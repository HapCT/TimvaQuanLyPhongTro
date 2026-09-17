
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
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';
import Header from '@/components/common/Header';
import { styles } from '@/styles/home.styles';

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  const [hoTen, setHoTen] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getUser();
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await backendApi.get('/api/phong-tro');
      if (response.data && response.data.rooms) {
        // Show all rooms or filter by 'Trong'
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.log('LOAD ROOMS ERROR:', error);
    }
  };

  const getUser = async () => {
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
        console.log('HOME USER ERROR:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
        const role = String(data.vai_tro || '').trim();
        if (role === 'Admin' || role === 'QuanTri') {
          router.replace('/admin');
          return;
        }
      }
    } catch (error) {
      console.log('GET USER ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return (
      (room.tieu_de || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.dia_chi || '').toLowerCase().includes(keyword) ||
      (room.khu_tro?.thanh_pho || '').toLowerCase().includes(keyword)
    );
  });

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isMobile ? 15 : 30,
          },
        ]}
      >
        <View
          style={[
            styles.content,
            {
              maxWidth: isDesktop ? 1250 : '100%',
            },
          ]}
        >
          {/* GREETING */}

          <View style={styles.greeting}>
            <Text
              style={[
                styles.greetingTitle,
                {
                  fontSize: isMobile ? 21 : 25,
                },
              ]}
            >
              Xin chào {hoTen || 'bạn'} 👋
            </Text>

            <Text style={styles.greetingText}>
              Hãy tìm cho mình một căn phòng phù hợp nhé!
            </Text>
          </View>

          {/* HERO */}

          <View
            style={[
              styles.hero,
              {
                padding: isMobile ? 20 : 35,
              },
            ]}
          >
            <View style={styles.heroLeft}>
              <Text
                style={[
                  styles.heroTitle,
                  {
                    fontSize: isMobile ? 25 : 36,
                    lineHeight: isMobile ? 32 : 43,
                  },
                ]}
              >
                Tìm phòng trọ
                {'\n'}
                phù hợp với bạn
              </Text>

              <Text
                style={[
                  styles.heroDescription,
                  {
                    fontSize: isMobile ? 13 : 15,
                  },
                ]}
              >
                Tìm kiếm hàng trăm phòng trọ
                nhanh chóng, tiện lợi và dễ dàng.
              </Text>

              {/* SEARCH */}

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>
                  🔍
                </Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm tên phòng, khu vực..."
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                />

                {!isMobile && (
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => router.push('/search' as any)}
                  >
                    <Text style={styles.searchButtonText}>
                      Tìm kiếm
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isMobile && (
                <TouchableOpacity
                  style={styles.mobileSearchButton}
                  onPress={() => router.push('/search' as any)}
                >
                  <Text style={styles.searchButtonText}>
                    Tìm kiếm
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!isMobile && (
              <View style={styles.heroRight}>
                <Text style={styles.house}>
                  🏠
                </Text>
              </View>
            )}
          </View>

          {/* QUICK FILTER */}

          <Text style={styles.sectionTitle}>
            Tìm kiếm nhanh
          </Text>

          <View
            style={[
              styles.filterRow,
              isMobile && styles.filterMobile,
            ]}
          >
            <TouchableOpacity style={styles.filterCard}>
              <Text style={styles.filterIcon}>📍</Text>

              <View style={styles.filterInfo}>
                <Text style={styles.filterLabel}>
                  Khu vực
                </Text>

                <Text style={styles.filterValue}>
                  Chọn khu vực
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterCard}>
              <Text style={styles.filterIcon}>💰</Text>

              <View style={styles.filterInfo}>
                <Text style={styles.filterLabel}>
                  Mức giá
                </Text>

                <Text style={styles.filterValue}>
                  Chọn mức giá
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterCard}>
              <Text style={styles.filterIcon}>📐</Text>

              <View style={styles.filterInfo}>
                <Text style={styles.filterLabel}>
                  Diện tích
                </Text>

                <Text style={styles.filterValue}>
                  Chọn diện tích
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* FEATURED */}

          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                Phòng trọ nổi bật
              </Text>

              <Text style={styles.sectionDescription}>
                Những phòng trọ được quan tâm nhiều nhất
              </Text>
            </View>

            {!isMobile && (
              <TouchableOpacity
                onPress={() => router.push('/search' as any)}
              >
                <Text style={styles.seeAll}>
                  Xem tất cả →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ROOM GRID */}

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={{ marginTop: 30 }}
            />
          ) : (
            <View style={styles.roomGrid}>
              {filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room.ma_phong}
                  style={[
                    styles.roomCard,
                    {
                      width: isMobile
                        ? '100%'
                        : isTablet
                        ? '48%'
                        : '31.8%',
                    },
                  ]}
                  onPress={() =>
                    console.log('CHỌN PHÒNG:', room)
                  }
                >
                  <View>
                    <Image
                      source={{ uri: room.anh_dai_dien || 'https://via.placeholder.com/300x200?text=No+Image' }}
                      style={[
                        styles.roomImage,
                        {
                          height: isMobile ? 200 : 190,
                        },
                      ]}
                    />

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        Nổi bật
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.heart}
                      onPress={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Text style={styles.heartText}>
                        ♡
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.roomInfo}>
                    <Text
                      style={styles.roomName}
                      numberOfLines={2}
                    >
                      {room.tieu_de || `Phòng ${room.so_phong}`}
                    </Text>

                    <Text
                      style={styles.address}
                      numberOfLines={1}
                    >
                      📍 {[room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho].filter(Boolean).join(', ') || 'Chưa rõ'}
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

          {/* NEW ROOMS */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Phòng mới đăng
              </Text>

              <Text style={styles.sectionDescription}>
                Những phòng trọ mới được đăng tải
              </Text>
            </View>
          </View>

          <View style={styles.newRooms}>
            {filteredRooms.map((room) => (
              <TouchableOpacity
                key={`new-${room.ma_phong}`}
                style={styles.newRoom}
                onPress={() =>
                  console.log('CHỌN PHÒNG:', room)
                }
              >
                <Image
                  source={{ uri: room.anh_dai_dien || 'https://via.placeholder.com/300x200?text=No+Image' }}
                  style={styles.newImage}
                />

                <View style={styles.newInfo}>
                  <Text
                    style={styles.newName}
                    numberOfLines={2}
                  >
                    {room.tieu_de || `Phòng ${room.so_phong}`}
                  </Text>

                  <Text
                    style={styles.newAddress}
                    numberOfLines={1}
                  >
                    📍 {[room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho].filter(Boolean).join(', ') || 'Chưa rõ'}
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

                {!isMobile && (
                  <Text style={styles.arrow}>
                    →
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.footerLogo}>
              🏠 Tìm Trọ
            </Text>

            <Text style={styles.footerText}>
              Hệ thống tìm kiếm và quản lý phòng trọ
            </Text>

            <Text style={styles.copyright}>
              © 2026 Tìm Trọ
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


