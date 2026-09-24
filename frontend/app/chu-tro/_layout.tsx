import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function ChuTroLayout() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(landlord)' as any);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
