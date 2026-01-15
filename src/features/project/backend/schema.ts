import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z
    .enum([
      'draft',
      'uploading',
      'optimizing',
      'theme_selecting',
      'training',
      'generating',
      'completed',
      'failed',
    ])
    .optional(),
  currentStep: z.number().int().min(1).max(5).optional(),
  selectedThemeId: z.string().uuid().optional(),
});

export const ProjectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectIdParam = z.infer<typeof ProjectIdParamSchema>;
