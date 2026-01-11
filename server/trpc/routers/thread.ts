import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
  rateLimitedProtectedProcedure,
  rateLimitedAdminProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import {
  getJakartaTodayAsUTC,
  getUTCDate,
  toJakartaDate,
} from "@/lib/date-utils";
import { getUserPermission, checkIsKetua } from "../trpc";
import { checkClassSubscription } from "./subscription";
import { sendNotificationToClass } from "./notification";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import logger, { createLogger } from "@/lib/logger";
import { threadTitleSchema, commentContentSchema, groupTaskTitleSchema } from "@/lib/validation";
import { createDeadlineError, handleError, getUserFriendlyMessage } from "@/lib/error-handler";

export const threadRouter = createTRPCRouter({
  // Get all threads with pagination
  getAll: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1).optional(),
          limit: z.number().min(1).max(50).default(20).optional(),
          sort: z
            .enum(["newest", "oldest", "dueDate"])
            .default("newest")
            .optional(),
          showCompleted: z.boolean().default(true).optional(),
          schoolId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Get user info if logged in (parallel with other queries)
      let userKelas: string | null = null;
      let isAdmin = false;
      let userId: string | null = null;

      // Pagination parameters
      const page = input?.page || 1;
      const limit = Math.min(input?.limit || 20, 50); // Max 50
      const skip = (page - 1) * limit;

      // OPTIMIZATION: Get user info in parallel with initial queries
      const userQuery = ctx.session?.user
        ? prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
            isAdmin: true,
          },
        })
        : Promise.resolve(null);

      // Wait for user query to complete first (needed for whereClause)
      const user = await userQuery;
      userKelas = user?.kelas || null;
      isAdmin = user?.isAdmin || false;
      userId = ctx.session?.user?.id || null;

      // Build where clause for filtering
      let whereClause: any = undefined;

      if (isAdmin) {
        // Admin sees all, but can filter by school
        if (input?.schoolId && input.schoolId !== 'all') {
          whereClause = {
            author: {
              schoolId: input.schoolId
            }
          };
        }
      } else if (userId && userKelas) {
        whereClause = {
          OR: [
            // Individual tasks from same kelas
            {
              isGroupTask: false,
              author: {
                kelas: userKelas,
              },
            },
            // Group tasks where user is a member
            {
              isGroupTask: true,
              groupMembers: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        };
      } else if (userKelas) {
        // Fallback: only show tasks from same kelas (if not logged in)
        whereClause = {
          author: {
            kelas: userKelas,
          },
        };
      }

      // OPTIMIZATION: Run count and threads queries in parallel
      const [countResult, threadsResult] = await Promise.allSettled([
        prisma.thread.count({
          where: whereClause,
        }),
        prisma.thread.findMany({
          where: whereClause,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                kelas: true,
                school: {
                  select: {
                    name: true
                  }
                }
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    kelas: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
            groupMembers: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: (() => {
            const sort = input?.sort || "newest";
            switch (sort) {
              case "oldest":
                return { createdAt: "asc" };
              case "dueDate":
                return { dueDate: "asc" };
              case "newest":
              default:
                return { createdAt: "desc" };
            }
          })(),
          skip,
          take: limit,
        }),
      ]);

      // Safe error handling for parallel queries
      const totalCount =
        countResult.status === "fulfilled" ? countResult.value : 0;
      const threads =
        threadsResult.status === "fulfilled" ? threadsResult.value : [];

      // Log errors if any (for debugging)
      const log = createLogger({ component: 'thread.getAll' })
      if (countResult.status === "rejected") {
        log.error({
          error: countResult.reason instanceof Error ? countResult.reason.message : String(countResult.reason),
          stack: countResult.reason instanceof Error ? countResult.reason.stack : undefined,
        }, 'Count query failed')
      }
      if (threadsResult.status === "rejected") {
        log.error({
          error: threadsResult.reason instanceof Error ? threadsResult.reason.message : String(threadsResult.reason),
          stack: threadsResult.reason instanceof Error ? threadsResult.reason.stack : undefined,
        }, 'Threads query failed')
        // If threads query fails, return empty result
        return {
          threads: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Filter out threads that are already completed by this user
      // Behavior depends on showCompleted setting:
      // - If showCompleted = true: Show all threads (including completed ones)
      // - If showCompleted = false: Filter out completed threads (regardless of completion time)
      let filteredThreads = threads;
      const showCompleted = input?.showCompleted ?? true;

      // OPTIMIZATION: Prepare history query conditionally (but don't execute yet)
      let historyQuery: Promise<any> | null = null;

      if (userId && !isAdmin && !showCompleted) {
        // Get all completed thread IDs from history for this user
        historyQuery = prisma.history.findMany({
          where: {
            userId: userId,
            threadId: {
              not: null, // Only threads that still exist
            },
          },
          select: {
            threadId: true,
          },
        });
      } else if (userId && !isAdmin && showCompleted) {
        // Show all threads, but we still need to check for old completions (>24 hours)
        // This maintains backward compatibility with the 24-hour rule
        const { getUTCDate } = await import("@/lib/date-utils");
        const now = getUTCDate();
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000,
        );

        historyQuery = prisma.history.findMany({
          where: {
            userId: userId,
            threadId: {
              not: null,
            },
            completedDate: {
              lt: twentyFourHoursAgo, // Completed more than 24 hours ago
            },
          },
          select: {
            threadId: true,
          },
        });
      }

      // Execute history query if needed and filter threads
      if (historyQuery) {
        const completedThreadIdsResult = await Promise.allSettled([
          historyQuery,
        ]);
        const completedThreadIds =
          completedThreadIdsResult[0].status === "fulfilled"
            ? completedThreadIdsResult[0].value
            : [];

        const completedIds = new Set(
          completedThreadIds
            .map((h: any) => h.threadId)
            .filter((id: string | null): id is string => id !== null),
        );

        // Filter out completed threads
        filteredThreads = threads.filter(
          (thread) => !completedIds.has(thread.id),
        );
      }

      // Calculate total pages based on total count (before filtering by completion)
      // Note: This is an approximation since we filter by completion after pagination
      // For exact count, we would need to count after filtering, but that's expensive
      const totalPages = Math.ceil(totalCount / limit);

      return {
        threads: filteredThreads,
        total: totalCount,
        page,
        limit,
        totalPages,
      };
    }),

  // Get thread by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const thread = await prisma.thread.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              kelas: true,
              school: {
                select: {
                  name: true
                }
              }
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  kelas: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
          groupMembers: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread tidak ditemukan",
        });
      }

      return thread;
    }),

  // Create thread
  create: rateLimitedProtectedProcedure
    .input(
      z.object({
        title: threadTitleSchema,
        comment: commentContentSchema.optional(),
        deadline: z.date().optional(),
        isGroupTask: z.boolean().optional().default(false),
        groupTaskTitle: groupTaskTitleSchema,
        memberIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // OPTIMIZATION: Run permission check, user lookup, and subscription check in parallel
        const [permissionResult, userResult] = await Promise.allSettled([
          getUserPermission(ctx.session.user.id),
          prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
              kelas: true,
              isAdmin: true,
            },
          }),
        ]);

        // Handle permission check result
        const permission =
          permissionResult.status === "fulfilled"
            ? permissionResult.value
            : null;
        if (permission === "only_read") {
          throw new Error(
            "Anda hanya memiliki izin membaca. Tidak dapat membuat thread baru.",
          );
        }

        // Handle user lookup result
        const currentUser =
          userResult.status === "fulfilled" ? userResult.value : null;
        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User tidak ditemukan",
          });
        }

        const userKelas = (currentUser as any)?.kelas;
        const isAdmin = (currentUser as any)?.isAdmin || false;

        // Check subscription status (skip for admin) - can run in parallel with date calculation
        let subscriptionStatus = { isActive: true };
        if (!isAdmin && userKelas) {
          try {
            subscriptionStatus = await checkClassSubscription(userKelas);
            if (!subscriptionStatus.isActive) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat membuat thread baru.`,
              });
            }
          } catch (error: any) {
            // If subscription check fails, throw the error
            if (error.message?.includes("Subscription")) {
              throw error;
            }
            // Otherwise, log and continue (assume active)
            logger.warn({
              component: 'thread.create',
              error: error instanceof Error ? error.message : String(error),
              userId: ctx.session.user.id,
            }, 'Subscription check error, assuming active')
          }
        }

        // Validate deadline if provided - must be in the future
        const currentTime = getUTCDate();
        if (input.deadline) {
          const deadlineDate = new Date(input.deadline);
          if (deadlineDate <= currentTime) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: createDeadlineError({ userId: ctx.session.user.id, deadline: input.deadline }).userMessage,
            });
          }
        }

        // Get today's date in Jakarta timezone, converted to UTC for database
        // This ensures we only check threads created TODAY, not yesterday or tomorrow
        const today = getJakartaTodayAsUTC(); // 00:00:00 today in Jakarta (converted to UTC)
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); // 00:00:00 tomorrow

        // Skip duplicate check for group tasks (each group task is unique)
        let existingThread = null;
        if (!input.isGroupTask) {
          // Check if thread with same title exists ONLY for today's date AND same kelas
          // This prevents bug where thread from different kelas is found
          // Example: Thread MTK from X RPL 1 will NOT be found when creating thread from XI BC 1
          existingThread = await prisma.thread.findFirst({
            where: {
              title: input.title,
              date: {
                gte: today, // >= 00:00:00 today (Jakarta time, UTC stored)
                lt: tomorrow, // < 00:00:00 tomorrow (Jakarta time, UTC stored)
              },
              // Only find threads from the same kelas
              // If userKelas is null, we still filter but it will only match threads from users with null kelas
              author: userKelas
                ? {
                  kelas: userKelas,
                }
                : {
                  kelas: null,
                },
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
        }

        if (existingThread) {
          // If comment provided, add as comment
          if (input.comment) {
            // Get comment author info
            const commentAuthor = await prisma.user.findUnique({
              where: { id: ctx.session.user.id },
              select: {
                kelas: true,
                name: true,
              },
            });

            // Use Jakarta time for comment creation
            const now = getUTCDate();
            const comment = await prisma.comment.create({
              data: {
                threadId: existingThread.id,
                authorId: ctx.session.user.id,
                content: input.comment,
                createdAt: now,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });

            // OPTIMIZATION: Send notification in background (fire-and-forget)
            // Don't await - notification failure shouldn't block thread creation
            if (userKelas && !isAdmin) {
              // Fire notification in background without blocking
              sendNotificationToClass(
                userKelas,
                "📝 Sub Tugas Baru",
                `${commentAuthor?.name || "Seseorang"} - ${existingThread.title}`,
                {
                  type: "new_comment",
                  threadId: existingThread.id,
                  threadTitle: existingThread.title,
                  commentId: comment.id,
                  commentContent: comment.content,
                  threadDate: existingThread.date.toISOString(),
                },
                "comment",
              ).catch((error) => {
                logger.error({
                  component: 'thread.create',
                  error: error instanceof Error ? error.message : String(error),
                  threadId: thread.id,
                }, 'Error sending notification for new comment (non-blocking)')
                // Don't throw - notification failure shouldn't break comment creation
              });
            }

            return {
              type: "comment" as const,
              thread: existingThread,
              comment,
            };
          }

          throw new TRPCError({
            code: "CONFLICT",
            message: "Thread dengan mata pelajaran ini sudah ada untuk hari ini",
          });
        }

        // Create new thread
        // Explicitly set createdAt to current time in Jakarta timezone
        const now = getUTCDate();

        const thread = await prisma.thread.create({
          data: {
            title: input.title,
            authorId: ctx.session.user.id,
            date: today,
            createdAt: now,
            deadline: input.deadline || null,
            isGroupTask: input.isGroupTask || false,
            groupTaskTitle: input.groupTaskTitle || null,
            comments: input.comment
              ? {
                create: {
                  authorId: ctx.session.user.id,
                  content: input.comment,
                  createdAt: now,
                  deadline: input.deadline || null, // Apply deadline to first comment
                },
              }
              : undefined,
          } as any,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                kelas: true,
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    kelas: true,
                  },
                },
              },
            },
          },
        });

        // Create group members if this is a group task
        if (
          input.isGroupTask &&
          input.memberIds &&
          input.memberIds.length > 0
        ) {
          // Add selected members
          const memberData = input.memberIds.map((memberId) => ({
            threadId: thread.id,
            userId: memberId,
            addedBy: ctx.session.user.id,
          }));

          // Auto-add creator as member if not already in the list
          if (!input.memberIds.includes(ctx.session.user.id)) {
            memberData.push({
              threadId: thread.id,
              userId: ctx.session.user.id,
              addedBy: ctx.session.user.id,
            });
          }

          await prisma.groupMember.createMany({
            data: memberData,
            skipDuplicates: true,
          });
        }

        // OPTIMIZATION: Send notification in background (fire-and-forget)
        // Don't await - notification failure shouldn't block thread creation
        if (userKelas && !isAdmin) {
          const normalizedKelas = userKelas.trim();
          const authorName = (thread as any).author.name;
          const threadTitle = thread.title;

          // Format notification body (simplified for speed)
          const hasFirstComment =
            (thread as any).comments && (thread as any).comments.length > 0;
          const firstCommentPreview = hasFirstComment
            ? (thread as any).comments[0].content.substring(0, 80) +
            ((thread as any).comments[0].content.length > 80 ? "..." : "")
            : null;

          const notificationBody = firstCommentPreview
            ? `${authorName} - ${threadTitle}. ${firstCommentPreview}`
            : `${authorName} - ${threadTitle}. Yuk, cek dan selesaikan sekarang!`;

          // Fire notification in background without blocking
          sendNotificationToClass(
            normalizedKelas,
            "✨ Tugas Baru",
            notificationBody,
            {
              type: "new_thread",
              threadId: thread.id,
              threadTitle: thread.title,
            },
            "task",
          ).catch((error) => {
            logger.error({
              component: 'thread.create',
              error: error instanceof Error ? error.message : String(error),
              threadId: thread.id,
            }, 'Error sending notification for new thread (non-blocking)')
            // Don't throw - notification failure shouldn't break thread creation
          });
        }

        return {
          type: "thread" as const,
          thread,
        };
      } catch (error: any) {
        // Log detailed error for debugging
        logger.error({
          component: 'thread.create',
          error: error.message,
          code: error.code,
          meta: error.meta,
          cause: error.cause,
          userId: ctx.session.user.id,
          title: input.title,
        }, 'Error creating thread')

        // If it's a unique constraint error, provide a more helpful message
        if (error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Thread dengan mata pelajaran "${input.title}" sudah ada untuk hari ini. ` +
              `Jika Anda dari kelas yang berbeda, pastikan constraint database sudah dihapus.`,
          });
        }

        // Re-throw the error with original message
        throw error;
      }
    }),

  // Add comment to thread
  addComment: rateLimitedProtectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: commentContentSchema,
        deadline: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const loggerContext = {
        component: 'thread.addComment',
        userId: ctx.session.user.id,
        threadId: input.threadId,
        deadline: input.deadline,
      };

      try {
        // OPTIMIZATION: Run permission check, user lookup, and subscription check in parallel
        const [permissionResult, userResult] = await Promise.allSettled([
          getUserPermission(ctx.session.user.id),
          prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
              kelas: true,
              isAdmin: true,
            },
          }),
        ]);

        // Handle permission check result
        const permission =
          permissionResult.status === "fulfilled" ? permissionResult.value : null;
        if (permission === "only_read") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Anda hanya memiliki izin membaca. Tidak dapat menambahkan komentar.",
          });
        }

        // Handle user lookup result
        const currentUser =
          userResult.status === "fulfilled" ? userResult.value : null;
        if (!currentUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User tidak ditemukan",
          });
        }

        const userKelas = (currentUser as any)?.kelas;
        const isAdmin = (currentUser as any)?.isAdmin || false;

        logger.info({ ...loggerContext, userKelas, isAdmin }, 'Starting addComment process');

        // Check subscription status (skip for admin)
        if (!isAdmin && userKelas) {
          try {
            const subscriptionStatus = await checkClassSubscription(userKelas);
            if (!subscriptionStatus.isActive) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat menambahkan komentar.`,
              });
            }
          } catch (error: any) {
            if (error.message?.includes("Subscription")) {
              throw error;
            }
            logger.warn({
              ...loggerContext,
              error: error instanceof Error ? error.message : String(error),
            }, 'Subscription check error, assuming active')
          }
        }

        // Get thread info first
        const thread = await prisma.thread.findUnique({
          where: { id: input.threadId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
              },
            },
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                deadline: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        if (!thread) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Thread tidak ditemukan",
          });
        }

        logger.info({
          ...loggerContext,
          threadId: thread.id,
          threadTitle: thread.title,
          threadIsGroupTask: thread.isGroupTask,
          threadDeadline: thread.deadline,
          existingCommentsCount: thread.comments.length,
          threadAuthorKelas: thread.author.kelas,
          threadAuthorId: thread.author.id,
        }, 'Thread found with details');

        // Get comment author info
        const commentAuthor = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
            name: true,
          },
        });

        if (!commentAuthor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data penulis komentar tidak ditemukan",
          });
        }

        // Use Jakarta time for comment creation
        const now = getUTCDate();

        // Validate deadline if provided - must be in the future
        if (input.deadline) {
          // Additional validation for deadline format
          if (!(input.deadline instanceof Date) && isNaN(Date.parse(input.deadline as any))) {
            logger.error({
              ...loggerContext,
              deadlineRaw: input.deadline,
              deadlineType: typeof input.deadline,
            }, 'Invalid deadline format');

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Format deadline tidak valid. Harus berupa tanggal yang valid.",
            });
          }

          const deadlineDate = new Date(input.deadline);
          logger.info({
            ...loggerContext,
            now: now.toISOString(),
            nowTimestamp: now.getTime(),
            deadlineDate: deadlineDate.toISOString(),
            deadlineTimestamp: deadlineDate.getTime(),
            deadlineIsValid: deadlineDate > now,
            timeDiffMs: deadlineDate.getTime() - now.getTime(),
          }, 'Validating deadline');

          // Allow deadline to be equal to or after current time
          if (deadlineDate < now) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: createDeadlineError({
                userId: ctx.session.user.id,
                threadId: input.threadId,
                deadline: input.deadline
              }).userMessage,
            });
          }
        }

        // Note: Removed duplicate comment validation to allow multiple comments per day
        // Users can add multiple sub-tasks/comments to the same thread

        // Additional validation: Check if content is empty after trimming
        const trimmedContent = input.content.trim();
        if (!trimmedContent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Komentar tidak boleh kosong",
          });
        }

        // Additional validation: Check if thread exists and user has permission
        // This is a double-check to ensure thread still exists and user can comment
        const threadCheck = await prisma.thread.findUnique({
          where: { id: input.threadId },
          select: { id: true, authorId: true },
        });

        if (!threadCheck) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Thread tidak ditemukan atau sudah dihapus",
          });
        }

        // Check if user is trying to add comment to their own thread
        const isOwnThread = thread.authorId === ctx.session.user.id;
        if (isOwnThread) {
          logger.info({
            ...loggerContext,
          }, 'User is adding comment to their own thread');
        }

        // Additional validation: Check if thread has deadline and if it's expired
        if (thread.deadline && new Date(thread.deadline) <= now) {
          logger.warn({
            ...loggerContext,
            threadDeadline: thread.deadline,
            now: now.toISOString(),
          }, 'Thread deadline has expired');

          // Don't throw error, but log warning
          // Users can still add comments to expired threads
        }

        // Create the comment
        const comment = await prisma.comment.create({
          data: {
            threadId: input.threadId,
            authorId: ctx.session.user.id,
            content: trimmedContent,
            deadline: input.deadline || null,
            createdAt: now,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }).catch((error: any) => {
          // Handle database constraint errors
          if (error.code === 'P2002') {
            logger.error({
              ...loggerContext,
              error: error.message,
              code: error.code,
            }, 'Database constraint violation');

            throw new TRPCError({
              code: "CONFLICT",
              message: "Terjadi konflik data. Mungkin komentar sudah ada atau data tidak valid.",
            });
          }

          // Handle foreign key constraint errors
          if (error.code === 'P2003') {
            logger.error({
              ...loggerContext,
              error: error.message,
              code: error.code,
            }, 'Foreign key constraint violation');

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Thread atau penulis tidak valid.",
            });
          }

          // Re-throw other errors
          throw error;
        });

        logger.info({
          ...loggerContext,
          commentId: comment.id,
          commentContentLength: comment.content.length,
        }, 'Comment created successfully');

        // OPTIMIZATION: Send notification in background (fire-and-forget)
        // Only send if comment author is from the same class as thread author
        const threadAuthorKelas = thread.author.kelas?.trim();
        const normalizedUserKelas = userKelas?.trim();

        // Use exact match with trimmed values
        if (
          threadAuthorKelas &&
          normalizedUserKelas === threadAuthorKelas &&
          !isAdmin
        ) {
          // Fire notification in background without blocking
          const commentPreview =
            comment.content.substring(0, 80) +
            (comment.content.length > 80 ? "..." : "");
          const notificationBody = `${commentAuthor?.name || "Seseorang"} - ${thread.title}. ${commentPreview}`;

          sendNotificationToClass(
            threadAuthorKelas,
            "📝 Sub Tugas Baru",
            notificationBody,
            {
              type: "new_comment",
              threadId: thread.id,
              threadTitle: thread.title,
              commentId: comment.id,
              commentContent: comment.content,
              threadDate: thread.date.toISOString(),
            },
            "comment",
          ).catch((error) => {
            logger.error({
              ...loggerContext,
              commentId: comment.id,
              error: error instanceof Error ? error.message : String(error),
            }, 'Error sending notification for new comment (non-blocking)')
            // Don't throw - notification failure shouldn't break comment creation
          });
        } else {
          logger.info({
            ...loggerContext,
            threadAuthorKelas,
            normalizedUserKelas,
            isAdmin,
            reason: !threadAuthorKelas ? 'No thread author kelas' :
              normalizedUserKelas !== threadAuthorKelas ? 'Class mismatch' :
                isAdmin ? 'User is admin' : 'Unknown',
          }, 'Skipping notification due to conditions');
        }

        logger.info({
          ...loggerContext,
          commentId: comment.id,
          success: true,
        }, 'addComment completed successfully');

        return {
          ...comment,
          author: comment.author,
        };
      } catch (error: any) {
        // Log detailed error for debugging
        logger.error({
          ...loggerContext,
          error: error.message,
          code: error.code,
          stack: error.stack,
        }, 'Error in addComment mutation');

        // Re-throw the error
        throw error;
      }
    }),

  // Delete thread (Author only or Admin)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get thread data before deletion to preserve in history
      const thread = await prisma.thread.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              isAdmin: true,
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread tidak ditemukan",
        });
      }

      // Check if user is admin or ketua of the same class
      const currentUser = (await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
          isKetua: true,
          kelas: true,
        },
      })) as any;

      const isAdmin = currentUser?.isAdmin || false;
      const isKetua = currentUser?.isKetua || false;
      const userKelas = currentUser?.kelas || null;

      // Get thread author's kelas
      const threadAuthor = await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: { kelas: true },
      });
      const threadAuthorKelas = threadAuthor?.kelas || null;

      // Only allow deletion if:
      // 1. User is the author, OR
      // 2. User is admin, OR
      // 3. User is ketua of the same class as thread author
      const isKetuaOfSameClass =
        isKetua && userKelas === threadAuthorKelas && userKelas !== null;

      if (
        thread.authorId !== ctx.session.user.id &&
        !isAdmin &&
        !isKetuaOfSameClass
      ) {
        throw new Error("Anda tidak memiliki izin untuk menghapus thread ini");
      }

      // Update all histories related to this thread with denormalized data
      // Set threadId to null explicitly to avoid unique constraint issues
      // This ensures history remains even after thread is deleted
      await prisma.history.updateMany({
        where: {
          threadId: input.id,
        },
        data: {
          threadTitle: thread.title,
          threadAuthorId: thread.author.id,
          threadAuthorName: thread.author.name,
          threadId: null, // Set to null explicitly before deleting thread
        },
      });

      // Delete the thread (histories will remain with threadId = null)
      await prisma.thread.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Edit comment (Author of comment only)
  editComment: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid('ID komentar tidak valid'),
        content: commentContentSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check user permission - only_read users cannot edit comments
        const permission = await getUserPermission(ctx.session.user.id);
        if (permission === "only_read") {
          throw new Error(
            "Anda hanya memiliki izin membaca. Tidak dapat mengedit komentar.",
          );
        }

        // Get user info to check subscription
        const currentUser = (await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            kelas: true,
            isAdmin: true,
          },
        })) as any;

        const userKelas = currentUser?.kelas;
        const isAdmin = currentUser?.isAdmin || false;

        // Check subscription status (skip for admin)
        if (!isAdmin && userKelas) {
          const subscriptionStatus = await checkClassSubscription(userKelas);
          if (!subscriptionStatus.isActive) {
            throw new Error(
              `Subscription untuk kelas ${userKelas} sudah habis. Tidak dapat mengedit komentar.`,
            );
          }
        }

        // Get comment with author info
        const comment = await prisma.comment.findUnique({
          where: { id: input.id },
          include: {
            author: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!comment) {
          throw new Error("Komentar tidak ditemukan");
        }

        // Only allow edit if user is the author of the comment
        if (comment.authorId !== ctx.session.user.id) {
          throw new Error(
            "Anda tidak memiliki izin untuk mengedit komentar ini",
          );
        }

        // Validate content
        if (!input.content.trim()) {
          throw new Error("Konten komentar tidak boleh kosong");
        }

        // Update comment with Jakarta time
        const now = getUTCDate();
        const updatedComment = await prisma.comment.update({
          where: { id: input.id },
          data: {
            content: input.content.trim(),
            updatedAt: now,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                kelas: true,
              },
            },
          },
        });

        return updatedComment;
      } catch (error: any) {
        // Log error for debugging
        logger.error({
          component: 'thread.editComment',
          error: error.message,
          code: error.code,
          commentId: input.id,
          userId: ctx.session.user.id,
        }, 'Error editing comment')

        // Re-throw with user-friendly message
        throw new Error(
          error.message || "Gagal mengedit komentar. Silakan coba lagi.",
        );
      }
    }),

  // Delete comment (Author of comment OR author of thread OR Admin)
  deleteComment: rateLimitedProtectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get comment with thread and authors info
      const comment = await prisma.comment.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
            },
          },
          thread: {
            include: {
              author: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      // Check if user is admin or ketua of the same class
      const currentUser = (await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          isAdmin: true,
          isKetua: true,
          kelas: true,
        },
      })) as any;

      const isAdmin = currentUser?.isAdmin || false;
      const isKetua = currentUser?.isKetua || false;
      const userKelas = currentUser?.kelas || null;

      // Get comment author's kelas
      const commentAuthor = await prisma.user.findUnique({
        where: { id: comment.authorId },
        select: { kelas: true },
      });
      const commentAuthorKelas = commentAuthor?.kelas || null;

      // Allow deletion if:
      // 1. User is the author of the comment, OR
      // 2. User is the author of the thread, OR
      // 3. User is admin, OR
      // 4. User is ketua of the same class as comment author
      const isCommentAuthor = comment.authorId === ctx.session.user.id;
      const isThreadAuthor = comment.thread.authorId === ctx.session.user.id;
      const isKetuaOfSameClass =
        isKetua && userKelas === commentAuthorKelas && userKelas !== null;

      if (
        !isCommentAuthor &&
        !isThreadAuthor &&
        !isAdmin &&
        !isKetuaOfSameClass
      ) {
        throw new Error(
          "Anda tidak memiliki izin untuk menghapus komentar ini",
        );
      }

      await prisma.comment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Auto-delete threads older than 1 day (for cron job)
  autoDeleteOldThreads: publicProcedure.mutation(async () => {
    const { getUTCDate } = await import("@/lib/date-utils");
    const now = getUTCDate();
    now.setDate(now.getDate() - 1);

    // Find threads older than 1 day
    const oldThreads = await prisma.thread.findMany({
      where: {
        createdAt: {
          lt: now,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        histories: true,
      },
    });

    let deletedCount = 0;

    // For each old thread, update histories to store thread data before deletion
    for (const thread of oldThreads) {
      // Update all histories related to this thread with denormalized data
      // Set threadId to null explicitly to avoid unique constraint issues
      await prisma.history.updateMany({
        where: {
          threadId: thread.id,
        },
        data: {
          threadTitle: thread.title,
          threadAuthorId: thread.author.id,
          threadAuthorName: thread.author.name,
          threadId: null, // Set to null explicitly before deleting thread
        },
      });

      // Get comment IDs before deleting thread
      const threadWithComments = await prisma.thread.findUnique({
        where: { id: thread.id },
        select: {
          comments: {
            select: { id: true },
          },
        },
      });

      const commentIds = threadWithComments?.comments.map((c) => c.id) || [];

      // Delete UserStatus related to this thread (cascade should handle this, but we do it explicitly to be sure)
      await prisma.userStatus.deleteMany({
        where: {
          threadId: thread.id,
        },
      });

      // Delete UserStatus related to comments in this thread
      if (commentIds.length > 0) {
        await prisma.userStatus.deleteMany({
          where: {
            commentId: {
              in: commentIds,
            },
          },
        });
      }

      // Delete the thread (histories will remain with threadId = null)
      // Cascade delete should handle UserStatus, but we already deleted them explicitly above
      await prisma.thread.delete({
        where: { id: thread.id },
      });

      deletedCount++;
    }

    return { deleted: deletedCount };
  }),

  // Cleanup expired threads (Admin only) - Delete threads that have passed their deadline
  cleanupExpiredThreads: adminProcedure
    .input(
      z.object({
        confirm: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!input.confirm) {
        throw new Error(
          "Konfirmasi diperlukan untuk menghapus expired threads",
        );
      }

      const { getUTCDate } = await import("@/lib/date-utils");
      const now = getUTCDate();

      // Find all threads that have passed their deadline
      // Only threads with deadline that is not null and is in the past
      const expiredThreads = await prisma.thread.findMany({
        where: {
          deadline: {
            not: null,
            lt: now, // Deadline is in the past
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          histories: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      let deletedCount = 0;

      // For each expired thread, update histories and delete thread
      for (const thread of expiredThreads) {
        // Update all histories related to this thread with denormalized data
        // Set threadId to null explicitly to avoid unique constraint issues
        // This ensures history remains even after thread is deleted
        await prisma.history.updateMany({
          where: {
            threadId: thread.id,
          },
          data: {
            threadTitle: thread.title,
            threadAuthorId: thread.author.id,
            threadAuthorName: thread.author.name,
            threadId: null, // Set to null explicitly before deleting thread
          },
        });

        // Get comment IDs before deleting thread
        const commentIds = thread.comments.map((c) => c.id);

        // Delete UserStatus related to this thread
        await prisma.userStatus.deleteMany({
          where: {
            threadId: thread.id,
          },
        });

        // Delete UserStatus related to comments in this thread
        if (commentIds.length > 0) {
          await prisma.userStatus.deleteMany({
            where: {
              commentId: {
                in: commentIds,
              },
            },
          });
        }

        // Delete the thread (histories will remain with threadId = null)
        // Comments will be deleted via cascade
        await prisma.thread.delete({
          where: { id: thread.id },
        });

        deletedCount++;
      }

      return {
        deleted: deletedCount,
        message: `Berhasil menghapus ${deletedCount} thread yang deadline-nya sudah lewat`,
      };
    }),

  // Get thread completion statistics (Admin only)
  getCompletionStats: adminProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input }) => {
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        include: {
          author: {
            select: {
              kelas: true,
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread tidak ditemukan",
        });
      }

      const authorKelas = (thread.author as any)?.kelas;

      if (!authorKelas) {
        // Thread by admin or no kelas - return empty stats
        return {
          completedCount: 0,
          totalCount: 0,
          completedUsers: [],
        };
      }

      // Get all users in the same kelas (excluding admins)
      const totalUsers = await prisma.user.findMany({
        where: {
          kelas: authorKelas,
          isAdmin: false,
        },
        select: {
          id: true,
        },
      });

      // Get all users who have completed this thread (have history)
      const completedHistories = await prisma.history.findMany({
        where: {
          threadId: input.threadId,
        },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        distinct: ["userId"],
      });

      const completedUsers = completedHistories.map((h) => ({
        id: h.user.id,
        name: h.user.name,
      }));

      return {
        completedCount: completedUsers.length,
        totalCount: totalUsers.length,
        completedUsers: completedUsers.sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    }),

  // Get group task progress (public - for progress bar display)
  getGroupTaskProgress: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ input }) => {
      const thread = await prisma.thread.findUnique({
        where: { id: input.threadId },
        select: {
          id: true,
          isGroupTask: true,
          comments: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!thread || !thread.isGroupTask) {
        return null;
      }

      if (!thread.comments || thread.comments.length === 0) {
        return {
          completed: 0,
          total: 0,
          percentage: 0,
        };
      }

      // Count how many comments have at least one completed status
      // For group tasks, a comment is considered "completed" if at least one member has completed it
      const commentIds = thread.comments.map((c) => c.id);

      // Get all completed statuses for these comments
      // Note: comment statuses don't have threadId set (to avoid unique constraint)
      // So we query by commentId only
      const completedStatuses = await prisma.userStatus.findMany({
        where: {
          commentId: {
            in: commentIds,
          },
          isCompleted: true,
        },
        select: {
          commentId: true,
        },
      });

      // Get unique comment IDs that have at least one completed status
      const completedCommentIds = new Set(
        completedStatuses
          .map((s) => s.commentId)
          .filter((id): id is string => id !== null),
      );

      const totalComments = thread.comments.length;
      const completedCount = completedCommentIds.size;
      const percentage =
        totalComments > 0
          ? Math.round((completedCount / totalComments) * 100)
          : 0;

      return {
        completed: completedCount,
        total: totalComments,
        percentage,
      };
    }),

  // Manual trigger for deleting expired threads and comments (Admin only)
  deleteExpired: adminProcedure.mutation(async () => {
    const { getUTCDate } = await import("@/lib/date-utils");
    const now = getUTCDate();

    let deletedThreadCount = 0;
    let deletedCommentCount = 0;

    // Step 1: Find all threads that have passed their deadline
    const expiredThreads = await prisma.thread.findMany({
      where: {
        deadline: {
          not: null,
          lt: now, // Deadline is in the past
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            deadline: true,
          },
        },
      },
    });

    // Step 2: Find threads that don't have deadline but all their comments have expired
    const threadsWithComments = await prisma.thread.findMany({
      where: {
        deadline: null, // Thread itself doesn't have deadline
        comments: {
          some: {
            deadline: {
              not: null, // Has at least one comment with deadline
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            deadline: true,
          },
        },
      },
    });

    // Filter threads where all comments with deadline have expired
    const threadsWithAllExpiredComments = threadsWithComments.filter(
      (thread) => {
        if (thread.comments.length === 0) return false;

        const commentsWithDeadline = thread.comments.filter(
          (c) => c.deadline !== null,
        );
        if (commentsWithDeadline.length === 0) return false;

        const allDeadlinesExpired = commentsWithDeadline.every((comment) => {
          if (!comment.deadline) return false;
          return new Date(comment.deadline) < now;
        });

        return allDeadlinesExpired;
      },
    );

    // Combine both lists
    const allExpiredThreads = [
      ...expiredThreads,
      ...threadsWithAllExpiredComments,
    ];

    // Step 3: Find standalone expired comments
    const allThreadIds = allExpiredThreads.map((t) => t.id);
    const expiredComments = await prisma.comment.findMany({
      where: {
        deadline: {
          not: null,
          lt: now,
        },
        threadId: {
          notIn: allThreadIds,
        },
      },
      select: {
        id: true,
      },
    });

    // Step 4: Delete standalone expired comments
    const standaloneExpiredCommentIds = expiredComments.map((c) => c.id);
    if (standaloneExpiredCommentIds.length > 0) {
      await prisma.userStatus.deleteMany({
        where: {
          commentId: {
            in: standaloneExpiredCommentIds,
          },
        },
      });

      await prisma.comment.deleteMany({
        where: {
          id: {
            in: standaloneExpiredCommentIds,
          },
        },
      });

      deletedCommentCount = standaloneExpiredCommentIds.length;
    }

    // Step 5: Delete expired threads (preserve history)
    for (const thread of allExpiredThreads) {
      // Update histories with denormalized data
      await prisma.history.updateMany({
        where: {
          threadId: thread.id,
        },
        data: {
          threadTitle: thread.title,
          threadAuthorId: thread.author.id,
          threadAuthorName: thread.author.name,
          threadId: null,
        },
      });

      const commentIds = thread.comments.map((c) => c.id);

      // Delete UserStatus related to this thread
      await prisma.userStatus.deleteMany({
        where: {
          threadId: thread.id,
        },
      });

      if (commentIds.length > 0) {
        await prisma.userStatus.deleteMany({
          where: {
            commentId: {
              in: commentIds,
            },
          },
        });
      }

      // Delete the thread
      await prisma.thread.delete({
        where: { id: thread.id },
      });

      deletedThreadCount++;
    }

    return {
      success: true,
      deleted: {
        threads: deletedThreadCount,
        comments: deletedCommentCount,
      },
      message: `Berhasil menghapus ${deletedThreadCount} thread dan ${deletedCommentCount} comment yang sudah expired`,
    };
  }),

  // Admin procedure to manually trigger deadline reminders
  testDeadlineReminder: adminProcedure.mutation(async () => {
    const { sendDeadlineReminders } =
      await import("@/server/cron/deadlineReminders");
    const result = await sendDeadlineReminders();
    return result;
  }),
});
