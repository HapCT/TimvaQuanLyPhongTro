import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';

export default function RootIndexScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (!user) {
          // Chưa đăng nhập -> Vào ngay trang chủ tìm phòng trọ cho khách/người thuê
          router.replace('/(tabs)');
          return;
        }

        // Đã đăng nhập -> Kiểm tra vai trò người dùng từ backend
        const { data: profile } = await backendApi.get('/api/users/me');
        if (profile) {
          const role = String(profile.vai_tro || '').trim();
          if (role === 'ChuTro') {
            router.replace('/(landlord)' as any);
            return;
          }
          if ((role === 'Admin' || role === 'QuanTri') && Platform.OS === 'web') {
            router.replace('/admin');
            return;
          }
        }
        router.replace('/(tabs)');
      } catch (e) {
        console.log('ROOT INDEX AUTH ERROR:', e);
        router.replace('/(tabs)');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
