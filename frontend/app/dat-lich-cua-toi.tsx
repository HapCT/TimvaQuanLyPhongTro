import AppointmentManagement from '@/components/AppointmentManagement';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function MyAppointmentsScreen() {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#2563EB', fontSize: 14 }}>‹ Quay lại</Text>
      </TouchableOpacity>
      <AppointmentManagement tenantView />
    </ScrollView>
  );
}