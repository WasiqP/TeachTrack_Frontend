import { apiRequest, apiUpload } from './client';
import { mediaUrl } from './config';

export type ProfileOut = {
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  institutionName?: string | null;
  professionalTitle?: string | null;
  subjectsTeach?: string | null;
  timezone?: string | null;
};

export type ProfileUpdateBody = {
  displayName?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  institutionName?: string;
  professionalTitle?: string;
  subjectsTeach?: string;
  timezone?: string;
};

export type SettingsOut = {
  notifyTaskReminders: boolean;
  notifyGradeUpdates: boolean;
  notifyClassAnnouncements: boolean;
  language: string;
};

export type SettingsUpdateBody = {
  notifyTaskReminders?: boolean;
  notifyGradeUpdates?: boolean;
  notifyClassAnnouncements?: boolean;
  language?: 'en' | 'es' | 'fr';
};

export function getProfile() {
  return apiRequest<ProfileOut>('/me/profile', { auth: true });
}

export function patchProfile(body: ProfileUpdateBody) {
  return apiRequest<ProfileOut>('/me/profile', {
    method: 'PATCH',
    body,
    auth: true,
  });
}

export function getSettings() {
  return apiRequest<SettingsOut>('/me/settings', { auth: true });
}

export function patchSettings(body: SettingsUpdateBody) {
  return apiRequest<SettingsOut>('/me/settings', {
    method: 'PATCH',
    body,
    auth: true,
  });
}

/**
 * Upload avatar from a local image URI (image picker).
 * Field name must be `file`.
 */
export async function uploadAvatar(localUri: string, mimeType?: string) {
  const type = mimeType || guessMime(localUri);
  const name = `avatar.${extForMime(type)}`;
  const form = new FormData();
  form.append('file', {
    uri: localUri,
    type,
    name,
  } as unknown as Blob);

  const res = await apiUpload<{ avatarUrl: string }>('/me/avatar', form);
  return { avatarUrl: mediaUrl(res.avatarUrl) ?? res.avatarUrl };
}

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}
