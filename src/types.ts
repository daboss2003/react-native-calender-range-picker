import type { ViewStyle } from 'react-native';

export type Mode = 'single' | 'range';

export interface DateRange {
  start: Date;
  end: Date;
}

export type DisabledDates = ReadonlyArray<Date> | ((date: Date) => boolean);

export interface Theme {
  primary: string;
  onPrimary: string;
  rangeFill: string;
  text: string;
  mutedText: string;
  disabled: string;
  background: string;
  headerText: string;
  weekdayText: string;
  todayBorder: string;
}

export type ChangeValue<M extends Mode> = M extends 'single' ? Date : DateRange;

export interface CalendarRangePickerProps {
  mode?: Mode;

  initialDate?: Date;
  initialRange?: DateRange;

  minDate?: Date;
  maxDate?: Date;
  disabledDates?: DisabledDates;

  onChange?: (value: Date | DateRange) => void;

  theme?: Partial<Theme>;
  locale?: string;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  monthsBefore?: number;
  monthsAfter?: number;

  style?: ViewStyle;
}

export interface CalendarRangePickerRef {
  scrollToDate: (date: Date, animated?: boolean) => void;
  scrollToToday: (animated?: boolean) => void;
  reset: () => void;
}
