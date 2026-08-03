import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { problemsRouter } from "./routers/problems";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Local mode has no sign-in/sign-out: this always resolves to the single
    // auto-provisioned local user (see server/_core/localUser.ts).
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  problems: problemsRouter,
});

export type AppRouter = typeof appRouter;
