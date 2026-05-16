import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../types';

export type DayProps = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isSelected: boolean;
  cellSize: number;
  theme: Theme;
  onPress: (date: Date) => void;
};

function DayCellInner(props: DayProps) {
  const {
    date,
    inMonth,
    isToday,
    isDisabled,
    isStart,
    isEnd,
    isInRange,
    isSelected,
    cellSize,
    theme,
    onPress,
  } = props;

  const handlePress = React.useCallback(() => {
    if (!isDisabled && inMonth) onPress(date);
  }, [date, isDisabled, inMonth, onPress]);

  const showRangeBar = isInRange || isStart || isEnd;
  const isEndpoint = isStart || isEnd;

  const textColor = isDisabled
    ? theme.disabled
    : !inMonth
      ? theme.mutedText
      : isEndpoint || isSelected
        ? theme.onPrimary
        : theme.text;

  const circleSize = Math.floor(cellSize * 0.78);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled || !inMonth}
      style={[styles.cell, { width: cellSize, height: cellSize }]}
      hitSlop={0}
    >
      {showRangeBar && (
        <View
          style={[
            styles.rangeBar,
            { backgroundColor: theme.rangeFill },
            isStart && !isEnd ? { left: cellSize / 2 } : null,
            isEnd && !isStart ? { right: cellSize / 2 } : null,
          ]}
        />
      )}

      {(isEndpoint || isSelected) && (
        <View
          style={[
            styles.endpoint,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: theme.primary,
            },
          ]}
        />
      )}

      {isToday && !isEndpoint && !isSelected && (
        <View
          style={[
            styles.todayRing,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderColor: theme.todayBorder,
            },
          ]}
        />
      )}

      <Text style={[styles.text, { color: textColor }]} allowFontScaling={false}>
        {date.getDate()}
      </Text>
    </Pressable>
  );
}

function areEqual(prev: DayProps, next: DayProps): boolean {
  return (
    prev.date.getTime() === next.date.getTime() &&
    prev.inMonth === next.inMonth &&
    prev.isToday === next.isToday &&
    prev.isDisabled === next.isDisabled &&
    prev.isStart === next.isStart &&
    prev.isEnd === next.isEnd &&
    prev.isInRange === next.isInRange &&
    prev.isSelected === next.isSelected &&
    prev.cellSize === next.cellSize &&
    prev.theme === next.theme &&
    prev.onPress === next.onPress
  );
}

export const Day = React.memo(DayCellInner, areEqual);

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBar: {
    position: 'absolute',
    top: '15%',
    bottom: '15%',
    left: 0,
    right: 0,
  },
  endpoint: {
    position: 'absolute',
  },
  todayRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
});
