import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/admin/admin.styles';
import { Slot, router, usePathname } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

export default function LandlordLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pathname = usePathname() || '';

  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);

  // Xác định tab đang chọn dựa trên pathname
  const isKhuTro = pathname.includes('khu-tro');
  const isDatPhong = pathname.includes('dat-phong');
  const isDatLich = pathname.includes('dat-lich');
  const isNotifications = pathname.includes('thong-bao');
  const isContracts = pathname.includes('hop-dong');
  const isHoTro = pathname.includes('ho-tro');
  const isRooms = !isKhuTro && !isDatPhong && !isDatLich && !isNotifications && !isContracts && !isHoTro;

  let pageTitle = 'Quản lý phòng trọ';
  if (isKhuTro) {
    pageTitle = 'Quản lý khu trọ';
  } else if (isDatPhong) {
    pageTitle = 'Yêu cầu đặt phòng';
  } else if (isDatLich) {
    pageTitle = 'Lịch xem phòng';
  } else if (isNotifications) {
    pageTitle = 'Thông báo';
  } else if (isContracts) {
    pageTitle = 'Hợp đồng & Thanh toán';
  } else if (isHoTro) {
    pageTitle = 'Yêu cầu hỗ trợ';
  }

  // Cập nhật title trình duyệt khi chạy trên Web
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isKhuTro) {
      document.title = 'Khu trọ | Chủ trọ';
    } else if (isDatPhong) {
      document.title = 'Yêu cầu đặt phòng | Chủ trọ';
    } else if (isDatLich) {
      document.title = 'Lịch xem phòng | Chủ trọ';
    } else if (isNotifications) {
      document.title = 'Thông báo | Chủ trọ';
    } else if (isContracts) {
      document.title = 'Hợp đồng & Thanh toán | Chủ trọ';
    } else if (isHoTro) {
      document.title = 'Yêu cầu hỗ trợ | Chủ trọ';
    } else {
      document.title = 'Quản lý phòng trọ | Chủ trọ';
    }
  }, [pathname, isKhuTro, isDatPhong, isDatLich, isNotifications, isContracts, isHoTro]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setLoading(false);
        router.replace('/(tabs)');
        return;
      }

      try {
        setLoading(true);
        const { data: profile } = await backendApi.get('/api/users/me');

        if (profile) {
          setHoTen(profile.ho_ten || 'Chủ trọ');
          const role = String(profile.vai_tro || '').trim();
          if (role !== 'ChuTro' && role !== 'Admin' && role !== 'QuanTri') {
            router.replace('/(tabs)');
            return;
          }
        } else {
          router.replace('/(tabs)');
          return;
        }
      } catch (e) {
        console.log('LANDLORD AUTH ERROR:', e);
        router.replace('/(tabs)');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(firebaseAuth);
      router.replace('/login');
    } catch (e) {
      console.log('LOGOUT ERROR:', e);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải trang chủ trọ...</Text>
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
              <Text style={styles.mobileHeaderSubtitle}>{hoTen || 'Chủ trọ'}</Text>
            </View>
          </View>

          <View style={styles.mobileHeaderRight}>
            <TouchableOpacity
              style={styles.backHomeButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.backHomeButtonText}>Trang chủ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backHomeButton} onPress={() => router.push('/(landlord)/thong-bao' as any)}>
              <Text style={styles.backHomeButtonText}>Thông báo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backHomeButton, { borderColor: '#FCA5A5' }]}
              onPress={handleLogout}
            >
              <Text style={[styles.backHomeButtonText, { color: '#DC2626' }]}>Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MOBILE HORIZONTAL NAVIGATION */}
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mobileNavScroll}
          >
            <TouchableOpacity
              style={[
                styles.mobileNavChip,
                isRooms && styles.mobileNavChipActive,
              ]}
              onPress={() => router.push('/(landlord)/phong-tro' as any)}
            >
              <Text
                style={[
                  styles.mobileNavChipText,
                  isRooms && styles.mobileNavChipTextActive,
                ]}
              >
                🏠 Phòng trọ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavChip, isDatLich && styles.mobileNavChipActive]}
              onPress={() => router.push('/(landlord)/dat-lich' as any)}
            >
              <Text style={[styles.mobileNavChipText, isDatLich && styles.mobileNavChipTextActive]}>📅 Lịch xem phòng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileNavChip,
                isKhuTro && styles.mobileNavChipActive,
              ]}
              onPress={() => router.push('/(landlord)/khu-tro' as any)}
            >
              <Text
                style={[
                  styles.mobileNavChipText,
                  isKhuTro && styles.mobileNavChipTextActive,
                ]}
              >
                🏢 Khu trọ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileNavChip,
                isDatPhong && styles.mobileNavChipActive,
              ]}
              onPress={() => router.push('/(landlord)/dat-phong' as any)}
            >
              <Text
                style={[
                  styles.mobileNavChipText,
                  isDatPhong && styles.mobileNavChipTextActive,
                ]}
              >
                📋 Đặt phòng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileNavChip,
                isContracts && styles.mobileNavChipActive,
              ]}
              onPress={() => router.push('/(landlord)/hop-dong' as any)}
            >
              <Text
                style={[
                  styles.mobileNavChipText,
                  isContracts && styles.mobileNavChipTextActive,
                ]}
              >
                Hợp đồng & Thanh toán
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileNavChip, isHoTro && styles.mobileNavChipActive]}
              onPress={() => router.push('/(landlord)/ho-tro' as any)}
            >
              <Text style={[styles.mobileNavChipText, isHoTro && styles.mobileNavChipTextActive]}>
                Hỗ trợ
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>
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
        <Text style={styles.logoSub}>Tìm & Quản lý Phòng Trọ</Text>

        {/* PHÒNG TRỌ */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            isRooms && styles.menuItemActive,
          ]}
          onPress={() => router.push('/(landlord)/phong-tro' as any)}
        >
          <Text
            style={[
              styles.menuText,
              isRooms && styles.menuTextActive,
            ]}
          >
            Quản lý phòng trọ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, isNotifications && styles.menuItemActive]}
          onPress={() => router.push('/(landlord)/thong-bao' as any)}
        >
          <Text style={[styles.menuText, isNotifications && styles.menuTextActive]}>Thông báo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, isDatLich && styles.menuItemActive]}
          onPress={() => router.push('/(landlord)/dat-lich' as any)}
        >
          <Text style={[styles.menuText, isDatLich && styles.menuTextActive]}>Lịch xem phòng</Text>
        </TouchableOpacity>

        {/* HỢP ĐỒNG & THANH TOÁN */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            isContracts && styles.menuItemActive,
          ]}
          onPress={() => router.push('/(landlord)/hop-dong' as any)}
        >
          <Text
            style={[
              styles.menuText,
              isContracts && styles.menuTextActive,
            ]}
          >
            Hợp đồng & Thanh toán
          </Text>
        </TouchableOpacity>

        {/* KHU TRỌ */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            isKhuTro && styles.menuItemActive,
          ]}
          onPress={() => router.push('/(landlord)/khu-tro' as any)}
        >
          <Text
            style={[
              styles.menuText,
              isKhuTro && styles.menuTextActive,
            ]}
          >
            Khu trọ của tôi
          </Text>
        </TouchableOpacity>

        {/* YÊU CẦU ĐẶT PHÒNG */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            isDatPhong && styles.menuItemActive,
          ]}
          onPress={() => router.push('/(landlord)/dat-phong' as any)}
        >
          <Text
            style={[
              styles.menuText,
              isDatPhong && styles.menuTextActive,
            ]}
          >
            Yêu cầu đặt phòng
          </Text>
        </TouchableOpacity>

        {/* YÊU CẦU HỖ TRỢ */}
        <TouchableOpacity
          style={[styles.menuItem, isHoTro && styles.menuItemActive]}
          onPress={() => router.push('/(landlord)/ho-tro' as any)}
        >
          <Text style={[styles.menuText, isHoTro && styles.menuTextActive]}>
            Yêu cầu hỗ trợ
          </Text>
        </TouchableOpacity>

        {/* SIDEBAR BOTTOM */}
        <View style={styles.sidebarBottom}>



          <View style={styles.adminInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(hoTen || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.adminInfoText}>
              <Text style={styles.adminName} numberOfLines={1}>
                {hoTen || 'Chủ trọ'}
              </Text>
              <Text style={styles.adminRole}>Chủ nhà cho thuê</Text>
            </View>
          </View>

          {/* ĐĂNG XUẤT */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: 30,
              paddingTop: 28,
              paddingBottom: 16,
              marginBottom: 0,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            },
          ]}
        >
          <View>
            <Text style={styles.headerTitle}>{pageTitle}</Text>
            <Text style={styles.headerSub}>
              Xin chào, {hoTen || 'Chủ trọ'} • Quản lý cho thuê phòng
            </Text>
          </View>
        </View>

        {/* BODY */}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}
