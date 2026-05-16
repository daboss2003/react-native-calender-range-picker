import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../types';

const FALLBACK_NARROW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekdayLabels(locale: string): string[] {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i))
    );
  } catch {
    return FALLBACK_NARROW;
  }
}

type Props = {
  firstDayOfWeek: number;
  locale: string;
  theme: Theme;
  cellWidth: number;
};

function WeekdayHeaderInner({ firstDayOfWeek, locale, theme, cellWidth }: Props) {
  const labels = React.useMemo(() => getWeekdayLabels(locale), [locale]);
  const ordered = React.useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 7; i++) out.push(labels[(firstDayOfWeek + i) % 7] ?? '');
    return out;
  }, [labels, firstDayOfWeek]);

  return (
    <View style={[styles.row, { backgroundColor: theme.background }]}>
      {ordered.map((label, i) => (
        <View key={i} style={[styles.cell, { width: cellWidth }]}>
          <Text style={[styles.text, { color: theme.weekdayText }]} allowFontScaling={false}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const WeekdayHeader = React.memo(WeekdayHeaderInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
