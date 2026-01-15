'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUpdateProject } from '@/features/project/hooks/useUpdateProject';

interface UseThemeSelectOptions {
  projectId: string;
  onSuccess?: () => void;
}

export function useThemeSelect({ projectId, onSuccess }: UseThemeSelectOptions) {
  const updateProject = useUpdateProject();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (themeId: string) => {
      await updateProject.mutateAsync({
        projectId,
        input: {
          selectedThemeId: themeId,
        },
      });
      return themeId;
    },
    onSuccess: () => {
      // 프로젝트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      onSuccess?.();
    },
  });
}
