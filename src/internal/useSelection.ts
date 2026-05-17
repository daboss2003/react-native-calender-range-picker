import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange, DisabledDates, Mode } from '../types';
import {
  compareDay,
  dayKey,
  isAfterDay,
  isBeforeDay,
  isBetweenDayInclusive,
  isSameDay,
  startOfDay,
} from './dateUtils';

export type DayState = {
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isSelected: boolean;
};

type Args = {
  mode: Mode;
  initialDate?: Date;
  initialRange?: DateRange;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: DisabledDates;
  onChange?: (value: Date | DateRange) => void;
};

type InternalState = {
  single: Date | null;
  anchor: Date | null;
  cursor: Date | null;
  rangeComplete: boolean;
};

function normalizeDate(d?: Date): Date | null {
  return d ? startOfDay(d) : null;
}

export function useSelection(args: Args) {
  const { mode, minDate, maxDate, disabledDates, onChange } = args;

  const [state, setState] = useState<InternalState>(() => {
    if (mode === 'single') {
      return {
        single: normalizeDate(args.initialDate),
        anchor: null,
        cursor: null,
        rangeComplete: false,
      };
    }
    const start = normalizeDate(args.initialRange?.start);
    const end = normalizeDate(args.initialRange?.end);
    return {
      single: null,
      anchor: start,
      cursor: end ?? start,
      rangeComplete: !!(start && end),
    };
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isDisabled = useCallback(
    (date: Date): boolean => {
      const d = startOfDay(date);
      if (minDate && isBeforeDay(d, minDate)) return true;
      if (maxDate && isAfterDay(d, maxDate)) return true;
      if (!disabledDates) return false;
      if (typeof disabledDates === 'function') return disabledDates(d);
      return disabledDates.some((x) => isSameDay(x, d));
    },
    [minDate, maxDate, disabledDates]
  );

  const lastEmittedRef = useRef<string>('');

  useEffect(() => {
    const cb = onChangeRef.current;
    if (!cb) return;
    let signature = '';
    let value: Date | DateRange | null = null;
    if (mode === 'single' && state.single) {
      signature = `s:${state.single.getTime()}`;
      value = state.single;
    } else if (mode === 'range' && state.anchor && state.cursor && state.rangeComplete) {
      const a = state.anchor;
      const c = state.cursor;
      const start = isBeforeDay(a, c) ? a : c;
      const end = isBeforeDay(a, c) ? c : a;
      signature = `r:${start.getTime()}-${end.getTime()}`;
      value = { start, end };
    }
    if (signature && signature !== lastEmittedRef.current && value) {
      lastEmittedRef.current = signature;
      cb(value);
    }
  }, [mode, state]);

  const handleTap = useCallback(
    (date: Date) => {
      const d = startOfDay(date);
      if (isDisabled(d)) return;

      setState((prev) => {
        if (mode === 'single') {
          return { ...prev, single: d };
        }
        if (!prev.anchor || prev.rangeComplete) {
          return { single: null, anchor: d, cursor: d, rangeComplete: false };
        }
        return { ...prev, cursor: d, rangeComplete: true };
      });
    },
    [mode, isDisabled]
  );

  const beginDrag = useCallback(
    (date: Date) => {
      const d = startOfDay(date);
      if (isDisabled(d)) return;
      if (mode === 'single') {
        setState((prev) => ({ ...prev, single: d }));
      } else {
        setState({ single: null, anchor: d, cursor: d, rangeComplete: false });
      }
    },
    [mode, isDisabled]
  );

  const updateDrag = useCallback(
    (date: Date) => {
      if (mode !== 'range') return;
      const d = startOfDay(date);
      setState((prev) => {
        if (!prev.anchor) return prev;
        if (prev.cursor && isSameDay(prev.cursor, d)) return prev;
        return { ...prev, cursor: d, rangeComplete: false };
      });
    },
    [mode]
  );

  const endDrag = useCallback(() => {
    if (mode !== 'range') return;
    setState((prev) => {
      if (!prev.anchor || !prev.cursor) return prev;
      if (isSameDay(prev.anchor, prev.cursor)) return prev;
      return { ...prev, rangeComplete: true };
    });
  }, [mode]);

  const reset = useCallback(() => {
    setState({ single: null, anchor: null, cursor: null, rangeComplete: false });
  }, []);

  const dayStateFor = useCallback(
    (date: Date): DayState => {
      const d = startOfDay(date);
      if (mode === 'single') {
        const selected = state.single ? isSameDay(state.single, d) : false;
        return { isStart: false, isEnd: false, isInRange: false, isSelected: selected };
      }
      if (!state.anchor || !state.cursor) {
        return { isStart: false, isEnd: false, isInRange: false, isSelected: false };
      }
      const a = state.anchor;
      const c = state.cursor;
      const start = isBeforeDay(a, c) || isSameDay(a, c) ? a : c;
      const end = isBeforeDay(a, c) || isSameDay(a, c) ? c : a;
      const isStart = isSameDay(d, start);
      const isEnd = isSameDay(d, end);
      const isInRange = !isStart && !isEnd && isBetweenDayInclusive(d, start, end);
      return { isStart, isEnd, isInRange, isSelected: false };
    },
    [mode, state]
  );

  const selection = useMemo(() => {
    if (mode === 'single') return { single: state.single };
    if (!state.anchor || !state.cursor) return { start: null, end: null };
    const a = state.anchor;
    const c = state.cursor;
    const start = compareDay(a, c) <= 0 ? a : c;
    const end = compareDay(a, c) <= 0 ? c : a;
    return { start, end };
  }, [mode, state]);

  return {
    state,
    selection,
    isDisabled,
    handleTap,
    beginDrag,
    updateDrag,
    endDrag,
    reset,
    dayStateFor,
    dayKey,
  };
}
