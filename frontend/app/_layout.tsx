import CustomAlert, { customAlertRef } from '@/components/CustomAlert';
import { firebaseAuth } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { Stack, router, usePathname, useRootNavigationState } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

export default function RootLayout() {
  const navState = useRootNavigationState();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const [ready, setReady] = useState(false);
  const started = useRef(false);

  // Chỉ chạy 1 lần lúc mở app: quyết định trang đầu tiên theo phiên đăng nhập.
  useEffect(() => {
    if (!navState?.key || started.current) return;
    started.current = true;

    const boot = async () => {
      try {
        // Chờ Firebase khôi phục phiên xong rồi mới xử lý
        await firebaseAuth.authStateReady();

        // Nếu mở thẳng 1 link khác (/admin, /room/1, /login...) thì để nguyên
        if (pathRef.current !== '/') return;

        // Vào web từ đầu (đường dẫn "/") -> luôn bắt đầu ở trang đăng nhập.
        // Đăng xuất phiên cũ trước, nếu không trang login sẽ tự nhảy sang /admin.
        if (firebaseAuth.currentUser) {
          await signOut(firebaseAuth);
        }
        router.replace('/login');
      } catch (e) {
        console.log('BOOT ERROR:', e);
        router.replace('/login');
      } finally {
        setReady(true);
      }
    };

    boot();
  }, [navState?.key]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(landlord)" />
        <Stack.Screen name="room/[id]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      {/* Màn hình chờ che trang chủ cho tới khi quyết định xong, tránh bị nháy */}
      {!ready && (
        <View
          style={{
            position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F5F7FA',
          }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      <CustomAlert ref={customAlertRef} />
    </>
  );
}
