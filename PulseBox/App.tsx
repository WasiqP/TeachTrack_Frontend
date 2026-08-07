/**
 * PulseBox App
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StatusBar, View } from 'react-native';
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FormsProvider } from './src/context/FormsContext';
import { ClassesProvider } from './src/context/ClassesContext';
import { GradesTasksProvider } from './src/context/GradesTasksContext';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import { AlertModalProvider } from './src/context/AlertModalContext';
import { ThemeProvider, useThemeMode } from './src/theme';

// Import screens
import SplashScreen from './src/onboarding/SplashScreen';
import BootRedirect from './src/onboarding/BootRedirect';
import GetStarted from './src/onboarding/GetStarted';
import Onboarding01 from './src/onboarding/Onboarding01';
import Onboarding02 from './src/onboarding/Onboarding02';
import Onboarding03 from './src/onboarding/Onboarding03';
import TeacherProfileSetup from './src/onboarding/TeacherProfileSetup';
import Login from './src/authentication/Login';
import SignUp from './src/authentication/SignUp';
import ForgotPassword from './src/authentication/ForgotPassword';
import VerifyOtp from './src/authentication/VerifyOtp';
import TeacherTabShell from './src/main/TeacherTabShell';
import MyForms from './src/main/MyForms';
import CreateForm from './src/forms/CreateForm';
import EditForm from './src/forms/EditForm.tsx';
import QuestionsScreen from './src/forms/QuestionsScreen.tsx';
import SwapQuestionsScreen from './src/forms/SwapQuestionsScreen.tsx';
import ShareForm from './src/forms/ShareForm.tsx';
// Teacher-specific screens
import LessonPlanner from './src/teacher/LessonPlanner';
import Attendance from './src/teacher/Attendance';
import CreateClass from './src/teacher/CreateClass';
import ClassDetails from './src/teacher/ClassDetails';
import ViewStudents from './src/teacher/ViewStudents';
import StudentRecordsScreen from './src/teacher/StudentRecordsScreen';
import TaskGradeReport from './src/main/TaskGradeReport';
import Profile from './src/main/Profile';
import NotificationSettingsScreen from './src/main/settings/NotificationSettingsScreen';
import LanguageSettingsScreen from './src/main/settings/LanguageSettingsScreen';
import HelpSupportScreen from './src/main/settings/HelpSupportScreen';
import TermsOfServiceScreen from './src/main/settings/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/main/settings/PrivacyPolicyScreen';
import AboutAppScreen from './src/main/settings/AboutAppScreen';

// Navigation types
import type { RootStackParamList } from './src/types/navigation';
import {
  getFocusedRouteNameFromState,
  isAuthFlowRoute,
} from './src/navigation/focusedRoute';
import BrandedTransitionOverlay from './src/navigation/BrandedTransitionOverlay';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Get Started, onboarding steps, login, sign-up: no stack transition. */
const instantAuthScreenOptions = {
  animation: 'none' as const,
};

const SPLASH_MS = 2000;

function AppNavigation() {
  const { ink, theme, contentOpacity, isDark } = useThemeMode();
  const [navTick, setNavTick] = useState(0);
  const routeNameRef = React.useRef<string | undefined>(undefined);

  const navigationTheme = useMemo(() => {
    const base = isDark ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: ink.canvas,
        card: ink.canvas,
        text: ink.ink,
        border: ink.borderInk,
        primary: theme.primary,
        notification: theme.primary,
      },
    };
  }, [ink, theme, isDark]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={ink.canvas}
      />
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <NavigationContainer
          theme={navigationTheme}
          onStateChange={(state) => {
            const name = getFocusedRouteNameFromState(state);
            if (!name) return;
            const prev = routeNameRef.current;
            if (name === prev) return;
            routeNameRef.current = name;
            if (prev === undefined) return;
            const prevAuth = isAuthFlowRoute(prev);
            const nextAuth = isAuthFlowRoute(name);
            if (prevAuth === nextAuth) return;
            setNavTick((t) => t + 1);
          }}
        >
          <Stack.Navigator
            initialRouteName="BootRedirect"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: ink.canvas },
            }}
          >
            <Stack.Screen name="BootRedirect" component={BootRedirect} options={instantAuthScreenOptions} />
            <Stack.Screen name="GetStarted" component={GetStarted} options={instantAuthScreenOptions} />
            <Stack.Screen name="Onboarding01" component={Onboarding01} options={instantAuthScreenOptions} />
            <Stack.Screen name="Onboarding02" component={Onboarding02} options={instantAuthScreenOptions} />
            <Stack.Screen name="Onboarding03" component={Onboarding03} options={instantAuthScreenOptions} />
            <Stack.Screen name="Login" component={Login} options={instantAuthScreenOptions} />
            <Stack.Screen name="SignUp" component={SignUp} options={instantAuthScreenOptions} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={instantAuthScreenOptions} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtp} options={instantAuthScreenOptions} />
            <Stack.Screen name="TeacherProfileSetup" component={TeacherProfileSetup} options={instantAuthScreenOptions} />
            <Stack.Screen name="Home" component={TeacherTabShell} />
            <Stack.Screen name="MyForms" component={MyForms} />
            <Stack.Screen name="LessonPlanner" component={LessonPlanner} />
            <Stack.Screen name="Attendance" component={Attendance} />
            <Stack.Screen name="CreateClass" component={CreateClass} />
            <Stack.Screen name="ClassDetails" component={ClassDetails} />
            <Stack.Screen name="ViewStudents" component={ViewStudents} />
            <Stack.Screen name="StudentRecords" component={StudentRecordsScreen} />
            <Stack.Screen name="TaskGradeReport" component={TaskGradeReport} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="CreateForm" component={CreateForm} />
            <Stack.Screen name="EditForm" component={EditForm} />
            <Stack.Screen name="QuestionsScreen" component={QuestionsScreen} />
            <Stack.Screen name="ShareTask" component={ShareForm} />
            <Stack.Screen
              name="SwapQuestions"
              component={SwapQuestionsScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <BrandedTransitionOverlay tick={navTick} />
      </Animated.View>
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertModalProvider>
          <UserProvider>
            <AuthProvider>
            <AppSettingsProvider>
            <FormsProvider>
              <ClassesProvider>
                <GradesTasksProvider>
                  {showSplash ? (
                    <SplashScreen />
                  ) : (
                    <View style={{ flex: 1 }}>
                      <AppNavigation />
                    </View>
                  )}
                </GradesTasksProvider>
              </ClassesProvider>
            </FormsProvider>
            </AppSettingsProvider>
            </AuthProvider>
          </UserProvider>
        </AlertModalProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
