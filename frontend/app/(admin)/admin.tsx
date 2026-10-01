import React, {
    useEffect,
    useState,
} from 'react';

import BookingManagement from '@/components/admin/BookingManagement';
import KhuTroManagement from '@/components/admin/KhuTroManagement';
import ReportsManagement from '@/components/admin/ReportsManagement';
import ReviewsManagement from '@/components/admin/ReviewsManagement';
import RoomReviewManagement from '@/components/admin/RoomReviewManagement';
import RoomsManagement from '@/components/admin/RoomsManagement';
import SupportManagement from '@/components/admin/SupportManagement';
import TienIchManagement from '@/components/admin/TienIchManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import AppointmentManagement from '@/components/AppointmentManagement';
import NotificationInbox from '@/components/NotificationInbox';
import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';
import { router, useRootNavigationState } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

export default function AdminScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);

  const [menu, setMenu] = useState<
    | 'review_posts'
    | 'users'
    | 'dashboard'
    | 'reports'
    | 'khutro'
    | 'rooms'
    | 'tienich'
    | 'bookings'
    | 'appointments'
    | 'notifications'
    | 'reviews'
    | 'requests'
  >('review_posts');

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: null as number | null,
    owners: null as number | null,
    tenants: null as number | null,
    admins: null as number | null,
    rooms: null as number | null,
    pendingPosts: null as number | null,
    pendingBookings: null as number | null,
    hiddenReviews: null as number | null,
    openRequests: null as number | null,
  });

  const navState = useRootNavigationState();
  const [authorized, setAuthorized] = useState(false);

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    if (!navState?.key || isMobile) return;
    loadAdmin();
  }, [navState?.key, isMobile]);

  useEffect(() => {
    if (menu !== 'dashboard' || !authorized) return;
    let cancelled = false;

    Promise.allSettled([
      backendApi.get('/api/users'),
      backendApi.get('/api/phong-tro'),
      backendApi.get('/api/phong-tro/admin/review?status=ALL'),
      backendApi.get('/api/dat-phong'),
      backendApi.get('/api/danh-gia/admin'),
      backendApi.get('/api/ho-tro/admin'),
    ]).then((results) => {
      if (cancelled) return;
      const data = results.map((result) => result.status === 'fulfilled' ? result.value.data : null);
      const users = Array.isArray(data[0]) ? data[0] : null;
      const rooms = Array.isArray(data[1]?.rooms) ? data[1].rooms : null;
      const bookings = Array.isArray(data[3]) ? data[3] : null;
      const reviews = Array.isArray(data[4]) ? data[4] : null;
      const requests = Array.isArray(data[5]) ? data[5] : null;

      setDashboardStats({
        totalUsers: users?.length ?? null,
        owners: users?.filter((user: any) => user.vai_tro === 'ChuTro').length ?? null,
        tenants: users?.filter((user: any) => user.vai_tro === 'NguoiThue').length ?? null,
        admins: users?.filter((user: any) => user.vai_tro === 'Admin' || user.vai_tro === 'QuanTri').length ?? null,
        rooms: rooms?.length ?? null,
        pendingPosts: data[2]?.counts?.ChoDuyet ?? null,
        pendingBookings: bookings?.filter((booking: any) => booking.trang_thai === 'ChoDuyet').length ?? null,
        hiddenReviews: reviews?.filter((review: any) => review.trang_thai === 'An').length ?? null,
        openRequests: requests?.filter((request: any) => request.trang_thai !== 'DaGiaiQuyet').length ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [menu, authorized]);

  // =========================
  // SAFE NAVIGATION
  // =========================
  // Hoãn điều hướng 1 tick để tránh lỗi "Attempted to navigate before
  // mounting the Root Layout component" khi /admin là route được load
  // đầu tiên (vào thẳng URL / F5 / deep link), lúc đó navState?.key có
  // thể đã "truthy" trước khi Root Layout thực sự commit xong.
  const safeReplace = (href: Parameters<typeof router.replace>[0]) => {
    setTimeout(() => {
      router.replace(href);
    }, 0);
  };

  // =========================
  // LOAD ADMIN
  // =========================
  const loadAdmin = async () => {
    try {
      setLoading(true);

      await firebaseAuth.authStateReady();
      const user = firebaseAuth.currentUser;

      if (!user) {
        showAlert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập bằng tài khoản quản trị.'
        );
        safeReplace('/login');
        return;
      }

      const { data } = await backendApi.get('/api/users/me');

      if (!data) {
        showAlert(
          'Lỗi tài khoản',
          'Không tìm thấy thông tin tài khoản trong hệ thống.'
        );
        safeReplace('/login');
        return;
      }

      const vaiTro = String(data.vai_tro || '').trim();

      if (vaiTro !== 'Admin' && vaiTro !== 'QuanTri') {
        showAlert(
          'Không có quyền',
          `Tài khoản hiện tại có vai trò "${vaiTro}", không phải Quản trị viên.`
        );
        safeReplace('/(tabs)');
        return;
      }

      setHoTen(data.ho_ten || 'Quản trị viên');
      setAuthorized(true);
    } catch (error) {
      console.log('ADMIN CATCH ERROR:', error);
      showAlert('Lỗi', 'Có lỗi xảy ra khi tải trang quản trị.');
      safeReplace('/login');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ĐĂNG XUẤT
  // =========================
  const handleLogout = async () => {
    try {
      setAuthorized(false);
      setLoading(true);

      await signOut(firebaseAuth);

      router.replace('/login');
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
      showAlert('Lỗi', 'Có lỗi xảy ra khi đăng xuất.');
      setAuthorized(true);
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (isMobile) {
    return (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedIcon}>🖥️</Text>
        <Text style={styles.blockedTitle}>Không hỗ trợ trên điện thoại</Text>
        <Text style={styles.blockedText}>Trang quản trị chỉ dùng trên máy tính.</Text>
        <Text style={styles.blockedSubText}>
          Hãy mở trang này trên màn hình rộng hơn để tiếp tục quản lý hệ thống.
        </Text>
        <TouchableOpacity
          style={styles.blockedButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.blockedButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !authorized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // =========================
  // GIAO DIỆN ADMIN TRÊN MÁY TÍNH
  // =========================
  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>

        <View style={styles.mainContainer}>

          {/* SIDEBAR */}
          <View style={styles.sidebar}>
            <Text style={styles.logo}>
              QUẢN TRỊ
            </Text>

            <Text style={styles.logoSub}>
              Tìm & Quản lý Phòng Trọ
            </Text>

            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
            {/* TỔNG QUAN */}
            <TouchableOpacity
              style={[styles.menuItem, menu === 'dashboard' && styles.menuItemActive]}
              onPress={() => setMenu('dashboard')}
            >
              <Text style={[styles.menuText, menu === 'dashboard' && styles.menuTextActive]}>
                Tổng quan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, menu === 'appointments' && styles.menuItemActive]}
              onPress={() => setMenu('appointments')}
            >
              <Text style={[styles.menuText, menu === 'appointments' && styles.menuTextActive]}>Lịch xem phòng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, menu === 'reports' && styles.menuItemActive]}
              onPress={() => setMenu('reports')}
            >
              <Text style={[styles.menuText, menu === 'reports' && styles.menuTextActive]}>
                Báo cáo thống kê
              </Text>
            </TouchableOpacity>

            {/* DUYỆT BÀI ĐĂNG */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'review_posts' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('review_posts')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'review_posts' &&
                  styles.menuTextActive,
                ]}
              >
                Duyệt bài đăng
              </Text>
            </TouchableOpacity>

            {/* TÀI KHOẢN */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'users' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('users')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'users' &&
                  styles.menuTextActive,
                ]}
              >
                Danh sách tài khoản
              </Text>
            </TouchableOpacity>

            {/* KHU TRỌ */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'khutro' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('khutro')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'khutro' &&
                  styles.menuTextActive,
                ]}
              >
                Khu trọ
              </Text>
            </TouchableOpacity>

            {/* PHÒNG TRỌ */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'rooms' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('rooms')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'rooms' &&
                  styles.menuTextActive,
                ]}
              >
                Phòng trọ
              </Text>
            </TouchableOpacity>

            {/* TIỆN ÍCH */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'tienich' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('tienich')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'tienich' &&
                  styles.menuTextActive,
                ]}
              >
                Tiện ích
              </Text>
            </TouchableOpacity>

            {/* YÊU CẦU ĐẶT PHÒNG */}
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

            {/* ĐÁNH GIÁ */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'reviews' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('reviews')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'reviews' &&
                  styles.menuTextActive,
                ]}
              >
                Quản lý đánh giá
              </Text>
            </TouchableOpacity>

            {/* YÊU CẦU */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                menu === 'requests' &&
                styles.menuItemActive,
              ]}
              onPress={() => setMenu('requests')}
            >
              <Text
                style={[
                  styles.menuText,
                  menu === 'requests' &&
                  styles.menuTextActive,
                ]}
              >
                Yêu cầu hỗ trợ
              </Text>
            </TouchableOpacity>
            </ScrollView>

            {/* SIDEBAR BOTTOM */}
            <View style={styles.sidebarBottom}>


              <View style={styles.adminInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(hoTen || 'A')
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.adminInfoText}>
                  <Text
                    style={styles.adminName}
                    numberOfLines={1}
                  >
                    {hoTen || 'Quản trị viên'}
                  </Text>

                  <Text style={styles.adminRole}>
                    Quản trị viên hệ thống
                  </Text>
                </View>
              </View>

              {/* ĐĂNG XUẤT */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={loading}
              >
                <Text style={styles.logoutText}>
                  Đăng xuất
                </Text>
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
                  {menu === 'review_posts' &&
                    'Duyệt bài đăng phòng trọ'}

                  {menu === 'users' &&
                    'Quản lý tài khoản người dùng'}

                  {menu === 'dashboard' &&
                    'Tổng quan hệ thống'}

                  {menu === 'reports' &&
                    'Báo cáo thống kê'}

                  {menu === 'khutro' &&
                    'Quản lý khu trọ'}

                  {menu === 'rooms' &&
                    'Quản lý phòng trọ'}

                  {menu === 'tienich' &&
                    'Quản lý tiện ích'}

                  {menu === 'bookings' &&
                    'Quản lý yêu cầu đặt phòng'}

                  {menu === 'appointments' &&
                    'Quản lý lịch hẹn xem phòng'}

                  {menu === 'reviews' &&
                    'Quản lý đánh giá'}

                  {menu === 'requests' &&
                    'Quản lý yêu cầu hỗ trợ'}
                </Text>

                <Text style={styles.headerSub}>
                  Xin chào, {hoTen || 'Quản trị viên'} •
                  {' '}Quyền Quản trị viên
                </Text>

              </View>
            </View>

            {/* DUYỆT BÀI ĐĂNG */}
            {menu === 'review_posts' && (
              <View style={styles.sectionCard}>
                <RoomReviewManagement />
              </View>
            )}

            {/* USERS */}
            {menu === 'users' && (
              <View style={styles.sectionCard}>
                <UsersManagement />
              </View>
            )}

            {/* DASHBOARD */}
            {menu === 'dashboard' && (
              <View>

                <View style={styles.cardGrid}>

                  <TouchableOpacity
                    style={[
                      styles.statCard,
                      { borderColor: '#007AFF' },
                    ]}
                    onPress={() => setMenu('users')}
                  >
                    <Text style={styles.statTitle}>
                      Người dùng
                    </Text>

                    <Text style={styles.statNumber}>
                      {dashboardStats.totalUsers ?? '--'}
                    </Text>

                    <Text
                      style={[
                        styles.statDescription,
                        {
                          color: '#007AFF',
                          fontWeight: 'bold',
                        },
                      ]}
                    >
                      Bấm để xem toàn bộ tài khoản
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>
                      Chủ trọ
                    </Text>

                    <Text style={styles.statNumber}>
                      {dashboardStats.owners ?? '--'}
                    </Text>

                    <Text style={styles.statDescription}>
                      Chủ trọ đang hoạt động
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>
                      Người thuê
                    </Text>

                    <Text style={styles.statNumber}>
                      {dashboardStats.tenants ?? '--'}
                    </Text>

                    <Text style={styles.statDescription}>
                      Người tìm thuê trọ
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statTitle}>
                      Quản trị viên
                    </Text>

                    <Text style={styles.statNumber}>
                      {dashboardStats.admins ?? '--'}
                    </Text>

                    <Text style={styles.statDescription}>
                      Quản trị viên hệ thống
                    </Text>
                  </View>

                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.cardGrid}>
                    {[
                      { title: 'Phòng trọ', value: dashboardStats.rooms },
                      { title: 'Bài đăng chờ duyệt', value: dashboardStats.pendingPosts },
                      { title: 'Yêu cầu đặt phòng chờ xử lý', value: dashboardStats.pendingBookings },
                      { title: 'Đánh giá đã ẩn', value: dashboardStats.hiddenReviews },
                      { title: 'Yêu cầu hỗ trợ đang mở', value: dashboardStats.openRequests },
                    ].map((stat) => (
                      <View key={stat.title} style={styles.statCard}>
                        <Text style={styles.statTitle}>{stat.title}</Text>
                        <Text style={styles.statNumber}>{stat.value ?? '--'}</Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>
            )}

            {menu === 'reports' && (
              <View style={styles.sectionCard}>
                <ReportsManagement />
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
                <BookingManagement />
              </View>
            )}

            {menu === 'appointments' && (
              <View style={styles.sectionCard}>
                <AppointmentManagement />
              </View>
            )}

            {menu === 'notifications' && (
              <View style={styles.sectionCard}>
                <NotificationInbox />
              </View>
            )}

            {/* REVIEWS */}
            {menu === 'reviews' && (
              <View style={styles.sectionCard}>
                <ReviewsManagement />
              </View>
            )}

            {/* REQUESTS */}
            {menu === 'requests' && (
              <View style={styles.sectionCard}>
                <SupportManagement />
              </View>
            )}

          </ScrollView>
        </View>
    </View>
  );
}