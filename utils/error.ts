export interface UserFacingError {
  title: string;
  message: string;
  action?: string;
}

const FALLBACK: UserFacingError = {
  title: 'Something went wrong',
  message: 'Please try again in a moment.',
  action: 'Try again',
};

export function toUserError(error: unknown, fallback: UserFacingError = FALLBACK): UserFacingError {
  if (error instanceof Error && error.message) {
    return {
      title: fallback.title,
      message: fallback.message,
      action: fallback.action,
    };
  }
  return fallback;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unexpected error';
}
