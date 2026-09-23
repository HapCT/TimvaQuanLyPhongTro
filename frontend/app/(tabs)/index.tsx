import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/home.styles';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  // Thông tin người dùng (có thể null nếu chưa đăng nhập)
  const [hoTen, setHoTen] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    checkUser();   // Kiểm tra đăng nhập nhẹ (không chặn trang)
    loadRooms();   // Luôn tải phòng, không cần đăng nhập
  }, []);

  // =============================================
  // KIỂM TRA ĐĂNG NHẬP (KHÔNG CHẶN TRANG NẾU CHƯA ĐĂNG NHẬP)
  // =============================================
  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        return;
      }

      const { data } = await supabase
        .from('nguoi_dung')
        .select('ho_ten, vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .maybeSingle();

      if (data) {
        setHoTen(data.ho_ten);
        setIsLoggedIn(true);
        const role = String(data.vai_tro || '').trim();

        // Admin chỉ vào Web → redirect sang admin dashboard
        if ((role === 'Admin' || role === 'QuanTri') && Platform.OS === 'web') {
          router.replace('/admin');
          return;
        }

        // Chủ trọ → vào landlord portal
        if (role === 'ChuTro') {
          router.replace('/(landlord)' as any);
          return;
        }
      }
    } catch (error) {
      console.log('CHECK USER ERROR:', error);
      setIsLoggedIn(false);
    }
  };

  // =============================================
  // TẢI DANH SÁCH PHÒNG (KHÔNG CẦN ĐĂNG NHẬP)
  // =============================================
  const loadRooms = async () => {
    try {
      const response = await backendApi.get('/api/phong-tro');
      if (response.data?.rooms) {
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.log('LOAD ROOMS ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // TÌM KIẾM
  // =============================================
  const filteredRooms = rooms.filter((room) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (room.tieu_de || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.dia_chi || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.thanh_pho || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.quan_huyen || '').toLowerCase().includes(keyword)
    );
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobile ? 15 : 30 },
        ]}
      >
        <View style={[styles.content, { maxWidth: isDesktop ? 1250 : '100%' }]}>

          {/* ========== TOP BAR ========== */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <View>
              <Text style={{ fontSize: 13, color: '#999' }}>
                {isLoggedIn ? `Xin chào 👋` : '🏠 Tìm Trọ'}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>
                {isLoggedIn ? (hoTen || 'Người dùng') : 'Tìm phòng trọ phù hợp'}
              </Text>
            </View>

            {/* NÚT ĐĂNG NHẬP / HỒ SƠ */}
            {isLoggedIn ? (
              <TouchableOpacity
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: '#007AFF',
                  justifyContent: 'center', alignItems: 'center',
                }}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>
                  {hoTen ? hoTen.charAt(0).toUpperCase() : 'U'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  paddingHorizontal: 18, paddingVertical: 9,
                  borderRadius: 20,
                }}
                onPress={() => router.push('/login')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                  Đăng nhập
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ========== HERO ========== */}
          <View style={[styles.hero, { padding: isMobile ? 20 : 35 }]}>
            <View style={styles.heroLeft}>
              <Text style={[styles.heroTitle, {
                fontSize: isMobile ? 25 : 36,
                lineHeight: isMobile ? 32 : 43,
              }]}>
                Tìm phòng trọ{'\n'}phù hợp với bạn
              </Text>
              <Text style={[styles.heroDescription, { fontSize: isMobile ? 13 : 15 }]}>
                Hàng trăm phòng trọ chất lượng, cập nhật mỗi ngày.
              </Text>

              {/* SEARCH BOX */}
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm tên phòng, địa chỉ, khu vực..."
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                />
                {!isMobile && (
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => router.push('/(tabs)/explore' as any)}
                  >
                    <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isMobile && (
                <TouchableOpacity
                  style={styles.mobileSearchButton}
                  onPress={() => router.push('/(tabs)/explore' as any)}
                >
                  <Text style={styles.searchButtonText}>Tìm kiếm nâng cao</Text>
                </TouchableOpacity>
              )}
            </View>

            {!isMobile && (
              <View style={styles.heroRight}>
                <Text style={styles.house}>🏠</Text>
              </View>
            )}
          </View>

          {/* ========== QUICK FILTER ========== */}
          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Tìm kiếm nhanh</Text>
          <View style={[styles.filterRow, isMobile && styles.filterMobile]}>
            {[
              { icon: '📍', label: 'Khu vực', value: 'Chọn khu vực' },
              { icon: '💰', label: 'Mức giá', value: 'Chọn mức giá' },
              { icon: '📐', label: 'Diện tích', value: 'Chọn diện tích' },
            ].map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.filterCard}
                onPress={() => router.push('/(tabs)/explore' as any)}
              >
                <Text style={styles.filterIcon}>{f.icon}</Text>
                <View style={styles.filterInfo}>
                  <Text style={styles.filterLabel}>{f.label}</Text>
                  <Text style={styles.filterValue}>{f.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ========== PHÒNG NỔI BẬT ========== */}
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Phòng trọ nổi bật</Text>
              <Text style={styles.sectionDescription}>
                Những phòng trọ được quan tâm nhiều nhất
              </Text>
            </View>
            {!isMobile && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
                <Text style={styles.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 30 }} />
          ) : filteredRooms.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 40 }}>🏠</Text>
              <Text style={{ color: '#999', marginTop: 10 }}>Không tìm thấy phòng trọ</Text>
            </View>
          ) : (
            <View style={styles.roomGrid}>
              {filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room.ma_phong}
                  style={[
                    styles.roomCard,
                    {
                      width: (isMobile
                        ? '100%'
                        : isTablet
                        ? (Platform.OS === 'web' ? 'calc(50% - 8px)' : '48.5%')
                        : (Platform.OS === 'web' ? 'calc(33.333% - 11px)' : '31.8%')) as any,
                    },
                  ]}
                  onPress={() =>
                    router.push({ pathname: '/room/[id]', params: { id: room.ma_phong } } as any)
                  }
                >
                  <View>
                    <Image
                      source={{
                        uri: room.anh_dai_dien ||
                          'https://placehold.co/300x200/e8f0fe/007AFF?text=Phong+Tro',
                      }}
                      style={[styles.roomImage, { height: isMobile ? 200 : 190 }]}
                    />
                    <View style={[styles.badge, {
                      backgroundColor: room.trang_thai === 'ConTrong' ? '#34C759' : '#FF3B30',
                    }]}>
                      <Text style={styles.badgeText}>
                        {room.trang_thai === 'ConTrong' ? 'Còn trống' : 'Đã thuê'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heart}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (!isLoggedIn) {
                          router.push('/login');
                        }
                      }}
                    >
                      <Text style={styles.heartText}>♡</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName} numberOfLines={2}>
                      {room.tieu_de || `Phòng ${room.so_phong}`}
                    </Text>
                    <Text style={styles.address} numberOfLines={1}>
                      📍 {[room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho]
                        .filter(Boolean).join(', ') || 'Chưa rõ'}
                    </Text>
                    <View style={styles.roomBottom}>
                      <Text style={styles.price}>
                        {room.gia_thue?.toLocaleString('vi-VN')} đ/tháng
                      </Text>
                      <Text style={styles.area}>
                        {room.dien_tich ? `${room.dien_tich} m²` : '--'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ========== PHÒNG MỚI ĐĂNG ========== */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Phòng mới đăng</Text>
              <Text style={styles.sectionDescription}>Cập nhật mới nhất hôm nay</Text>
            </View>
          </View>

          <View style={styles.newRooms}>
            {filteredRooms.slice(0, 5).map((room) => (
              <TouchableOpacity
                key={`new-${room.ma_phong}`}
                style={styles.newRoom}
                onPress={() =>
                  router.push({ pathname: '/room/[id]', params: { id: room.ma_phong } } as any)
                }
              >
                <Image
                  source={{
                    uri: room.anh_dai_dien ||
                      'https://placehold.co/300x200/e8f0fe/007AFF?text=Phong+Tro',
                  }}
                  style={styles.newImage}
                />
                <View style={styles.newInfo}>
                  <Text style={styles.newName} numberOfLines={2}>
                    {room.tieu_de || `Phòng ${room.so_phong}`}
                  </Text>
                  <Text style={styles.newAddress} numberOfLines={1}>
                    📍 {[room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho]
                      .filter(Boolean).join(', ') || 'Chưa rõ'}
                  </Text>
                  <View style={styles.newBottom}>
                    <Text style={styles.newPrice}>
                      {room.gia_thue?.toLocaleString('vi-VN')} đ/tháng
                    </Text>
                    <Text style={styles.newArea}>
                      {room.dien_tich ? `${room.dien_tich} m²` : '--'}
                    </Text>
                  </View>
                </View>
                {!isMobile && <Text style={styles.arrow}>→</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* ========== BANNER KÊU GỌI ĐĂNG NHẬP (CHỈ HIỆN KHI CHƯA ĐĂNG NHẬP) ========== */}
          {!isLoggedIn && (
            <View style={{
              backgroundColor: '#007AFF',
              borderRadius: 18,
              padding: 24,
              marginTop: 30,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', lineHeight: 26 }}>
                  Đặt lịch xem phòng nhanh hơn với tài khoản!
                </Text>
                <Text style={{ color: '#CCDFFF', fontSize: 13, marginTop: 6 }}>
                  Đăng ký miễn phí để lưu yêu thích và đặt lịch hẹn xem phòng.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 20, paddingVertical: 12,
                    borderRadius: 12,
                  }}
                  onPress={() => router.push('/login')}
                >
                  <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Đăng nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 20, paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
                  }}
                  onPress={() => router.push('/register')}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Đăng ký</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========== FOOTER ========== */}
          <View style={styles.footer}>
            <Text style={styles.footerLogo}>🏠 Tìm Trọ</Text>
            <Text style={styles.footerText}>Hệ thống tìm kiếm và quản lý phòng trọ</Text>
            <Text style={styles.copyright}>© 2026 Tìm Trọ</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
