import React from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { MonthList, type MonthListHandle } from './internal/MonthList';
import { addMonths, startOfDay } from './internal/dateUtils';
import { mergeTheme } from './internal/theme';
import { useSelection } from './internal/useSelection';
import type { CalendarRangePickerProps, CalendarRangePickerRef } from './types';

// Default to 50 years back and 50 years forward. If `maxDate` is omitted,
// MonthList also auto-extends the forward window when the user scrolls near
// the bottom, so the future feels effectively unbounded in practice.
const DEFAULT_MONTHS_BEFORE = 600;
const DEFAULT_MONTHS_AFTER = 600;

export const CalendarRangePicker = React.forwardRef<
  CalendarRangePickerRef,
  CalendarRangePickerProps
>(function CalendarRangePicker(props, ref) {
  const {
    mode = 'range',
    initialDate,
    initialRange,
    minDate,
    maxDate,
    disabledDates,
    onChange,
    theme: themeOverride,
    locale = 'en',
    firstDayOfWeek = 0,
    monthsBefore = DEFAULT_MONTHS_BEFORE,
    monthsAfter = DEFAULT_MONTHS_AFTER,
    style,
  } = props;

  const theme = React.useMemo(() => mergeTheme(themeOverride), [themeOverride]);
  const today = React.useMemo(() => startOfDay(new Date()), []);

  const rangeStart = React.useMemo(
    () => minDate ?? addMonths(today, -monthsBefore),
    [minDate, today, monthsBefore]
  );
  const rangeEnd = React.useMemo(
    () => maxDate ?? addMonths(today, monthsAfter),
    [maxDate, today, monthsAfter]
  );

  const initialMonth = React.useMemo(() => {
    if (initialDate) return initialDate;
    if (initialRange?.start) return initialRange.start;
    return today;
  }, [initialDate, initialRange, today]);

  const selection = useSelection({
    mode,
    initialDate,
    initialRange,
    minDate,
    maxDate,
    disabledDates,
    onChange,
  });

  const [containerWidth, setContainerWidth] = React.useState(0);
  const handleLayout = React.useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== containerWidth) setContainerWidth(w);
  }, [containerWidth]);

  const cellSize = containerWidth > 0 ? Math.floor(containerWidth / 7) : 0;

  const listRef = React.useRef<MonthListHandle>(null);

  React.useImperativeHandle(ref, () => ({
    scrollToDate: (date: Date, animated = true) => {
      listRef.current?.scrollToMonth(date, animated);
    },
    scrollToToday: (animated = true) => {
      listRef.current?.scrollToMonth(today, animated);
    },
    reset: () => {
      selection.reset();
    },
  }), [selection, today]);

  return (
    <View
      style={[styles.root, { backgroundColor: theme.background }, style]}
      onLayout={handleLayout}
    >
      {cellSize > 0 && (
        <MonthList
          ref={listRef}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          today={today}
          cellSize={cellSize}
          containerWidth={cellSize * 7}
          firstDayOfWeek={firstDayOfWeek}
          locale={locale}
          theme={theme}
          dragEnabled={mode === 'range'}
          autoExtendForward={!maxDate}
          getDayState={selection.dayStateFor}
          isDisabled={selection.isDisabled}
          onDayPress={selection.handleTap}
          onDragBegin={selection.beginDrag}
          onDragMove={selection.updateDrag}
          onDragEnd={selection.endDrag}
          initialMonth={initialMonth}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
});
