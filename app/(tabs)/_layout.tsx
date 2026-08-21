import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { CalendarDays, GraduationCap, BookOpen, Settings } from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <>
      <StatusBar style="auto" backgroundColor={theme.background} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.tint,
          headerShown: false,
          tabBarButton: HapticTab,
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
