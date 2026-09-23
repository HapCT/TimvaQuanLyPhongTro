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
<<<<<<< HEAD
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="room/[id]" />
=======
      <Stack.Screen name="chu-tro" />
      <Stack.Screen name="home" />
>>>>>>> de48903ed550643542b229580638f9bfc52d4866
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
    <CustomAlert ref={customAlertRef} />
    </>
  );
}

