// Màn hình Tìm kiếm / Khám phá phòng trọ - Đã nâng cấp giao diện đẹp mắt, chuẩn tỉ lệ không méo hình
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { backendApi } from '@/services/backend';
import { supabase } from '@/services/supabase';

const PRICE_FILTERS = [
  { label: 'Tất cả mức giá', min: 0, max: Infinity },
  { label: 'Dưới 2 triệu', min: 0, max: 2_000_000 },
  { label: '2 - 4 triệu', min: 2_000_000, max: 4_000_000 },
  { label: '4 - 6 triệu', min: 4_000_000, max: 6_000_000 },
  { label: 'Trên 6 triệu', min: 6_000_000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'NEWEST', label: '⚡ Mới nhất' },
  { id: 'PRICE_ASC', label: '💰 Giá: Thấp → Cao' },
  { id: 'PRICE_DESC', label: '💎 Giá: Cao → Thấp' },
];

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  const [rooms, setRooms] = useState<any[]>([]);
  const [khuTroList, setKhuTroList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0); // index trong PRICE_FILTERS
  const [selectedKhuTro, setSelectedKhuTro] = useState(''); // ma_khu_tro hoặc '' = tất cả
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ConTrong' | 'DaThue'>('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    checkUser();
    loadData();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    } catch (e) {
      setIsLoggedIn(false);
    }
  };

  const loadData = async () => {
    try {
      const response = await backendApi.get('/api/phong-tro');
      if (response.data) {
        setRooms(response.data.rooms || []);
        setKhuTroList(response.data.khuTroList || []);
      }
    } catch (error) {
      console.log('LOAD ROOMS ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kiêm tra xem có bộ lọc nào đang bật không
  const hasActiveFilters =
    search.trim() !== '' ||
    selectedPrice !== 0 ||
    selectedKhuTro !== '' ||
    selectedStatus !== 'ALL' ||
    sortBy !== 'NEWEST';

  const resetFilters = () => {
    setSearch('');
    setSelectedPrice(0);
    setSelectedKhuTro('');
    setSelectedStatus('ALL');
    setSortBy('NEWEST');
  };

  // ============================
  // LỌC & SẮP XẾP PHÒNG
  // ============================
  const filteredRooms = useMemo(() => {
    const priceFilter = PRICE_FILTERS[selectedPrice];
    const keyword = search.trim().toLowerCase();

    let list = rooms.filter((room) => {
      // Lọc từ khóa
      const matchKeyword =
        !keyword ||
        (room.tieu_de || '').toLowerCase().includes(keyword) ||
        (room.khu_tro?.ten_khu_tro || '').toLowerCase().includes(keyword) ||
        (room.khu_tro?.dia_chi || '').toLowerCase().includes(keyword) ||
        (room.khu_tro?.thanh_pho || '').toLowerCase().includes(keyword) ||
        (room.khu_tro?.quan_huyen || '').toLowerCase().includes(keyword);

      // Lọc giá
      const gia = room.gia_thue || 0;
      const matchPrice = gia >= priceFilter.min && gia < priceFilter.max;

      // Lọc khu trọ
      const matchKhu = !selectedKhuTro || room.ma_khu_tro === selectedKhuTro;

      // Lọc trạng thái
      const matchStatus =
        selectedStatus === 'ALL' || room.trang_thai === selectedStatus;

      return matchKeyword && matchPrice && matchKhu && matchStatus;
    });

    // Sắp xếp
    if (sortBy === 'PRICE_ASC') {
      list = [...list].sort((a, b) => (a.gia_thue || 0) - (b.gia_thue || 0));
    } else if (sortBy === 'PRICE_DESC') {
      list = [...list].sort((a, b) => (b.gia_thue || 0) - (a.gia_thue || 0));
    } else if (sortBy === 'NEWEST') {
      list = [...list].sort((a, b) => (new Date(b.ngay_tao || 0).getTime() - new Date(a.ngay_tao || 0).getTime()));
    }

    return list;
  }, [rooms, search, selectedPrice, selectedKhuTro, selectedStatus, sortBy]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobile ? 15 : 30 },
        ]}
      >
        <View style={[styles.mainContent, { maxWidth: isDesktop ? 1250 : '100%' }]}>

          {/* ========== HERO SEARCH BANNER ========== */}
          <View style={[styles.heroHeader, { padding: isMobile ? 20 : 30 }]}>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>🔍 TÌM KIẾM PHÒNG TRỌ</Text>
            </View>

            <Text style={[styles.heroTitle, { fontSize: isMobile ? 22 : 30 }]}>
              Khám phá phòng trọ phù hợp với bạn
            </Text>
            <Text style={styles.heroSubTitle}>
              Bộ lọc thông minh theo mức giá, vị trí khu vực và tiện nghi
            </Text>

            {/* Ô TÌM KIẾM CHÍNH */}
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Nhập tên phòng, địa chỉ, quận huyện, khu vực..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ========== KHU VỰC BỘ LỌC ========== */}
          <View style={styles.filterSection}>
            
            {/* LỌC THEO GIÁ */}
            <Text style={styles.filterSectionTitle}>💰 Mức giá thuê</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {PRICE_FILTERS.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, selectedPrice === i && styles.chipActive]}
                  onPress={() => setSelectedPrice(i)}
                >
                  <Text style={[styles.chipText, selectedPrice === i && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* LỌC THEO KHU TRỌ */}
            {khuTroList.length > 0 && (
              <>
                <Text style={[styles.filterSectionTitle, { marginTop: 14 }]}>📍 Khu vực / Khu trọ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <TouchableOpacity
                    style={[styles.chip, selectedKhuTro === '' && styles.chipActive]}
                    onPress={() => setSelectedKhuTro('')}
                  >
                    <Text style={[styles.chipText, selectedKhuTro === '' && styles.chipTextActive]}>
                      🏠 Tất cả khu vực
                    </Text>
                  </TouchableOpacity>
                  {khuTroList.map((khu: any) => (
                    <TouchableOpacity
                      key={khu.ma_khu_tro}
                      style={[styles.chip, selectedKhuTro === khu.ma_khu_tro && styles.chipActive]}
                      onPress={() =>
                        setSelectedKhuTro(selectedKhuTro === khu.ma_khu_tro ? '' : khu.ma_khu_tro)
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedKhuTro === khu.ma_khu_tro && styles.chipTextActive,
                        ]}
                      >
                        📍 {khu.ten_khu_tro}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* TRẠNG THÁI & SẮP XẾP */}
            <View style={[styles.rowFilterGroup, isMobile && { flexDirection: 'column', gap: 10 }]}>
              {/* TRẠNG THÁI */}
              <View style={{ flex: 1 }}>
                <Text style={styles.filterSectionTitle}>⚡ Trạng thái</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'ConTrong', label: '🟢 Còn trống' },
                    { id: 'DaThue', label: '🔴 Đã thuê' },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={[styles.smallChip, selectedStatus === st.id && styles.smallChipActive]}
                      onPress={() => setSelectedStatus(st.id as any)}
                    >
                      <Text style={[styles.smallChipText, selectedStatus === st.id && styles.smallChipTextActive]}>
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* SẮP XẾP */}
              <View style={{ flex: 1 }}>
                <Text style={styles.filterSectionTitle}>🔃 Sắp xếp</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.smallChip, sortBy === opt.id && styles.smallChipActive]}
                      onPress={() => setSortBy(opt.id)}
                    >
                      <Text style={[styles.smallChipText, sortBy === opt.id && styles.smallChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* NÚT ĐẶT LẠI BỘ LỌC */}
            {hasActiveFilters && (
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>🔄 Đặt lại tất cả bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ========== KẾT QUẢ TÌM KIẾM ========== */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              {loading ? 'Đang tải phòng trọ...' : `Tìm thấy ${filteredRooms.length} phòng trọ phù hợp`}
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 50, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ color: '#888', marginTop: 12 }}>Đang tải danh sách phòng trọ...</Text>
            </View>
          ) : filteredRooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy phòng trọ phù hợp</Text>
              <Text style={styles.emptySubText}>
                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng giá, khu vực.
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.emptyResetBtn} onPress={resetFilters}>
                  <Text style={styles.emptyResetText}>Xóa bộ lọc để xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* DANH SÁCH PHÒNG GRID - ĐÃ CHUẨN TỈ LỆ KHÔNG BỊ MÉO HÌNH */
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
                  {/* HÌNH ẢNH CARD - DÙNG RESIZEMODE COVER GIÚP KHÔNG BỊ MÉO */}
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{
                        uri:
                          room.anh_dai_dien ||
                          'https://placehold.co/400x300/e8f0fe/007AFF?text=Phong+Tro',
                      }}
                      style={styles.roomImage}
                      resizeMode="cover"
                    />

                    {/* BADGE TRẠNG THÁI */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            room.trang_thai === 'ConTrong' ? '#34C759' : '#FF3B30',
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {room.trang_thai === 'ConTrong' ? 'Còn trống' : 'Đã thuê'}
                      </Text>
                    </View>

                    {/* NÚT YÊU THÍCH */}
                    <TouchableOpacity
                      style={styles.heartBtn}
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

                  {/* THÔNG TIN PHÒNG */}
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName} numberOfLines={2}>
                      {room.tieu_de || `Phòng ${room.so_phong}`}
                    </Text>

                    <Text style={styles.roomAddress} numberOfLines={1}>
                      📍{' '}
                      {[room.khu_tro?.ten_khu_tro, room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho]
                        .filter(Boolean)
                        .join(', ') || 'Địa chỉ đang cập nhật'}
                    </Text>

                    {/* TIỆN ÍCH PHÒNG */}
                    {room.danh_sach_tien_ich && room.danh_sach_tien_ich.length > 0 && (
                      <View style={styles.tienIchRow}>
                        {room.danh_sach_tien_ich.slice(0, 3).map((ti: any) => (
                          <View key={ti.ma_tien_ich} style={styles.tienIchTag}>
                            <Text style={styles.tienIchText}>{ti.ten_tien_ich}</Text>
                          </View>
                        ))}
                        {room.danh_sach_tien_ich.length > 3 && (
                          <View style={styles.tienIchTag}>
                            <Text style={styles.tienIchText}>
                              +{room.danh_sach_tien_ich.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* GIÁ THUÊ VÀ DIỆN TÍCH */}
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

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 50,
  },
  mainContent: {
    width: '100%',
    alignSelf: 'center',
  },

  // HERO SEARCH BANNER
  heroHeader: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeLabel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 38,
  },
  heroSubTitle: {
    color: '#EAF3FF',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,
  clearBtn: {
    padding: 8,
  },
  clearText: {
    color: '#999',
    fontSize: 16,
  },

  // BỘ LỌC
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipScroll: {
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#F5F7FB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  rowFilterGroup: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F8',
  },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F5F7FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  smallChipText: {
    fontSize: 12,
    color: '#555',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  resetBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF1F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  resetBtnText: {
    color: '#FF4D4F',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // KẾT QUẢ TÌM KIẾM
  resultHeader: {
    marginBottom: 14,
  },
  resultCount: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyIcon: {
    fontSize: 54,
  },
  emptyTitle: {
    fontSize: 17,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyResetBtn: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // GRID VÀ ROOM CARD
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 195,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heartText: {
    fontSize: 22,
    color: '#555',
    marginTop: -2,
  },

  // INFO
  roomInfo: {
    padding: 14,
  },
  roomName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 21,
    minHeight: 42,
  },
  roomAddress: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
  },
  tienIchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tienIchTag: {
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tienIchText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '500',
  },
  roomBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F7FB',
  },
  price: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  area: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
});
