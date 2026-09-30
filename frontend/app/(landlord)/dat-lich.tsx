import AppointmentManagement from '@/components/AppointmentManagement';
import React from 'react';
import { ScrollView } from 'react-native';

export default function LandlordAppointmentsScreen() {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <AppointmentManagement />
    </ScrollView>
  );
}