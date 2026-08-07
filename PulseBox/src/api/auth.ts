import { apiRequest } from './client';

export type UserOut = {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  auth_provider: string;
  role?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  language?: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserOut;
};

export type MessageResponse = {
  message: string;
};

export type SignUpResponse = {
  user_id: string;
  message: string;
};

export function signUp(data: { name: string; email: string; password: string }) {
  return apiRequest<SignUpResponse>('/auth/sign-up', { method: 'POST', body: data });
}

export function verifyOtp(data: { email: string; code: string }) {
  return apiRequest<TokenResponse>('/auth/verify-otp', { method: 'POST', body: data });
}

export function resendOtp(email: string) {
  return apiRequest<MessageResponse>('/auth/resend-otp', {
    method: 'POST',
    body: { email },
  });
}

export function signIn(data: { email: string; password: string }) {
  return apiRequest<TokenResponse>('/auth/sign-in', { method: 'POST', body: data });
}

export function refresh(refresh_token: string) {
  return apiRequest<{ access_token: string; token_type: string }>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token },
  });
}

export function logout(refresh_token: string) {
  return apiRequest<MessageResponse>('/auth/logout', {
    method: 'POST',
    body: { refresh_token },
  });
}

export function forgotPassword(email: string) {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function resetPassword(data: {
  email: string;
  code: string;
  new_password: string;
}) {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: data,
  });
}

export function getMe() {
  return apiRequest<UserOut>('/me', { auth: true });
}
