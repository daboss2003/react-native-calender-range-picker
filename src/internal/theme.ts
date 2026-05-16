import type { Theme } from '../types';

export const defaultTheme: Theme = {
  primary: '#1F6FEB',
  onPrimary: '#FFFFFF',
  rangeFill: '#E6F0FE',
  text: '#1A1A1A',
  mutedText: '#B0B0B0',
  disabled: '#D9D9D9',
  background: 'transparent',
  headerText: '#1A1A1A',
  weekdayText: '#8A8A8A',
  todayBorder: '#1F6FEB',
};

export function mergeTheme(override?: Partial<Theme>): Theme {
  if (!override) return defaultTheme;
  return { ...defaultTheme, ...override };
}
