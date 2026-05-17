import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  CalendarRangePicker,
  type DateRange,
  type Mode,
} from '@daboss2003/react-native-calender-range-picker';

const ACCENT = '#FF6B6B';

type Props = {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onConfirm: (value: Date | DateRange) => void;
  initialValue?: Date | DateRange | null;
};

export function CalendarModal({ visible, mode, onClose, onConfirm, initialValue }: Props) {
  const [draft, setDraft] = React.useState<Date | DateRange | null>(initialValue ?? null);

  React.useEffect(() => {
    if (visible) setDraft(initialValue ?? null);
  }, [visible, initialValue]);

  const handleChange = React.useCallback((v: Date | DateRange) => {
    setDraft(v);
  }, []);

  const summary = React.useMemo(() => {
    if (!draft) return mode === 'range' ? 'Pick a start and end date' : 'Pick a date';
    if (draft instanceof Date) return draft.toDateString();
    return `${draft.start.toDateString()}  →  ${draft.end.toDateString()}`;
  }, [draft, mode]);

  const canConfirm = !!draft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <GestureHandlerRootView style={styles.fill}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {mode === 'range' ? 'Select dates' : 'Select date'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>{summary}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>
            </View>

            <View style={styles.pickerWrap}>
              <CalendarRangePicker
                mode={mode}
                firstDayOfWeek={1}
                onChange={handleChange}
                theme={{
                  primary: ACCENT,
                  onPrimary: '#fff',
                  rangeFill: '#FFE3E3',
                  todayBorder: ACCENT,
                  text: '#1A1A1A',
                  mutedText: '#CFCFCF',
                  headerText: '#1A1A1A',
                  weekdayText: '#8A8A8A',
                }}
              />
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.secondary} onPress={onClose}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primary, !canConfirm && styles.primaryDisabled]}
                disabled={!canConfirm}
                onPress={() => { if (draft) { onConfirm(draft); onClose(); } }}
              >
                <Text style={styles.primaryText}>Confirm</Text>
              </Pressable>
            </View>
          </GestureHandlerRootView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    height: '78%',
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#666',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  closeIcon: {
    fontSize: 20,
    lineHeight: 22,
    color: '#666',
    fontWeight: '600',
  },
  pickerWrap: {
    flex: 1,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
  },
  secondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  primary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
  },
  primaryDisabled: {
    backgroundColor: '#F0BABA',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
