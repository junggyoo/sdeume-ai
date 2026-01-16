export interface StudioStep {
  id: number;
  label: string;
  labelKo: string;
  path: string;
  description: string;
}

export const STUDIO_STEPS: readonly StudioStep[] = [
  {
    id: 1,
    label: 'Upload',
    labelKo: '업로드',
    path: 'upload',
    description: '사진을 업로드해주세요',
  },
  {
    id: 2,
    label: 'Theme',
    labelKo: '테마 선택',
    path: 'theme',
    description: '원하는 테마를 선택해주세요',
  },
  {
    id: 3,
    label: 'Shooting',
    labelKo: '촬영',
    path: 'shooting',
    description: 'AI가 화보를 생성합니다',
  },
  {
    id: 4,
    label: 'Reveal',
    labelKo: '결과 확인',
    path: 'reveal',
    description: '완성된 화보를 확인하세요',
  },
] as const;

export const getStepById = (stepId: number): StudioStep | undefined => {
  return STUDIO_STEPS.find((step) => step.id === stepId);
};

export const getStepByPath = (path: string): StudioStep | undefined => {
  return STUDIO_STEPS.find((step) => step.path === path);
};
