import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            minHeight: 50,
            paddingBottom: 5,
            paddingTop: 5,
          },
        }),
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={30} name="house.fill" color={color} type="FontAwesome" />,
          }}
        />
        <Tabs.Screen
          name="CreateItemScreen"
          options={{
            title: 'Input',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={25} name="paperplane.fill" color={color} type="FontAwesome" />,
          }}
        />
    </Tabs>
  );
}
