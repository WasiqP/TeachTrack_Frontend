/**
 * API base URL for TeachTrack backend.
 *
 * Physical device / wireless debugging cannot use 127.0.0.1 (that is the phone itself).
 * Use your PC's LAN IP on the same Wi‑Fi as the phone.
 *
 * Backend must run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
 *
 * Override at runtime if needed by changing DEV_HOST.
 */
import { Platform } from 'react-native';

/** PC LAN IP (same subnet as wireless-debug phone). Update if your IP changes. */
const DEV_HOST = '192.168.60.176';

const DEV_PORT = 8000;

/**
 * Android emulator would use 10.0.2.2; we prioritize physical device for this project.
 * iOS simulator can use localhost.
 */
export const API_BASE_URL =
  Platform.OS === 'ios'
    ? `http://127.0.0.1:${DEV_PORT}`
    : `http://${DEV_HOST}:${DEV_PORT}`;

export const API_V1 = `${API_BASE_URL}/v1`;

/**
 * Backend may return avatar URLs with 127.0.0.1 — rewrite to the LAN API host for phones.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      return `${API_BASE_URL}${u.pathname}${u.search}`;
    }
  } catch {
    /* keep as-is */
  }
  return url;
}
