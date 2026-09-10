
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';

export default function HomeScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
    loadRooms();
  }, []);

  // =========================
  // LẤY THÔNG TIN NGƯỜI DÙNG
  // =========================
  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('ho_ten')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error) {
        console.log('LỖI LẤY NGƯỜI DÙNG:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
      }
    } catch (error) {
      console.log('LOAD USER ERROR:', error);
    }
  };

  // =========================
  // LẤY DANH SÁCH PHÒNG
  // =========================
  const loadRooms = async () => {
    try {
      /*
       * Tạm thời dùng dữ liệu mẫu.
       *
       * Khi bảng phòng_trọ của bạn hoàn thiện,
       * chúng ta sẽ thay phần này bằng Supabase.
       */

      const demoRooms = [
        {
          id: 1,
          ten: 'Phòng trọ gần trường đại học',
          diaChi: 'Mỹ Hào, Hưng Yên',
          gia: '2.500.000',
          dienTich: '25 m²',
          image:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        },
        {
          id: 2,
          ten: 'Phòng trọ đầy đủ nội thất',
          diaChi: 'Nhân Hòa, Mỹ Hào',
          gia: '3.000.000',
          dienTich: '30 m²',
          image:
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
        },
        {
          id: 3,
          ten: 'Phòng trọ giá rẻ',
          diaChi: 'Bần Yên Nhân, Hưng Yên',
          gia: '1.800.000',
          dienTich: '20 m²',
          image:
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
        },
      ];

      setRooms(demoRooms);
    } catch (error) {
      console.log('LOAD ROOMS ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TÌM KIẾM
  // =========================
  const filteredRooms = rooms.filter((room) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return true;

    return (
      room.ten.toLowerCase().includes(keyword) ||
      room.diaChi.toLowerCase().includes(keyword)
    );
  });

  // =========================
  // ĐĂNG XUẤT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>Xin chào 👋</Text>

            <Text style={styles.userName}>
              {hoTen || 'Người thuê'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>
              {hoTen ? hoTen.charAt(0).toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= TITLE ================= */}
        <View style={styles.titleArea}>
          <Text style={styles.mainTitle}>
            Tìm phòng trọ phù hợp
          </Text>

          <Text style={styles.subTitle}>
            Tìm kiếm phòng trọ nhanh chóng và dễ dàng
          </Text>
        </View>

        {/* ================= SEARCH ================= */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc khu vực..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* ================= FILTER ================= */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>📍</Text>
            <Text style={styles.filterText}>Khu vực</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>💰</Text>
            <Text style={styles.filterText}>Mức giá</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>📐</Text>
            <Text style={styles.filterText}>Diện tích</Text>
          </TouchableOpacity>
        </View>

        {/* ================= BANNER ================= */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              Tìm phòng dễ dàng hơn
            </Text>

            <Text style={styles.bannerText}>
              Hàng trăm phòng trọ đang chờ bạn
            </Text>

            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.bannerButtonText}>
                Tìm phòng ngay
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bannerEmoji}>🏠</Text>
        </View>

        {/* ================= SECTION ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Phòng trọ nổi bật
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
          >
            <Text style={styles.seeAll}>
              Xem tất cả
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= ROOM LIST ================= */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 30 }}
          />
        ) : filteredRooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏠</Text>

            <Text style={styles.emptyText}>
              Không tìm thấy phòng trọ
            </Text>
          </View>
        ) : (
          filteredRooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => {
                console.log('CHỌN PHÒNG:', room);
              }}
            >
              <Image
                source={{ uri: room.image }}
                style={styles.roomImage}
              />

              <View style={styles.roomInfo}>
                <Text
                  style={styles.roomName}
                  numberOfLines={2}
                >
                  {room.ten}
                </Text>

                <Text
                  style={styles.roomAddress}
                  numberOfLines={1}
                >
                  📍 {room.diaChi}
                </Text>

                <View style={styles.roomBottom}>
                  <Text style={styles.roomPrice}>
                    {room.gia} đ/tháng
                  </Text>

                  <Text style={styles.roomArea}>
                    {room.dienTich}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.favorite}
                onPress={(e) => {
                  e.stopPropagation();
                }}
              >
                <Text style={styles.favoriteText}>
                  ♡
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* ================= QUICK ACTION ================= */}
        <Text style={styles.sectionTitle}>
          Tiện ích
        </Text>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard}>
            <Text style={styles.quickIcon}>❤️</Text>
            <Text style={styles.quickText}>
              Phòng yêu thích
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard}>
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickText}>
              Đơn thuê của tôi
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLE
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  smallText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },

  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  titleArea: {
    marginTop: 28,
  },

  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
  },

  subTitle: {
    marginTop: 7,
    fontSize: 14,
    color: '#777',
  },

  searchBox: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  searchIcon: {
    fontSize: 27,
    color: '#777',
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  filterButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  filterText: {
    fontSize: 13,
    color: '#333',
  },

  banner: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    marginTop: 20,
    padding: 20,
    minHeight: 155,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  bannerText: {
    color: '#EAF3FF',
    fontSize: 13,
    marginTop: 7,
    lineHeight: 19,
  },

  bannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 15,
  },

  bannerButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  bannerEmoji: {
    fontSize: 65,
    position: 'absolute',
    right: 15,
    bottom: 15,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 25,
    marginBottom: 12,
  },

  seeAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },

  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  roomImage: {
    width: 115,
    height: 125,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
  },

  roomInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 20,
  },

  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 22,
  },

  roomAddress: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
  },

  roomBottom: {
    marginTop: 20,
  },

  roomPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  roomArea: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  favorite: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteText: {
    fontSize: 24,
    color: '#777',
  },

  empty: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 14,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyText: {
    marginTop: 10,
    color: '#777',
    fontSize: 15,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  quickIcon: {
    fontSize: 30,
  },

  quickText: {
    marginTop: 8,
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },

  logoutButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  logoutText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

