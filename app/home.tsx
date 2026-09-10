
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
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import Header from './components/Header';

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  const [hoTen, setHoTen] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const rooms = [
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
    {
      id: 4,
      ten: 'Phòng trọ khép kín mới xây',
      diaChi: 'Phố Nối, Hưng Yên',
      gia: '2.200.000',
      dienTich: '22 m²',
      image:
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
    },
  ];

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('D:\\ReactNative\\BaiTapLonQuanlyTro\\Btl_QuanLyPhongTro\\app\\auth\\login.tsx');
        return;
      }

      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('ho_ten')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error) {
        console.log('HOME USER ERROR:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
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
      room.ten.toLowerCase().includes(keyword) ||
      room.diaChi.toLowerCase().includes(keyword)
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
                    onPress={() => router.push('/search')}
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
                  onPress={() => router.push('/search')}
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
                onPress={() => router.push('/search')}
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
                  key={room.id}
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
                      source={{ uri: room.image }}
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
                      {room.ten}
                    </Text>

                    <Text
                      style={styles.address}
                      numberOfLines={1}
                    >
                      📍 {room.diaChi}
                    </Text>

                    <View style={styles.roomBottom}>
                      <Text style={styles.price}>
                        {room.gia} đ/tháng
                      </Text>

                      <Text style={styles.area}>
                        {room.dienTich}
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
                key={`new-${room.id}`}
                style={styles.newRoom}
                onPress={() =>
                  console.log('CHỌN PHÒNG:', room)
                }
              >
                <Image
                  source={{ uri: room.image }}
                  style={styles.newImage}
                />

                <View style={styles.newInfo}>
                  <Text
                    style={styles.newName}
                    numberOfLines={2}
                  >
                    {room.ten}
                  </Text>

                  <Text
                    style={styles.newAddress}
                    numberOfLines={1}
                  >
                    📍 {room.diaChi}
                  </Text>

                  <View style={styles.newBottom}>
                    <Text style={styles.newPrice}>
                      {room.gia} đ/tháng
                    </Text>

                    <Text style={styles.newArea}>
                      {room.dienTich}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  scrollContent: {
    paddingTop: 10,
    paddingBottom: 50,
  },

  content: {
    width: '100%',
    alignSelf: 'center',
  },

  greeting: {
    marginTop: 15,
    marginBottom: 20,
  },

  greetingTitle: {
    fontWeight: 'bold',
    color: '#222',
  },

  greetingText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  // HERO

  hero: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minHeight: 270,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  heroLeft: {
    flex: 1,
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  heroDescription: {
    color: '#EAF3FF',
    marginTop: 12,
    marginBottom: 20,
    maxWidth: 600,
    lineHeight: 21,
  },

  heroRight: {
    width: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },

  house: {
    fontSize: 115,
  },

  // SEARCH

  searchBox: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    height: 52,
    color: '#222',
    fontSize: 14,
    outlineStyle: 'none',
  } as any,

  searchButton: {
    backgroundColor: '#0066D6',
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mobileSearchButton: {
    backgroundColor: '#0066D6',
    minHeight: 48,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // SECTION

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 30,
    marginBottom: 5,
  },

  sectionDescription: {
    fontSize: 13,
    color: '#888',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 5,
    marginBottom: 15,
  },

  seeAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // FILTER

  filterRow: {
    flexDirection: 'row',
    gap: 14,
  },

  filterMobile: {
    flexDirection: 'column',
  },

  filterCard: {
    flex: 1,
    minHeight: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterIcon: {
    fontSize: 26,
    marginRight: 12,
  },

  filterInfo: {
    flex: 1,
  },

  filterLabel: {
    color: '#888',
    fontSize: 12,
  },

  filterValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  // ROOM

  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },

  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 5,
  },

  roomImage: {
    width: '100%',
    backgroundColor: '#EEEEEE',
  },

  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heartText: {
    fontSize: 25,
    color: '#555',
  },

  roomInfo: {
    padding: 15,
  },

  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 21,
    minHeight: 42,
  },

  address: {
    color: '#777',
    fontSize: 13,
    marginTop: 8,
  },

  roomBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  price: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  area: {
    color: '#666',
    fontSize: 13,
  },

  // NEW ROOMS

  newRooms: {
    gap: 12,
  },

  newRoom: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  newImage: {
    width: 120,
    height: 95,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
  },

  newInfo: {
    flex: 1,
    marginLeft: 14,
  },

  newName: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
  },

  newAddress: {
    color: '#777',
    fontSize: 12,
    marginTop: 7,
  },

  newBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  newPrice: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  newArea: {
    color: '#666',
    fontSize: 12,
  },

  arrow: {
    fontSize: 22,
    color: '#999',
    paddingHorizontal: 10,
  },

  // FOOTER

  footer: {
    marginTop: 50,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },

  footerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },

  footerText: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },

  copyright: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
});

