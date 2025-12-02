import { createTRPCRouter } from './trpc'
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
})

export type AppRouter = typeof appRouter

