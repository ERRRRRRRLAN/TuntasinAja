import { createTRPCRouter } from './trpc'
import { threadRouter } from './routers/thread'
import { userStatusRouter } from './routers/userStatus'
import { historyRouter } from './routers/history'
import { authRouter } from './routers/auth'
import { dantonRouter } from './routers/danton'
import { subscriptionRouter } from './routers/subscription'
import { announcementRouter } from './routers/announcement'

export const appRouter = createTRPCRouter({
  thread: threadRouter,
  userStatus: userStatusRouter,
  history: historyRouter,
  auth: authRouter,
  danton: dantonRouter,
  subscription: subscriptionRouter,
  announcement: announcementRouter,
})

export type AppRouter = typeof appRouter

