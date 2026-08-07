import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { fonts as F, radius, useThemeMode } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Matches teachtrack web `tt-btn`: ink border + hard bottom offset shadow + press sink.
 */
const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const { ink, theme } = useThemeMode();

  const styles = useMemo(() => {
    const pad =
      size === 'sm'
        ? { paddingVertical: 10, paddingHorizontal: 14 }
        : size === 'lg'
          ? { paddingVertical: 16, paddingHorizontal: 24 }
          : { paddingVertical: 14, paddingHorizontal: 18 };
    const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 16;

    const fill =
      variant === 'primary'
        ? theme.primary
        : variant === 'secondary'
          ? ink.canvas
          : 'transparent';
    const labelColor = variant === 'primary' ? theme.white : ink.ink;
    const showChunkyShadow = variant !== 'ghost';

    return StyleSheet.create({
      wrap: {
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        width: fullWidth ? '100%' : undefined,
        marginBottom: showChunkyShadow ? 4 : 0,
        opacity: disabled ? 0.55 : 1,
      },
      shadowPlate: {
        ...StyleSheet.absoluteFillObject,
        top: 4,
        backgroundColor: ink.borderInk,
        borderRadius: radius.btn,
      },
      button: {
        borderWidth: showChunkyShadow ? ink.borderWidth : 0,
        borderColor: ink.borderInk,
        borderRadius: radius.btn,
        backgroundColor: fill,
        alignItems: 'center',
        justifyContent: 'center',
        ...pad,
      },
      text: {
        color: labelColor,
        fontSize,
        lineHeight: fontSize + 4,
        fontFamily: F.outfitBold,
        textAlign: 'center',
      },
    });
  }, [ink, theme, variant, size, fullWidth, disabled]);

  return (
    <View style={[styles.wrap, style]}>
      {variant !== 'ghost' ? <View style={styles.shadowPlate} pointerEvents="none" /> : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        android_ripple={
          variant === 'primary'
            ? { color: theme.rippleLight }
            : { color: 'rgba(0,0,0,0.06)' }
        }
        style={({ pressed }) => [
          styles.button,
          variant !== 'ghost' && {
            transform: [{ translateY: pressed && !disabled ? 3 : 0 }],
          },
          variant === 'ghost' && pressed && !disabled
            ? { backgroundColor: ink.pressTint }
            : null,
        ]}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </Pressable>
    </View>
  );
};

export default Button;
