import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabRoute, RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import BottomTab from '../components/BottomTab';
import { PulseScrollView } from '../components/PulseScrollView';
import {
  useClasses,
  type ClassActivityItem,
  type ClassActivityKind,
  type ClassAnnouncement,
} from '../context/ClassesContext';
import { useForms } from '../context/FormsContext';
import { useUser } from '../context/UserContext';
import { usePulseAlert } from '../context/AlertModalContext';
import {
  useGradesTasks,
  type ClassTask,
  type TaskGradeRecord,
} from '../context/GradesTasksContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'> & {
  embedded?: boolean;
  onSelectTab?: (tab: MainTabRoute) => void;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PAGE_H = 20;
const R_CARD = radius.card;

/** Relative time for activity rows (short, locale-friendly). */
function formatRecentTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type HomeActivityRow = {
  id: string;
  createdAt: string;
  kind: ClassActivityKind | 'saved_form';
  headline: string;
  detail?: string;
  classId?: string;
  className?: string;
  formId?: string;
};

function parseAssignedTaskTitle(headline: string): string | null {
  const taskAssigned = 'Task assigned: ';
  if (headline.startsWith(taskAssigned)) return headline.slice(taskAssigned.length).trim();
  const assigned = 'Assigned: ';
  if (headline.startsWith(assigned)) return headline.slice(assigned.length).trim();
  return null;
}

function findTaskForAssignedActivity(
  headline: string,
  classId: string | undefined,
  tasks: ClassTask[],
): ClassTask | undefined {
  if (!classId) return undefined;
  const title = parseAssignedTaskTitle(headline);
  if (!title) return undefined;
  return tasks.find((t) => t.classId === classId && t.title === title);
}

function countTaskResponses(
  task: ClassTask,
  grades: TaskGradeRecord[],
): { responded: number; total: number } {
  const rows = grades.filter((g) => g.taskId === task.id && g.classId === task.classId);
  return {
    total: rows.length,
    responded: rows.filter((g) => g.status !== 'missing').length,
  };
}

function formatDueAtShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatTimeLeft(dueAtIso: string): string {
  const end = new Date(dueAtIso).getTime();
  if (Number.isNaN(end)) return '';
  const diff = end - Date.now();
  if (diff <= 0) return 'Overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h left`;
  const days = Math.floor(hrs / 24);
  return `${days}d left`;
}

/** Elapsed share of window from assignment → deadline (0–100). */
function timeProgressPercent(createdAt: string, dueAtIso: string): number | null {
  const start = new Date(createdAt).getTime();
  const end = new Date(dueAtIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  const p = (Date.now() - start) / (end - start);
  return Math.max(0, Math.min(100, p * 100));
}

/* —— Icons —— */
const IconBase = ({
  children,
  size = 22,
}: {
  children: React.ReactNode;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

const IconPlusCircle = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Circle cx="12" cy="12" r="9.25" stroke={color} strokeWidth="1.75" />
    <Path
      d="M12 8.5v7M8.5 12h7"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </IconBase>
);

const IconFileLines = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
    <Path
      d="M8 13h8M8 17h6M8 9h3"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </IconBase>
);

const IconListChecks = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Circle cx="6" cy="7" r="1.5" fill={color} />
    <Circle cx="6" cy="12" r="1.5" fill={color} />
    <Circle cx="6" cy="17" r="1.5" fill={color} />
    <Path
      d="M10 7h10M10 12h10M10 17h7"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </IconBase>
);

const IconClipboardUser = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
      stroke={color}
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <Path
      d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12h6M9 16h4"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </IconBase>
);

const IconChevronRight = ({ color, size = 20 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="m9 18 6-6-6-6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

const IconChevronDown = ({ color, size = 20 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="m6 9 6 6 6-6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

const IconBook = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 7h8M8 11h6"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </IconBase>
);

const IconCircleCheck = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Circle cx="12" cy="12" r="9.25" stroke={color} strokeWidth="1.75" />
    <Path
      d="m8.5 12.5 2 2 4.5-4.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

/** Settings / gear — top bar opens Settings tab */
const IconSettings = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Path
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
  </IconBase>
);

/** User silhouette — profile / account (opens Settings). */
const IconUserProfile = ({ color, size = 22 }: { color: string; size?: number }) => (
  <IconBase size={size}>
    <Circle cx="12" cy="8.25" r="3.25" stroke={color} strokeWidth="1.75" />
    <Path
      d="M5.5 19.25c0-3 2.75-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

/**
 * Megaphone — same artwork in the modal and on the home chip. Home uses a slight tilt via `View` (no SVG filters / “inner shadow”).
 */
const IconMegaphone = ({
  color,
  size = 22,
  tiltDeg = 0,
}: {
  color: string;
  size?: number;
  tiltDeg?: number;
}) => {
  const inner = (
    <IconBase size={size}>
      <Path
        d="M3 11V9a2 2 0 012-2h2l5-3v14l-5-3H5a2 2 0 01-2-2v-2z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8v8M19 10v4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </IconBase>
  );
  if (!tiltDeg) {
    return inner;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: `${tiltDeg}deg` }],
      }}
    >
      {inner}
    </View>
  );
};

type QuickItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
};

const Home: React.FC<Props> = ({ navigation, embedded, onSelectTab, route }) => {
  const { classes, updateClass } = useClasses();
  const { forms } = useForms();
  const { tasks, grades } = useGradesTasks();
  const { firstName, displayName } = useUser();
  const { showAlert, showSuccess } = usePulseAlert();
  const { ink, theme } = useThemeMode();

  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  /** Recent activity: closed on each Home visit; expand to see header + card (latest only until list expanded). */
  const [recentSectionExpanded, setRecentSectionExpanded] = useState(false);
  const [recentListExpanded, setRecentListExpanded] = useState(false);

  const runRecentLayoutAnimation = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setRecentSectionExpanded(false);
      setRecentListExpanded(false);
    }, []),
  );

  const homeSegOpacity = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;
  const homeSegY = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useLayoutEffect(() => {
    if (route?.params?.homeEntrance) {
      homeSegOpacity.forEach((v) => v.setValue(0));
      homeSegY.forEach((v) => v.setValue(24));
    }
  }, [route?.params?.homeEntrance, homeSegOpacity, homeSegY]);

  useEffect(() => {
    if (!route?.params?.homeEntrance) return;
    const springs = homeSegOpacity.map((op, i) =>
      Animated.parallel([
        Animated.spring(op, {
          toValue: 1,
          friction: 7,
          tension: 78,
          useNativeDriver: true,
        }),
        Animated.spring(homeSegY[i], {
          toValue: 0,
          friction: 7,
          tension: 78,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(58, springs).start(() => {
      navigation.setParams({ homeEntrance: undefined });
    });
  }, [route?.params?.homeEntrance, navigation, homeSegOpacity, homeSegY]);

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId(null);
      return;
    }
    setSelectedClassId(prev => {
      if (prev && classes.some(c => c.id === prev)) return prev;
      return classes[0].id;
    });
  }, [classes]);

  const heyLine = useMemo(() => {
    const name = firstName.trim() || displayName.trim().split(/\s+/)[0] || '';
    return name ? `Hey ${name}` : 'Hey User';
  }, [firstName, displayName]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, c) => sum + (c.studentCount || 0), 0),
    [classes],
  );

  const recentHomeActivity = useMemo((): HomeActivityRow[] => {
    const rows: HomeActivityRow[] = [];
    for (const c of classes) {
      for (const act of c.activityLog ?? []) {
        rows.push({
          id: `log-${c.id}-${act.id}`,
          createdAt: act.createdAt,
          kind: act.kind,
          headline: act.headline,
          detail: act.detail,
          classId: c.id,
          className: c.name,
        });
      }
    }
    for (const f of forms) {
      rows.push({
        id: `form-${f.id}`,
        createdAt: f.createdAt,
        kind: 'saved_form',
        headline: `Saved task “${f.name}”`,
        detail: 'From the form builder',
        formId: f.id,
      });
    }
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows.slice(0, 5);
  }, [classes, forms]);

  const displayRecentActivity = useMemo(() => {
    if (!recentSectionExpanded) return [];
    if (!recentListExpanded) return recentHomeActivity.slice(0, 1);
    return recentHomeActivity;
  }, [recentSectionExpanded, recentListExpanded, recentHomeActivity]);

  const accent = theme.primary;
  const iconMuted = 'rgba(160, 96, 255, 0.55)';
  const chevronMuted = 'rgba(160, 96, 255, 0.45)';

  const HomeActivityIcon = ({ kind }: { kind: HomeActivityRow['kind'] }) => {
    switch (kind) {
      case 'announcement':
        return <IconMegaphone color={accent} size={20} tiltDeg={-8} />;
      case 'attendance':
        return <IconCircleCheck color="#4CAF50" size={20} />;
      case 'task_assigned':
        return <IconListChecks color={accent} size={20} />;
      case 'saved_form':
        return <IconFileLines color={accent} size={20} />;
      default:
        return <IconBook color={accent} size={20} />;
    }
  };

  const onRecentActivityPress = useCallback(
    (row: HomeActivityRow) => {
      if (row.formId) {
        navigation.navigate('EditForm', { formId: row.formId });
        return;
      }
      if (row.classId) {
        navigation.navigate('ClassDetails', { classId: row.classId });
      }
    },
    [navigation],
  );

  const selectedClass = useMemo(
    () => (selectedClassId ? classes.find(c => c.id === selectedClassId) : undefined),
    [classes, selectedClassId],
  );

  const postAnnouncement = useCallback(() => {
    if (!selectedClassId || !selectedClass) {
      showAlert({
        variant: 'warning',
        title: 'Choose a class',
        message: 'Create a class first, then pick it to post an announcement.',
      });
      return;
    }
    const body = announcementDraft.trim();
    if (!body) {
      showAlert({
        variant: 'warning',
        title: 'Empty announcement',
        message: 'Write something before posting.',
      });
      return;
    }
    const createdAt = new Date().toISOString();
    const next: ClassAnnouncement = {
      id: `ann-${Date.now()}`,
      body,
      createdAt,
    };
    const merged = [next, ...(selectedClass.announcements ?? [])];
    const activity: ClassActivityItem = {
      id: `act-${Date.now()}`,
      kind: 'announcement',
      headline: 'Posted an announcement',
      detail: body.length > 100 ? `${body.slice(0, 100)}…` : body,
      createdAt,
    };
    void updateClass(selectedClass.id, {
      announcements: merged,
      activityLog: [activity, ...(selectedClass.activityLog ?? [])].slice(0, 40),
    }).then(() => {
      setAnnouncementDraft('');
      setAnnouncementModalOpen(false);
      showSuccess('Posted', `Announcement added for ${selectedClass.name}.`);
    });
  }, [
    announcementDraft,
    selectedClass,
    selectedClassId,
    updateClass,
    showAlert,
    showSuccess,
  ]);

  const openAnnouncementModal = useCallback(() => {
    if (classes.length === 0) {
      showAlert({
        variant: 'warning',
        title: 'No classes yet',
        message: 'Create a class first, then you can post announcements to it.',
      });
      return;
    }
    setAnnouncementModalOpen(true);
  }, [classes.length, showAlert]);

  const quickActions: QuickItem[] = useMemo(
    () => [
      {
        key: 'class',
        title: 'New class',
        subtitle: 'Create a cohort and invite students',
        icon: <IconPlusCircle color={accent} size={22} />,
        onPress: () => navigation.navigate('CreateClass'),
      },
      {
        key: 'lesson',
        title: 'Lesson plans',
        subtitle: 'Draft and organize lessons',
        icon: <IconFileLines color={accent} size={22} />,
        onPress: () => navigation.navigate('LessonPlanner'),
      },
      {
        key: 'quiz',
        title: 'Tasks & quizzes',
        subtitle: 'Build and publish for classes',
        icon: <IconListChecks color={accent} size={22} />,
        onPress: () => onSelectTab?.('Quizzes'),
      },
      {
        key: 'att',
        title: 'Attendance',
        subtitle: 'Take roll in seconds',
        icon: <IconClipboardUser color={accent} size={22} />,
        onPress: () => {
          if (classes.length > 0) {
            navigation.navigate('Attendance', {});
          } else {
            onSelectTab?.('MyClasses');
          }
        },
      },
    ],
    [navigation, classes, accent, onSelectTab],
  );

  const CANVAS = ink.canvas;
  const INK = ink.ink;
  const INK_SOFT = ink.inkSoft;
  const BORDER_INK = ink.borderInk;
  const BORDER_WIDTH = ink.borderWidth;
  const ROW_DIVIDER = ink.rowDivider;
  const ICON_WELL = ink.iconWell;
  const PRESS_TINT = ink.pressTint;

  const styles = useMemo(
    () =>
      StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  root: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    flexGrow: 1,
    paddingBottom: 112,
  },
  page: {
    paddingTop: 8,
  },
  headerBlock: {
    marginTop: 10,
    marginBottom: 10,
  },
  headerRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerRowGreeting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  /** Right column: top row = profile + settings; greeting row = megaphone aligned to same trailing edge. */
  headerRightColumn: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandGroove: {
    fontSize: 20,
    fontFamily: F.outfitBold,
    color: INK,
    letterSpacing: -0.4,
  },
  brandBox: {
    fontSize: 20,
    fontFamily: F.outfitBold,
    color: theme.brandLogoPurple,
    letterSpacing: -0.4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.white,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingDisplay: {
    flex: 1,
    minWidth: 0,
    fontSize: 40,
    lineHeight: 44,
    fontFamily: F.outfitBlack,
    color: INK,
    letterSpacing: -1,
  },
  megaphoneBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.white,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  megaphoneBtnPressed: {
    opacity: 0.9,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: F.dmMedium,
    color: INK_SOFT,
    marginBottom: 22,
  },
  recentActivityShell: {
    marginBottom: 12,
    borderRadius: R_CARD,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
    overflow: 'hidden',
    backgroundColor: theme.white,
  },
  recentActivityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  recentActivityBarTitle: {
    fontSize: 17,
    fontFamily: F.dmBold,
    color: INK,
    marginBottom: 4,
  },
  recentActivityBarMeta: {
    fontSize: 13,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  recentActivityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ROW_DIVIDER,
    marginHorizontal: 16,
  },
  recentActivityCard: {
    overflow: 'hidden',
    paddingVertical: 0,
  },
  recentActivityListToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ROW_DIVIDER,
    backgroundColor: theme.white,
  },
  recentActivityListToggleTxt: {
    fontSize: 15,
    fontFamily: F.dmBold,
    color: theme.primary,
  },
  recentActivityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  recentActivityRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  recentActivityRowPressed: {
    backgroundColor: PRESS_TINT,
  },
  recentActivityIconWell: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ICON_WELL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
  },
  recentActivityCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  recentActivityTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: F.dmBold,
    color: INK,
    marginBottom: 4,
  },
  recentActivityDetail: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
    marginBottom: 4,
  },
  recentActivityFoot: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: F.dmMedium,
    color: INK_SOFT,
  },
  recentTaskBlock: {
    marginTop: 10,
    gap: 6,
  },
  recentTaskAssignLine: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.dmSemi,
    color: INK,
  },
  recentTaskDueText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  recentTaskProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: ROW_DIVIDER,
    overflow: 'hidden',
    marginTop: 2,
  },
  recentTaskProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentTaskResponses: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: F.dmMedium,
    color: INK_SOFT,
    marginTop: 2,
  },
  surfaceCard: {
    backgroundColor: theme.white,
    borderRadius: R_CARD,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statV: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: ROW_DIVIDER,
    marginVertical: 4,
  },
  statNum: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: F.dmExtraBold,
    color: INK,
    letterSpacing: -0.6,
  },
  statLab: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: F.dmSemi,
    color: INK_SOFT,
    letterSpacing: 0.2,
  },
  postAnnouncementHeading: {
    marginTop: 30,
    marginBottom: 8,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: F.outfitExtraBold,
    color: INK,
    letterSpacing: -0.5,
  },
  postAnnouncementSub: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: F.dmMedium,
    color: INK_SOFT,
    marginBottom: 14,
  },
  postAnnouncementCard: {
    padding: 16,
    marginBottom: 0,
  },
  announceModalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  announceModalSheet: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: theme.white,
    borderRadius: R_CARD,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
    padding: 18,
    maxHeight: '88%',
  },
  announceModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  announceModalTitleBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  announceModalIconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ICON_WELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
  },
  announceModalTitleText: {
    flex: 1,
    minWidth: 0,
  },
  announceModalTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: F.outfitBold,
    color: INK,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  announceModalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  announceModalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ink.canvas,
    borderWidth: BORDER_WIDTH,
    borderColor: ROW_DIVIDER,
  },
  announceModalCloseText: {
    fontSize: 15,
    color: INK_SOFT,
    fontFamily: F.dmBold,
    lineHeight: 18,
  },
  classPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: BORDER_WIDTH,
    borderColor: ROW_DIVIDER,
    backgroundColor: ink.canvas,
  },
  classPickerTriggerPressed: {
    opacity: 0.92,
  },
  classPickerTriggerInner: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
    paddingRight: 4,
  },
  classPickerChevron: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 40,
    marginLeft: 4,
  },
  classPickerLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: F.dmSemi,
    color: INK_SOFT,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  classPickerValue: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: F.dmBold,
    color: INK,
  },
  classPickerValueMuted: {
    fontFamily: F.dmMedium,
    color: INK_SOFT,
  },
  announcementInput: {
    minHeight: 100,
    maxHeight: 180,
    borderRadius: 12,
    borderWidth: BORDER_WIDTH,
    borderColor: ROW_DIVIDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: F.dmRegular,
    color: INK,
    marginBottom: 14,
    backgroundColor: theme.white,
  },
  postAnnouncementBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  postAnnouncementBtnDisabled: {
    opacity: 0.45,
  },
  postAnnouncementBtnPressed: {
    opacity: 0.9,
  },
  postAnnouncementBtnText: {
    fontSize: 16,
    fontFamily: F.outfitBold,
    color: theme.white,
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: theme.white,
    borderRadius: R_CARD,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_INK,
    maxHeight: '78%',
    overflow: 'hidden',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: F.outfitBold,
    color: INK,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  modalList: {
    flexGrow: 0,
    maxHeight: 340,
  },
  modalListContent: {
    paddingVertical: 8,
    paddingBottom: 12,
    flexGrow: 1,
  },
  modalRow: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  modalRowWithDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  modalRowTextCol: {
    flex: 1,
    minWidth: 0,
  },
  modalRowSelected: {
    backgroundColor: theme.primarySoft,
  },
  modalRowPressed: {
    backgroundColor: PRESS_TINT,
  },
  modalRowTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: F.dmBold,
    color: INK,
    marginBottom: 6,
  },
  modalRowMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ROW_DIVIDER,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: F.dmBold,
    color: theme.primary,
  },
  sectionHeading: {
    marginTop: 30,
    marginBottom: 14,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: F.outfitExtraBold,
    color: INK,
    letterSpacing: -0.5,
  },
  actionsCard: {
    overflow: 'hidden',
    paddingVertical: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 76,
  },
  actionRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  actionRowPressed: {
    backgroundColor: PRESS_TINT,
  },
  actionIconWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ICON_WELL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: F.dmBold,
    color: INK,
    marginBottom: 3,
  },
  actionSub: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  classesHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 14,
  },
  sectionHeadingTight: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: F.outfitExtraBold,
    color: INK,
    letterSpacing: -0.5,
  },
  sectionMeta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: F.dmMedium,
    color: INK_SOFT,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  seeAllText: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: F.outfitBold,
    color: theme.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIconWell: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ICON_WELL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: F.outfitExtraBold,
    color: INK,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnLabel: {
    fontSize: 17,
    fontFamily: F.outfitBold,
    color: theme.white,
  },
  classListCard: {
    overflow: 'hidden',
    paddingVertical: 0,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 76,
  },
  classRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_DIVIDER,
  },
  classRowPressed: {
    backgroundColor: PRESS_TINT,
  },
  classIconWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  classMain: {
    flex: 1,
    minWidth: 0,
  },
  classTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: F.dmBold,
    color: INK,
    marginBottom: 3,
  },
  classMeta: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: F.dmRegular,
    color: INK_SOFT,
  },
  classQuick: {
    padding: 8,
    marginRight: 4,
  },
  bottomSpacer: {
    height: 8,
  },
}),
    [ink, theme],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <PulseScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
        >
          <View style={[styles.page, { paddingHorizontal: PAGE_H }]}>
            <Animated.View
              style={{
                opacity: homeSegOpacity[0],
                transform: [{ translateY: homeSegY[0] }],
              }}
            >
              <View style={styles.headerBlock}>
                <View style={styles.headerRowTop}>
                  <View style={styles.brandRow}>
                    <Text style={styles.brandGroove}>Teach</Text>
                    <Text style={styles.brandBox}>Track</Text>
                  </View>
                  <View style={styles.headerRightColumn}>
                    <View style={styles.headerIconsRow}>
                      <Pressable
                        style={styles.avatar}
                        onPress={() => navigation.navigate('Profile')}
                        accessibilityRole="button"
                        accessibilityLabel="Profile and account"
                        android_ripple={{ color: theme.rippleLight, borderless: true }}
                      >
                        <IconUserProfile color={INK} size={22} />
                      </Pressable>
                      <Pressable
                        style={styles.avatar}
                        onPress={() => onSelectTab?.('Settings')}
                        accessibilityRole="button"
                        accessibilityLabel="Open settings"
                        android_ripple={{ color: theme.rippleLight, borderless: true }}
                      >
                        <IconSettings color={INK} size={22} />
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={styles.headerRowGreeting}>
                  <Text style={styles.greetingDisplay} numberOfLines={2}>
                    {heyLine}
                  </Text>
                  <View style={styles.headerRightColumn}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.megaphoneBtn,
                        pressed && styles.megaphoneBtnPressed,
                      ]}
                      onPress={openAnnouncementModal}
                      accessibilityRole="button"
                      accessibilityLabel="Post announcement to a class"
                      android_ripple={{ color: theme.rippleLight, borderless: false }}
                    >
                      <IconMegaphone color={accent} size={24} tiltDeg={-11} />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Text style={styles.tagline}>
                Jump in — your classes and tools are ready when you are.
              </Text>
            </Animated.View>

            {recentHomeActivity.length > 0 ? (
              <Animated.View
                style={{
                  opacity: homeSegOpacity[1],
                  transform: [{ translateY: homeSegY[1] }],
                }}
              >
                <View style={styles.recentActivityShell}>
                  <Pressable
                    style={styles.recentActivityBar}
                    onPress={() => {
                      runRecentLayoutAnimation();
                      if (recentSectionExpanded) {
                        setRecentSectionExpanded(false);
                        setRecentListExpanded(false);
                      } else {
                        setRecentSectionExpanded(true);
                        setRecentListExpanded(false);
                      }
                    }}
                    android_ripple={{ color: ink.pressTint }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      recentSectionExpanded
                        ? 'Recent activity. Tap to collapse.'
                        : `Recent activity, ${recentHomeActivity.length} updates. Tap to expand.`
                    }
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.recentActivityBarTitle}>Recent activity</Text>
                      <Text style={styles.recentActivityBarMeta}>
                        {recentSectionExpanded
                          ? 'Tap to collapse'
                          : `${recentHomeActivity.length} update${
                              recentHomeActivity.length === 1 ? '' : 's'
                            } · Tap to open`}
                      </Text>
                    </View>
                    <View
                      style={{
                        transform: [{ rotate: recentSectionExpanded ? '180deg' : '0deg' }],
                      }}
                    >
                      <IconChevronDown color={accent} size={22} />
                    </View>
                  </Pressable>
                  {recentSectionExpanded ? (
                    <>
                      <View style={styles.recentActivityDivider} />
                      <View style={styles.recentActivityCard}>
                  {displayRecentActivity.map((row, index) => {
                    const time = formatRecentTime(row.createdAt);
                    const contextLabel =
                      row.kind === 'saved_form'
                        ? 'Saved forms'
                        : row.className ?? 'Class';
                    const matchedTask =
                      row.kind === 'task_assigned'
                        ? findTaskForAssignedActivity(row.headline, row.classId, tasks)
                        : undefined;
                    const responses = matchedTask ? countTaskResponses(matchedTask, grades) : null;
                    const progressPct =
                      matchedTask?.dueAt && matchedTask.createdAt
                        ? timeProgressPercent(matchedTask.createdAt, matchedTask.dueAt)
                        : null;
                    const showDetail =
                      !!row.detail?.trim() &&
                      row.kind !== 'saved_form' &&
                      row.detail !== row.headline &&
                      !(matchedTask && row.kind === 'task_assigned');
                    return (
                      <Pressable
                        key={row.id}
                        style={({ pressed }) => [
                          styles.recentActivityRow,
                          index < displayRecentActivity.length - 1 && styles.recentActivityRowDivider,
                          pressed && styles.recentActivityRowPressed,
                        ]}
                        onPress={() => onRecentActivityPress(row)}
                        android_ripple={{ color: 'rgba(15,23,42,0.04)' }}
                      >
                        <View style={styles.recentActivityIconWell}>
                          <HomeActivityIcon kind={row.kind} />
                        </View>
                        <View style={styles.recentActivityCopy}>
                          <Text style={styles.recentActivityTitle} numberOfLines={2}>
                            {row.headline}
                          </Text>
                          {showDetail ? (
                            <Text style={styles.recentActivityDetail} numberOfLines={2}>
                              {row.detail}
                            </Text>
                          ) : null}
                          {matchedTask ? (
                            <View style={styles.recentTaskBlock}>
                              <Text style={styles.recentTaskAssignLine}>
                                Assigned to {row.className ?? 'Class'}
                              </Text>
                              {matchedTask.dueAt ? (
                                <>
                                  <Text style={styles.recentTaskDueText}>
                                    {formatDueAtShort(matchedTask.dueAt)} · {formatTimeLeft(matchedTask.dueAt)}
                                  </Text>
                                  {progressPct !== null ? (
                                    <View style={styles.recentTaskProgressTrack}>
                                      <View
                                        style={[
                                          styles.recentTaskProgressFill,
                                          { width: `${progressPct}%`, backgroundColor: accent },
                                        ]}
                                      />
                                    </View>
                                  ) : null}
                                </>
                              ) : matchedTask.dueLabel ? (
                                <Text style={styles.recentTaskDueText}>{matchedTask.dueLabel}</Text>
                              ) : null}
                              {responses && responses.total > 0 ? (
                                <Text style={styles.recentTaskResponses}>
                                  {responses.responded} / {responses.total} responses
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                          <Text style={styles.recentActivityFoot}>
                            {matchedTask
                              ? time
                              : `${time}${contextLabel ? ` · ${contextLabel}` : ''}`}
                          </Text>
                        </View>
                        <IconChevronRight color={chevronMuted} size={18} />
                      </Pressable>
                    );
                  })}
                      </View>
                      {recentHomeActivity.length > 1 ? (
                        <Pressable
                          style={styles.recentActivityListToggle}
                          onPress={() => {
                            runRecentLayoutAnimation();
                            setRecentListExpanded((v) => !v);
                          }}
                          android_ripple={{ color: ink.pressTint }}
                          accessibilityLabel={
                            recentListExpanded
                              ? 'Show fewer activities'
                              : `Show all ${recentHomeActivity.length} activities`
                          }
                        >
                          <Text style={styles.recentActivityListToggleTxt}>
                            {recentListExpanded ? 'Show less' : `Show all (${recentHomeActivity.length})`}
                          </Text>
                          <View
                            style={{
                              transform: [{ rotate: recentListExpanded ? '180deg' : '0deg' }],
                            }}
                          >
                            <IconChevronDown color={accent} size={20} />
                          </View>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </View>
              </Animated.View>
            ) : null}

            <Animated.View
              style={{
                opacity: homeSegOpacity[2],
                transform: [{ translateY: homeSegY[2] }],
              }}
            >
            <View style={styles.surfaceCard}>
              <View style={styles.statsRow}>
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>{classes.length}</Text>
                  <Text style={styles.statLab}>Total Classes</Text>
                </View>
                <View style={styles.statV} />
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>{totalStudents}</Text>
                  <Text style={styles.statLab}>Total Students</Text>
                </View>
                <View style={styles.statV} />
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>{tasks.length}</Text>
                  <Text style={styles.statLab}>Active Tasks</Text>
                </View>
              </View>
            </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: homeSegOpacity[3],
                transform: [{ translateY: homeSegY[3] }],
              }}
            >
            <View style={styles.classesHead}>
              <View>
                <Text style={styles.sectionHeadingTight}>My Classes</Text>
                <Text style={styles.sectionMeta}>
                  {classes.length === 0
                    ? 'Nothing here yet'
                    : `${classes.length} active · ${totalStudents} students`}
                </Text>
              </View>
              <Pressable
                onPress={() => onSelectTab?.('MyClasses')}
                style={styles.seeAll}
                hitSlop={10}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <IconChevronRight color={accent} size={18} />
              </Pressable>
            </View>

            {classes.length === 0 ? (
              <View style={[styles.surfaceCard, styles.emptyCard]}>
                <View style={styles.emptyIconWell}>
                  <IconBook color={accent} size={26} />
                </View>
                <Text style={styles.emptyTitle}>No classes yet</Text>
                <Text style={styles.emptyBody}>
                  Add a class to track rosters, attendance, and work in one place.
                </Text>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => navigation.navigate('CreateClass')}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={styles.primaryBtnLabel}>Create a class</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.surfaceCard, styles.classListCard]}>
                {classes.map((c, index) => (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [
                      styles.classRow,
                      index < classes.length - 1 && styles.classRowDivider,
                      pressed && styles.classRowPressed,
                    ]}
                    onPress={() =>
                      navigation.navigate('ClassDetails', { classId: c.id })
                    }
                    android_ripple={{ color: 'rgba(15,23,42,0.04)' }}
                  >
                      <View style={styles.classIconWell}>
                        <IconBook color={accent} size={22} />
                      </View>
                      <View style={styles.classMain}>
                        <Text style={styles.classTitle} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.classMeta} numberOfLines={2}>
                          {c.subject} · {c.gradeLevel} · {c.studentCount} students
                        </Text>
                      </View>
                      <Pressable
                        style={styles.classQuick}
                        onPress={e => {
                          e.stopPropagation();
                          navigation.navigate('Attendance', { classId: c.id });
                        }}
                        accessibilityLabel="Open attendance"
                        hitSlop={10}
                      >
                        <IconCircleCheck color={iconMuted} size={22} />
                      </Pressable>
                      <IconChevronRight color={chevronMuted} size={20} />
                  </Pressable>
                ))}
              </View>
            )}
            </Animated.View>

            <Animated.View
              style={{
                opacity: homeSegOpacity[4],
                transform: [{ translateY: homeSegY[4] }],
              }}
            >
            <Text style={styles.sectionHeading}>What do you want to do next?</Text>

            <View style={[styles.surfaceCard, styles.actionsCard]}>
              {quickActions.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    styles.actionRow,
                    index < quickActions.length - 1 && styles.actionRowDivider,
                    pressed && styles.actionRowPressed,
                  ]}
                  onPress={item.onPress}
                  android_ripple={{ color: 'rgba(15,23,42,0.04)' }}
                >
                  <View style={styles.actionIconWell}>{item.icon}</View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionSub}>{item.subtitle}</Text>
                  </View>
                  <IconChevronRight color={chevronMuted} size={20} />
                </Pressable>
              ))}
            </View>

            <Text style={styles.postAnnouncementHeading}>Post announcement</Text>
            <Text style={styles.postAnnouncementSub}>
              Choose a class, write your message, and post — it shows on that class’s feed.
            </Text>

            <View style={[styles.surfaceCard, styles.postAnnouncementCard]}>
              <Pressable
                style={({ pressed }) => [
                  styles.classPickerTrigger,
                  pressed && styles.classPickerTriggerPressed,
                ]}
                onPress={() => classes.length > 0 && setClassPickerOpen(true)}
                disabled={classes.length === 0}
                android_ripple={{ color: 'rgba(15,23,42,0.06)' }}
              >
                <View style={styles.classPickerTriggerInner}>
                  <Text style={styles.classPickerLabel}>Posting for</Text>
                  <Text
                    style={[
                      styles.classPickerValue,
                      classes.length === 0 && styles.classPickerValueMuted,
                    ]}
                    numberOfLines={2}
                  >
                    {classes.length === 0
                      ? 'No classes yet — create one first'
                      : selectedClass?.name ?? 'Select a class'}
                  </Text>
                </View>
                {classes.length > 0 ? (
                  <View style={styles.classPickerChevron}>
                    <IconChevronRight color={chevronMuted} size={20} />
                  </View>
                ) : null}
              </Pressable>

              <TextInput
                style={styles.announcementInput}
                placeholder="Write an announcement…"
                placeholderTextColor={INK_SOFT}
                value={announcementDraft}
                onChangeText={setAnnouncementDraft}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.postAnnouncementBtn,
                  (classes.length === 0 || !announcementDraft.trim()) &&
                    styles.postAnnouncementBtnDisabled,
                  pressed && styles.postAnnouncementBtnPressed,
                ]}
                onPress={postAnnouncement}
                disabled={classes.length === 0 || !announcementDraft.trim()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.postAnnouncementBtnText}>Post announcement</Text>
              </Pressable>
            </View>
            </Animated.View>

            <Modal
              visible={announcementModalOpen}
              transparent
              animationType="fade"
              onRequestClose={() => {
                setClassPickerOpen(false);
                setAnnouncementModalOpen(false);
              }}
            >
              <Pressable
                style={styles.announceModalBackdrop}
                onPress={() => {
                  setClassPickerOpen(false);
                  setAnnouncementModalOpen(false);
                }}
              >
                <View
                  style={styles.announceModalSheet}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.announceModalHeader}>
                    <View style={styles.announceModalTitleBlock}>
                      <View style={styles.announceModalIconWell}>
                        <IconMegaphone color={accent} size={22} />
                      </View>
                      <View style={styles.announceModalTitleText}>
                        <Text style={styles.announceModalTitle}>New announcement</Text>
                        <Text style={styles.announceModalSubtitle}>
                          Pick a class and share an update — it appears on that class’s feed.
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.announceModalClose}
                      onPress={() => {
                        setClassPickerOpen(false);
                        setAnnouncementModalOpen(false);
                      }}
                      hitSlop={12}
                      accessibilityLabel="Close"
                    >
                      <Text style={styles.announceModalCloseText}>✕</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.classPickerTrigger,
                      pressed && styles.classPickerTriggerPressed,
                    ]}
                    onPress={() => classes.length > 0 && setClassPickerOpen(true)}
                    disabled={classes.length === 0}
                    android_ripple={{ color: 'rgba(15,23,42,0.06)' }}
                  >
                    <View style={styles.classPickerTriggerInner}>
                      <Text style={styles.classPickerLabel}>Announce to</Text>
                      <Text
                        style={[
                          styles.classPickerValue,
                          classes.length === 0 && styles.classPickerValueMuted,
                        ]}
                        numberOfLines={2}
                      >
                        {classes.length === 0
                          ? 'No classes — create one in Quick actions'
                          : selectedClass?.name ?? 'Select a class'}
                      </Text>
                    </View>
                    {classes.length > 0 ? (
                      <View style={styles.classPickerChevron}>
                        <IconChevronRight color={chevronMuted} size={20} />
                      </View>
                    ) : null}
                  </Pressable>

                  <TextInput
                    style={styles.announcementInput}
                    placeholder="What do you want to share?"
                    placeholderTextColor={INK_SOFT}
                    value={announcementDraft}
                    onChangeText={setAnnouncementDraft}
                    multiline
                    textAlignVertical="top"
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.postAnnouncementBtn,
                      (classes.length === 0 || !announcementDraft.trim()) &&
                        styles.postAnnouncementBtnDisabled,
                      pressed && styles.postAnnouncementBtnPressed,
                    ]}
                    onPress={postAnnouncement}
                    disabled={classes.length === 0 || !announcementDraft.trim()}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.postAnnouncementBtnText}>Post announcement</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            <Modal
              visible={classPickerOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setClassPickerOpen(false)}
            >
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setClassPickerOpen(false)}
              >
                <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                  <Text style={styles.modalTitle}>Select class</Text>
                  <ScrollView
                    style={styles.modalList}
                    contentContainerStyle={styles.modalListContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={classes.length > 4}
                  >
                    {classes.map((c, index) => (
                      <Pressable
                        key={c.id}
                        style={({ pressed }) => [
                          styles.modalRow,
                          index < classes.length - 1 && styles.modalRowWithDivider,
                          selectedClassId === c.id && styles.modalRowSelected,
                          pressed && styles.modalRowPressed,
                        ]}
                        onPress={() => {
                          setSelectedClassId(c.id);
                          setClassPickerOpen(false);
                        }}
                        android_ripple={{ color: 'rgba(15,23,42,0.06)' }}
                      >
                        <View style={styles.modalRowTextCol}>
                          <Text style={styles.modalRowTitle} numberOfLines={2}>
                            {c.name}
                          </Text>
                          <Text style={styles.modalRowMeta} numberOfLines={2}>
                            {c.subject} · {c.gradeLevel}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={styles.modalCancel}
                    onPress={() => setClassPickerOpen(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            <View style={styles.bottomSpacer} />
          </View>
        </PulseScrollView>

        {!embedded && <BottomTab navigation={navigation} currentRoute="Home" />}
      </View>
    </SafeAreaView>
  );
};



export default Home;
