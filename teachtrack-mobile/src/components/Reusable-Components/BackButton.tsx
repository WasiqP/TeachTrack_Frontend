import React, { useMemo } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeMode } from '../../theme';
import BackIcon from '../../../assets/images/Back.svg';

const MIN_TOUCH = 44;

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Icon width/height (default 24, matches LessonPlanner / ClassDetails headers) */
  size?: number;
  /** Icon color (outline + arrow). Uses SVG `currentColor`; do not set root `fill` or the rounded frame fills solid. */
  stroke?: string;
  /** Android ripple color (default brand purple ripple) */
  rippleColor?: string;
};

/**
 * Shared back control using `Back.svg`: large hit area, ripple on Android, a11y label for VoiceOver/TalkBack.
 */
const BackButton: React.FC<Props> = ({
  onPress,
  style,
  size = 24,
  stroke,
  rippleColor,
}) => {
  const { ink, theme } = useThemeMode();
  const strokeColor = stroke ?? ink.ink;
  const ripple = rippleColor ?? theme.ripple;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          minWidth: MIN_TOUCH,
          minHeight: MIN_TOUCH,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: -6,
        },
        pressed: {
          opacity: 0.55,
        },
      }),
    [],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      android_ripple={{ color: ripple, borderless: true, radius: 28 }}
      style={({ pressed }) => [styles.root, style, pressed && styles.pressed]}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
    >
      {/*
        Pass color only — root fill would paint the <rect> interior solid.
        Back.svg uses currentColor for frame stroke and arrow fill.
      */}
      <BackIcon width={size} height={size} color={strokeColor} />
    </Pressable>
  );
};

export default BackButton;
