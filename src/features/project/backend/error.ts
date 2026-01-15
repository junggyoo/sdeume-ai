export const projectErrorCodes = {
  notFound: 'PROJECT_NOT_FOUND',
  createError: 'PROJECT_CREATE_ERROR',
  updateError: 'PROJECT_UPDATE_ERROR',
  fetchError: 'PROJECT_FETCH_ERROR',
  unauthorized: 'PROJECT_UNAUTHORIZED',
} as const;

type ProjectErrorValue =
  (typeof projectErrorCodes)[keyof typeof projectErrorCodes];

export type ProjectServiceError = ProjectErrorValue;
