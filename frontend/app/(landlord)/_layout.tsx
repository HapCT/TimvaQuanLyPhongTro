import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/services/supabase';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LandlordLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLandlordAuth();
  }, []);

  const checkLandlordAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('nguoi_dung')
        .select('ho_ten, vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .maybeSingle();

      if (profile) {
        setHoTen(profile.ho_ten || 'Chủ trọ');
        const role = String(profile.vai_tro || '').trim();
        if (role !== 'ChuTro' && role !== 'Admin' && role !== 'QuanTri') {
          router.replace('/(tabs)');
          return;
        }
      }
    } catch (e) {
      console.log('LANDLORD AUTH ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FB' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
      {/* HEADER KÊNH CHỦ TRỌ */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderContent}>
          <TouchableOpacity style={styles.logoRow} onPress={() => router.push('/(landlord)' as any)}>
            <Text style={{ fontSize: 24 }}>🏢</Text>
            <View style={{ marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.logoTitle}>Portal Chủ Trọ</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>CHỦ NHÀ</Text>
                </View>
              </View>
              <Text style={styles.logoSub}>Hệ thống quản lý phòng trọ chuyên nghiệp</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {!isMobile && (
              <View style={styles.userInfo}>
                <Text style={styles.userHello}>Xin chào, <Text style={{ fontWeight: 'bold', color: '#222' }}>{hoTen}</Text></Text>
              </View>
            )}

            <TouchableOpacity style={styles.switchHomeBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.switchHomeText}>🏠 Trang người thuê</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* RENDER TABS */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#EEEEEE',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Quản lý phòng',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="khu-tro"
          options={{
            title: 'Khu trọ của tôi',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="building.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dat-lich"
          options={{
            title: 'Lịch hẹn xem',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1250,
    alignSelf: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  logoSub: {
    fontSize: 11,
    color: '#777',
  },
  roleBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  userInfo: {
    marginRight: 6,
  },
  userHello: {
    fontSize: 13,
    color: '#666',
  },
  switchHomeBtn: {
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchHomeText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  logoutText: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: 'bold',
  },
});
