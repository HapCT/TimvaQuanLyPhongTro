import NotificationInbox from '@/components/NotificationInbox';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function TenantNotificationsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 850, alignSelf: 'center' }}>
        <NotificationInbox />
      </View>
    </ScrollView>
  );
}
