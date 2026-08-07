import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import ScreenFrame from '../components/layout/ScreenFrame';
import Button from '../components/Reusable-Components/Button';
import { SearchableSelect } from '../components/Reusable-Components/SearchableSelect';
import { PulseScrollView } from '../components/PulseScrollView';
import { useUser } from '../context/UserContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { scaleFont, useResponsive } from '../ui/responsive';
import { deviceTimezone } from '../utils/profileSetup';
import { ApiError } from '../api/client';
import {
  dialLabel,
  getCitiesForCountryName,
  getCountryNames,
  getDialOptions,
  getInstitutionOptions,
  getSubjectOptions,
  getTimezoneOptions,
  getTitleOptions,
  joinPhone,
  splitPhone,
  INSTITUTION_OTHER,
  INSTITUTION_TUITION,
} from './profileFormData';

type PlaceMode = 'institution' | 'tuition';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherProfileSetup'>;

function institutionStateFromProfile(name: string): {
  mode: PlaceMode;
  choice: string;
  custom: string;
} {
  const n = name.trim();
  if (!n) return { mode: 'institution', choice: '', custom: '' };
  if (n === INSTITUTION_TUITION) return { mode: 'tuition', choice: '', custom: '' };
  const presets = getInstitutionOptions();
  if (presets.includes(n) && n !== INSTITUTION_OTHER) {
    return { mode: 'institution', choice: n, custom: '' };
  }
  return { mode: 'institution', choice: INSTITUTION_OTHER, custom: n };
}

const IconUser = ({ color, size = 40 }: { color: string; size?: number }) => (
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

function parseSubjects(raw: string): { selected: string[]; custom: string } {
  const parts = raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const known = new Set(getSubjectOptions());
  const selected: string[] = [];
  const customParts: string[] = [];
  for (const p of parts) {
    const hit = getSubjectOptions().find((o) => o.toLowerCase() === p.toLowerCase());
    if (hit && known.has(hit)) selected.push(hit);
    else customParts.push(p);
  }
  return { selected: [...new Set(selected)], custom: customParts.join(', ') };
}

const TeacherProfileSetup: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const r = useResponsive();
  const { profile, updateProfile, uploadAvatar } = useUser();
  const { showAlert, showSuccess } = usePulseAlert();
  const [busy, setBusy] = useState(false);

  const dialOptions = useMemo(() => getDialOptions(), []);
  const dialLabels = useMemo(() => dialOptions.map((d) => d.label), [dialOptions]);
  const countries = useMemo(() => getCountryNames(), []);
  const institutionPresets = useMemo(() => getInstitutionOptions(), []);
  const titles = useMemo(() => getTitleOptions(), []);
  const subjectOptions = useMemo(() => getSubjectOptions(), []);
  const timezones = useMemo(() => getTimezoneOptions(), []);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const initialPhone = useMemo(() => splitPhone(profile.phone), [profile.phone]);
  const [dialCode, setDialCode] = useState(initialPhone.dial);
  const [phoneNational, setPhoneNational] = useState(initialPhone.national);
  const [country, setCountry] = useState(profile.country);
  const [city, setCity] = useState(profile.city);
  const [address, setAddress] = useState(profile.address);
  const initialInstitution = useMemo(
    () => institutionStateFromProfile(profile.institutionName),
    [profile.institutionName],
  );
  const [placeMode, setPlaceMode] = useState<PlaceMode>(initialInstitution.mode);
  const [institutionChoice, setInstitutionChoice] = useState(initialInstitution.choice);
  const [institutionCustom, setInstitutionCustom] = useState(initialInstitution.custom);
  const [professionalTitle, setProfessionalTitle] = useState(profile.professionalTitle);
  const initialSubjects = useMemo(() => parseSubjects(profile.subjectsTeach), [profile.subjectsTeach]);
  const [subjectsSelected, setSubjectsSelected] = useState<string[]>(initialSubjects.selected);
  const [subjectsCustom, setSubjectsCustom] = useState(initialSubjects.custom);
  const [timezone, setTimezone] = useState(profile.timezone || deviceTimezone());

  const cities = useMemo(() => getCitiesForCountryName(country), [country]);

  const dialTriggerLabel = useMemo(() => dialLabel(dialCode), [dialCode]);

  useEffect(() => {
    setDisplayName(profile.displayName);
    const sp = splitPhone(profile.phone);
    setDialCode(sp.dial);
    setPhoneNational(sp.national);
    setCountry(profile.country);
    setCity(profile.city);
    setAddress(profile.address);
    const inst = institutionStateFromProfile(profile.institutionName);
    setPlaceMode(inst.mode);
    if (inst.mode === 'institution') {
      setInstitutionChoice(inst.choice);
      setInstitutionCustom(inst.custom);
    }
    setProfessionalTitle(profile.professionalTitle);
    const sub = parseSubjects(profile.subjectsTeach);
    setSubjectsSelected(sub.selected);
    setSubjectsCustom(sub.custom);
    setTimezone(profile.timezone || deviceTimezone());
  }, [profile]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: ink.canvas },
        scroll: {
          paddingHorizontal: r.gutter + 8,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 14,
        },
        eyebrow: {
          fontSize: 12,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
        },
        title: {
          fontSize: scaleFont(28, r.titleScale),
          lineHeight: scaleFont(34, r.titleScale),
          fontFamily: F.outfitBlack,
          color: ink.ink,
          letterSpacing: -0.6,
          marginBottom: 4,
        },
        lede: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 12,
        },
        avatarRow: {
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        },
        avatarWell: {
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImg: { width: 96, height: 96 },
        avatarHint: {
          fontSize: 14,
          fontFamily: F.dmMedium,
          color: theme.primary,
        },
        label: {
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
          marginBottom: 6,
          marginTop: 4,
        },
        labelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginTop: 4,
          marginBottom: 6,
        },
        labelRowText: {
          flex: 1,
          fontSize: 13,
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
        },
        placeToggle: {
          flexDirection: 'row',
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: ink.canvas,
        },
        placeToggleBtn: {
          paddingHorizontal: 12,
          paddingVertical: 7,
        },
        placeToggleBtnOn: {
          backgroundColor: theme.primarySoft,
        },
        placeToggleTxt: {
          fontSize: 12,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
        },
        placeToggleTxtOn: {
          color: theme.primary,
          fontFamily: F.dmSemi,
        },
        hint: {
          fontSize: 12,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginTop: -2,
          marginBottom: 4,
        },
        required: { color: theme.primary },
        tuitionNote: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          backgroundColor: theme.primarySoft,
        },
        tuitionNoteTxt: {
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        input: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.ink,
          backgroundColor: ink.canvas,
        },
        textarea: {
          minHeight: 88,
          textAlignVertical: 'top',
        },
        phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
        dialWrap: { width: 132 },
        phoneFlex: { flex: 1 },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
        chip: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: ink.canvas,
        },
        chipOn: {
          backgroundColor: theme.primarySoft,
          borderColor: theme.primary,
        },
        chipTxt: {
          fontSize: 13,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        chipTxtOn: {
          color: theme.primary,
          fontFamily: F.dmSemi,
        },
        footer: { marginTop: 16, gap: 10 },
      }),
    [ink, theme, r.gutter, r.titleScale],
  );

  const onDialSelect = (label: string) => {
    const hit = dialOptions.find((d) => d.label === label);
    if (hit) setDialCode(hit.dial);
  };

  const toggleSubject = (s: string) => {
    setSubjectsSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const pickPhoto = useCallback(() => {
    const onResult = (response: ImagePickerResponse | undefined) => {
      if (!response || response.didCancel) return;
      if (response.errorCode) {
        showAlert({
          variant: 'warning',
          title: "Couldn't open photos",
          message: response.errorMessage ?? 'Allow photo access, then try again.',
        });
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      void uploadAvatar(asset.uri, asset.type).catch((e) => {
        showAlert({
          variant: 'warning',
          title: 'Upload failed',
          message: e instanceof Error ? e.message : 'Try another photo.',
        });
      });
    };
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 0.8 },
      onResult,
    );
  }, [showAlert, uploadAvatar]);

  const onSave = async () => {
    const name = displayName.trim();
    const school =
      placeMode === 'tuition'
        ? INSTITUTION_TUITION
        : institutionChoice === INSTITUTION_OTHER
          ? institutionCustom.trim()
          : institutionChoice.trim();
    const title = professionalTitle.trim();
    if (!name || !school || !title) {
      showAlert({
        variant: 'warning',
        title: 'Almost there',
        message:
          placeMode === 'institution' &&
          institutionChoice === INSTITUTION_OTHER &&
          !institutionCustom.trim()
            ? 'Enter your institution name, or pick one from the list.'
            : placeMode === 'institution' && !school
              ? 'Pick an institution, or switch to Tuition.'
              : 'Display name, institution or Tuition, and professional title are required.',
      });
      return;
    }
    if (!timezone.trim()) {
      showAlert({
        variant: 'warning',
        title: 'Timezone required',
        message: 'Pick your timezone from the list.',
      });
      return;
    }

    const subjects = [
      ...subjectsSelected,
      ...subjectsCustom
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ];
    const subjectsTeach = [...new Set(subjects)].join(', ');

    setBusy(true);
    try {
      await updateProfile({
        displayName: name,
        phone: joinPhone(dialCode, phoneNational),
        country: country.trim(),
        city: city.trim(),
        address: address.trim(),
        institutionName: school,
        professionalTitle: title,
        subjectsTeach,
        timezone: timezone.trim(),
      });
      showSuccess('Profile ready', 'Welcome to GrooveBox.', () => {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      });
    } catch (e) {
      showAlert({
        variant: 'warning',
        title: 'Could not save',
        message: e instanceof ApiError ? e.message : 'Check your connection and try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenFrame style={styles.screen} edges={['top', 'bottom', 'left', 'right']} framed={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PulseScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>Welcome</Text>
          <Text style={styles.title}>Set up your teacher profile</Text>
          <Text style={styles.lede}>
            Tell us a bit about you so classes, grades, and announcements feel personal. You can
            edit this anytime in Profile.
          </Text>

          <View style={styles.avatarRow}>
            <Pressable style={styles.avatarWell} onPress={pickPhoto} accessibilityLabel="Add photo">
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
              ) : (
                <IconUser color={theme.primary} size={40} />
              )}
            </Pressable>
            <Pressable onPress={pickPhoto}>
              <Text style={styles.avatarHint}>Add profile photo</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>
            Display name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={ink.placeholder}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone</Text>
          <Text style={styles.hint}>Country calling code + your number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.dialWrap}>
              <SearchableSelect
                label="Calling code"
                value={dialOptions.find((d) => d.dial === dialCode)?.label ?? ''}
                displayValue={dialTriggerLabel}
                placeholder="+1"
                options={dialLabels}
                onSelect={onDialSelect}
              />
            </View>
            <View style={styles.phoneFlex}>
              <TextInput
                style={styles.input}
                value={phoneNational}
                onChangeText={setPhoneNational}
                placeholder="300 1234567"
                placeholderTextColor={ink.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Country</Text>
          <SearchableSelect
            label="Country"
            value={country}
            placeholder="Select country"
            options={countries}
            onSelect={(c) => {
              setCountry(c);
              setCity('');
            }}
          />

          <Text style={styles.label}>City</Text>
          <SearchableSelect
            label="City"
            value={city}
            placeholder={country ? 'Select city' : 'Select a country first'}
            options={cities}
            onSelect={setCity}
            allowCustom
            disabled={!country}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={address}
            onChangeText={setAddress}
            placeholder="School or home address (optional)"
            placeholderTextColor={ink.placeholder}
            multiline
          />

          <View style={styles.labelRow}>
            <Text style={styles.labelRowText}>
              {placeMode === 'tuition' ? 'Tuition' : 'Institution'}{' '}
              <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.placeToggle} accessibilityRole="tablist">
              <Pressable
                style={[
                  styles.placeToggleBtn,
                  placeMode === 'institution' && styles.placeToggleBtnOn,
                ]}
                onPress={() => setPlaceMode('institution')}
                accessibilityRole="tab"
                accessibilityState={{ selected: placeMode === 'institution' }}
                accessibilityLabel="Institution"
              >
                <Text
                  style={[
                    styles.placeToggleTxt,
                    placeMode === 'institution' && styles.placeToggleTxtOn,
                  ]}
                >
                  Institution
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.placeToggleBtn,
                  placeMode === 'tuition' && styles.placeToggleBtnOn,
                ]}
                onPress={() => setPlaceMode('tuition')}
                accessibilityRole="tab"
                accessibilityState={{ selected: placeMode === 'tuition' }}
                accessibilityLabel="Tuition"
              >
                <Text
                  style={[
                    styles.placeToggleTxt,
                    placeMode === 'tuition' && styles.placeToggleTxtOn,
                  ]}
                >
                  Tuition
                </Text>
              </Pressable>
            </View>
          </View>
          {placeMode === 'tuition' ? (
            <>
              <Text style={styles.hint}>Saves as Tuition — switch back anytime to pick a school</Text>
              <View style={styles.tuitionNote}>
                <Text style={styles.tuitionNoteTxt}>{INSTITUTION_TUITION}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.hint}>Pick a school, or choose Other and type yours</Text>
              <SearchableSelect
                label="Institution"
                value={institutionChoice}
                placeholder="Select institution"
                options={institutionPresets}
                onSelect={(v) => {
                  setInstitutionChoice(v);
                  if (v !== INSTITUTION_OTHER) setInstitutionCustom('');
                }}
              />
              {institutionChoice === INSTITUTION_OTHER ? (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={institutionCustom}
                  onChangeText={setInstitutionCustom}
                  placeholder="Type your institution name"
                  placeholderTextColor={ink.placeholder}
                  autoCapitalize="words"
                />
              ) : null}
            </>
          )}

          <Text style={styles.label}>
            Professional title <Text style={styles.required}>*</Text>
          </Text>
          <SearchableSelect
            label="Professional title"
            value={professionalTitle}
            placeholder="Select or type title"
            options={titles}
            onSelect={setProfessionalTitle}
            allowCustom
          />

          <Text style={styles.label}>Subjects you teach</Text>
          <Text style={styles.hint}>Tap common subjects; add others below</Text>
          <View style={styles.chips}>
            {subjectOptions.map((s) => {
              const on = subjectsSelected.includes(s);
              return (
                <Pressable
                  key={s}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleSubject(s)}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={subjectsCustom}
            onChangeText={setSubjectsCustom}
            placeholder="Other subjects (comma-separated)"
            placeholderTextColor={ink.placeholder}
          />

          <Text style={styles.label}>Timezone</Text>
          <SearchableSelect
            label="Timezone"
            value={timezone}
            placeholder="Select timezone"
            options={timezones}
            onSelect={setTimezone}
          />

          <View style={styles.footer}>
            <Button
              title={busy ? 'Saving…' : 'Save and continue'}
              fullWidth
              size="lg"
              variant="primary"
              disabled={busy}
              onPress={() => void onSave()}
            />
            {busy ? <ActivityIndicator color={theme.primary} /> : null}
          </View>
        </PulseScrollView>
      </KeyboardAvoidingView>
    </ScreenFrame>
  );
};

export default TeacherProfileSetup;
