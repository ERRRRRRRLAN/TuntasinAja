import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  protectedProcedure,
  rateLimitedProcedure,
  rateLimitedProtectedProcedure,
  rateLimitedAdminProcedure,
} from "../trpc";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUTCDate } from "@/lib/date-utils";
import { getUserPermission } from "../trpc";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/validation";
import { encryptPassword, decryptPassword } from "@/lib/password-encryption";

export const authRouter = createTRPCRouter({
  // Register
  register: rateLimitedProcedure
    .input(
      z.object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Encrypt password for admin view
      const passwordEncrypted = encryptPassword(input.password);

      // Use Jakarta time for user creation
      const now = getUTCDate();

      // Create user
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          passwordEncrypted,
          createdAt: now,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return user;
    }),

  // Get user profile (simplified - no stats)
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      };
    }),

  // Check if current user is admin
  isAdmin: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return { isAdmin: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { isAdmin: true },
    });

    return { isAdmin: user?.isAdmin || false };
  }),

  // Get current user data (kelas, isAdmin, isDanton)
  getUserData: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return { kelas: null, isAdmin: false, isDanton: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        kelas: true,
        isAdmin: true,
        isDanton: true,
      },
    });

    return {
      kelas: user?.kelas || null,
      isAdmin: user?.isAdmin || false,
      isDanton: user?.isDanton || false,
    };
  }),

  // Check if current user is danton
  isDanton: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return { isDanton: false, kelas: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        isDanton: true,
        kelas: true,
      },
    });

    return {
      isDanton: user?.isDanton || false,
      kelas: user?.kelas || null,
    };
  }),

  // Get user permission (only_read or read_and_post_edit)
  getUserPermission: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user) {
      return {
        permission: "read_and_post_edit" as const,
        canCreateAnnouncement: false,
      };
    }

    const permission = await getUserPermission(ctx.session.user.id);

    // Get user data to check if admin/danton
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        isAdmin: true,
        isDanton: true,
        permission: {
          select: {
            canCreateAnnouncement: true,
          },
        },
      },
    });

    const canCreateAnnouncement =
      user?.isAdmin ||
      user?.isDanton ||
      user?.permission?.canCreateAnnouncement === true;

    return { permission, canCreateAnnouncement };
  }),

  // Create user (Admin only)
  createUser: adminProcedure
    .input(
      z.object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        isAdmin: z.boolean().optional().default(false),
        isDanton: z.boolean().optional().default(false),
        kelas: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("Email sudah terdaftar");
      }

      // Validate kelas for non-admin users
      if (!input.isAdmin && !input.kelas) {
        throw new Error("Kelas harus diisi untuk user non-admin");
      }

      // Validate danton: cannot be admin and danton at the same time
      if (input.isDanton && input.isAdmin) {
        throw new Error("User tidak dapat menjadi admin dan danton sekaligus");
      }

      // Validate danton: must have kelas
      if (input.isDanton && !input.kelas) {
        throw new Error("User harus memiliki kelas untuk dijadikan danton");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Encrypt password for admin view
      const passwordEncrypted = encryptPassword(input.password);

      // Use Jakarta time for user creation
      const now = getUTCDate();

      // Create user
      const user = (await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          passwordEncrypted,
          isAdmin: input.isAdmin || false,
          isDanton: input.isAdmin ? false : input.isDanton || false, // Cannot be danton if admin
          kelas: input.isAdmin ? null : input.kelas || null,
          createdAt: now,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isDanton: true,
          kelas: true,
          createdAt: true,
        },
      })) as any;

      return user;
    }),

  // Get all users (Admin only)
  // Get user password (decrypted) - Admin only
  getUserPasswordHash: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          passwordHash: true,
          passwordEncrypted: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Try to decrypt password if encrypted password exists
      let decryptedPassword: string | null = null;
      let decryptError: string | null = null;
      
      if (user.passwordEncrypted) {
        try {
          // Validate encrypted password format
          const parts = user.passwordEncrypted.split(':');
          if (parts.length === 4) {
            decryptedPassword = decryptPassword(user.passwordEncrypted);
            console.log(`[getUserPasswordHash] Successfully decrypted password for user ${input.userId}`);
          } else {
            decryptError = 'Invalid encrypted password format';
            console.error(`[getUserPasswordHash] Invalid format for user ${input.userId}: expected 4 parts, got ${parts.length}`);
          }
        } catch (error) {
          decryptError = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[getUserPasswordHash] Failed to decrypt password for user ${input.userId}:`, decryptError);
          console.error(`[getUserPasswordHash] Encrypted password (first 50 chars):`, user.passwordEncrypted?.substring(0, 50));
        }
      } else {
        console.log(`[getUserPasswordHash] No encrypted password found for user ${input.userId}`);
      }

      return {
        userId: user.id,
        passwordHash: user.passwordHash,
        password: decryptedPassword, // Decrypted password (null if not available)
        hasEncryptedPassword: !!user.passwordEncrypted,
        decryptError: decryptError || undefined,
      };
    }),

  getAllUsers: adminProcedure.query(async () => {
    const users = (await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isDanton: true,
        kelas: true,
        createdAt: true,
        permission: {
          select: {
            permission: true,
            canCreateAnnouncement: true,
          },
        },
        _count: {
          select: {
            threads: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as any[];

    return users;
  }),

  // Update user (Admin only)
  updateUser: rateLimitedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        name: nameSchema.optional(),
        email: emailSchema.optional(),
        password: passwordSchema.optional(),
        isAdmin: z.boolean().optional(),
        isDanton: z.boolean().optional(),
        kelas: z.string().optional().nullable(),
        permission: z.enum(["only_read", "read_and_post_edit"]).optional(),
        canCreateAnnouncement: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, password, ...updateData } = input;

      // Check if user exists
      const user = (await prisma.user.findUnique({
        where: { id: userId },
      })) as any;

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (existingUser) {
          throw new Error("Email sudah digunakan oleh user lain");
        }
      }

      // Validate kelas for non-admin users
      const willBeAdmin =
        updateData.isAdmin !== undefined ? updateData.isAdmin : user.isAdmin;
      if (!willBeAdmin && updateData.kelas === null) {
        throw new Error("Kelas harus diisi untuk user non-admin");
      }

      // Validate danton: user must have kelas to be danton, cannot be admin and danton at the same time
      const willBeDanton =
        updateData.isDanton !== undefined
          ? updateData.isDanton
          : (user as any).isDanton || false;
      const targetKelas =
        updateData.kelas !== undefined ? updateData.kelas : user.kelas;

      if (willBeDanton && !targetKelas) {
        throw new Error("User harus memiliki kelas untuk dijadikan danton");
      }

      if (willBeDanton && willBeAdmin) {
        throw new Error("User tidak dapat menjadi admin dan danton sekaligus");
      }

      // Prepare update data
      const dataToUpdate: any = {};

      if (updateData.name !== undefined) {
        dataToUpdate.name = updateData.name;
      }

      if (updateData.email !== undefined) {
        dataToUpdate.email = updateData.email;
      }

      if (updateData.isAdmin !== undefined) {
        dataToUpdate.isAdmin = updateData.isAdmin;
        // If making user admin, remove kelas and danton status
        if (updateData.isAdmin) {
          dataToUpdate.kelas = null;
          dataToUpdate.isDanton = false;
        } else if (updateData.kelas !== undefined) {
          dataToUpdate.kelas = updateData.kelas;
        }
      } else if (updateData.kelas !== undefined) {
        dataToUpdate.kelas = updateData.kelas;
        // If removing kelas, also remove danton status
        if (updateData.kelas === null) {
          dataToUpdate.isDanton = false;
        }
      }

      // Handle isDanton update
      if (updateData.isDanton !== undefined) {
        dataToUpdate.isDanton = updateData.isDanton;
        // If setting as danton, ensure user has kelas
        if (updateData.isDanton && !targetKelas) {
          throw new Error("User harus memiliki kelas untuk dijadikan danton");
        }
        // If setting as danton, ensure user is not admin
        if (updateData.isDanton && willBeAdmin) {
          throw new Error("Admin tidak dapat menjadi danton");
        }
      }

      // Hash password if provided
      if (password) {
        dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        // Also encrypt password for admin view
        dataToUpdate.passwordEncrypted = encryptPassword(password);
      }

      // Update user
      const updatedUser = (await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isDanton: true,
          kelas: true,
          createdAt: true,
        },
      })) as any;

      // Update permission if provided
      if (
        input.permission !== undefined ||
        input.canCreateAnnouncement !== undefined
      ) {
        // Only update permission for non-admin users
        if (!willBeAdmin) {
          await prisma.userPermission.upsert({
            where: { userId },
            create: {
              userId,
              permission: input.permission || "read_and_post_edit",
              canCreateAnnouncement: input.canCreateAnnouncement ?? false,
            },
            update: {
              ...(input.permission !== undefined && {
                permission: input.permission,
              }),
              ...(input.canCreateAnnouncement !== undefined && {
                canCreateAnnouncement: input.canCreateAnnouncement,
              }),
            },
          });
        }
      }

      return updatedUser;
    }),

  // Delete user (Admin only)
  deleteUser: rateLimitedAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Prevent admin from deleting themselves
      if (input.userId === ctx.session?.user?.id) {
        throw new Error("Tidak dapat menghapus akun sendiri");
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      // Delete user (cascade will delete related threads, comments, etc.)
      await prisma.user.delete({
        where: { id: input.userId },
      });

      return { success: true };
    }),

  // Bulk create users (Admin only)
  bulkCreateUsers: rateLimitedAdminProcedure
    .input(
      z.object({
        names: z.array(nameSchema).min(1, 'Minimal 1 nama harus diisi'),
        kelas: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { names, kelas } = input;

      // Helper function to capitalize name properly (Title Case)
      const capitalizeName = (name: string): string => {
        return name
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      // Helper function to get words for email/password (2 words or 1 if only 1 word)
      const getWordsForEmail = (name: string): string => {
        const words = name
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 0);
        if (words.length >= 2) {
          return `${words[0]}${words[1]}`;
        } else if (words.length === 1) {
          return words[0];
        }
        return "user";
      };

      // Helper function to generate random number (4-5 digits)
      const generateRandomNumber = (): number => {
        // Generate 4 or 5 digit number randomly
        const isFourDigit = Math.random() < 0.5;
        if (isFourDigit) {
          return Math.floor(1000 + Math.random() * 9000); // 1000-9999
        } else {
          return Math.floor(10000 + Math.random() * 90000); // 10000-99999
        }
      };

      const now = getUTCDate();
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each name
      for (const name of names) {
        try {
          const capitalizedName = capitalizeName(name);
          const emailPrefix = getWordsForEmail(name);
          const email = `${emailPrefix}@tuntasinaja.com`;
          const randomNum = generateRandomNumber();
          const password = `${emailPrefix}${randomNum}`;

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            failedCount++;
            errors.push(`${capitalizedName}: Email ${email} sudah terdaftar`);
            continue;
          }

          // Hash password
          const passwordHash = await bcrypt.hash(password, 10);

          // Create user
          await prisma.user.create({
            data: {
              name: capitalizedName,
              email,
              passwordHash,
              kelas,
              isAdmin: false,
              isDanton: false,
              createdAt: now,
            },
          });

          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(`${name}: ${error.message || "Terjadi kesalahan"}`);
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      };
    }),

  // Bulk delete users (Admin only)
  bulkDeleteUsers: rateLimitedAdminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds } = input;
      const currentUserId = ctx.session?.user?.id;

      // Prevent admin from deleting themselves
      if (currentUserId && userIds.includes(currentUserId)) {
        throw new Error("Tidak dapat menghapus akun sendiri");
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each user ID
      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
          });

          if (!user) {
            failedCount++;
            errors.push(`User dengan ID ${userId} tidak ditemukan`);
            continue;
          }

          // Prevent deleting current user
          if (userId === currentUserId) {
            failedCount++;
            errors.push(`${user.name}: Tidak dapat menghapus akun sendiri`);
            continue;
          }

          // Delete user (cascade will delete related threads, comments, etc.)
          await prisma.user.delete({
            where: { id: userId },
          });

          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(
            `User ID ${userId}: ${error.message || "Terjadi kesalahan"}`,
          );
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        errors,
      };
    }),

  // Search users by name for autocomplete
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        excludeUserId: z.string().optional(), // Exclude current user from results
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, excludeUserId, limit } = input;

      // Get current user's class to filter results
      const currentUser = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          kelas: true,
          isAdmin: true,
        },
      });

      const userKelas = currentUser?.kelas;
      const isAdmin = currentUser?.isAdmin || false;

      // If user doesn't have a class or is admin, return empty results
      // Group tasks should only be available to users with assigned classes
      if (!userKelas || isAdmin) {
        return [];
      }

      const users = await prisma.user.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
          // Only return users from the same class
          kelas: userKelas,
          ...(excludeUserId && {
            id: {
              not: excludeUserId,
            },
          }),
          // Exclude admin users from search results
          isAdmin: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          kelas: true,
        },
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      return users;
    }),
});
