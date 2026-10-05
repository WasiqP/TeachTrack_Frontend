import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import BottomTab from '../components/BottomTab';
import Svg, { Path } from 'react-native-svg';
import { useClasses, type ClassData } from '../context/ClassesContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { fonts as F, radius, useThemeMode } from '../theme';
import { PulseScrollView } from '../components/PulseScrollView';
import TabScreenHeaderBar from '../components/TabScreenHeaderBar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  embedded?: boolean;
};


const SearchIcon = ({ size = 20, color = '#1A1A22' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 21L16.65 16.65"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 20, color = '#1A1A22' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BookIcon = ({ size = 22, color = '#A060FF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UsersIcon = ({ size = 16, color = '#1A1A22' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarSmallIcon = ({ size = 15, color = '#1A1A22' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClipboardCheckIcon = ({
  size = 18,
  color = '#A060FF',
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 17 17 17H15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5V5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const MyClasses: React.FC<Props> = ({ navigation, embedded }) => {
  const { ink, theme } = useThemeMode();
  const { classes, deleteClass } = useClasses();
  const { showAlert } = usePulseAlert();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClasses = useMemo(
    () =>
      classes.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cls.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [classes, searchQuery],
  );

  const totalStudents = useMemo(
    () => filteredClasses.reduce((acc, c) => acc + (c.studentCount ?? 0), 0),
    [filteredClasses],
  );

  const confirmDeleteClass = (classItem: ClassData) => {
    showAlert({
      variant: 'warning',
      title: 'Delete class?',
      message: `“${classItem.name}” will be removed. This cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteClass(classItem.id);
          },
        },
      ],
    });
  };

  const countLabel =
    filteredClasses.length === 0
      ? 'No classes'
      : filteredClasses.length === 1
        ? '1 class'
        : `${filteredClasses.length} classes`;


  const styles = useMemo(
    () =>
      StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ink.canvas,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: F.outfitBlack,
    color: ink.ink,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    opacity: 0.92,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 108,
  },
  hero: {
    marginBottom: 16,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    backgroundColor: theme.primarySoft,
    overflow: 'hidden',
  },
  heroInner: {
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  heroStat: {
    alignItems: 'center',
    minWidth: 72,
  },
  heroStatNum: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: F.outfitBlack,
    color: ink.ink,
    letterSpacing: -1,
  },
  heroStatLab: {
    fontSize: 11,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: ink.rowDivider,
    opacity: 0.9,
  },
  heroCaption: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: F.dmMedium,
    color: ink.inkSoft,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 16,
    backgroundColor: ink.canvas,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    fontSize: 15,
    fontFamily: F.dmRegular,
    color: ink.ink,
  },
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 14,
  },
  createCtaPressed: {
    opacity: 0.94,
  },
  createCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCtaText: {
    flex: 1,
    minWidth: 0,
  },
  createCtaTitle: {
    fontSize: 18,
    fontFamily: F.outfitBold,
    color: theme.white,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  createCtaSub: {
    fontSize: 13,
    fontFamily: F.dmRegular,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 18,
  },
  listEyebrow: {
    fontSize: 11,
    fontFamily: F.dmSemi,
    color: ink.inkSoft,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    marginBottom: 14,
    borderRadius: radius.card,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    backgroundColor: ink.canvas,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
  },
  cardMainPressed: {
    backgroundColor: theme.rippleLight,
  },
  cardAccent: {
    width: 5,
    backgroundColor: theme.primary,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 14,
    paddingLeft: 12,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  className: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: F.outfitBold,
    color: ink.ink,
    letterSpacing: -0.4,
  },
  classSubject: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    marginBottom: 12,
  },
  classDot: {
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
  },
  classGrade: {
    fontFamily: F.dmSemi,
    color: ink.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.btn,
    backgroundColor: theme.primarySoft,
    borderWidth: 1,
    borderColor: ink.borderInk,
    maxWidth: '100%',
  },
  chipFlex: {
    flex: 1,
    minWidth: 120,
  },
  chipText: {
    fontSize: 13,
    fontFamily: F.dmSemi,
    color: ink.ink,
  },
  chipTextMuted: {
    fontSize: 13,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ink.rowDivider,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
  },
  actionLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  actionLinkPressed: {
    backgroundColor: theme.rippleLight,
  },
  actionLinkText: {
    fontSize: 14,
    fontFamily: F.dmSemi,
    color: theme.primary,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: ink.rowDivider,
  },
  actionDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  actionDangerPressed: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
  },
  actionDangerText: {
    fontSize: 14,
    fontFamily: F.dmSemi,
    color: '#B91C1C',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primarySoft,
    borderWidth: ink.borderWidth,
    borderColor: ink.borderInk,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: F.outfitExtraBold,
    color: ink.ink,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: F.dmRegular,
    color: ink.inkSoft,
    textAlign: 'center',
    maxWidth: 300,
  },
      }),
    [ink, theme],
  );
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TabScreenHeaderBar navigation={navigation}>
        <View>
          <Text style={styles.title}>My Classes</Text>
          <Text style={styles.subtitle}>
            Rosters, schedules, attendance, and class tasks in one place.
          </Text>
        </View>
      </TabScreenHeaderBar>

      <PulseScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        customTrack={filteredClasses.length >= 8}
      >
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroTop}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{filteredClasses.length}</Text>
                <Text style={styles.heroStatLab}>{searchQuery.trim() ? 'Matching' : 'Total'}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{totalStudents}</Text>
                <Text style={styles.heroStatLab}>Students</Text>
              </View>
            </View>
            <Text style={styles.heroCaption}>{countLabel}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchIcon size={20} color={ink.inkSoft} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or subject…"
            placeholderTextColor={ink.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.createCta, pressed && styles.createCtaPressed]}
          onPress={() => navigation.navigate('CreateClass')}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <View style={styles.createCtaIcon}>
            <PlusIcon size={24} color={theme.white} />
          </View>
          <View style={styles.createCtaText}>
            <Text style={styles.createCtaTitle}>New class</Text>
            <Text style={styles.createCtaSub}>Set up a roster and start teaching</Text>
          </View>
          <ChevronRightIcon size={22} color="rgba(255,255,255,0.85)" />
        </Pressable>

        {filteredClasses.length > 0 ? (
          <Text style={styles.listEyebrow}>All classes</Text>
        ) : null}

        {filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRing}>
              <BookIcon size={40} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No matches' : 'No classes yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Try another search, or clear the field to see everything.'
                : 'Create a class to add students, plan lessons, and take attendance.'}
            </Text>
          </View>
        ) : (
          filteredClasses.map((classItem) => (
            <View key={classItem.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardMain, pressed && styles.cardMainPressed]}
                onPress={() => navigation.navigate('ClassDetails', { classId: classItem.id })}
                android_ripple={{ color: theme.rippleLight }}
              >
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.className} numberOfLines={2}>
                      {classItem.name}
                    </Text>
                    <ChevronRightIcon size={20} color={ink.inkSoft} />
                  </View>
                  <Text style={styles.classSubject} numberOfLines={2}>
                    {classItem.subject}
                    <Text style={styles.classDot}> · </Text>
                    <Text style={styles.classGrade}>{classItem.gradeLevel}</Text>
                  </Text>
                  <View style={styles.chipRow}>
                    <View style={styles.chip}>
                      <UsersIcon size={14} color={theme.primary} />
                      <Text style={styles.chipText}>
                        {classItem.studentCount}{' '}
                        {classItem.studentCount === 1 ? 'student' : 'students'}
                      </Text>
                    </View>
                    {classItem.schedule ? (
                      <View style={[styles.chip, styles.chipFlex]}>
                        <CalendarSmallIcon size={14} color={theme.primary} />
                        <Text style={styles.chipTextMuted} numberOfLines={1}>
                          {classItem.schedule}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>

              <View style={styles.cardActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionLink, pressed && styles.actionLinkPressed]}
                  onPress={() => navigation.navigate('Attendance', { classId: classItem.id })}
                  android_ripple={{ color: theme.rippleLight }}
                >
                  <ClipboardCheckIcon size={18} color={theme.primary} />
                  <Text style={styles.actionLinkText}>Attendance</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable
                  style={({ pressed }) => [styles.actionDanger, pressed && styles.actionDangerPressed]}
                  onPress={() => confirmDeleteClass(classItem)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  android_ripple={{ color: 'rgba(220,38,38,0.12)' }}
                >
                  <TrashIcon size={18} color="#DC2626" />
                  <Text style={styles.actionDangerText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </PulseScrollView>

      {!embedded && <BottomTab navigation={navigation} currentRoute="MyClasses" />}
    </SafeAreaView>
  );
};

export default MyClasses;
