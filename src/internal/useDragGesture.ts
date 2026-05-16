import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { COL_COUNT, HEADER_HEIGHT, LONG_PRESS_MS, ROW_COUNT } from './constants';

export type DragParams = {
  enabled: boolean;
  scrollY: SharedValue<number>;
  cellSize: number;
  firstDayOfWeek: number;
  rangeStartYear: number;
  rangeStartMonth: number;
  sectionsLength: number;
  onBegin: (timestamp: number) => void;
  onMove: (timestamp: number) => void;
  onEnd: () => void;
};

export function useDragGesture(p: DragParams) {
  const lastTs = useSharedValue(0);

  return useMemo(() => {
    const cellSize = p.cellSize;
    const firstDayOfWeek = p.firstDayOfWeek;
    const sectionsLength = p.sectionsLength;
    const rangeStartYear = p.rangeStartYear;
    const rangeStartMonth = p.rangeStartMonth;
    const scrollY = p.scrollY;
    const onBegin = p.onBegin;
    const onMove = p.onMove;
    const onEnd = p.onEnd;

    const hitTest = (x: number, y: number): number => {
      'worklet';
      if (cellSize <= 0 || sectionsLength === 0) return -1;
      const sectionHeight = HEADER_HEIGHT + ROW_COUNT * cellSize;
      const contentY = y + scrollY.value;
      if (contentY < 0) return -1;
      const sectionIndex = Math.floor(contentY / sectionHeight);
      if (sectionIndex < 0 || sectionIndex >= sectionsLength) return -1;
      const yInSection = contentY - sectionIndex * sectionHeight;
      if (yInSection < HEADER_HEIGHT) return -1;
      const row = Math.floor((yInSection - HEADER_HEIGHT) / cellSize);
      const col = Math.floor(x / cellSize);
      if (row < 0 || row >= ROW_COUNT || col < 0 || col >= COL_COUNT) return -1;
      const totalMonths = rangeStartMonth + sectionIndex;
      const tYear = rangeStartYear + Math.floor(totalMonths / 12);
      const tMonth = ((totalMonths % 12) + 12) % 12;
      const firstDayWd = new Date(tYear, tMonth, 1).getDay();
      const lead = (firstDayWd - firstDayOfWeek + 7) % 7;
      const dayOfMonth = 1 - lead + row * COL_COUNT + col;
      const target = new Date(tYear, tMonth, dayOfMonth);
      target.setHours(0, 0, 0, 0);
      return target.getTime();
    };

    return Gesture.Pan()
      .enabled(p.enabled)
      .activateAfterLongPress(LONG_PRESS_MS)
      .onStart((e) => {
        'worklet';
        const ts = hitTest(e.x, e.y);
        if (ts < 0) return;
        lastTs.value = ts;
        scheduleOnRN(onBegin, ts);
      })
      .onChange((e) => {
        'worklet';
        const ts = hitTest(e.x, e.y);
        if (ts < 0) return;
        if (ts === lastTs.value) return;
        lastTs.value = ts;
        scheduleOnRN(onMove, ts);
      })
      .onEnd(() => {
        'worklet';
        scheduleOnRN(onEnd);
      })
      .onFinalize(() => {
        'worklet';
        scheduleOnRN(onEnd);
      });
  }, [
    p.enabled,
    p.cellSize,
    p.firstDayOfWeek,
    p.sectionsLength,
    p.rangeStartYear,
    p.rangeStartMonth,
    p.scrollY,
    p.onBegin,
    p.onMove,
    p.onEnd,
    lastTs,
  ]);
}
