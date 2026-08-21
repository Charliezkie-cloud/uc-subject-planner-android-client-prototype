import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { CalendarDays, GraduationCap, BookOpen, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_BAR_CONTENT_HEIGHT = 54;
const TAB_BAR_EXTRA_BOTTOM_PADDING = 4;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = insets.bottom + TAB_BAR_EXTRA_BOTTOM_PADDING;

  return (
    <>
      <StatusBar style="auto" backgroundColor={theme.background} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding,
            paddingBottom: tabBarBottomPadding,
          },
        }}>
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Plan',
            tabBarIcon: ({ color, size }) => <CalendarDays size={size ?? 24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="subjects"
          options={{
            title: 'Subjects',
            tabBarIcon: ({ color, size }) => <GraduationCap size={size ?? 24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color, size }) => <BookOpen size={size ?? 24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={size ?? 24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
