import { z } from 'zod';

// Re-export schemas for frontend use
export const ExampleParamsSchema = z.object({
  id: z.string().uuid({ message: 'Example id must be a valid UUID.' }),
});

export const ExampleResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().url(),
  bio: z.string().nullable(),
  updatedAt: z.string(),
});

export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
