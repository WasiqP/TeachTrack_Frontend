import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

/**
 * Enter the main app and wipe the auth / onboarding stack so hardware back
 * and gestures cannot return to Login, SignUp, or Get Started.
 */
export function enterMainApp(
  navigation: NavigationProp<RootStackParamList>,
  params?: RootStackParamList['Home'],
): void {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Home', params }],
  });
}
