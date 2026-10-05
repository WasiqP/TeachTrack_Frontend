import { Platform } from 'react-native';

/**
 * Local FastAPI (port 8000).
 * Physical phone: 127.0.0.1 + `adb reverse tcp:8000 tcp:8000`
 * (phone localhost tunnels to this PC). Do not put the phone’s ADB IP here.
 * Android emulator without reverse: leave DEV_API_ORIGIN empty to use 10.0.2.2.
 */
export const DEV_API_ORIGIN = 'http://127.0.0.1:8000';

const DEFAULT_ORIGIN =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const API_ORIGIN = DEV_API_ORIGIN || DEFAULT_ORIGIN;

export const API_PREFIX = '/api/v1';

export const API_BASE = `${API_ORIGIN}${API_PREFIX}`;

export const STUDENT_FORM_BASE = `${API_ORIGIN}/form`;
