import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [vaiTro, setVaiTro] = useState('');
  const [ngayTao, setNgayTao] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setEmail(user.email || '');
      setIsLoggedIn(true);

      const { data } = await supabase
        .from('nguoi_dung')
        .select('ho_ten, so_dien_thoai, vai_tro, ngay_tao')
        .eq('ma_nguoi_dung', user.id)
        .maybeSingle();

      if (data) {
        setHoTen(data.ho_ten || '');
        setSoDienThoai(data.so_dien_thoai || '');
        setVaiTro(data.vai_tro || '');
        setNgayTao(data.ngay_tao || '');
      }
    } catch (error) {
      console.log('PROFILE ERROR:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      setLoggingOut(true);
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setHoTen('');
      setEmail('');
      setVaiTro('');
      setLoggingOut(false);
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const getRoleInfo = (role: string) => {
    const r = String(role || '').trim();
    switch (r) {
      case 'NguoiThue':
        return { label: '👤 Người thuê trọ', color: '#007AFF', bg: '#EEF5FF', border: '#CBE2FF' };
      case 'ChuTro':
        return { label: '🏢 Chủ nhà trọ', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' };
      case 'Admin':
      case 'QuanTri':
        return { label: '🛡️ Quản trị viên', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
      default:
        return { label: r || 'Thành viên', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
    }
  };

  const formatDate = (d: string) => {
    if (!d) return 'Mới tham gia';
    try {
      return new Date(d).toLocaleDateString('vi-VN');
    } catch {
      return 'Mới tham gia';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>Đang tải thông tin tài khoản...</Text>
      </View>
    );
  }

  // ==============================================================
  // 1. CHƯA ĐĂNG NHẬP → Giao diện tinh tế, gọn gàng, căn giữa chuẩn
  // ==============================================================
  if (!isLoggedIn) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerWrapper}>
          <View style={styles.guestCard}>
            <View style={styles.guestAvatar}>
              <Text style={{ fontSize: 44 }}>👤</Text>
            </View>

            <Text style={styles.guestTitle}>Chào mừng bạn đến với Tìm Trọ</Text>
            <Text style={styles.guestSubtitle}>
              Đăng nhập để đặt lịch hẹn xem phòng, lưu phòng trọ yêu thích và quản lý tiện ích.
            </Text>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginBtnText}>🔑 Đăng nhập ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerBtnText}>Tạo tài khoản mới</Text>
            </TouchableOpacity>

            {/* LỢI ÍCH */}
            <View style={styles.benefitContainer}>
              <Text style={styles.benefitHeaderTitle}>⭐ Lợi ích khi đăng nhập</Text>
              {[
                { icon: '📅', title: 'Đặt lịch xem phòng', desc: 'Chọn ngày giờ tiện lợi, chủ trọ liên hệ lại ngay' },
                { icon: '❤️', title: 'Danh sách yêu thích', desc: 'Lưu lại các phòng trọ ưng ý để so sánh giá' },
                { icon: '📞', title: 'Liên hệ trực tiếp', desc: 'Xem số điện thoại và gọi điện thoại cho chủ nhà' },
              ].map((b, i) => (
                <View key={i} style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitItemTitle}>{b.title}</Text>
                    <Text style={styles.benefitItemDesc}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==============================================================
  // 2. ĐÃ ĐĂNG NHẬP → Giao diện hồ sơ chuyên nghiệp, gọn gàng
  // ==============================================================
  const roleInfo = getRoleInfo(vaiTro);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerWrapper}>
        
        {/* PROFILE HEADER HERO CARD */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {hoTen ? hoTen.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>

          <Text style={styles.userName}>{hoTen || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg, borderColor: roleInfo.border }]}>
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
        </View>

        {/* LỐI TẮT KÊNH CHUYÊN BIỆT (CHỦ TRỌ / ADMIN) */}
        {(vaiTro === 'ChuTro') && (
          <TouchableOpacity
            style={styles.portalBanner}
            onPress={() => router.push('/(landlord)' as any)}
          >
            <View style={styles.portalIconBox}>
              <Text style={{ fontSize: 24 }}>🏢</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.portalTitle}>Kênh Quản Lý Dành Cho Chủ Trọ</Text>
              <Text style={styles.portalSub}>Quản lý phòng trọ, khu trọ và duyệt lịch xem</Text>
            </View>
            <Text style={styles.portalArrow}>→</Text>
          </TouchableOpacity>
        )}

        {(vaiTro === 'Admin' || vaiTro === 'QuanTri') && (
          <TouchableOpacity
            style={[styles.portalBanner, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
            onPress={() => router.push('/admin')}
          >
            <View style={[styles.portalIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Text style={{ fontSize: 24 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.portalTitle, { color: '#B91C1C' }]}>Bảng Quản Trị Hệ Thống</Text>
              <Text style={styles.portalSub}>Quản lý thành viên, danh mục và thống kê toàn hệ thống</Text>
            </View>
            <Text style={[styles.portalArrow, { color: '#B91C1C' }]}>→</Text>
          </TouchableOpacity>
        )}

        {/* THÔNG TIN CHI TIẾT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <Text style={styles.infoValue}>{hoTen || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>📧</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email đăng ký</Text>
              <Text style={styles.infoValue}>{email || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>📱</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{soDienThoai || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ngày đăng ký</Text>
              <Text style={styles.infoValue}>{formatDate(ngayTao)}</Text>
            </View>
          </View>
        </View>

        {/* TIỆN ÍCH ĐIỀU HƯỚNG */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tiện ích</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Text style={{ fontSize: 16 }}>🏠</Text>
            </View>
            <Text style={styles.actionText}>Trang chủ tìm phòng</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EEF5FF' }]}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
            </View>
            <Text style={styles.actionText}>Tìm kiếm & Lọc phòng trọ</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* NÚT ĐĂNG XUẤT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text style={styles.logoutText}>🚪 Đăng xuất khỏi tài khoản</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>© 2026 Hệ thống Quản lý và Tìm kiếm Phòng trọ</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  // GUEST CARD
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 380,
  },
  loginBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  registerBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  registerBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  benefitContainer: {
    marginTop: 26,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  benefitHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  benefitItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  benefitItemDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // LOGGED IN HERO
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // PORTAL BANNER
  portalBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  portalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
  },
  portalSub: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  portalArrow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A34A',
    marginLeft: 8,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
    marginLeft: 50,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  actionArrow: {
    fontSize: 20,
    color: '#CBD5E1',
  },

  // LOGOUT BUTTON
  logoutButton: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  logoutText: {
    color: '#E11D48',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerNote: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 30,
  },
});
