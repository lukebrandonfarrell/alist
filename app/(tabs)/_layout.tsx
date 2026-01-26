import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs
      tintColor={Colors[colorScheme ?? 'light'].tint}
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
        <Label>Actions</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Habits</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="completed">
        <Icon sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }} />
        <Label>Completed</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
