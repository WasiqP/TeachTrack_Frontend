import { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { useThemeMode } from '../theme';

export function useClassDetailsAttendanceReportStyles() {
  const { ink, theme } = useThemeMode();
  const styles = useMemo(
    () =>
      StyleSheet.create({
  wrap: {
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ink.borderInk,
    backgroundColor: ink.canvas,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    color: ink.ink,
    marginBottom: 6,
  },
  lead: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 14,
  },
  fieldLab: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: '#64748B',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipOn: {
    borderColor: ink.borderInk,
    backgroundColor: '#F8F5FF',
  },
  chipTxt: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#475569',
  },
  chipTxtOn: {
    color: ink.ink,
    fontFamily: 'DMSans-SemiBold',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dateBtnFull: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 0,
    backgroundColor: '#FAFAFA',
  },
  dateBtnFullSpaced: {
    marginBottom: 8,
  },
  periodBlock: {
    marginBottom: 8,
  },
  periodBlockTitle: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  periodHint: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: '#94A3B8',
    lineHeight: 17,
    marginTop: 8,
  },
  dateBtnLab: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: '#94A3B8',
    marginBottom: 4,
  },
  dateBtnVal: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: '#0F172A',
  },
  search: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    fontFamily: 'DMSans-Regular',
    color: '#0F172A',
    marginBottom: 8,
  },
  pickList: {
    gap: 6,
    marginBottom: 12,
  },
  pickRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: ink.canvas,
  },
  pickRowOn: {
    borderColor: theme.primary,
    backgroundColor: '#F8F5FF',
  },
  pickName: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: '#0F172A',
  },
  pickEmail: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: '#64748B',
    marginTop: 2,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
    borderWidth: 1,
    borderColor: ink.borderInk,
  },
  downloadRowDisabled: {
    opacity: 0.65,
  },
  downloadTxt: {
    paddingRight: 25,
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: theme.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: ink.canvas,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'DMSans-SemiBold',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnGhostTxt: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: '#64748B',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.primary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ink.borderInk,
  },
  modalBtnTxt: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: theme.white,
  },
  monthSheet: {
    backgroundColor: ink.canvas,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
    maxHeight: '78%',
  },
  monthSheetSub: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: -4,
  },
  monthScroll: {
    maxHeight: 340,
  },
  monthRow: {
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    marginBottom: 0,
  },
  monthRowOn: {
    borderColor: theme.primary,
    backgroundColor: '#F8F5FF',
  },
  monthRowTxt: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: '#0F172A',
    textAlign: 'center',
  },
  monthRowTxtOn: {
    color: ink.ink,
  },
  monthDismiss: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },

      }),
    [ink, theme],
  );
  return { styles, ink, theme };
}
