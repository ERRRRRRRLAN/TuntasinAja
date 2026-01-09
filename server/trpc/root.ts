import { createTRPCRouter } from './trpc'
import { userSettingsRouter } from './routers/userSettings'
import { threadRouter } from './routers/thread'
import { userStatusRouter } from './routers/userStatus'
import { historyRouter } from './routers/history'
import { authRouter } from './routers/auth'
import { dantonRouter } from './routers/danton'
import { subscriptionRouter } from './routers/subscription'
import { scheduleRouter } from './routers/schedule'
import { weeklyScheduleRouter } from './routers/weeklySchedule'
import { classSubjectRouter } from './routers/classSubject'
import { feedbackRouter } from './routers/feedback'
import { notificationRouter } from './routers/notification'
import { appSettingsRouter } from './routers/appSettings'
import { databaseRouter } from './routers/database'
import { bulkOperationsRouter } from './routers/bulkOperations'
import { announcementRouter } from './routers/announcement'
import { schoolRouter } from './routers/school'

export const appRouter = createTRPCRouter({
  thread: threadRouter,
  userStatus: userStatusRouter,
  history: historyRouter,
  auth: authRouter,
  danton: dantonRouter,
  subscription: subscriptionRouter,
  schedule: scheduleRouter,
  weeklySchedule: weeklyScheduleRouter,
  classSubject: classSubjectRouter,
  feedback: feedbackRouter,
  notification: notificationRouter,
  appSettings: appSettingsRouter,
  database: databaseRouter,
  bulkOperations: bulkOperationsRouter,
  announcement: announcementRouter,
  userSettings: userSettingsRouter,
  school: schoolRouter,
})

export type AppRouter = typeof appRouter

