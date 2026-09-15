import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import UsersManagement from '@/components/admin/UsersManagement';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { styles } from '@/styles/admin/admin.styles';

export default function AdminScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  // Mặc định mở ngay tab 'users' để hiển thị toàn bộ danh sách tài khoản
  const [menu, setMenu] = useState<'users' | 'dashboard' | 'rooms' | 'contracts' | 'requests'>('users');
  const [userStats, setUserStats] = useState({
    total: 0,
    owners: 0,
    tenants: 0,
    admins: 0,
  });

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // =========================
  // KIỂM TRA ADMIN
  // =========================
  useEffect(() => {
    loadAdmin();
  }, []);

  // =========================
  // LOAD ADMIN
  // =========================
  const loadAdmin = async () => {
    try {
      setLoading(true);

      // LẤY USER AUTH HIỆN TẠI
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      const user = authData?.user;

      if (authError || !user) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập bằng tài khoản quản trị.'
        );
        router.replace('/login');
        return;
      }

      // LẤY THÔNG TIN NGƯỜI DÙNG
      const {
        data,
        error,
      } = await supabase
        .from('nguoi_dung')
        .select('ma_nguoi_dung, ho_ten, vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .maybeSingle();

      if (error || !data) {
        Alert.alert(
          'Lỗi tài khoản',
          'Không tìm thấy thông tin tài khoản trong hệ thống.'
        );
        router.replace('/login');
        return;
      }

      const vaiTro = String(data.vai_tro || '').trim();

      if (vaiTro !== 'Admin' && vaiTro !== 'QuanTri') {
        Alert.alert(
          'Không có quyền',
          `Tài khoản hiện tại có vai trò "${vaiTro}", không phải Quản trị viên.`
        );
        router.replace('/home');
        return;
      }

      setHoTen(data.ho_ten || 'Quản trị viên');
    } catch (error) {
      console.log('ADMIN CATCH ERROR:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải trang quản trị.');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ĐĂNG XUẤT
  // =========================
  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất.');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải trang quản trị...</Text>
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
              <Text style={styles.mobileHeaderTitle}>QUẢN TRỊ</Text>
              <Text style={styles.mobileHeaderSubtitle}>{hoTen || 'Admin'}</Text>
            </View>
          </View>

          <View style={styles.mobileHeaderRight}>
            <TouchableOpacity
              style={styles.backHomeButton}
              onPress={() => router.push('/home')}
            >
              <Text style={styles.backHomeButtonText}>Trang chủ</Text>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mobileNavScroll}
        >
          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'users' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('users')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'users' && styles.mobileNavChipTextActive]}>
              Tài khoản ({userStats.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'dashboard' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('dashboard')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'dashboard' && styles.mobileNavChipTextActive]}>
              Tổng quan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'rooms' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('rooms')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'rooms' && styles.mobileNavChipTextActive]}>
              Phòng trọ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'contracts' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('contracts')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'contracts' && styles.mobileNavChipTextActive]}>
              Hợp đồng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'requests' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('requests')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'requests' && styles.mobileNavChipTextActive]}>
              Yêu cầu
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MOBILE CONTENT */}
        <ScrollView
          style={styles.mobileContent}
          contentContainerStyle={styles.mobileContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* USERS (MẶC ĐỊNH) */}
          {menu === 'users' && (
            <View style={styles.sectionCard}>
              <UsersManagement onStatsUpdate={setUserStats} />
            </View>
          )}

          {/* DASHBOARD */}
          {menu === 'dashboard' && (
            <View>
              <View style={styles.cardGrid}>
                <TouchableOpacity
                  style={[styles.statCard, { borderColor: '#007AFF' }]}
                  onPress={() => setMenu('users')}
                >
                  <Text style={styles.statTitle}>Người dùng</Text>
                  <Text style={styles.statNumber}>{userStats.total}</Text>
                  <Text style={[styles.statDescription, { color: '#007AFF', fontWeight: 'bold' }]}>
                    Xem toàn bộ tài khoản
                  </Text>
                </TouchableOpacity>

                <View style={styles.statCard}>
                  <Text style={styles.statTitle}>Chủ trọ</Text>
                  <Text style={styles.statNumber}>{userStats.owners}</Text>
                  <Text style={styles.statDescription}>Chủ trọ hoạt động</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statTitle}>Người thuê</Text>
                  <Text style={styles.statNumber}>{userStats.tenants}</Text>
                  <Text style={styles.statDescription}>Khách tìm thuê</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statTitle}>Quản trị viên</Text>
                  <Text style={styles.statNumber}>{userStats.admins}</Text>
                  <Text style={styles.statDescription}>Tài khoản Admin</Text>
                </View>
              </View>


              {/* Danh sách tài khoản hiển thị ngay trên Dashboard */}
              <View style={styles.sectionCard}>
                <UsersManagement onStatsUpdate={setUserStats} />
              </View>
            </View>
          )}

          {/* ROOMS */}
          {menu === 'rooms' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Danh sách phòng trọ</Text>
              <Text style={styles.sectionSub}>Quản lý toàn bộ phòng trọ trên hệ thống.</Text>
            </View>
          )}

          {/* CONTRACTS */}
          {menu === 'contracts' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Danh sách hợp đồng</Text>
              <Text style={styles.sectionSub}>Quản lý hợp đồng thuê trọ.</Text>
            </View>
          )}

          {/* REQUESTS */}
          {menu === 'requests' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Danh sách yêu cầu</Text>
              <Text style={styles.sectionSub}>Quản lý các khiếu nại và hỗ trợ.</Text>
            </View>
          )}
        </ScrollView>
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
        <Text style={styles.logo}>QUẢN TRỊ</Text>
        <Text style={styles.logoSub}>Tìm & Quản lý Phòng Trọ</Text>

        {/* TÀI KHOẢN (NGƯỜI DÙNG) */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'users' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('users')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'users' && styles.menuTextActive,
            ]}
          >
            Danh sách tài khoản
          </Text>
        </TouchableOpacity>

        {/* TỔNG QUAN */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'dashboard' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('dashboard')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'dashboard' && styles.menuTextActive,
            ]}
          >
            Tổng quan
          </Text>
        </TouchableOpacity>

        {/* PHÒNG TRỌ */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'rooms' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('rooms')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'rooms' && styles.menuTextActive,
            ]}
          >
            Phòng trọ
          </Text>
        </TouchableOpacity>

        {/* HỢP ĐỒNG */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'contracts' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('contracts')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'contracts' && styles.menuTextActive,
            ]}
          >
            Hợp đồng
          </Text>
        </TouchableOpacity>

        {/* YÊU CẦU */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'requests' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('requests')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'requests' && styles.menuTextActive,
            ]}
          >
            Yêu cầu
          </Text>
        </TouchableOpacity>

        {/* SIDEBAR BOTTOM */}
        <View style={styles.sidebarBottom}>
          {/* NÚT VỀ TRANG CHỦ */}
          <TouchableOpacity
            style={[styles.menuItem, { marginBottom: 12, backgroundColor: '#F3F4F6' }]}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.menuText}>Về trang chủ</Text>
          </TouchableOpacity>


          <View style={styles.adminInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(hoTen || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.adminInfoText}>
              <Text style={styles.adminName} numberOfLines={1}>
                {hoTen || 'Quản trị viên'}
              </Text>
              <Text style={styles.adminRole}>Quản trị viên hệ thống</Text>
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {menu === 'users' && 'Quản lý tài khoản người dùng'}
              {menu === 'dashboard' && 'Tổng quan hệ thống'}
              {menu === 'rooms' && 'Quản lý phòng trọ'}
              {menu === 'contracts' && 'Quản lý hợp đồng'}
              {menu === 'requests' && 'Quản lý yêu cầu'}
            </Text>

            <Text style={styles.headerSub}>
              Xin chào, {hoTen || 'Quản trị viên'} • Quyền Quản trị viên
            </Text>
          </View>
        </View>

        {/* USERS (MẶC ĐỊNH) */}
        {menu === 'users' && (
          <View style={styles.sectionCard}>
            <UsersManagement onStatsUpdate={setUserStats} />
          </View>
        )}

        {/* DASHBOARD */}
        {menu === 'dashboard' && (
          <View>
            <View style={styles.cardGrid}>
              <TouchableOpacity
                style={[styles.statCard, { borderColor: '#007AFF' }]}
                onPress={() => setMenu('users')}
              >
                <Text style={styles.statTitle}>Người dùng</Text>
                <Text style={styles.statNumber}>{userStats.total}</Text>
                <Text style={[styles.statDescription, { color: '#007AFF', fontWeight: 'bold' }]}>
                  Bấm để xem toàn bộ tài khoản
                </Text>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Chủ trọ</Text>
                <Text style={styles.statNumber}>{userStats.owners}</Text>
                <Text style={styles.statDescription}>Chủ trọ đang hoạt động</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Người thuê</Text>
                <Text style={styles.statNumber}>{userStats.tenants}</Text>
                <Text style={styles.statDescription}>Người tìm thuê trọ</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Quản trị viên</Text>
                <Text style={styles.statNumber}>{userStats.admins}</Text>
                <Text style={styles.statDescription}>Quản trị viên hệ thống</Text>
              </View>
            </View>


            {/* Danh sách tài khoản hiển thị ngay trên Dashboard */}
            <View style={styles.sectionCard}>
              <UsersManagement onStatsUpdate={setUserStats} />
            </View>
          </View>
        )}

        {/* ROOMS */}
        {menu === 'rooms' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Danh sách phòng trọ</Text>
                <Text style={styles.sectionSub}>Quản lý toàn bộ phòng trọ trên hệ thống.</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>+ Thêm phòng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CONTRACTS */}
        {menu === 'contracts' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Danh sách hợp đồng</Text>
                <Text style={styles.sectionSub}>Quản lý toàn bộ hợp đồng thuê trọ.</Text>
              </View>
            </View>
          </View>
        )}

        {/* REQUESTS */}
        {menu === 'requests' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Danh sách yêu cầu</Text>
                <Text style={styles.sectionSub}>Quản lý các yêu cầu và phản hồi từ người dùng.</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
