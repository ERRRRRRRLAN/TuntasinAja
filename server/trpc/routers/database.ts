import { createTRPCRouter, adminProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const databaseRouter = createTRPCRouter({
  // Get database statistics
  getStats: adminProcedure.query(async () => {
    // Get row counts for all tables
    const [
      userCount,
      threadCount,
      commentCount,
      userStatusCount,
      historyCount,
      feedbackCount,
      deviceTokenCount,
      subscriptionCount,
      classSubjectCount,
      weeklyScheduleCount,
      classScheduleCount,
      appSettingsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.thread.count(),
      prisma.comment.count(),
      prisma.userStatus.count(),
      prisma.history.count(),
      prisma.feedback.count(),
      prisma.deviceToken.count(),
      prisma.classSubscription.count(),
      prisma.classSubject.count(),
      prisma.weeklySchedule.count(),
      prisma.classSchedule.count(),
      prisma.appSettings.count(),
    ])

    // Try to count notification mutes (table might not exist)
    let notificationMuteCount = 0
    try {
      notificationMuteCount = await (prisma as any).notificationMute.count()
    } catch {
      // Table doesn't exist, skip
    }

    // Get oldest records
    const oldestThread = await prisma.thread.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })

    const oldestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })

    const oldestHistory = await prisma.history.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })

    // Get records that might need cleanup
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const [oldHistoryCount, oldInactiveThreadsCount] = await Promise.all([
      // History older than 30 days
      prisma.history.count({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
      // Threads older than 90 days with no comments and no completions
      prisma.thread.count({
        where: {
          createdAt: {
            lt: ninetyDaysAgo,
          },
          comments: {
            none: {},
          },
          userStatuses: {
            none: {
              isCompleted: true,
            },
          },
        },
      }),
    ])

    // Get orphaned user statuses (threadId or commentId that doesn't exist)
    // Use raw SQL for better performance
    let orphanedUserStatusCount = 0
    try {
      const orphanedByThread = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM user_statuses us
        WHERE us.thread_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM threads t WHERE t.id = us.thread_id
        )
      `
      const orphanedByComment = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM user_statuses us
        WHERE us.comment_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM comments c WHERE c.id = us.comment_id
        )
      `
      orphanedUserStatusCount = Number(orphanedByThread[0]?.count || 0) + Number(orphanedByComment[0]?.count || 0)
    } catch (error) {
      // If raw query fails, skip orphaned count
      console.error('Error counting orphaned user statuses:', error)
      orphanedUserStatusCount = 0
    }

    // Calculate total estimated rows (for display purposes)
    const totalRows =
      userCount +
      threadCount +
      commentCount +
      userStatusCount +
      historyCount +
      feedbackCount +
      deviceTokenCount +
      subscriptionCount +
      classSubjectCount +
      weeklyScheduleCount +
      classScheduleCount +
      appSettingsCount +
      notificationMuteCount

    return {
      tableStats: [
        { name: 'Users', count: userCount, tableName: 'users' },
        { name: 'Threads', count: threadCount, tableName: 'threads' },
        { name: 'Comments', count: commentCount, tableName: 'comments' },
        { name: 'User Statuses', count: userStatusCount, tableName: 'user_statuses' },
        { name: 'Histories', count: historyCount, tableName: 'histories' },
        { name: 'Feedbacks', count: feedbackCount, tableName: 'feedbacks' },
        { name: 'Device Tokens', count: deviceTokenCount, tableName: 'device_tokens' },
        { name: 'Subscriptions', count: subscriptionCount, tableName: 'class_subscriptions' },
        { name: 'Class Subjects', count: classSubjectCount, tableName: 'class_subjects' },
        { name: 'Weekly Schedules', count: weeklyScheduleCount, tableName: 'weekly_schedules' },
        { name: 'Class Schedules', count: classScheduleCount, tableName: 'class_schedules' },
        { name: 'App Settings', count: appSettingsCount, tableName: 'app_settings' },
        ...(notificationMuteCount > 0 ? [{ name: 'Notification Mutes', count: notificationMuteCount, tableName: 'notification_mutes' }] : []),
      ],
      oldestRecords: {
        thread: oldestThread?.createdAt || null,
        user: oldestUser?.createdAt || null,
        history: oldestHistory?.createdAt || null,
      },
      cleanupRecommendations: {
        oldHistory: oldHistoryCount,
        inactiveThreads: oldInactiveThreadsCount,
        orphanedUserStatuses: orphanedUserStatusCount,
      },
      summary: {
        totalRows,
        totalTables: notificationMuteCount > 0 ? 13 : 12,
      },
    }
  }),

  // Get table size estimates (PostgreSQL specific)
  getTableSizes: adminProcedure.query(async () => {
    // Note: This requires raw SQL query for PostgreSQL
    // We'll use Prisma's $queryRaw for this
    try {
      const result = await prisma.$queryRaw<Array<{
        table_name: string
        row_count: bigint
        total_size: string
        table_size: string
      }>>`
        SELECT 
          schemaname || '.' || tablename AS table_name,
          pg_class.reltuples::bigint AS row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size
        FROM pg_tables
        JOIN pg_class ON pg_class.relname = pg_tables.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `

      return result.map((row) => ({
        tableName: row.table_name.replace('public.', ''),
        rowCount: Number(row.row_count),
        totalSize: row.total_size,
        tableSize: row.table_size,
      }))
    } catch (error) {
      // If query fails (e.g., not PostgreSQL or insufficient permissions), return empty
      console.error('Error getting table sizes:', error)
      return []
    }
  }),

  // Get database total size
  getDatabaseSize: adminProcedure.query(async () => {
    try {
      const result = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size
      `

      return result[0]?.size || 'Unknown'
    } catch (error) {
      console.error('Error getting database size:', error)
      return 'Unknown'
    }
  }),
})

