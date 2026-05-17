# @daboss2003/react-native-calender-range-picker

Mobile-first, declarative date & range picker for React Native.

- **Single tap or drag** to select a range — no separate mode toggle.
- **Vertical, virtualized** month list (feels like the iOS Calendar app).
- **Worklet-driven gestures** via `react-native-reanimated` and `react-native-worklets` — pan events stay on the UI thread.
- **Continuous range bar** with rounded endpoints (not pill-per-day).
- **Single theme object** — full color control, no dozen-prop API.
- **Zero date-library dependency** — pure JS date math.
- **TypeScript** first.

## Install

```sh
npm install @daboss2003/react-native-calender-range-picker \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-worklets
```

### App setup

1. Wrap your root in `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ... */}
    </GestureHandlerRootView>
  );
}
```

2. Make sure the worklets babel plugin is active.

   - **Expo (SDK 50+)** — nothing to do. `babel-preset-expo` already includes `react-native-worklets/plugin` automatically.
   - **Bare React Native (Community CLI)** — add it to your `babel.config.js`:

     ```js
     module.exports = {
       presets: ['module:@react-native/babel-preset'],
       plugins: ['react-native-worklets/plugin'], // must be last in the plugins array
     };
     ```

   `react-native-worklets/plugin` replaces the old `react-native-reanimated/plugin` for Reanimated 4+.

## Usage

### Range mode (default)

```tsx
import { CalendarRangePicker, type DateRange } from '@daboss2003/react-native-calender-range-picker';

function Screen() {
  return (
    <CalendarRangePicker
      onChange={(value) => {
        const range = value as DateRange;
        console.log(range.start, range.end);
      }}
    />
  );
}
```

Tap once to set the start, tap again for the end. Long-press + drag to select a range in one gesture.

### Single mode

```tsx
<CalendarRangePicker
  mode="single"
  onChange={(value) => console.log(value as Date)}
/>
```

### With bounds and disabled dates

```tsx
<CalendarRangePicker
  mode="range"
  minDate={new Date(2026, 0, 1)}
  maxDate={new Date(2026, 11, 31)}
  disabledDates={[new Date(2026, 4, 25)]} // or a predicate (d) => boolean
  onChange={(v) => setRange(v as DateRange)}
/>
```

### Theming

```tsx
<CalendarRangePicker
  theme={{
    primary: '#FF6B6B',
    onPrimary: '#fff',
    rangeFill: '#FFE3E3',
    text: '#1A1A1A',
    headerText: '#1A1A1A',
    weekdayText: '#8A8A8A',
    todayBorder: '#FF6B6B',
  }}
/>
```

All theme keys are optional — anything you omit falls back to `defaultTheme`.

### Imperative ref

```tsx
const ref = useRef<CalendarRangePickerRef>(null);

<CalendarRangePicker ref={ref} />

ref.current?.scrollToToday();
ref.current?.scrollToDate(new Date(2027, 0, 1));
ref.current?.reset();
```

## API

### `<CalendarRangePicker>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `mode` | `"single" \| "range"` | `"range"` | Selection mode. |
| `initialDate` | `Date` | — | Initial value when `mode="single"`. Optional. |
| `initialRange` | `{ start: Date; end: Date }` | — | Initial value when `mode="range"`. Optional. |
| `minDate` | `Date` | 24 months before today | Earliest selectable / visible day. |
| `maxDate` | `Date` | 24 months after today | Latest selectable / visible day. |
| `disabledDates` | `Date[] \| (d: Date) => boolean` | — | Disabled days. |
| `onChange` | `(v: Date \| DateRange) => void` | — | Fires on completed selection. |
| `theme` | `Partial<Theme>` | `defaultTheme` | Color overrides (deep-merged). |
| `locale` | `string` | `"en"` | BCP-47 locale for month/weekday labels. |
| `firstDayOfWeek` | `0..6` | `0` | 0 = Sunday, 1 = Monday, … |
| `monthsBefore` | `number` | `24` | How many months back to render when `minDate` is omitted. |
| `monthsAfter` | `number` | `24` | How many months forward when `maxDate` is omitted. |
| `style` | `ViewStyle` | — | Container style. |

### Ref API

```ts
type CalendarRangePickerRef = {
  scrollToDate: (date: Date, animated?: boolean) => void;
  scrollToToday: (animated?: boolean) => void;
  reset: () => void;
};
```

### Theme

```ts
type Theme = {
  primary: string;       // selected day fill + today ring
  onPrimary: string;     // text on selected day
  rangeFill: string;     // continuous range bar color
  text: string;          // in-month day text
  mutedText: string;     // spill-over day text (prev/next month)
  disabled: string;      // disabled day text
  background: string;    // overall background
  headerText: string;    // "May 2026" header
  weekdayText: string;   // "Mon Tue Wed..." row
  todayBorder: string;   // ring around today (unselected)
};
```

## How it works

- Months are rendered in a vertical, virtualized `Animated.SectionList`. Only ~3 months stay mounted at a time.
- Each `Day` cell is `React.memo`'d — re-renders only when its own selection state changes.
- Pan gestures use Reanimated 4 worklets: hit-testing (finger → cell → date) runs on the UI thread. Only when the targeted cell changes does it schedule a JS update via `scheduleOnRN`.
- No date library — `dateUtils.ts` provides everything needed (~70 lines).

## Example app

A runnable Expo example lives in [`example/`](./example). From the repo root:

```sh
cd example
npm install
npm run ios     # builds a native dev client (first run: ~5–15 min)
```

> **Why `run:ios` instead of `start` + Expo Go?**
> Reanimated + Worklets + Gesture Handler with the New Architecture require their native modules to be linked into a custom dev client. The vanilla Expo Go binary does not load `RNGestureHandlerModule` / `WorkletsModule` under bridgeless mode, so it will red-screen at startup. A one-time `expo run:ios` build fixes this; subsequent reloads use `npm start` and are instant.

### Heads-up: avoid duplicate copies of native modules

If you consume this library from a sibling directory via `"file:.."` (or in a monorepo / workspace setup), make sure your **library directory does not have its own `node_modules`** containing different versions of `react-native-gesture-handler`, `react-native-reanimated`, or `react-native-worklets`. Two copies = the JS side imports one, the native binary registered the other, and you get:

```
TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found.
```

Fix: either `rm -rf <library-root>/node_modules` so the app's copy is the only one, or pin matching versions in your consumer app's `package.json` `overrides`. The [gesture-handler troubleshooting docs](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/troubleshooting/) cover the same scenario.

## License

[MIT](./LICENSE) © daboss2003
