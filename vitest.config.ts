import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('https://placeholder.supabase.co'),
    'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('placeholder-key'),
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('placeholder-key'),
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        execArgv: ['--max-old-space-size=8192'],
      },
    },
    fileParallelism: false,
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'e2e/**',
        '**/*.config.{js,ts}',
        '**/types.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
