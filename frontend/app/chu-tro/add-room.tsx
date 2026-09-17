import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Head } from 'expo-router/head';

export default function AddRoomScreen() {
  return (
    <>
      <Head><title>Quản lý phòng | Chủ trọ</title></Head>
      <View style={styles.container}>
        <Text style={styles.text}>Chức năng đăng phòng mới đang được phát triển...</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFE',
  },
  text: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
});
