import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PulseAlertModal from '../components/PulseAlertModal';
import type { PulseAlertOptions, PulseAlertButton, PulseAlertVariant } from '../types/pulseAlert';

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  variant: PulseAlertVariant;
  buttons: PulseAlertButton[];
};

const defaultState: AlertState = {
  visible: false,
  title: '',
  variant: 'info',
  buttons: [{ text: 'OK', style: 'default' }],
};

type AlertModalContextValue = {
  /** Show a custom modal (replaces `Alert.alert`). */
  showAlert: (options: PulseAlertOptions) => void;
  showSuccess: (title: string, message?: string, onOk?: () => void) => void;
  showError: (title: string, message?: string, onOk?: () => void) => void;
  showWarning: (title: string, message?: string, buttons?: PulseAlertButton[]) => void;
};

const AlertModalContext = createContext<AlertModalContextValue | undefined>(undefined);

export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>(defaultState);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const showAlert = useCallback((options: PulseAlertOptions) => {
    const buttons: PulseAlertButton[] =
      options.buttons && options.buttons.length > 0
        ? options.buttons
        : [{ text: 'OK', style: 'default' as const }];

    setState({
      visible: true,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      buttons,
    });
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        variant: 'success',
        buttons: [{ text: 'OK', style: 'default', onPress: onOk }],
      });
    },
    [showAlert],
  );

  const showError = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        variant: 'error',
        buttons: [{ text: 'OK', style: 'default', onPress: onOk }],
      });
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (title: string, message?: string, buttons?: PulseAlertButton[]) => {
      showAlert({
        title,
        message,
        variant: 'warning',
        buttons,
      });
    },
    [showAlert],
  );

  const handleButtonPress = useCallback(
    (btn: PulseAlertButton) => {
      hide();
      // Defer so the modal unmounts before navigation / state updates (matches native alert feel)
      Promise.resolve().then(() => {
        btn.onPress?.();
      });
    },
    [hide],
  );

  const value = useMemo(
    () => ({ showAlert, showSuccess, showError, showWarning }),
    [showAlert, showSuccess, showError, showWarning],
  );

  return (
    <AlertModalContext.Provider value={value}>
      {children}
      <PulseAlertModal
        visible={state.visible}
        title={state.title}
        message={state.message}
        variant={state.variant}
        buttons={state.buttons}
        onButtonPress={handleButtonPress}
      />
    </AlertModalContext.Provider>
  );
}

export function usePulseAlert(): AlertModalContextValue {
  const ctx = useContext(AlertModalContext);
  if (!ctx) {
    throw new Error('usePulseAlert must be used within AlertModalProvider');
  }
  return ctx;
}
