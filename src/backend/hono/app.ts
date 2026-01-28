import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { exampleRoutes } from '@/backend/routes/example';
import { projectRoutes } from '@/backend/routes/project';
import { themeRoutes } from '@/backend/routes/theme';
import { generationRoutes } from '@/backend/routes/generation';
import { shootRoutes } from '@/backend/routes/shoot';
import { uploadRoutes } from '@/backend/routes/upload';
import { userFaceModelRoutes } from '@/backend/routes/user-face-model';
import { adminPromptTestRoutes } from '@/backend/routes/admin-prompt-test';
import type { AppEnv } from '@/backend/hono/context';

// =============================================================================
// App Factory with Type Export for Hono RPC
// =============================================================================

const createBaseApp = () => {
  const app = new Hono<AppEnv>().basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  return app;
};

const createTypedRoutes = () => {
  const app = createBaseApp();

  // Register all routes with chaining for complete RPC type inference
  return app
    .route('/example', exampleRoutes)
    .route('/projects', projectRoutes)
    .route('/themes', themeRoutes)
    .route('/generate', generationRoutes)
    .route('/shoot', shootRoutes)
    .route('/upload', uploadRoutes)
    .route('/user-face-models', userFaceModelRoutes)
    .route('/admin/prompt-test', adminPromptTestRoutes);
};

// Type export for Hono RPC client
export type AppType = ReturnType<typeof createTypedRoutes>;

// =============================================================================
// Singleton App Instance
// =============================================================================

let singletonApp: AppType | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  singletonApp = createTypedRoutes();

  return singletonApp;
};
