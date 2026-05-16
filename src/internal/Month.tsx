import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '../types';
import { Day } from './Day';
import type { DayState } from './useSelection';
import { addDays, isSameDay, isSameMonth, startOfMonth, weekdayOfFirst } from './dateUtils';
import { COL_COUNT, ROW_COUNT } from './constants';

export { COL_COUNT, ROW_COUNT };

type Props = {
  monthDate: Date;
  today: Date;
  cellSize: number;
  firstDayOfWeek: number;
  theme: Theme;
  getDayState: (date: Date) => DayState;
  isDisabled: (date: Date) => boolean;
  onDayPress: (date: Date) => void;
};

function MonthInner(props: Props) {
  const {
    monthDate,
    today,
    cellSize,
    firstDayOfWeek,
    theme,
    getDayState,
    isDisabled,
    onDayPress,
  } = props;

  const cells = React.useMemo(() => {
    const first = startOfMonth(monthDate);
    const lead = weekdayOfFirst(first, firstDayOfWeek);
    const out: Date[] = [];
    const gridStart = addDays(first, -lead);
    for (let i = 0; i < ROW_COUNT * COL_COUNT; i++) {
      out.push(addDays(gridStart, i));
    }
    return out;
  }, [monthDate, firstDayOfWeek]);

  return (
    <View style={[styles.grid, { backgroundColor: theme.background }]}>
      {cells.map((date) => {
        const inMonth = isSameMonth(date, monthDate);
        const dayState = inMonth
          ? getDayState(date)
          : { isStart: false, isEnd: false, isInRange: false, isSelected: false };
        const disabled = inMonth ? isDisabled(date) : true;

        return (
          <Day
            key={date.getTime()}
            date={date}
            inMonth={inMonth}
            isToday={isSameDay(date, today)}
            isDisabled={disabled}
            isStart={dayState.isStart}
            isEnd={dayState.isEnd}
            isInRange={dayState.isInRange}
            isSelected={dayState.isSelected}
            cellSize={cellSize}
            theme={theme}
            onPress={onDayPress}
          />
        );
      })}
    </View>
  );
}

export const Month = React.memo(MonthInner);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
