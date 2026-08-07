import { ApiError } from './client';

/** Map ApiError codes to a short title + user-facing message for alerts. */
export function authErrorAlert(err: unknown): { title: string; message: string; code?: string } {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'EMAIL_TAKEN':
        return { title: 'Email taken', message: err.message, code: err.code };
      case 'INVALID_CREDENTIALS':
        return { title: 'Sign in failed', message: err.message, code: err.code };
      case 'EMAIL_NOT_VERIFIED':
        return { title: 'Verify your email', message: err.message, code: err.code };
      case 'INVALID_OTP':
        return { title: 'Invalid code', message: err.message, code: err.code };
      case 'OTP_LOCKED':
        return { title: 'Code locked', message: err.message, code: err.code };
      case 'VALIDATION_ERROR':
        return {
          title: 'Check your details',
          message: err.message,
          code: err.code,
        };
      case 'RATE_LIMITED':
        return { title: 'Slow down', message: err.message, code: err.code };
      case 'USE_GOOGLE_SIGN_IN':
        return { title: 'Use Google', message: err.message, code: err.code };
      default:
        return { title: 'Something went wrong', message: err.message, code: err.code };
    }
  }
  if (err instanceof TypeError) {
    return {
      title: 'Cannot reach server',
      message:
        'Check that the backend is running with --host 0.0.0.0 and that API_BASE_URL matches your PC IP.',
    };
  }
  return {
    title: 'Something went wrong',
    message: err instanceof Error ? err.message : 'Unknown error',
  };
}
