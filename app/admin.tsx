
import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import UsersManagement from './components/admin/UsersManagement';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

export default function AdminScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState('dashboard');

  const { width } = Dimensions.get('window');

  const isMobile = width < 768;

  // =========================
  // KIỂM TRA ADMIN
  // =========================

  useEffect(() => {
    if (isMobile) {
      setLoading(false);
      return;
    }

    loadAdmin();
  }, [isMobile]);

  // =========================
  // LOAD ADMIN
  // =========================

  const loadAdmin = async () => {
    try {
      setLoading(true);

      // =========================
      // LẤY USER AUTH HIỆN TẠI
      // =========================

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      const user = authData?.user;

      console.log(
        '========================='
      );

      console.log(
        'ADMIN AUTH USER:',
        user
      );

      console.log(
        'ADMIN AUTH ERROR:',
        authError
      );

      console.log(
        '========================='
      );

      if (authError) {
        Alert.alert(
          'Lỗi',
          'Không thể kiểm tra tài khoản đăng nhập.'
        );

        router.replace('/login');

        return;
      }

      // =========================
      // CHƯA ĐĂNG NHẬP
      // =========================

      if (!user) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để truy cập trang quản trị.'
        );

        router.replace('/login');

        return;
      }

      console.log(
        'ADMIN USER ID:',
        user.id
      );

      // =========================
      // LẤY THÔNG TIN NGƯỜI DÙNG
      // =========================

      const {
        data,
        error,
      } = await supabase
        .from('nguoi_dung')
        .select(
          'ma_nguoi_dung, ho_ten, vai_tro'
        )
        .eq(
          'ma_nguoi_dung',
          user.id
        )
        .maybeSingle();

      console.log(
        '========================='
      );

      console.log(
        'ADMIN DATA:',
        data
      );

      console.log(
        'ADMIN ERROR:',
        error
      );

      console.log(
        '========================='
      );

      // =========================
      // LỖI QUERY
      // =========================

      if (error) {
        console.log(
          'ADMIN QUERY ERROR:',
          error
        );

        Alert.alert(
          'Lỗi',
          'Không thể kiểm tra thông tin quyền quản trị.'
        );

        return;
      }

      // =========================
      // KHÔNG CÓ PROFILE
      // =========================

      if (!data) {
        Alert.alert(
          'Lỗi tài khoản',
          'Không tìm thấy thông tin tài khoản trong bảng nguoi_dung.'
        );

        await supabase.auth.signOut();

        router.replace('/login');

        return;
      }

      // =========================
      // CHUẨN HÓA VAI TRÒ
      // =========================

      const vaiTro = String(
        data.vai_tro || ''
      ).trim();

      console.log(
        'ADMIN VAI TRÒ:',
        vaiTro
      );

      // =========================
      // KHÔNG PHẢI ADMIN
      // =========================

      if (vaiTro !== 'Admin') {
        Alert.alert(
          'Không có quyền',
          `Tài khoản hiện tại có vai trò "${vaiTro}", không phải Admin.`
        );

        router.replace('/login');

        return;
      }

      // =========================
      // ADMIN HỢP LỆ
      // =========================

      console.log(
        '========================='
      );

      console.log(
        'ADMIN XÁC THỰC THÀNH CÔNG'
      );

      console.log(
        'HO TÊN:',
        data.ho_ten
      );

      console.log(
        'VAI TRÒ:',
        vaiTro
      );

      console.log(
        '========================='
      );

      setHoTen(
        data.ho_ten || 'Quản trị viên'
      );

    } catch (error) {
      console.log(
        'ADMIN CATCH ERROR:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi tải trang quản trị.'
      );

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

      console.log(
        'ĐANG ĐĂNG XUẤT...'
      );

      const {
        error,
      } = await supabase.auth.signOut();

      console.log(
        'LOGOUT ERROR:',
        error
      );

      if (error) {
        setLoading(false);

        Alert.alert(
          'Lỗi',
          'Không thể đăng xuất. Vui lòng thử lại.'
        );

        return;
      }

      console.log(
        'ĐĂNG XUẤT THÀNH CÔNG'
      );

      setLoading(false);

      router.replace('/login');

    } catch (error) {
      console.log(
        'LOGOUT CATCH ERROR:',
        error
      );

      setLoading(false);

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi đăng xuất.'
      );
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#007AFF"
        />

        <Text style={styles.loadingText}>
          Đang tải trang quản trị...
        </Text>
      </View>
    );
  }

  // =========================
  // CHẶN ĐIỆN THOẠI
  // =========================

  if (isMobile) {
    return (
      <View style={styles.blockedContainer}>

        <Text style={styles.blockedIcon}>
          🖥️
        </Text>

        <Text style={styles.blockedTitle}>
          Không thể truy cập trang Admin
        </Text>

        <Text style={styles.blockedText}>
          Trang quản trị chỉ hỗ trợ trên máy tính.
        </Text>

        <Text style={styles.blockedSubText}>
          Tài khoản quản trị không thể sử dụng
          trang Admin trên điện thoại.
          {'\n'}
          Vui lòng sử dụng máy tính hoặc laptop
          để truy cập.
        </Text>

        <TouchableOpacity
          style={styles.blockedButton}
          onPress={() =>
            router.replace('/login')
          }
        >
          <Text style={styles.blockedButtonText}>
            Quay lại đăng nhập
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  // =========================
  // GIAO DIỆN ADMIN
  // =========================

  return (
    <View style={styles.mainContainer}>

      {/* SIDEBAR */}

      <View style={styles.sidebar}>

        <Text style={styles.logo}>
          QUẢN TRỊ
        </Text>

        <Text style={styles.logoSub}>
          Tìm & Quản lý Phòng Trọ
        </Text>

        {/* TỔNG QUAN */}

        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'dashboard' &&
              styles.menuItemActive,
          ]}
          onPress={() =>
            setMenu('dashboard')
          }
        >
          <Text
            style={[
              styles.menuIcon,
              menu === 'dashboard' &&
                styles.menuTextActive,
            ]}
          >
            ⌂
          </Text>

          <Text
            style={[
              styles.menuText,
              menu === 'dashboard' &&
                styles.menuTextActive,
            ]}
          >
            Tổng quan
          </Text>
        </TouchableOpacity>

        {/* NGƯỜI DÙNG */}

        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'users' &&
              styles.menuItemActive,
          ]}
          onPress={() =>
            setMenu('users')
          }
        >
          <Text
            style={[
              styles.menuIcon,
              menu === 'users' &&
                styles.menuTextActive,
            ]}
          >
            👥
          </Text>

          <Text
            style={[
              styles.menuText,
              menu === 'users' &&
                styles.menuTextActive,
            ]}
          >
            Người dùng
          </Text>
        </TouchableOpacity>

        {/* PHÒNG TRỌ */}

        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'rooms' &&
              styles.menuItemActive,
          ]}
          onPress={() =>
            setMenu('rooms')
          }
        >
          <Text
            style={[
              styles.menuIcon,
              menu === 'rooms' &&
                styles.menuTextActive,
            ]}
          >
            🏠
          </Text>

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

        {/* HỢP ĐỒNG */}

        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'contracts' &&
              styles.menuItemActive,
          ]}
          onPress={() =>
            setMenu('contracts')
          }
        >
          <Text
            style={[
              styles.menuIcon,
              menu === 'contracts' &&
                styles.menuTextActive,
            ]}
          >
            📄
          </Text>

          <Text
            style={[
              styles.menuText,
              menu === 'contracts' &&
                styles.menuTextActive,
            ]}
          >
            Hợp đồng
          </Text>
        </TouchableOpacity>

        {/* YÊU CẦU */}

        <TouchableOpacity
          style={[
            styles.menuItem,
            menu === 'requests' &&
              styles.menuItemActive,
          ]}
          onPress={() =>
            setMenu('requests')
          }
        >
          <Text
            style={[
              styles.menuIcon,
              menu === 'requests' &&
                styles.menuTextActive,
            ]}
          >
            🔔
          </Text>

          <Text
            style={[
              styles.menuText,
              menu === 'requests' &&
                styles.menuTextActive,
            ]}
          >
            Yêu cầu
          </Text>
        </TouchableOpacity>

        {/* ADMIN INFO */}

        <View style={styles.sidebarBottom}>

          <View style={styles.adminInfo}>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                A
              </Text>
            </View>

            <View style={styles.adminInfoText}>

              <Text
                style={styles.adminName}
                numberOfLines={1}
              >
                {hoTen ||
                  'Quản trị viên'}
              </Text>

              <Text style={styles.adminRole}>
                Quản trị viên
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
        contentContainerStyle={
          styles.contentContainer
        }
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View>

            <Text style={styles.headerTitle}>
              {menu === 'dashboard' &&
                'Tổng quan'}

              {menu === 'users' &&
                'Quản lý người dùng'}

              {menu === 'rooms' &&
                'Quản lý phòng trọ'}

              {menu === 'contracts' &&
                'Quản lý hợp đồng'}

              {menu === 'requests' &&
                'Quản lý yêu cầu'}
            </Text>

            <Text style={styles.headerSub}>
              Xin chào,{' '}
              {hoTen ||
                'Quản trị viên'}
            </Text>

          </View>

        </View>

        {/* ========================= */}
        {/* DASHBOARD */}
        {/* ========================= */}

        {menu === 'dashboard' && (
          <View>

            <View style={styles.cardGrid}>

              <View style={styles.statCard}>

                <View style={styles.statIcon}>
                  <Text
                    style={
                      styles.statIconText
                    }
                  >
                    👥
                  </Text>
                </View>

                <Text style={styles.statTitle}>
                  Người dùng
                </Text>

                <Text style={styles.statNumber}>
                  0
                </Text>

                <Text
                  style={
                    styles.statDescription
                  }
                >
                  Tổng số tài khoản
                </Text>

              </View>

              <View style={styles.statCard}>

                <View style={styles.statIcon}>
                  <Text
                    style={
                      styles.statIconText
                    }
                  >
                    🏠
                  </Text>
                </View>

                <Text style={styles.statTitle}>
                  Chủ trọ
                </Text>

                <Text style={styles.statNumber}>
                  0
                </Text>

                <Text
                  style={
                    styles.statDescription
                  }
                >
                  Chủ trọ đang hoạt động
                </Text>

              </View>

              <View style={styles.statCard}>

                <View style={styles.statIcon}>
                  <Text
                    style={
                      styles.statIconText
                    }
                  >
                    🏘️
                  </Text>
                </View>

                <Text style={styles.statTitle}>
                  Phòng trọ
                </Text>

                <Text style={styles.statNumber}>
                  0
                </Text>

                <Text
                  style={
                    styles.statDescription
                  }
                >
                  Tổng số phòng
                </Text>

              </View>

              <View style={styles.statCard}>

                <View style={styles.statIcon}>
                  <Text
                    style={
                      styles.statIconText
                    }
                  >
                    🔔
                  </Text>
                </View>

                <Text style={styles.statTitle}>
                  Yêu cầu
                </Text>

                <Text style={styles.statNumber}>
                  0
                </Text>

                <Text
                  style={
                    styles.statDescription
                  }
                >
                  Yêu cầu đang chờ
                </Text>

              </View>

            </View>

            <View style={styles.sectionCard}>

              <Text style={styles.sectionTitle}>
                Hoạt động gần đây
              </Text>

              <View style={styles.emptyContainer}>

                <Text style={styles.emptyIcon}>
                  📋
                </Text>

                <Text style={styles.emptyTitle}>
                  Chưa có hoạt động
                </Text>

                <Text style={styles.emptyText}>
                  Các hoạt động mới sẽ
                  hiển thị ở đây.
                </Text>

              </View>

            </View>

          </View>
        )}

        {/* ========================= */}
        {/* USERS */}
        {/* ========================= */}

        
          {menu === 'users' && ( <View style={styles.sectionCard}> <UsersManagement /> </View> )}
        

        {/* ========================= */}
        {/* ROOMS */}
        {/* ========================= */}

        {menu === 'rooms' && (
          <View style={styles.sectionCard}>

            <View style={styles.sectionHeader}>

              <View>

                <Text style={styles.sectionTitle}>
                  Danh sách phòng trọ
                </Text>

                <Text style={styles.sectionSub}>
                  Quản lý toàn bộ phòng trọ
                  trên hệ thống.
                </Text>

              </View>

              <TouchableOpacity
                style={styles.primaryButton}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  + Thêm phòng
                </Text>
              </TouchableOpacity>

            </View>

            <View style={styles.emptyContainer}>

              <Text style={styles.emptyIcon}>
                🏠
              </Text>

              <Text style={styles.emptyTitle}>
                Chưa có dữ liệu
              </Text>

              <Text style={styles.emptyText}>
                Danh sách phòng trọ sẽ
                được hiển thị tại đây.
              </Text>

            </View>

          </View>
        )}

        {/* ========================= */}
        {/* CONTRACTS */}
        {/* ========================= */}

        {menu === 'contracts' && (
          <View style={styles.sectionCard}>

            <Text style={styles.sectionTitle}>
              Quản lý hợp đồng
            </Text>

            <Text style={styles.sectionSub}>
              Theo dõi các hợp đồng thuê phòng.
            </Text>

            <View style={styles.emptyContainer}>

              <Text style={styles.emptyIcon}>
                📄
              </Text>

              <Text style={styles.emptyTitle}>
                Chưa có dữ liệu
              </Text>

              <Text style={styles.emptyText}>
                Hợp đồng sẽ được hiển thị
                tại đây.
              </Text>

            </View>

          </View>
        )}

        {/* ========================= */}
        {/* REQUESTS */}
        {/* ========================= */}

        {menu === 'requests' && (
          <View style={styles.sectionCard}>

            <Text style={styles.sectionTitle}>
              Quản lý yêu cầu
            </Text>

            <Text style={styles.sectionSub}>
              Xử lý các yêu cầu từ người dùng.
            </Text>

            <View style={styles.emptyContainer}>

              <Text style={styles.emptyIcon}>
                🔔
              </Text>

              <Text style={styles.emptyTitle}>
                Chưa có yêu cầu
              </Text>

              <Text style={styles.emptyText}>
                Các yêu cầu mới sẽ xuất hiện
                tại đây.
              </Text>

            </View>

          </View>
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  // =========================
  // MAIN
  // =========================

  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
  },

  // =========================
  // SIDEBAR
  // =========================

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

  menuIcon: {
    width: 30,
    fontSize: 19,
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

  // =========================
  // CONTENT
  // =========================

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 50,
  },

  header: {
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

  // =========================
  // STAT CARD
  // =========================

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },

  statCard: {
    flex: 1,
    minWidth: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  statIconText: {
    fontSize: 20,
  },

  statTitle: {
    fontSize: 14,
    color: '#666',
  },

  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 5,
  },

  statDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },

  // =========================
  // SECTION
  // =========================

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },

  sectionSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },

  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },

  // =========================
  // LOADING
  // =========================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },

  // =========================
  // BLOCK MOBILE
  // =========================

  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F5F7FA',
  },

  blockedIcon: {
    fontSize: 65,
    marginBottom: 20,
  },

  blockedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },

  blockedText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },

  blockedSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 450,
  },

  blockedButton: {
    marginTop: 25,
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },

  blockedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

});

