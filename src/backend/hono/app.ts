import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/backend/routes/example';
import { registerProjectRoutes } from '@/backend/routes/project';
import { registerThemeRoutes } from '@/backend/routes/theme';
import { registerGenerationRoutes } from '@/backend/routes/generation';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>().basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerProjectRoutes(app);
  registerThemeRoutes(app);
  registerGenerationRoutes(app);

  singletonApp = app;

  return app;
};
