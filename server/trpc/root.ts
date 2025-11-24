import { createTRPCRouter } from './trpc'
import { threadRouter } from './routers/thread'
import { userStatusRouter } from './routers/userStatus'
import { historyRouter } from './routers/history'
import { authRouter } from './routers/auth'

export const appRouter = createTRPCRouter({
  thread: threadRouter,
  userStatus: userStatusRouter,
  history: historyRouter,
  auth: authRouter,
})

export type AppRouter = typeof appRouter

