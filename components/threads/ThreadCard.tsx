"use client";

import { useState, useEffect } from "react";
import {
  format,
  differenceInHours,
  differenceInMinutes,
  addDays,
  differenceInDays,
} from "date-fns";

import { id } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { toJakartaDate, getUTCDate } from "@/lib/date-utils";
import { trpc } from "@/lib/trpc";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CompletionStatsModal from "@/components/ui/CompletionStatsModal";
import { toast } from "@/components/ui/ToastContainer";
import {
  UserIcon,
  CalendarIcon,
  MessageIcon,
  ClockIcon,
  TrashIcon,
  XCloseIcon,
} from "@/components/ui/Icons";
import Checkbox from "@/components/ui/Checkbox";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    date: Date;
    createdAt: Date;
    deadline?: Date | null;
    isGroupTask?: boolean;
    groupTaskTitle?: string | null;
    author: {
      id: string;
      name: string;
      kelas?: string | null;
    };
    comments: Array<{
      id: string;
      content: string;
      deadline?: Date | null; // Make sure this is included
      author: {
        id: string;
        name: string;
        kelas?: string | null;
      };
    }>;
    _count: {
      comments: number;
    };
    groupMembers?: Array<{
      userId: string;
      user: {
        id: string;
        name: string;
      };
    }>;
  };
  onThreadClick?: (threadId: string) => void;
}

export default function ThreadCard({ thread, onThreadClick }: ThreadCardProps) {
  const { data: session } = useSession();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUncheckDialog, setShowUncheckDialog] = useState(false);
  const [showCompletionStatsModal, setShowCompletionStatsModal] =
    useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isFakeLoading, setIsFakeLoading] = useState(false);
  const [visualCompleted, setVisualCompleted] = useState<boolean | null>(null);
  const [visualGroupProgress, setVisualGroupProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const debounceTimerRef = useState<{ timer: NodeJS.Timeout | null }>({ timer: null })[0];

  // Get thread status (for current user)
  const { data: statuses } = trpc.userStatus.getThreadStatuses.useQuery(
    { threadId: thread.id },
    { enabled: !!session },
  );

  // Get group task progress (for all users - public data)
  const { data: groupTaskProgress } = trpc.thread.getGroupTaskProgress.useQuery(
    { threadId: thread.id },
    { enabled: thread.isGroupTask === true },
  );

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  });
  const isAdmin = adminCheck?.isAdmin || false;

  // Get completion stats for admin
  const { data: completionStats } = trpc.thread.getCompletionStats.useQuery(
    { threadId: thread.id },
    { enabled: !!session && isAdmin },
  );

  const utils = trpc.useUtils();

  const threadStatus = statuses?.find(
    (s) => s.threadId === thread.id && !s.commentId,
  );
  const isCompleted = visualCompleted ?? (threadStatus?.isCompleted || false);

  // Use server-calculated progress for group tasks (works for all users)
  // Fallback to client-side calculation if server data not available
  const groupProgress =
    visualGroupProgress ??
    (thread.isGroupTask && groupTaskProgress
      ? groupTaskProgress
      : thread.isGroupTask &&
        thread.comments &&
        thread.comments.length > 0 &&
        statuses
        ? (() => {
          const completedComments = thread.comments.filter((comment) => {
            const commentStatus = statuses.find(
              (s) => s.commentId === comment.id,
            );
            return commentStatus?.isCompleted || false;
          });
          const totalComments = thread.comments.length;
          const completedCount = completedComments.length;
          // Calculate percentage: 1/2 = 50%, 2/2 = 100%, etc.
          const percentage =
            totalComments > 0
              ? Math.round((completedCount / totalComments) * 100)
              : 0;
          return {
            completed: completedCount,
            total: totalComments,
            percentage,
          };
        })()
        : thread.isGroupTask && thread.comments && thread.comments.length > 0
          ? {
            completed: 0,
            total: thread.comments.length,
            percentage: 0,
          }
          : null);

  // Calculate time remaining until auto-delete (1 day from when thread was checked)
  // Timer only shows when thread is completed
  useEffect(() => {
    if (!isCompleted || !threadStatus?.updatedAt) {
      setTimeRemaining("");
      return;
    }

    const calculateTimeRemaining = () => {
      // Timer is calculated from when thread was checked (updatedAt) + 1 day
      const deleteDate = addDays(new Date(threadStatus.updatedAt), 1);
      const now = new Date();
      const diffMs = deleteDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining("Akan terhapus segera");
        return;
      }

      const hours = differenceInHours(deleteDate, now);
      const minutes = differenceInMinutes(deleteDate, now) % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m lagi`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m lagi`);
      } else {
        setTimeRemaining("Akan terhapus segera");
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isCompleted, threadStatus?.updatedAt]);

  // Toggle thread completion
  const toggleThread = trpc.userStatus.toggleThread.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await utils.userStatus.getThreadStatuses.cancel({ threadId: thread.id });

      // Snapshot the previous value
      const previousStatuses = utils.userStatus.getThreadStatuses.getData({
        threadId: thread.id,
      });

      // Optimistically update to the new value
      utils.userStatus.getThreadStatuses.setData(
        { threadId: thread.id },
        (old = []) => {
          const threadStatusIndex = old.findIndex(s => !s.commentId);
          let updatedStatuses = [...old];

          if (threadStatusIndex > -1) {
            // Update existing thread status
            updatedStatuses = updatedStatuses.map((s, i) => {
              if (i === threadStatusIndex) {
                return { ...s, isCompleted: variables.isCompleted };
              }
              // If thread is completed, all subtasks are also completed
              if (variables.isCompleted && s.commentId) {
                return { ...s, isCompleted: true };
              }
              return s;
            });
          } else {
            // Add new thread status
            updatedStatuses.push({
              id: "temp-thread-id",
              threadId: thread.id,
              commentId: null,
              isCompleted: variables.isCompleted,
              updatedAt: new Date(),
              createdAt: new Date(),
              userId: session?.user?.id || "temp-user-id",
            });
            // If thread is completed, ensure all subtasks in cache are also completed
            if (variables.isCompleted) {
              updatedStatuses = updatedStatuses.map((s) =>
                s.commentId ? { ...s, isCompleted: true } : s
              );
            }
          }
          return updatedStatuses;
        },
      );

      // Return a context object with the snapshotted value
      return { previousStatuses };
    },
    onSuccess: async () => {
      setShowConfirmDialog(false);
      // Invalidate and refetch to ensure sync with server
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId: thread.id }),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
        utils.userStatus.getUncompletedCount.invalidate(),
        utils.userStatus.getOverdueTasks.invalidate(),
      ]);
    },
    onError: (error: any, variables, context) => {
      console.error("Error toggling thread:", error);
      console.error("[ERROR] Gagal mengubah status thread. Silakan coba lagi.");
      setShowConfirmDialog(false);

      // Rollback to the previous value if mutation fails
      if (context?.previousStatuses) {
        utils.userStatus.getThreadStatuses.setData(
          { threadId: thread.id },
          context.previousStatuses,
        );
      }
    },
    onSettled: () => {
      // Sync with server
      utils.userStatus.getThreadStatuses.invalidate({ threadId: thread.id });
    },
  });

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;

    const now = Date.now();
    if (now - lastClickTime < 300) {
      toast.error("Waduh, pelan-pelan! Gerakan kamu terlalu cepat.");
      return;
    }
    setLastClickTime(now);

    const nextState = !isCompleted;
    setVisualCompleted(nextState);

    // Start/restart fake loading spinner
    setIsFakeLoading(true);
    if (debounceTimerRef.timer) clearTimeout(debounceTimerRef.timer);

    // Update group progress visually if needed
    if (thread.isGroupTask && thread.comments && thread.comments.length > 0) {
      if (nextState) {
        setVisualGroupProgress({
          completed: thread.comments.length,
          total: thread.comments.length,
          percentage: 100,
        });
      } else {
        setVisualGroupProgress({
          completed: 0,
          total: thread.comments.length,
          percentage: 0,
        });
      }
    }

    debounceTimerRef.timer = setTimeout(() => {
      setIsFakeLoading(false);
      // Only mutate if the state is different from what we think the DB has
      if (nextState !== (threadStatus?.isCompleted || false)) {
        toggleThread.mutate({
          threadId: thread.id,
          isCompleted: nextState,
        });
      }
    }, 800);
  };

  const handleConfirmUncheck = () => {
    setShowUncheckDialog(false);
    // Explicit uncheck from dialog (if needed)
    setVisualCompleted(false);
    setIsFakeLoading(true);
    if (debounceTimerRef.timer) clearTimeout(debounceTimerRef.timer);

    debounceTimerRef.timer = setTimeout(() => {
      setIsFakeLoading(false);
      toggleThread.mutate({
        threadId: thread.id,
        isCompleted: false,
      });
    }, 800);
  };

  const handleConfirmThread = () => {
    setShowConfirmDialog(false);
    setVisualCompleted(true);
    setIsFakeLoading(true);
    if (debounceTimerRef.timer) clearTimeout(debounceTimerRef.timer);

    debounceTimerRef.timer = setTimeout(() => {
      setIsFakeLoading(false);
      toggleThread.mutate({
        threadId: thread.id,
        isCompleted: true,
      });
    }, 800);
  };


  const handleCardClick = () => {
    // Don't open quickview if any dialog is open
    if (showConfirmDialog || showUncheckDialog) {
      return;
    }
    if (onThreadClick) {
      onThreadClick(thread.id);
    }
  };

  // Calculate deadline badge for a single deadline
  const getDeadlineBadge = (deadline: Date | null | undefined) => {
    if (!deadline) return null;

    const now = getUTCDate();
    const deadlineUTC = new Date(deadline);
    const deadlineJakarta = toJakartaDate(deadlineUTC);
    const nowJakarta = toJakartaDate(now);

    const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta);
    const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta);

    if (hoursUntilDeadline < 0) {
      // Deadline sudah lewat
      return {
        text: "Deadline lewat",
        color: "var(--danger)",
        bg: "var(--danger)20",
      };
    } else if (hoursUntilDeadline < 2) {
      // Kurang dari 2 jam
      const totalMinutes = differenceInMinutes(deadlineJakarta, nowJakarta);
      if (totalMinutes < 60) {
        return {
          text: `${totalMinutes}m lagi`,
          color: "var(--danger)",
          bg: "var(--danger)20",
        };
      } else {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return {
          text: minutes > 0 ? `${hours}j ${minutes}m lagi` : `${hours}j lagi`,
          color: "var(--danger)",
          bg: "var(--danger)20",
        };
      }
    } else if (hoursUntilDeadline < 24) {
      // Kurang dari 24 jam
      return {
        text: `${hoursUntilDeadline}j lagi`,
        color: "var(--danger)",
        bg: "var(--danger)20",
      };
    } else if (daysUntilDeadline < 3) {
      // Kurang dari 3 hari
      return {
        text: `${daysUntilDeadline} hari lagi`,
        color: "var(--warning)",
        bg: "var(--warning)20",
      };
    } else {
      // Lebih dari 3 hari
      return {
        text: format(deadlineJakarta, "d MMM", { locale: id }),
        color: "var(--text-light)",
        bg: "var(--bg-secondary)",
      };
    }
  };

  // Get all unique deadlines from thread and comments (only show non-expired)
  const getAllDeadlines = () => {
    const deadlines: Date[] = [];
    const now = getUTCDate();

    // Add thread deadline if exists and not expired
    if (thread.deadline) {
      const threadDeadline = new Date(thread.deadline);
      if (threadDeadline > now) {
        deadlines.push(threadDeadline);
      }
    }

    // Add comment deadlines if they exist, not expired, and different from thread deadline
    thread.comments.forEach((comment) => {
      if (comment.deadline) {
        const commentDeadline = new Date(comment.deadline);

        // Only include if not expired
        if (commentDeadline <= now) return;

        // Check if this deadline is different from existing ones (compare timestamps)
        const isDifferent = !deadlines.some(
          (d) => Math.abs(d.getTime() - commentDeadline.getTime()) < 60000, // Within 1 minute = same
        );
        if (isDifferent) {
          deadlines.push(commentDeadline);
        }
      }
    });

    // Sort deadlines by date (earliest first)
    return deadlines.sort((a, b) => a.getTime() - b.getTime());
  };

  const allDeadlines = getAllDeadlines();
  const deadlineBadges = allDeadlines
    .map((deadline) => getDeadlineBadge(deadline))
    .filter(Boolean);

  // Filter out comments with expired deadline (hide them)
  const visibleComments = thread.comments.filter((comment) => {
    if (!comment.deadline) return true; // Show comments without deadline

    const deadlineDate = new Date(comment.deadline);
    const now = getUTCDate();
    const isExpired = deadlineDate <= now;

    return !isExpired; // Only show if deadline hasn't passed
  });

  // Check if thread should be hidden (all comments are hidden due to expired deadline)
  const shouldHideThread =
    thread.comments.length > 0 && visibleComments.length === 0;

  // Don't render if thread should be hidden
  if (shouldHideThread) {
    return null;
  }

  return (
    <div
      className="thread-card"
      onClick={handleCardClick}
      style={{
        cursor: "pointer",
        pointerEvents: showConfirmDialog || showUncheckDialog ? "none" : "auto",
        position: 'relative',
      }}
    >
      {/* Status Indicator Dot */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: isCompleted
            ? 'var(--success)'
            : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--danger)'
              ? 'var(--danger)'
              : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--warning)'
                ? 'var(--warning)'
                : 'var(--primary)',
          boxShadow: `0 0 0 3px ${isCompleted
            ? 'rgba(16, 185, 129, 0.2)'
            : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--danger)'
              ? 'rgba(239, 68, 68, 0.2)'
              : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--warning)'
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(99, 102, 241, 0.2)'
            }`,
          transition: 'all 0.3s ease',
          zIndex: 1,
        }}
        title={
          isCompleted
            ? 'Selesai'
            : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--danger)'
              ? 'Deadline mendekat'
              : allDeadlines.length > 0 && deadlineBadges[0]?.color === 'var(--warning)'
                ? 'Deadline dalam 3 hari'
                : 'Aktif'
        }
      />
      <div className="thread-card-content">
        <div className="thread-card-header">
          {session && !isAdmin && (
            <Checkbox
              checked={isCompleted}
              onClick={handleCheckboxClick}
              isLoading={isFakeLoading}
              disabled={isFakeLoading}
              size={28}
            />
          )}
          {session && isAdmin && (
            <div
              style={{
                minWidth: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--primary)",
                cursor: "pointer",
                padding: "0 0.5rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--primary)",
                background: "transparent",
                transition: "all 0.2s",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (completionStats) {
                  setShowCompletionStatsModal(true);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--primary)";
              }}
            >
              {completionStats
                ? `${completionStats.completedCount}/${completionStats.totalCount}`
                : "-"}
            </div>
          )}
          <div
            className="thread-card-header-content"
            style={{ position: "relative" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <h3
                  className="thread-title"
                  style={{
                    textDecoration: isCompleted ? "line-through" : "none",
                    color: isCompleted ? "var(--text-light)" : "var(--text)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {thread.title}
                </h3>
                {thread.isGroupTask && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "0.25rem",
                      background: "var(--primary)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Kelompok
                  </span>
                )}
                {thread.author.kelas && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.125rem 0.375rem",
                      borderRadius: "0.25rem",
                      border: "1px solid var(--primary)",
                      color: "var(--primary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "transparent",
                    }}
                  >
                    {thread.author.kelas}
                  </span>
                )}
              </div>
              {thread.isGroupTask && thread.groupTaskTitle && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--text-light)",
                    fontStyle: "italic",
                  }}
                >
                  {thread.groupTaskTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="thread-meta">
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <UserIcon size={16} />
            <span>{thread.author.name}</span>
          </span>
          {thread.isGroupTask &&
            thread.groupMembers &&
            thread.groupMembers.length > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  color: "var(--text-light)",
                }}
              >
                👥 {thread.groupMembers.length} anggota
              </span>
            )}
          {thread.isGroupTask && (
            <div
              style={{
                width: "100%",
                marginTop: "0.75rem",
                padding: "0.75rem",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Progress Tugas
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  {groupProgress
                    ? `${groupProgress.completed}/${groupProgress.total}`
                    : "0/0"}
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "12px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                {groupProgress && groupProgress.total > 0 ? (
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, groupProgress.percentage))}%`,
                      height: "100%",
                      backgroundColor:
                        groupProgress.percentage === 100
                          ? "var(--success)"
                          : "var(--primary)",
                      borderRadius: "6px",
                      transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 1px 3px rgba(99, 102, 241, 0.3)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "0%",
                      height: "100%",
                      backgroundColor: "var(--primary)",
                      borderRadius: "6px",
                    }}
                  />
                )}
              </div>
              {groupProgress && groupProgress.total > 0 && (
                <div
                  style={{
                    marginTop: "0.375rem",
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "var(--text-light)",
                    }}
                  >
                    {groupProgress.percentage}% selesai
                  </span>
                </div>
              )}
            </div>
          )}
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <CalendarIcon size={16} />
            <span>
              {format(new Date(thread.date), "EEEE, d MMM yyyy", {
                locale: id,
              })}
            </span>
          </span>
          {deadlineBadges.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {deadlineBadges.map((badge, index) => (
                <span
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: badge!.color,
                    background: badge!.bg,
                  }}
                >
                  <ClockIcon size={14} />
                  {badge!.text}
                </span>
              ))}
            </div>
          )}
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <MessageIcon size={16} />
            <span>{visibleComments.length} sub tugas</span>
          </span>
          {isCompleted && timeRemaining && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                color: "var(--text-light)",
                fontSize: "0.875rem",
              }}
            >
              <ClockIcon size={16} />
              <span>Auto-hapus: {timeRemaining}</span>
            </span>
          )}
        </div>

        {visibleComments.length > 0 && (
          <div className="thread-comments-preview">
            {visibleComments.slice(0, 2).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                threadId={thread.id}
                statuses={statuses || []}
                threadAuthorId={thread.author.id}
                isGroupTask={thread.isGroupTask || false}
                totalComments={thread.comments?.length || 0}
                currentCompleted={groupProgress?.completed || 0}
                onProgressChange={(newProgress) => setVisualGroupProgress(newProgress)}
              />
            ))}
            {visibleComments.length > 2 && (
              <p
                style={{
                  marginTop: "0.5rem",
                  color: "var(--text-light)",
                  fontSize: "0.875rem",
                }}
              >
                + {visibleComments.length - 2} sub tugas lainnya
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Centang PR?"
        message={`Apakah Anda yakin ingin mencentang PR "${thread.title}"? Semua sub tugas di dalamnya akan otomatis tercentang.`}
        confirmText="Ya, Centang"
        cancelText="Batal"
        onConfirm={handleConfirmThread}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <ConfirmDialog
        isOpen={showUncheckDialog}
        title="Uncentang PR?"
        message={`Apakah Anda yakin ingin menguncentang PR "${thread.title}"? Jika Anda mencentang lagi nanti, timer auto-hapus akan direset ke 1 hari lagi dari waktu centang tersebut.`}
        confirmText="Ya, Uncentang"
        cancelText="Batal"
        onConfirm={handleConfirmUncheck}
        onCancel={() => setShowUncheckDialog(false)}
      />

      {isAdmin && completionStats && (
        <CompletionStatsModal
          isOpen={showCompletionStatsModal}
          onClose={() => setShowCompletionStatsModal(false)}
          threadTitle={thread.title}
          completedCount={completionStats.completedCount}
          totalCount={completionStats.totalCount}
          completedUsers={completionStats.completedUsers}
        />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  threadId,
  statuses,
  threadAuthorId,
  isGroupTask,
  totalComments,
  currentCompleted,
  onProgressChange,
}: {
  comment: {
    id: string;
    content: string;
    deadline?: Date | null;
    author: { id: string; name: string; kelas?: string | null };
  };
  threadId: string;
  statuses: Array<{ commentId?: string | null; isCompleted: boolean }>;
  threadAuthorId: string;
  isGroupTask: boolean;
  totalComments: number;
  currentCompleted: number;
  onProgressChange: (progress: { completed: number; total: number; percentage: number }) => void;
}) {
  const { data: session } = useSession();
  const commentStatus = statuses.find((s) => s.commentId === comment.id);
  const [isFakeLoading, setIsFakeLoading] = useState(false);
  const [visualCompleted, setVisualCompleted] = useState<boolean | null>(null);
  const isCompleted = visualCompleted ?? (commentStatus?.isCompleted || false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const debounceTimerRef = useState<{ timer: NodeJS.Timeout | null }>({ timer: null })[0];

  // Check if user is admin
  const { data: adminCheck } = trpc.auth.isAdmin.useQuery(undefined, {
    enabled: !!session,
  });
  const isAdmin = adminCheck?.isAdmin || false;

  const utils = trpc.useUtils();

  const toggleComment = trpc.userStatus.toggleComment.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await utils.userStatus.getThreadStatuses.cancel({ threadId });

      // Snapshot the previous value
      const previousStatuses = utils.userStatus.getThreadStatuses.getData({
        threadId,
      });

      // Optimistically update to the new value
      utils.userStatus.getThreadStatuses.setData({ threadId }, (old = []) => {
        const statusIndex = old.findIndex(s => s.commentId === variables.commentId);
        if (statusIndex > -1) {
          return old.map((s, i) => i === statusIndex ? { ...s, isCompleted: variables.isCompleted } : s);
        } else {
          return [
            ...old,
            {
              id: "temp-comment-" + variables.commentId,
              threadId,
              commentId: variables.commentId,
              isCompleted: variables.isCompleted,
              updatedAt: new Date(),
              createdAt: new Date(),
              userId: session?.user?.id || "temp-user-id",
            }
          ];
        }
      });


      // Start/restart fake loading spinner
      setIsFakeLoading(true);
      if (debounceTimerRef.timer) clearTimeout(debounceTimerRef.timer);

      debounceTimerRef.timer = setTimeout(() => {
        setIsFakeLoading(false);
        const nextIsCompleted = variables.isCompleted;
        setVisualCompleted(nextIsCompleted);

        // If parent thread is group task, update visual progress of parent
        if (isGroupTask && totalComments > 0) {
          const nextCompleted = nextIsCompleted
            ? Math.min(totalComments, currentCompleted + 1)
            : Math.max(0, currentCompleted - 1);
          const nextPercentage = Math.round((nextCompleted / totalComments) * 100);
          onProgressChange({
            completed: nextCompleted,
            total: totalComments,
            percentage: nextPercentage,
          });
        }

        // Only mutate if the state is different
        if (nextIsCompleted !== (commentStatus?.isCompleted || false)) {
          toggleComment.mutate(variables);
        }
      }, 800);

      return { previousStatuses };
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await Promise.all([
        utils.userStatus.getThreadStatuses.invalidate({ threadId }),
        utils.thread.getAll.invalidate(),
        utils.history.getUserHistory.invalidate(),
      ]);
    },
    onError: (error: any, variables, context) => {
      console.error("Error toggling comment:", error);
      console.error(
        "[ERROR] Gagal mengubah status sub tugas. Silakan coba lagi.",
      );

      // Rollback
      if (context?.previousStatuses) {
        utils.userStatus.getThreadStatuses.setData(
          { threadId },
          context.previousStatuses,
        );
      }
    },
    onSettled: () => {
      utils.userStatus.getThreadStatuses.invalidate({ threadId });
    },
  });

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) return;

    const now = Date.now();
    if (now - lastClickTime < 300) {
      toast.error("Waduh, pelan-pelan! Gerakan kamu terlalu cepat.");
      return;
    }
    setLastClickTime(now);

    const nextState = !isCompleted;
    setVisualCompleted(nextState);

    // Start/restart fake loading spinner
    setIsFakeLoading(true);
    if (debounceTimerRef.timer) clearTimeout(debounceTimerRef.timer);

    // Update parent's visual progress immediately
    if (isGroupTask && totalComments > 0) {
      const nextCompleted = nextState
        ? Math.min(totalComments, currentCompleted + 1)
        : Math.max(0, currentCompleted - 1);
      const nextPercentage = Math.round((nextCompleted / totalComments) * 100);
      onProgressChange({
        completed: nextCompleted,
        total: totalComments,
        percentage: nextPercentage,
      });
    }

    debounceTimerRef.timer = setTimeout(() => {
      setIsFakeLoading(false);
      // Only mutate if state truly changed from DB
      if (nextState !== (commentStatus?.isCompleted || false)) {
        toggleComment.mutate({
          threadId,
          commentId: comment.id,
          isCompleted: nextState,
        });
      }
    }, 800);
  };

  // Calculate deadline badge for comment
  const getCommentDeadlineBadge = () => {
    if (!comment.deadline) {
      console.log(
        "[CommentItem] No deadline:",
        comment.id,
        comment.content.substring(0, 20),
      );
      return null;
    }

    const now = getUTCDate();
    const deadlineUTC = new Date(comment.deadline);
    const deadlineJakarta = toJakartaDate(deadlineUTC);
    const nowJakarta = toJakartaDate(now);

    const hoursUntilDeadline = differenceInHours(deadlineJakarta, nowJakarta);
    const daysUntilDeadline = differenceInDays(deadlineJakarta, nowJakarta);

    let badge = null;

    if (hoursUntilDeadline < 0) {
      badge = {
        text: "Lewat",
        color: "var(--danger)",
        bg: "var(--danger)20",
      };
    } else if (hoursUntilDeadline < 2) {
      badge = {
        text: `${hoursUntilDeadline * 60 + (differenceInMinutes(deadlineJakarta, nowJakarta) % 60)}m`,
        color: "var(--danger)",
        bg: "var(--danger)20",
      };
    } else if (hoursUntilDeadline < 24) {
      badge = {
        text: `${hoursUntilDeadline}j`,
        color: "var(--danger)",
        bg: "var(--danger)20",
      };
    } else if (daysUntilDeadline < 3) {
      badge = {
        text: `${daysUntilDeadline} hari`,
        color: "var(--warning)",
        bg: "var(--warning)20",
      };
    } else {
      badge = {
        text: format(deadlineJakarta, "d MMM", { locale: id }),
        color: "var(--text-light)",
        bg: "var(--bg-secondary)",
      };
    }

    console.log("[CommentItem] Badge calculated:", {
      commentId: comment.id,
      content: comment.content.substring(0, 20),
      deadline: comment.deadline,
      hoursUntilDeadline,
      badge,
    });

    return badge;
  };

  const commentDeadlineBadge = getCommentDeadlineBadge();

  console.log("[CommentItem] Final badge:", {
    commentId: comment.id,
    content: comment.content.substring(0, 20),
    hasBadge: !!commentDeadlineBadge,
    badge: commentDeadlineBadge,
  });

  return (
    <div
      className="comment-item"
      style={{
        display: "flex",
        alignItems: "start",
        gap: "0.5rem",
        position: "relative",
        width: "100%",
      }}
    >
      {session && !isAdmin && (
        <div style={{ marginTop: "0.25rem" }}>
          <Checkbox
            checked={isCompleted}
            onClick={handleCheckboxClick}
            isLoading={isFakeLoading}
            disabled={isFakeLoading}
            size={24}
          />
        </div>
      )}
      <div className="comment-text" style={{ flex: 1 }}>
        <div
          style={{
            textDecoration: isCompleted ? "line-through" : "none",
            color: isCompleted ? "var(--text-light)" : "var(--text)",
          }}
        >
          {comment.content}
        </div>
        <div
          className="comment-author"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.25rem",
            position: "relative",
            flexWrap: "wrap",
          }}
        >
          <span>- {comment.author.name}</span>
          {comment.author.kelas && (
            <span
              style={{
                display: "inline-block",
                padding: "0.125rem 0.375rem",
                borderRadius: "0.25rem",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "transparent",
              }}
            >
              {comment.author.kelas}
            </span>
          )}
          {commentDeadlineBadge && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.125rem 0.375rem",
                borderRadius: "0.25rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: commentDeadlineBadge.color,
                background: commentDeadlineBadge.bg,
              }}
            >
              <ClockIcon size={12} />
              {commentDeadlineBadge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
