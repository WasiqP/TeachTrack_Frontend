import type { UserProfile } from '../context/UserContext';
import type { RootStackParamList } from '../types/navigation';

/** Teacher first-run complete when school + title + name are set (plan completeness rule). */
export function isTeacherProfileComplete(profile: UserProfile): boolean {
  return (
    Boolean(profile.institutionName?.trim()) &&
    Boolean(profile.professionalTitle?.trim()) &&
    Boolean(profile.displayName?.trim())
  );
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export type PostAuthRoute = Extract<
  keyof RootStackParamList,
  'Home' | 'TeacherProfileSetup'
>;

/** Where to send an already-authenticated teacher (login / cold start). */
export function resolveAuthenticatedRoute(profile: UserProfile): PostAuthRoute {
  if (!isTeacherProfileComplete(profile)) return 'TeacherProfileSetup';
  return 'Home';
}
