import type { NavigationState, PartialState } from '@react-navigation/native';

/** Routes that use auth-style transitions + branded overlay (login / sign-up flow). */
const AUTH_FLOW_ROUTE_NAMES = new Set<string>([
  'GetStarted',
  'Onboarding01',
  'Onboarding02',
  'Onboarding03',
  'Login',
  'SignUp',
  'ForgotPassword',
  'VerifyOtp',
]);

export function isAuthFlowRoute(name: string | undefined): boolean {
  return name != null && AUTH_FLOW_ROUTE_NAMES.has(name);
}

/** Deepest focused route name from root navigation state. */
export function getFocusedRouteNameFromState(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state || typeof state.index !== 'number') return undefined;
  const route = state.routes[state.index];
  const nested = route.state as NavigationState | PartialState<NavigationState> | undefined;
  if (nested) {
    return getFocusedRouteNameFromState(nested);
  }
  return route.name;
}
