/**
 * Weekly class reminder stored on {@link ClassData} and used by Notifee triggers.
 * Weekdays follow ISO: 1 = Monday … 7 = Sunday.
 */
export type ClassReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  weekdays: number[];
};

export const DEFAULT_CLASS_REMINDER: ClassReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
  weekdays: [1, 2, 3, 4, 5],
};
