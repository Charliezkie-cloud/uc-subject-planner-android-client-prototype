import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Root wrapper for every screen.
 *
 * Applies top/bottom safe area insets so content is never obscured by the
 * status bar or device notch. The tab bar manages its own bottom inset, so
 * `paddingBottom` defaults to 0 — pass `applyBottomInset` when the screen
 * owns its own bottom edge (e.g. a modal-style full-screen view without tabs).
 */
interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  applyBottomInset?: boolean;
}

export function ScreenContainer({
  children,
  applyBottomInset = false,
  style,
  ...rest
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.base,
        {
          paddingTop: insets.top,
          paddingBottom: applyBottomInset ? insets.bottom : 0,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
