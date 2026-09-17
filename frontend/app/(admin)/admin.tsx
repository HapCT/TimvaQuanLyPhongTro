import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import UsersManagement from '@/components/admin/UsersManagement';
import RoomsManagement from '@/components/admin/RoomsManagement';
import KhuTroManagement from '@/components/admin/KhuTroManagement';
import TienIchManagement from '@/components/admin/TienIchManagement';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';

export default function AdminScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  // Mặc định mở ngay tab 'users' để hiển thị toàn bộ danh sách tài khoản
  const [menu, setMenu] = useState<'users' | 'dashboard' | 'khutro' | 'rooms' | 'tienich' | 'bookings' | 'contracts' | 'reviews' | 'requests'>('users');
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
        showAlert(
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
        showAlert(
          'Lỗi tài khoản',
          'Không tìm thấy thông tin tài khoản trong hệ thống.'
        );
        router.replace('/login');
        return;
      }

      const vaiTro = String(data.vai_tro || '').trim();

      if (vaiTro !== 'Admin' && vaiTro !== 'QuanTri') {
        showAlert(
          'Không có quyền',
          `Tài khoản hiện tại có vai trò "${vaiTro}", không phải Quản trị viên.`
        );
        router.replace('/home');
        return;
      }

      setHoTen(data.ho_ten || 'Quản trị viên');
    } catch (error) {
      console.log('ADMIN CATCH ERROR:', error);
      showAlert('Lỗi', 'Có lỗi xảy ra khi tải trang quản trị.');
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
      showAlert('Lỗi', 'Có lỗi xảy ra khi đăng xuất.');
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
              menu === 'khutro' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('khutro')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'khutro' && styles.mobileNavChipTextActive]}>
              Khu trọ
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
              menu === 'tienich' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('tienich')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'tienich' && styles.mobileNavChipTextActive]}>
              Tiện ích
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'bookings' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('bookings')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'bookings' && styles.mobileNavChipTextActive]}>
              Đặt phòng
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
              Hợp đồng & Thanh toán
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mobileNavChip,
              menu === 'reviews' && styles.mobileNavChipActive,
            ]}
            onPress={() => setMenu('reviews')}
          >
            <Text style={[styles.mobileNavChipText, menu === 'reviews' && styles.mobileNavChipTextActive]}>
              Đánh giá
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
              Yêu cầu hỗ trợ
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


              <View style={styles.sectionCard}>
                <Text style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: 20 }}>
                  Các biểu đồ và thống kê phòng trọ, khu trọ sẽ được cập nhật trong tương lai...
                </Text>
              </View>
            </View>
          )}

          {/* KHU TRỌ */}
          {menu === 'khutro' && (
            <View style={styles.sectionCard}>
              <KhuTroManagement />
            </View>
          )}

          {/* ROOMS */}
          {menu === 'rooms' && (
            <View style={styles.sectionCard}>
              <RoomsManagement />
            </View>
          )}

          {/* BOOKINGS */}
          {menu === 'bookings' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Yêu cầu đặt phòng</Text>
              <Text style={styles.sectionSub}>Quản lý các yêu cầu đặt phòng từ người thuê.</Text>
            </View>
          )}

          {/* CONTRACTS */}
          {menu === 'contracts' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Hợp đồng & Thanh toán</Text>
              <Text style={styles.sectionSub}>Quản lý hợp đồng thuê trọ và trạng thái thanh toán.</Text>
            </View>
          )}

          {/* REVIEWS */}
          {menu === 'reviews' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quản lý đánh giá</Text>
              <Text style={styles.sectionSub}>Theo dõi đánh giá phòng trọ từ người thuê.</Text>
            </View>
          )}

          {/* REQUESTS */}
          {menu === 'requests' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Danh sách yêu cầu hỗ trợ</Text>
              <Text style={styles.sectionSub}>Quản lý các khiếu nại và hỗ trợ từ người dùng.</Text>
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

        {/* KHU TRỌ */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'khutro' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('khutro')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'khutro' && styles.menuTextActive,
            ]}
          >
            Khu trọ
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

        {/* TIỆN ÍCH */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'tienich' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('tienich')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'tienich' && styles.menuTextActive,
            ]}
          >
            Tiện ích
          </Text>
        </TouchableOpacity>

        {/* ĐẶT PHÒNG */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'bookings' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('bookings')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'bookings' && styles.menuTextActive,
            ]}
          >
            Yêu cầu đặt phòng
          </Text>
        </TouchableOpacity>

        {/* HỢP ĐỒNG & THANH TOÁN */}
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
            Hợp đồng & Thanh toán
          </Text>
        </TouchableOpacity>

        {/* ĐÁNH GIÁ */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'reviews' && styles.menuItemActive,
          ]}
          onPress={() => setMenu('reviews')}
        >
          <Text
            style={[
              styles.menuText,
              menu === 'reviews' && styles.menuTextActive,
            ]}
          >
            Quản lý đánh giá
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
            Yêu cầu hỗ trợ
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
              {menu === 'khutro' && 'Quản lý khu trọ'}
              {menu === 'rooms' && 'Quản lý phòng trọ'}
              {menu === 'tienich' && 'Quản lý tiện ích'}
              {menu === 'bookings' && 'Quản lý yêu cầu đặt phòng'}
              {menu === 'contracts' && 'Hợp đồng & Thanh toán'}
              {menu === 'reviews' && 'Quản lý đánh giá'}
              {menu === 'requests' && 'Quản lý yêu cầu hỗ trợ'}
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


            <View style={styles.sectionCard}>
              <Text style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: 20 }}>
                Các biểu đồ và thống kê phòng trọ, khu trọ sẽ được cập nhật trong tương lai...
              </Text>
            </View>
          </View>
        )}

        {/* KHU TRỌ */}
        {menu === 'khutro' && (
          <View style={styles.sectionCard}>
            <KhuTroManagement />
          </View>
        )}

        {/* ROOMS */}
        {menu === 'rooms' && (
          <View style={styles.sectionCard}>
            <RoomsManagement />
          </View>
        )}

        {/* TIỆN ÍCH */}
        {menu === 'tienich' && (
          <View style={styles.sectionCard}>
            <TienIchManagement />
          </View>
        )}

        {/* BOOKINGS */}
        {menu === 'bookings' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Yêu cầu đặt phòng</Text>
                <Text style={styles.sectionSub}>Theo dõi và duyệt các yêu cầu đặt phòng từ người thuê.</Text>
              </View>
            </View>
          </View>
        )}

        {/* CONTRACTS */}
        {menu === 'contracts' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Hợp đồng & Thanh toán</Text>
                <Text style={styles.sectionSub}>Quản lý toàn bộ hợp đồng thuê trọ và lịch sử thanh toán.</Text>
              </View>
            </View>
          </View>
        )}

        {/* REVIEWS */}
        {menu === 'reviews' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Quản lý đánh giá</Text>
                <Text style={styles.sectionSub}>Theo dõi và phản hồi các đánh giá từ người thuê.</Text>
              </View>
            </View>
          </View>
        )}

        {/* REQUESTS */}
        {menu === 'requests' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Yêu cầu hỗ trợ</Text>
                <Text style={styles.sectionSub}>Quản lý các yêu cầu hỗ trợ và khiếu nại từ người dùng.</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
