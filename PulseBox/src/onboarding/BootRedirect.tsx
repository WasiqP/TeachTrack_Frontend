import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useThemeMode } from '../theme';
import { resolveAuthenticatedRoute } from '../utils/profileSetup';

type Props = NativeStackScreenProps<RootStackParamList, 'BootRedirect'>;

/** Cold-start router: session → role/profile gate → Home or GetStarted. */
const BootRedirect: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { isBootstrapping, isAuthenticated } = useAuth();
  const { hydrateFromServer } = useUser();
  const ran = useRef(false);

  useEffect(() => {
    if (isBootstrapping || ran.current) return;
    ran.current = true;
    void (async () => {
      if (!isAuthenticated) {
        navigation.reset({ index: 0, routes: [{ name: 'GetStarted' }] });
        return;
      }
      const fresh = await hydrateFromServer();
      const dest = resolveAuthenticatedRoute(
        fresh ?? {
          displayName: '',
          avatarUri: null,
          email: '',
          phone: '',
          country: '',
          city: '',
          address: '',
          institutionName: '',
          professionalTitle: '',
          subjectsTeach: '',
          timezone: '',
        },
      );
      navigation.reset({ index: 0, routes: [{ name: dest }] });
    })();
  }, [isBootstrapping, isAuthenticated, hydrateFromServer, navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: ink.canvas,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );
};

export default BootRedirect;
