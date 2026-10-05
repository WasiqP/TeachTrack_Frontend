import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import { useUser } from '../context/UserContext';
import { useClasses } from '../context/ClassesContext';
import { useGradesTasks } from '../context/GradesTasksContext';
import { usePulseAlert } from '../context/AlertModalContext';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const IconUserHero = ({ color, size = 40 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8.25" r="3.25" stroke={color} strokeWidth="1.75" />
    <Path
      d="M5.5 19.25c0-3 2.75-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconChevronRight = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="m9 18 6-6-6-6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const Profile: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { profile, displayName, firstName, updateProfile } = useUser();
  const { classes } = useClasses();
  const { tasks } = useGradesTasks();
  const { showAlert, showSuccess } = usePulseAlert();

  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [emailDraft, setEmailDraft] = useState(profile.email);
  const [phoneDraft, setPhoneDraft] = useState(profile.phone);
  const [countryDraft, setCountryDraft] = useState(profile.country);
  const [cityDraft, setCityDraft] = useState(profile.city);
  const [addressDraft, setAddressDraft] = useState(profile.address);
  const [institutionDraft, setInstitutionDraft] = useState(profile.institutionName);
  const [titleDraft, setTitleDraft] = useState(profile.professionalTitle);
  const [subjectsDraft, setSubjectsDraft] = useState(profile.subjectsTeach);

  useEffect(() => {
    setNameDraft(profile.displayName);
    setEmailDraft(profile.email);
    setPhoneDraft(profile.phone);
    setCountryDraft(profile.country);
    setCityDraft(profile.city);
    setAddressDraft(profile.address);
    setInstitutionDraft(profile.institutionName);
    setTitleDraft(profile.professionalTitle);
    setSubjectsDraft(profile.subjectsTeach);
  }, [
    profile.displayName,
    profile.email,
    profile.phone,
    profile.country,
    profile.city,
    profile.address,
    profile.institutionName,
    profile.professionalTitle,
    profile.subjectsTeach,
  ]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, c) => sum + (c.studentCount || 0), 0),
    [classes],
  );

  const greetingPreview = useMemo(() => {
    const n = firstName.trim() || displayName.trim().split(/\s+/)[0] || '';
    return n ? `Hey ${n}` : 'Hey User';
  }, [firstName, displayName]);

  const pickPhoto = useCallback(() => {
    const onResult = (response: ImagePickerResponse | undefined) => {
      if (!response || response.didCancel) return;
      if (response.errorCode) {
        showAlert({
          variant: 'warning',
          title: "Couldn't open photos",
          message:
            response.errorMessage ??
            (response.errorCode === 'permission'
              ? 'Allow photo access in system settings, then try again.'
              : 'Something went wrong opening the photo library.'),
        });
        return;
      }
      const uri = response.assets?.[0]?.uri;
      if (uri) void updateProfile({ avatarUri: uri });
    };

    void launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 0.8 },
      onResult,
    ).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert({
        variant: 'warning',
        title: "Couldn't open photos",
        message: msg,
      });
    });
  }, [updateProfile, showAlert]);

  const clearPhoto = useCallback(() => {
    void updateProfile({ avatarUri: null });
  }, [updateProfile]);

  const handleSaveProfile = useCallback(async () => {
    const t = nameDraft.trim();
    if (!t) {
      showAlert({
        variant: 'warning',
        title: 'Name required',
        message: 'Enter how you’d like your name to appear in the app.',
      });
      return;
    }
    Keyboard.dismiss();
    await updateProfile({
      displayName: t,
      email: emailDraft.trim(),
      phone: phoneDraft.trim(),
      country: countryDraft.trim(),
      city: cityDraft.trim(),
      address: addressDraft.trim(),
      institutionName: institutionDraft.trim(),
      professionalTitle: titleDraft.trim(),
      subjectsTeach: subjectsDraft.trim(),
    });
    showSuccess('Saved', 'Your profile is updated.');
  }, [
    nameDraft,
    emailDraft,
    phoneDraft,
    countryDraft,
    cityDraft,
    addressDraft,
    institutionDraft,
    titleDraft,
    subjectsDraft,
    updateProfile,
    showAlert,
    showSuccess,
  ]);

  const openAppSettings = useCallback(() => {
    navigation.navigate('Home', { tab: 'Settings' });
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingLeft: 8,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
          backgroundColor: ink.canvas,
        },
        headerTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
        },
        headerTitle: {
          flex: 1,
          marginLeft: 2,
          fontSize: 20,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.3,
        },
        scroll: {
          flex: 1,
        },
        scrollInner: {
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 48,
        },
        hero: {
          alignItems: 'center',
          marginBottom: 28,
        },
        heroAvatar: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: theme.primarySoft,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          overflow: 'hidden',
        },
        heroAvatarImg: {
          width: 96,
          height: 96,
        },
        photoActions: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 16,
        },
        photoLink: {
          paddingVertical: 8,
          paddingHorizontal: 4,
        },
        photoLinkTxt: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: theme.primary,
        },
        photoLinkMuted: {
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
        },
        heroName: {
          fontSize: 24,
          lineHeight: 30,
          fontFamily: F.outfitBold,
          color: ink.ink,
          letterSpacing: -0.5,
          textAlign: 'center',
          marginBottom: 6,
        },
        heroHint: {
          fontSize: 14,
          lineHeight: 20,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
          maxWidth: 300,
        },
        previewPill: {
          marginTop: 14,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
        },
        previewPillLab: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 4,
          textAlign: 'center',
        },
        previewPillTxt: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: ink.ink,
          textAlign: 'center',
        },
        section: {
          marginBottom: 26,
        },
        sectionEyebrow: {
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 12,
        },
        label: {
          fontSize: 15,
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 10,
        },
        input: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 16 : 14,
          fontSize: 17,
          fontFamily: F.dmMedium,
          color: ink.ink,
          backgroundColor: theme.white,
          marginBottom: 14,
        },
        inputMultiline: {
          minHeight: 100,
          paddingTop: Platform.OS === 'ios' ? 16 : 14,
          textAlignVertical: 'top',
        },
        saveBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.btn,
          paddingVertical: 16,
          alignItems: 'center',
          borderWidth: ink.borderWidth,
          borderColor: '#000000',
          marginTop: 4,
        },
        saveBtnTxt: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: theme.white,
        },
        statsCard: {
          backgroundColor: theme.white,
          borderRadius: radius.card,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          flexDirection: 'row',
          alignItems: 'stretch',
          paddingVertical: 18,
          paddingHorizontal: 6,
        },
        statCell: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        statRule: {
          width: StyleSheet.hairlineWidth,
          backgroundColor: ink.rowDivider,
          marginVertical: 4,
        },
        statNum: {
          fontSize: 22,
          lineHeight: 26,
          fontFamily: F.dmExtraBold,
          color: ink.ink,
          letterSpacing: -0.4,
        },
        statLab: {
          marginTop: 4,
          fontSize: 11,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          letterSpacing: 0.2,
          textAlign: 'center',
        },
        linkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.white,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        linkTitle: {
          fontSize: 16,
          fontFamily: F.dmBold,
          color: ink.ink,
          marginBottom: 4,
        },
        linkSub: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
        },
      }),
    [ink, theme],
  );

  const hasPhoto = Boolean(profile.avatarUri);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Profile
          </Text>
        </View>
      </View>

      <PulseScrollView
        customTrack={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            {hasPhoto && profile.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.heroAvatarImg}
                resizeMode="cover"
                accessibilityLabel="Profile photo"
              />
            ) : (
              <IconUserHero color={theme.primary} size={44} />
            )}
          </View>
          <View style={styles.photoActions}>
            <Pressable
              style={styles.photoLink}
              onPress={pickPhoto}
              android_ripple={{ color: ink.pressTint }}
            >
              <Text style={styles.photoLinkTxt}>Change photo</Text>
            </Pressable>
            {hasPhoto ? (
              <Pressable
                style={styles.photoLink}
                onPress={clearPhoto}
                android_ripple={{ color: ink.pressTint }}
              >
                <Text style={styles.photoLinkMuted}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.heroName} numberOfLines={2}>
            {displayName.trim() || 'Your name'}
          </Text>
          <Text style={styles.heroHint}>
            This is how you appear on Home and anywhere your name is shown.
          </Text>
          <View style={styles.previewPill}>
            <Text style={styles.previewPillLab}>Home greeting preview</Text>
            <Text style={styles.previewPillTxt}>{greetingPreview}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Identity & contact</Text>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="e.g. Jamie Rivera"
            placeholderTextColor={ink.placeholder}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={emailDraft}
            onChangeText={setEmailDraft}
            placeholder="you@school.edu"
            placeholderTextColor={ink.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>Contact number</Text>
          <TextInput
            style={styles.input}
            value={phoneDraft}
            onChangeText={setPhoneDraft}
            placeholder="Phone or WhatsApp"
            placeholderTextColor={ink.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Location</Text>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={countryDraft}
            onChangeText={setCountryDraft}
            placeholder="Country"
            placeholderTextColor={ink.placeholder}
            autoCapitalize="words"
          />
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={cityDraft}
            onChangeText={setCityDraft}
            placeholder="City"
            placeholderTextColor={ink.placeholder}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={addressDraft}
            onChangeText={setAddressDraft}
            placeholder="Street, building, postal code…"
            placeholderTextColor={ink.placeholder}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Work</Text>
          <Text style={styles.label}>Institution name</Text>
          <TextInput
            style={styles.input}
            value={institutionDraft}
            onChangeText={setInstitutionDraft}
            placeholder="School or organization"
            placeholderTextColor={ink.placeholder}
          />
          <Text style={styles.label}>Professional title</Text>
          <TextInput
            style={styles.input}
            value={titleDraft}
            onChangeText={setTitleDraft}
            placeholder="e.g. Mathematics teacher"
            placeholderTextColor={ink.placeholder}
          />
          <Text style={styles.label}>Subjects you teach</Text>
          <TextInput
            style={styles.input}
            value={subjectsDraft}
            onChangeText={setSubjectsDraft}
            placeholder="e.g. Algebra, Physics"
            placeholderTextColor={ink.placeholder}
          />
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.saveBtn}
            onPress={() => void handleSaveProfile()}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.saveBtnTxt}>Save profile</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Your workload</Text>
          <View style={styles.statsCard}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{classes.length}</Text>
              <Text style={styles.statLab}>Total{'\n'}Classes</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{totalStudents}</Text>
              <Text style={styles.statLab}>Total{'\n'}Students</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{tasks.length}</Text>
              <Text style={styles.statLab}>Active{'\n'}Tasks</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>More</Text>
          <Pressable
            style={styles.linkRow}
            onPress={openAppSettings}
            android_ripple={{ color: ink.pressTint }}
          >
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <Text style={styles.linkTitle}>App settings</Text>
              <Text style={styles.linkSub}>Theme, language, help, and account options</Text>
            </View>
            <IconChevronRight color={theme.primary} size={22} />
          </Pressable>
        </View>
      </PulseScrollView>
    </SafeAreaView>
  );
};

export default Profile;
