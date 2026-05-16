import React from 'react';
import { SectionList, type SectionListData, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Theme } from '../types';
import { Month } from './Month';
import { WeekdayHeader } from './WeekdayHeader';
import { HEADER_HEIGHT, ROW_COUNT } from './constants';
import { addMonths, monthsBetween, startOfMonth } from './dateUtils';
import { useDragGesture } from './useDragGesture';
import type { DayState } from './useSelection';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList as unknown as React.ComponentType<React.ComponentProps<typeof SectionList<null, Section>>>
);

type Section = { key: string; monthDate: Date; data: [null] };

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
  getDayState: (date: Date) => DayState;
  isDisabled: (date: Date) => boolean;
  onDayPress: (date: Date) => void;
  onDragBegin: (date: Date) => void;
  onDragMove: (date: Date) => void;
  onDragEnd: () => void;
  initialMonth: Date;
};

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
    getDayState,
    isDisabled,
    onDayPress,
    onDragBegin,
    onDragMove,
    onDragEnd,
    initialMonth,
  } = props;

  const listRef = React.useRef<SectionList<null, Section>>(null);
  const scrollY = useSharedValue(0);

  const sections: Section[] = React.useMemo(() => {
    const total = monthsBetween(startOfMonth(rangeStart), startOfMonth(rangeEnd)) + 1;
    const out: Section[] = [];
    const start = startOfMonth(rangeStart);
    for (let i = 0; i < total; i++) {
      const m = addMonths(start, i);
      out.push({ key: `${m.getFullYear()}-${m.getMonth()}`, monthDate: m, data: [null] });
    }
    return out;
  }, [rangeStart, rangeEnd]);

  const rangeStartMonthBase = React.useMemo(() => startOfMonth(rangeStart), [rangeStart]);

  const initialIndex = React.useMemo(
    () => Math.max(0, monthsBetween(rangeStartMonthBase, startOfMonth(initialMonth))),
    [rangeStartMonthBase, initialMonth]
  );

  React.useImperativeHandle(ref, () => ({
    scrollToMonth(monthDate, animated = true) {
      const idx = Math.max(0, monthsBetween(rangeStartMonthBase, startOfMonth(monthDate)));
      const clamped = Math.min(idx, sections.length - 1);
      listRef.current?.scrollToLocation({
        sectionIndex: clamped,
        itemIndex: 0,
        animated,
        viewOffset: 0,
        viewPosition: 0,
      });
    },
  }), [rangeStartMonthBase, sections.length]);

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
    sectionsLength: sections.length,
    onBegin: handleBeginTs,
    onMove: handleMoveTs,
    onEnd: onDragEnd,
  });

  const renderSectionHeader = React.useCallback(
    ({ section }: { section: SectionListData<null, Section> }) => (
      <View
        style={[
          styles.header,
          { height: HEADER_HEIGHT, backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.headerText, { color: theme.headerText }]} allowFontScaling={false}>
          {monthHeaderLabel(section.monthDate, locale)}
        </Text>
      </View>
    ),
    [theme, locale]
  );

  const renderItem = React.useCallback(
    ({ section }: { section: SectionListData<null, Section> }) => (
      <Month
        monthDate={section.monthDate}
        today={today}
        cellSize={cellSize}
        firstDayOfWeek={firstDayOfWeek}
        theme={theme}
        getDayState={getDayState}
        isDisabled={isDisabled}
        onDayPress={onDayPress}
      />
    ),
    [today, cellSize, firstDayOfWeek, theme, getDayState, isDisabled, onDayPress]
  );

  const keyExtractor = React.useCallback(
    (_item: null, index: number) => `item-${index}`,
    []
  );

  const getItemLayout = React.useCallback(
    (_data: unknown, index: number) => {
      const sectionHeight = HEADER_HEIGHT + ROW_COUNT * cellSize;
      return { length: sectionHeight, offset: index * sectionHeight, index };
    },
    [cellSize]
  );

  return (
    <View style={{ width: containerWidth }}>
      <WeekdayHeader
        firstDayOfWeek={firstDayOfWeek}
        locale={locale}
        theme={theme}
        cellWidth={cellSize}
      />
      <GestureDetector gesture={dragGesture}>
        <View style={styles.listWrap}>
          <AnimatedSectionList
            ref={listRef as any}
            sections={sections}
            keyExtractor={keyExtractor as any}
            renderItem={renderItem as any}
            renderSectionHeader={renderSectionHeader as any}
            stickySectionHeadersEnabled
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews
            onScroll={onScroll}
            scrollEventThrottle={16}
            initialScrollIndex={initialIndex > 0 ? 0 : undefined}
            getItemLayout={getItemLayout as any}
            onScrollToIndexFailed={() => {}}
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
