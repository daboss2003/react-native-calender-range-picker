import React from 'react';
import { FlatList, type ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Theme } from '../types';
import { Month } from './Month';
import { WeekdayHeader } from './WeekdayHeader';
import { HEADER_HEIGHT, ROW_COUNT } from './constants';
import { addMonths, monthsBetween, startOfMonth } from './dateUtils';
import { useDragGesture } from './useDragGesture';
import type { DayState } from './useSelection';

// Each calendar month is split into two list rows:
//   even index = "header" (the "May 1976" pill)
//   odd  index = "grid"   (the 6×7 day grid for that month)
// This makes virtualisation, sticky headers, and getItemLayout cheap and exact.
type Row =
  | { kind: 'header'; monthDate: Date; key: string }
  | { kind: 'grid'; monthDate: Date; key: string };

// Reanimated's `createAnimatedComponent` doesn't preserve the original
// component's ref/prop types through generics; cast to a permissive shape so
// we can pass `ref` and FlatList props without per-call `as any` noise.
const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList as unknown as React.ComponentType<React.ComponentProps<typeof FlatList<Row>>>
) as unknown as React.ComponentType<
  React.ComponentProps<typeof FlatList<Row>> & { ref?: React.Ref<FlatList<Row>> }
>;

export type MonthListHandle = {
  scrollToMonth: (monthDate: Date, animated?: boolean) => void;
};

type Props = {
  rangeStart: Date;
  rangeEnd: Date;
  today: Date;
  cellSize: number;
  containerWidth: number;
  firstDayOfWeek: number;
  locale: string;
  theme: Theme;
  dragEnabled: boolean;
  /** When true, more months are appended as the user scrolls near the end. */
  autoExtendForward: boolean;
  getDayState: (date: Date) => DayState;
  isDisabled: (date: Date) => boolean;
  onDayPress: (date: Date) => void;
  onDragBegin: (date: Date) => void;
  onDragMove: (date: Date) => void;
  onDragEnd: () => void;
  initialMonth: Date;
};

const FORWARD_GROW_CHUNK_MONTHS = 60; // grow by 5-year batches when near the end

function monthHeaderLabel(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  } catch {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

export const MonthList = React.forwardRef<MonthListHandle, Props>(function MonthListImpl(
  props,
  ref
) {
  const {
    rangeStart,
    rangeEnd,
    today,
    cellSize,
    containerWidth,
    firstDayOfWeek,
    locale,
    theme,
    dragEnabled,
    autoExtendForward,
    getDayState,
    isDisabled,
    onDayPress,
    onDragBegin,
    onDragMove,
    onDragEnd,
    initialMonth,
  } = props;

  const listRef = React.useRef<FlatList<Row>>(null);
  const scrollY = useSharedValue(0);

  const rangeStartMonthBase = React.useMemo(() => startOfMonth(rangeStart), [rangeStart]);

  // Extra months tacked onto the forward window when the user scrolls past
  // the initial end. Only used when `autoExtendForward` is true.
  const [extraMonthsAfter, setExtraMonthsAfter] = React.useState(0);

  // Reset the grown window when the caller-controlled range changes.
  React.useEffect(() => {
    setExtraMonthsAfter(0);
  }, [rangeStart, rangeEnd]);

  const effectiveRangeEnd = React.useMemo(
    () => (autoExtendForward && extraMonthsAfter > 0 ? addMonths(rangeEnd, extraMonthsAfter) : rangeEnd),
    [autoExtendForward, extraMonthsAfter, rangeEnd]
  );

  const rows: Row[] = React.useMemo(() => {
    const totalMonths = monthsBetween(rangeStartMonthBase, startOfMonth(effectiveRangeEnd)) + 1;
    const out: Row[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const m = addMonths(rangeStartMonthBase, i);
      const key = `${m.getFullYear()}-${m.getMonth()}`;
      out.push({ kind: 'header', monthDate: m, key: `h-${key}` });
      out.push({ kind: 'grid', monthDate: m, key: `g-${key}` });
    }
    return out;
  }, [rangeStartMonthBase, effectiveRangeEnd]);

  const handleEndReached = React.useCallback(() => {
    if (!autoExtendForward) return;
    setExtraMonthsAfter((prev) => prev + FORWARD_GROW_CHUNK_MONTHS);
  }, [autoExtendForward]);

  const sectionCount = rows.length / 2;

  const gridHeight = ROW_COUNT * cellSize;
  const sectionHeight = HEADER_HEIGHT + gridHeight;

  // Header rows live at even flat indices.
  const stickyHeaderIndices = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < sectionCount; i++) arr.push(i * 2);
    return arr;
  }, [sectionCount]);

  const initialMonthIndex = React.useMemo(() => {
    const idx = monthsBetween(rangeStartMonthBase, startOfMonth(initialMonth));
    return Math.min(Math.max(0, idx), Math.max(0, sectionCount - 1));
  }, [rangeStartMonthBase, initialMonth, sectionCount]);

  // Flat-list index of the header row for that month.
  const initialFlatIndex = initialMonthIndex * 2;

  React.useImperativeHandle(ref, () => ({
    scrollToMonth(monthDate, animated = true) {
      const idx = Math.max(
        0,
        Math.min(sectionCount - 1, monthsBetween(rangeStartMonthBase, startOfMonth(monthDate)))
      );
      listRef.current?.scrollToIndex({
        index: idx * 2,
        animated,
        viewPosition: 0,
      });
    },
  }), [rangeStartMonthBase, sectionCount]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      'worklet';
      scrollY.value = e.contentOffset.y;
    },
  });

  const handleBeginTs = React.useCallback(
    (ts: number) => onDragBegin(new Date(ts)),
    [onDragBegin]
  );
  const handleMoveTs = React.useCallback(
    (ts: number) => onDragMove(new Date(ts)),
    [onDragMove]
  );

  const dragGesture = useDragGesture({
    enabled: dragEnabled,
    scrollY,
    cellSize,
    firstDayOfWeek,
    rangeStartYear: rangeStartMonthBase.getFullYear(),
    rangeStartMonth: rangeStartMonthBase.getMonth(),
    sectionsLength: sectionCount,
    onBegin: handleBeginTs,
    onMove: handleMoveTs,
    onEnd: onDragEnd,
  });

  const renderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<Row>) => {
      if (item.kind === 'header') {
        return (
          <View
            style={[
              styles.header,
              { height: HEADER_HEIGHT, backgroundColor: theme.background },
            ]}
          >
            <Text style={[styles.headerText, { color: theme.headerText }]} allowFontScaling={false}>
              {monthHeaderLabel(item.monthDate, locale)}
            </Text>
          </View>
        );
      }
      return (
        <Month
          monthDate={item.monthDate}
          today={today}
          cellSize={cellSize}
          firstDayOfWeek={firstDayOfWeek}
          theme={theme}
          getDayState={getDayState}
          isDisabled={isDisabled}
          onDayPress={onDayPress}
        />
      );
    },
    [theme, locale, today, cellSize, firstDayOfWeek, getDayState, isDisabled, onDayPress]
  );

  const keyExtractor = React.useCallback((row: Row) => row.key, []);

  const getItemLayout = React.useCallback(
    (_data: ArrayLike<Row> | null | undefined, flatIndex: number) => {
      const sectionIdx = Math.floor(flatIndex / 2);
      const isHeader = flatIndex % 2 === 0;
      const offset = sectionIdx * sectionHeight + (isHeader ? 0 : HEADER_HEIGHT);
      const length = isHeader ? HEADER_HEIGHT : gridHeight;
      return { length, offset, index: flatIndex };
    },
    [sectionHeight, gridHeight]
  );

  return (
    <View style={{ width: containerWidth, flex: 1 }}>
      <WeekdayHeader
        firstDayOfWeek={firstDayOfWeek}
        locale={locale}
        theme={theme}
        cellWidth={cellSize}
      />
      <GestureDetector gesture={dragGesture}>
        <View style={styles.listWrap}>
          <AnimatedFlatList
            ref={listRef}
            data={rows}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            stickyHeaderIndices={stickyHeaderIndices}
            getItemLayout={getItemLayout}
            initialScrollIndex={initialFlatIndex > 0 ? initialFlatIndex : undefined}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={11}
            removeClippedSubviews={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={1.5}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.index * (sectionHeight / 2),
                animated: false,
              });
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0,
                });
              }, 100);
            }}
          />
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
