import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { fonts as F, radius, useThemeMode } from '../theme';
import type { PulseAlertButton, PulseAlertVariant } from '../types/pulseAlert';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  variant: PulseAlertVariant;
  buttons: PulseAlertButton[];
  onButtonPress: (btn: PulseAlertButton) => void;
};

const IconSuccess = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="rgba(13, 148, 136, 0.15)" />
    <Path
      d="M8 12.5l2.5 2.5L16 9"
      stroke="#0D9488"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconError = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="rgba(220, 38, 38, 0.12)" />
    <Path
      d="M15 9l-6 6M9 9l6 6"
      stroke="#DC2626"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconWarning = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="rgba(217, 119, 6, 0.15)" stroke="#D97706" strokeWidth="1.5" />
    <Path d="M12 8v5M12 16h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

function IconInfo({ primary, primarySoft }: { primary: string; primarySoft: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={primarySoft} stroke={primary} strokeWidth="1.5" />
      <Path d="M12 16v-5M12 8h.01" stroke={primary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VariantIcon({
  variant,
  primary,
  primarySoft,
}: {
  variant: PulseAlertVariant;
  primary: string;
  primarySoft: string;
}) {
  switch (variant) {
    case 'success':
      return <IconSuccess />;
    case 'error':
      return <IconError />;
    case 'warning':
      return <IconWarning />;
    default:
      return <IconInfo primary={primary} primarySoft={primarySoft} />;
  }
}

/**
 * Centered alert-style modal (replaces system Alert.alert) with TeachTrack styling.
 */
export default function PulseAlertModal({
  visible,
  title,
  message,
  variant,
  buttons,
  onButtonPress,
}: Props) {
  const { width } = useWindowDimensions();
  const { ink, theme } = useThemeMode();
  const cardW = Math.min(340, width - 48);

  const BW = ink.borderWidth;
  const BORDER = ink.borderInk;
  const INK = ink.ink;
  const INK_SOFT = ink.inkSoft;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        },
        card: {
          backgroundColor: ink.canvas,
          borderRadius: radius.card + 4,
          borderWidth: BW,
          borderColor: BORDER,
          paddingTop: 22,
          paddingHorizontal: 20,
          paddingBottom: 18,
          maxHeight: '80%',
        },
        iconWrap: {
          alignItems: 'center',
          marginBottom: 14,
        },
        title: {
          fontSize: 22,
          lineHeight: 28,
          fontFamily: F.outfitBold,
          color: INK,
          textAlign: 'center',
          letterSpacing: -0.4,
          marginBottom: 8,
        },
        messageScroll: {
          maxHeight: 220,
          marginBottom: 18,
        },
        messageScrollContent: {
          paddingBottom: 4,
        },
        message: {
          fontSize: 15,
          lineHeight: 22,
          fontFamily: F.dmRegular,
          color: INK_SOFT,
          textAlign: 'center',
        },
        btnColumn: {
          gap: 10,
        },
        btnRow: {
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
        },
        btnFlex: {
          flex: 1,
          minHeight: 48,
          borderRadius: radius.btn,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
        },
        btnSingle: {
          flex: 1,
          alignSelf: 'stretch',
        },
        btnStacked: {
          minHeight: 48,
          borderRadius: radius.btn,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        },
        btnPrimary: {
          backgroundColor: theme.primary,
        },
        btnCancel: {
          backgroundColor: ink.canvas,
          borderWidth: BW,
          borderColor: BORDER,
        },
        btnDestructive: {
          backgroundColor: ink.canvas,
          borderWidth: BW,
          borderColor: '#DC2626',
        },
        btnPressed: {
          opacity: 0.88,
        },
        btnText: {
          fontSize: 16,
          fontFamily: F.dmSemi,
        },
        btnTextPrimary: {
          color: theme.white,
        },
        btnTextCancel: {
          color: INK,
        },
        btnTextDestructive: {
          color: '#DC2626',
        },
      }),
    [ink, theme, BW, BORDER, INK, INK_SOFT],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: cardW }]}>
          <View style={styles.iconWrap}>
            <VariantIcon variant={variant} primary={theme.primary} primarySoft={theme.primarySoft} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              showsVerticalScrollIndicator={message.length > 200}
            >
              <Text style={styles.message}>{message}</Text>
            </ScrollView>
          ) : null}

          <View style={styles.btnColumn}>
            {buttons.length <= 2 ? (
              <View style={styles.btnRow}>
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  return (
                    <Pressable
                      key={`${btn.text}-${index}`}
                      style={({ pressed }) => [
                        styles.btnFlex,
                        buttons.length === 1 && styles.btnSingle,
                        !isCancel && !isDestructive && styles.btnPrimary,
                        isCancel && styles.btnCancel,
                        isDestructive && styles.btnDestructive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => onButtonPress(btn)}
                      android_ripple={
                        isCancel
                          ? { color: 'rgba(0,0,0,0.06)' }
                          : { color: 'rgba(255,255,255,0.2)' }
                      }
                    >
                      <Text
                        style={[
                          styles.btnText,
                          !isCancel && !isDestructive && styles.btnTextPrimary,
                          isCancel && styles.btnTextCancel,
                          isDestructive && styles.btnTextDestructive,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <Pressable
                    key={`${btn.text}-${index}`}
                    style={({ pressed }) => [
                      styles.btnStacked,
                      !isCancel && !isDestructive && styles.btnPrimary,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => onButtonPress(btn)}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        !isCancel && !isDestructive && styles.btnTextPrimary,
                        isCancel && styles.btnTextCancel,
                        isDestructive && styles.btnTextDestructive,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
