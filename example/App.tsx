import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarRangePicker,
  type DateRange,
  type Mode,
} from '@daboss2003/react-native-calender-range-picker';
import { CalendarModal } from './CalendarModal';

const ACCENT = '#FF6B6B';

export default function App() {
  const [mode, setMode] = React.useState<Mode>('range');
  const [selected, setSelected] = React.useState<Date | DateRange | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleChange = React.useCallback((value: Date | DateRange) => {
    setSelected(value);
  }, []);

  const summary = React.useMemo(() => {
    if (!selected) return 'no selection';
    if (selected instanceof Date) return selected.toDateString();
    return `${selected.start.toDateString()}  →  ${selected.end.toDateString()}`;
  }, [selected]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.root} edges={['top']}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.headerBar}>
            <Text style={styles.title}>Calender Range Picker</Text>
            <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
          </View>

          <View style={styles.modeRow}>
            <ModeButton label="Range" active={mode === 'range'} onPress={() => { setMode('range'); setSelected(null); }} />
            <ModeButton label="Single" active={mode === 'single'} onPress={() => { setMode('single'); setSelected(null); }} />
            <Pressable style={styles.modalBtn} onPress={() => setModalOpen(true)}>
              <Text style={styles.modalBtnText}>Open in modal</Text>
            </Pressable>
          </View>

          <View style={styles.pickerWrap}>
            <CalendarRangePicker
              key={mode}
              mode={mode}
              firstDayOfWeek={1}
              onChange={handleChange}
              theme={{
                primary: ACCENT,
                onPrimary: '#fff',
                rangeFill: '#FFE3E3',
                todayBorder: ACCENT,
                headerText: '#1A1A1A',
                text: '#1A1A1A',
                weekdayText: '#8A8A8A',
                mutedText: '#CFCFCF',
              }}
            />
          </View>

          <CalendarModal
            visible={modalOpen}
            mode={mode}
            initialValue={selected}
            onClose={() => setModalOpen(false)}
            onConfirm={(v) => setSelected(v)}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeBtn, active && { backgroundColor: ACCENT }]}
    >
      <Text style={[styles.modeBtnText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  summary: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEE',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },
  pickerWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
