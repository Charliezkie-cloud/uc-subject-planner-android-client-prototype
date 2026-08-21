# Shared layouts

## `app/_layout.tsx`

The root layout wraps all routes in `SafeAreaProvider`, `DatabaseProvider`, React Navigation's theme provider, an Expo Router stack, `StatusBar`, and `PortalHost`. The `(tabs)` stack screen has no header.

## `app/(tabs)/_layout.tsx`

The persistent bottom-tab layout renders four tabs: Plan, Subjects, Courses, and Settings. It uses Expo Router `Tabs`, `HapticTab`, lucide icons, and the safe-area bottom inset. All tab screens render without headers.

## `components/ui/ScreenContainer.tsx`

Every screen is wrapped in a flex container with a top safe-area inset; the bottom inset is opt-in because the tab bar owns it.
