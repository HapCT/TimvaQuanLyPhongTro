import { Stack } from 'expo-router';
import CustomAlert, { customAlertRef } from '@/components/CustomAlert';

export default function RootLayout() {
  return (
    <>
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="room/[id]" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
    <CustomAlert ref={customAlertRef} />
    </>
  );
}

