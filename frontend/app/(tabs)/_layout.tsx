import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB', // Blue for active tab
        tabBarInactiveTintColor: '#94A3B8', // Gray for inactive tabs
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
<<<<<<< HEAD
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
      }}
    >
      {/* TAB 1: TRANG CHỦ */}
=======
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        },
      }}>
>>>>>>> de48903ed550643542b229580638f9bfc52d4866
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
<<<<<<< HEAD
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
=======
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
>>>>>>> de48903ed550643542b229580638f9bfc52d4866
        }}
      />

      {/* TAB 2: TÌM KIẾM */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
<<<<<<< HEAD
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="magnifyingglass" color={color} />
          ),
        }}
      />

      {/* TAB 3: TÀI KHOẢN */}
=======
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: 'Đã lưu',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
>>>>>>> de48903ed550643542b229580638f9bfc52d4866
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
<<<<<<< HEAD
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.fill" color={color} />
          ),
=======
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
>>>>>>> de48903ed550643542b229580638f9bfc52d4866
        }}
      />
    </Tabs>
  );
}
