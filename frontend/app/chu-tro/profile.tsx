import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { firebaseAuth } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    router.replace('/login');
  };

  return (
    <>
      <Head><title>Tài khoản | Chủ trọ</title></Head>
      <View style={styles.container}>
        <Text style={styles.text}>Quản lý tài khoản đang được phát triển...</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
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
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 40,
  },
  logoutButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
