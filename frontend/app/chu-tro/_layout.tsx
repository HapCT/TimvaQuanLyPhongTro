import { Slot, useRouter, usePathname } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/services/supabase';

export default function ChuTroWebLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  
  const isMobile = width < 768;

  useEffect(() => {
    loadUser();
  }, []);

  // Cập nhật tiêu đề tab trình duyệt theo trang đang xem
  useEffect(() => {
    if (typeof document === 'undefined') return; // Chỉ chạy trên Web
    const titles: Record<string, string> = {
      '/chu-tro':         'Tổng quan | Chủ trọ',
      '/chu-tro/add-room':'Quản lý phòng | Chủ trọ',
      '/chu-tro/profile': 'Tài khoản | Chủ trọ',
    };
    document.title = titles[pathname] || 'Chủ trọ | Quản lý cho thuê';
  }, [pathname]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('nguoi_dung').select('ho_ten').eq('ma_nguoi_dung', user.id).single();
        if (data) setHoTen(data.ho_ten);
      }
    } catch (e) {
      console.log(e);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // =========================
  // GIAO DIỆN MOBILE
  // =========================
  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        {/* MOBILE TOP BAR */}
        <View style={styles.mobileHeader}>
          <View style={styles.mobileHeaderLeft}>
            <View>
              <Text style={styles.mobileHeaderTitle}>CHỦ TRỌ</Text>
              <Text style={styles.mobileHeaderSubtitle}>{hoTen || 'Quản lý'}</Text>
            </View>
          </View>

          <View style={styles.mobileHeaderRight}>
            <TouchableOpacity style={styles.backHomeButton} onPress={() => router.push('/home')}>
              <Text style={styles.backHomeButtonText}>Trang chủ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.backHomeButton, { borderColor: '#FCA5A5' }]} onPress={handleLogout}>
              <Text style={[styles.backHomeButtonText, { color: '#DC2626' }]}>Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MOBILE HORIZONTAL NAVIGATION */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileNavScroll}>
          <TouchableOpacity
            style={[styles.mobileNavChip, pathname === '/chu-tro' && styles.mobileNavChipActive]}
            onPress={() => router.push('/chu-tro')}
          >
            <Text style={[styles.mobileNavChipText, pathname === '/chu-tro' && styles.mobileNavChipTextActive]}>Tổng quan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mobileNavChip, pathname === '/chu-tro/add-room' && styles.mobileNavChipActive]}
            onPress={() => router.push('/chu-tro/add-room')}
          >
            <Text style={[styles.mobileNavChipText, pathname === '/chu-tro/add-room' && styles.mobileNavChipTextActive]}>Quản lý phòng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mobileNavChip, pathname === '/chu-tro/profile' && styles.mobileNavChipActive]}
            onPress={() => router.push('/chu-tro/profile')}
          >
            <Text style={[styles.mobileNavChipText, pathname === '/chu-tro/profile' && styles.mobileNavChipTextActive]}>Tài khoản</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MOBILE CONTENT */}
        <View style={styles.mobileContent}>
          <Slot />
        </View>
      </View>
    );
  }

  // =========================
  // GIAO DIỆN DESKTOP (PC/LAPTOP)
  // =========================
  return (
    <View style={styles.mainContainer}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>CHỦ TRỌ</Text>
        <Text style={styles.logoSub}>Quản lý cho thuê phòng</Text>

        <TouchableOpacity
          style={[styles.menuItem, pathname === '/chu-tro' && styles.menuItemActive]}
          onPress={() => router.push('/chu-tro')}
        >
          <Text style={[styles.menuText, pathname === '/chu-tro' && styles.menuTextActive]}>Tổng quan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, pathname === '/chu-tro/add-room' && styles.menuItemActive]}
          onPress={() => router.push('/chu-tro/add-room')}
        >
          <Text style={[styles.menuText, pathname === '/chu-tro/add-room' && styles.menuTextActive]}>Quản lý phòng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, pathname === '/chu-tro/profile' && styles.menuItemActive]}
          onPress={() => router.push('/chu-tro/profile')}
        >
          <Text style={[styles.menuText, pathname === '/chu-tro/profile' && styles.menuTextActive]}>Tài khoản</Text>
        </TouchableOpacity>

        {/* SIDEBAR BOTTOM */}
        <View style={styles.sidebarBottom}>
          <TouchableOpacity style={[styles.menuItem, { marginBottom: 12, backgroundColor: '#F3F4F6' }]} onPress={() => router.push('/home')}>
            <Text style={styles.menuText}>Về trang chủ</Text>
          </TouchableOpacity>

          <View style={styles.adminInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(hoTen || 'C').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.adminInfoText}>
              <Text style={styles.adminName} numberOfLines={1}>{hoTen || 'Chủ trọ'}</Text>
              <Text style={styles.adminRole}>Chủ cho thuê</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <View style={styles.desktopHeader}>
          <Text style={styles.headerTitle}>
            {pathname === '/chu-tro' && 'Tổng quan hệ thống'}
            {pathname === '/chu-tro/add-room' && 'Quản lý phòng trọ'}
            {pathname === '/chu-tro/profile' && 'Quản lý tài khoản'}
          </Text>
          <Text style={styles.headerSub}>Xin chào, {hoTen || 'Chủ trọ'} • Chủ cho thuê</Text>
        </View>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },
  logoSub: {
    fontSize: 11,
    color: '#888',
    marginLeft: 10,
    marginTop: 3,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  menuItemActive: {
    backgroundColor: '#EAF3FF',
  },
  menuText: {
    fontSize: 15,
    color: '#444',
  },
  menuTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sidebarBottom: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminInfoText: {
    flex: 1,
    marginLeft: 10,
  },
  adminName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  adminRole: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 30,
  },
  desktopHeader: {
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  headerSub: {
    fontSize: 15,
    color: '#777',
    marginTop: 5,
  },
  
  mobileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  mobileHeaderSubtitle: {
    fontSize: 11,
    color: '#888',
  },
  mobileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileNavScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxHeight: 55,
  },
  mobileNavChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  mobileNavChipActive: {
    backgroundColor: '#007AFF',
  },
  mobileNavChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  mobileNavChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  mobileContent: {
    flex: 1,
  },
  backHomeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backHomeButtonText: {
    fontSize: 12,
    color: '#4B5563',
  },
});
