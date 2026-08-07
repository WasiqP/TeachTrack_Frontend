import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { fonts as F, radius, useThemeMode } from '../../theme';

type Props = {
  label?: string;
  value: string;
  /** Shown on the closed field when different from `value` (e.g. "+92" vs full option label). */
  displayValue?: string;
  placeholder?: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Allow choosing a value not in the list via search field + Use this. */
  allowCustom?: boolean;
  disabled?: boolean;
};

/**
 * Tap-to-open searchable list (country-code style dropdown).
 */
export function SearchableSelect({
  label,
  value,
  displayValue,
  placeholder = 'Select…',
  options,
  onSelect,
  allowCustom = false,
  disabled = false,
}: Props) {
  const { ink, theme } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: ink.canvas,
          opacity: disabled ? 0.5 : 1,
        },
        triggerText: {
          flex: 1,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: value ? ink.ink : ink.placeholder,
        },
        chev: {
          fontSize: 12,
          color: ink.inkSoft,
          marginLeft: 8,
          fontFamily: F.dmSemi,
        },
        backdrop: {
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        },
        sheet: {
          maxHeight: '78%',
          backgroundColor: ink.canvas,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderBottomWidth: 0,
          paddingTop: 14,
          paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        },
        sheetTitle: {
          fontSize: 17,
          fontFamily: F.outfitBold,
          color: ink.ink,
          paddingHorizontal: 16,
          marginBottom: 10,
        },
        search: {
          marginHorizontal: 16,
          marginBottom: 10,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === 'ios' ? 12 : 10,
          fontSize: 15,
          fontFamily: F.dmRegular,
          color: ink.ink,
        },
        row: {
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.rowDivider,
        },
        rowOn: {
          backgroundColor: theme.primarySoft,
        },
        rowTxt: {
          fontSize: 15,
          fontFamily: F.dmMedium,
          color: ink.ink,
        },
        empty: {
          padding: 24,
          textAlign: 'center',
          color: ink.inkSoft,
          fontFamily: F.dmRegular,
        },
        customBtn: {
          marginHorizontal: 16,
          marginTop: 8,
          paddingVertical: 12,
          borderRadius: radius.btn,
          borderWidth: ink.borderWidth,
          borderColor: ink.borderInk,
          alignItems: 'center',
          backgroundColor: theme.primarySoft,
        },
        customBtnTxt: {
          fontFamily: F.outfitBold,
          color: theme.primary,
          fontSize: 14,
        },
        close: {
          marginTop: 10,
          alignSelf: 'center',
          padding: 10,
        },
        closeTxt: {
          fontFamily: F.dmSemi,
          color: ink.inkSoft,
        },
      }),
    [ink, theme, value, disabled],
  );

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (v: string) => {
    onSelect(v);
    close();
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {(displayValue || value) || placeholder}
        </Text>
        <Text style={styles.chev}>▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor={ink.placeholder}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => `${item}-${i}`}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {allowCustom && query.trim()
                    ? 'No matches — use your typed value below.'
                    : 'No matches.'}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, item === value && styles.rowOn]}
                  onPress={() => pick(item)}
                >
                  <Text style={styles.rowTxt}>{item}</Text>
                </Pressable>
              )}
            />
            {allowCustom && query.trim() && !options.includes(query.trim()) ? (
              <Pressable style={styles.customBtn} onPress={() => pick(query.trim())}>
                <Text style={styles.customBtnTxt}>Use “{query.trim()}”</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.close} onPress={close}>
              <Text style={styles.closeTxt}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
