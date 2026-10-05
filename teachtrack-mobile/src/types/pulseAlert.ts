export type PulseAlertVariant = 'success' | 'error' | 'warning' | 'info';

export type PulseAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type PulseAlertButton = {
  text: string;
  onPress?: () => void;
  style?: PulseAlertButtonStyle;
};

export type PulseAlertOptions = {
  title: string;
  message?: string;
  /** Visual tone — default `info` */
  variant?: PulseAlertVariant;
  /** Defaults to a single “OK” button */
  buttons?: PulseAlertButton[];
};
