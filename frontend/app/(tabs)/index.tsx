
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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/tabs/index.styles';

export default function HomeScreen() {
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
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
        .select('ho_ten, vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error) {
        console.log('LỖI LẤY NGƯỜI DÙNG:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
        const role = String(data.vai_tro || '').trim();
        if (role === 'Admin' || role === 'QuanTri') {
          if (Platform.OS === 'web') {
            router.replace('/admin');
            return;
          } else {
            // Trên điện thoại, Admin sẽ bị coi như một Người Dùng bình thường để trải nghiệm App
            setAuthChecking(false);
            return;
          }
        }
      }
      
      // Nếu là user thường, cho phép render màn hình
      setAuthChecking(false);
    } catch (error) {
      console.log('LỖI KIỂM TRA QUYỀN:', error);
      setAuthChecking(false);
    }
  };

  // =========================
  // LẤY DANH SÁCH PHÒNG
  // =========================
  const loadRooms = async () => {
    try {
      const response = await backendApi.get('/api/phong-tro');
      if (response.data && response.data.rooms) {
        setRooms(response.data.rooms);
      }
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
      (room.tieu_de || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.dia_chi || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.thanh_pho || '').toLowerCase().includes(keyword)
    );
  });

  // =========================
  // ĐĂNG XUẤT
  // =========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (authChecking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
            onPress={() => router.push('/(tabs)/profile' as any)}
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
              onPress={() => router.push('/(tabs)/search' as any)}
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
            onPress={() => router.push('/(tabs)/search' as any)}
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
              key={room.ma_phong}
              style={styles.roomCard}
              onPress={() => {
                router.push(`/room/${room.ma_phong}` as any);
              }}
            >
              <Image
                source={{ uri: room.anh_dai_dien || 'https://via.placeholder.com/300x200?text=No+Image' }}
                style={styles.roomImage}
              />

              <View style={styles.roomInfo}>
                <Text
                  style={styles.roomName}
                  numberOfLines={2}
                >
                  {room.tieu_de || `Phòng ${room.so_phong}`}
                </Text>

                <Text
                  style={styles.roomAddress}
                  numberOfLines={1}
                >
                  📍 {[room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho].filter(Boolean).join(', ') || 'Chưa rõ'}
                </Text>

                <View style={styles.roomBottom}>
                  <Text style={styles.roomPrice}>
                    {room.gia_thue?.toLocaleString('vi-VN')} đ/tháng
                  </Text>

                  <Text style={styles.roomArea}>
                    {room.dien_tich ? `${room.dien_tich} m²` : '--'}
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



