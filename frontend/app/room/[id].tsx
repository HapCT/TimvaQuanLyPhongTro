import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, StatusBar, FlatList, NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { backendApi } from '@/services/backend';

const { width } = Dimensions.get('window');

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadRoomDetails();
  }, [id]);

  const loadRoomDetails = async () => {
    try {
      const response = await backendApi.get('/api/phong-tro');
      if (response.data && response.data.rooms) {
        const found = response.data.rooms.find((r: any) => String(r.ma_phong) === String(id));
        setRoom(found);
      }
    } catch (error) {
      console.log('LOAD ROOM DETAILS ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin phòng trọ.</Text>
        <TouchableOpacity style={styles.backButtonErr} onPress={() => router.back()}>
          <Text style={styles.backButtonTextErr}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Danh sách ảnh: ưu tiên danh_sach_anh, fallback về ảnh đại diện
  const images: string[] = (room.danh_sach_anh && room.danh_sach_anh.length > 0)
    ? room.danh_sach_anh.map((a: any) => a.duong_dan_anh).filter(Boolean)
    : [room.anh_dai_dien || 'https://via.placeholder.com/600x400?text=No+Image'];

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(index);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HERO IMAGE CAROUSEL */}
        <View style={styles.heroContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            style={{ width, height: 320 }}
          >
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={[styles.heroImage, { width }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dot indicators */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Số ảnh */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{activeImageIndex + 1}/{images.length}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
             <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.favoriteButton}>
             <Text style={[styles.iconText, { color: '#FF4757' }]}>♡</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          {/* Tag & Title */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: room.trang_thai === 'ConTrong' ? '#DEF7EC' : '#FDE8E8' }]}>
              <Text style={[styles.tagText, { color: room.trang_thai === 'ConTrong' ? '#03543F' : '#9B1C1C' }]}>
                {room.trang_thai === 'ConTrong' ? 'Còn trống' : 'Đã thuê'}
              </Text>
            </View>
            <View style={styles.tagArea}>
              <Text style={styles.tagAreaText}>{room.dien_tich ? `${room.dien_tich} m²` : '--'}</Text>
            </View>
          </View>

          <Text style={styles.title}>{room.tieu_de || `Phòng ${room.so_phong}`}</Text>
          <Text style={styles.price}>{room.gia_thue?.toLocaleString('vi-VN')} đ<Text style={styles.priceMonth}> /tháng</Text></Text>

          {/* Location */}
          <View style={styles.locationContainer}>
             <Text style={styles.locationIcon}>📍</Text>
             <Text style={styles.locationText}>
               {[room.khu_tro?.dia_chi, room.khu_tro?.phuong_xa, room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho].filter(Boolean).join(', ')}
             </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Landlord Info */}
          <View style={styles.landlordContainer}>
             <View style={styles.landlordAvatar}>
               <Text style={styles.landlordAvatarText}>{room.ten_chu_tro ? room.ten_chu_tro.charAt(0).toUpperCase() : 'C'}</Text>
             </View>
             <View style={styles.landlordInfo}>
               <Text style={styles.landlordName}>{room.ten_chu_tro || 'Chủ trọ ẩn danh'}</Text>
               <Text style={styles.landlordRole}>Chủ cho thuê</Text>
             </View>
             <TouchableOpacity style={styles.callButton}>
               <Text style={styles.callIcon}>📞</Text>
             </TouchableOpacity>
          </View>

          {/* Utilities */}
          {room.danh_sach_tien_ich && room.danh_sach_tien_ich.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Tiện ích nổi bật</Text>
              <View style={styles.utilitiesContainer}>
                {room.danh_sach_tien_ich.map((tienIch: any, index: number) => (
                  <View key={index} style={styles.utilityItem}>
                    <View style={styles.utilityIconBox}>
                       <Text style={styles.utilityIcon}>✨</Text>
                    </View>
                    <Text style={styles.utilityText}>{tienIch.ten_tien_ich}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Description */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          <Text style={styles.description}>
            {room.mo_ta || 'Chưa có mô tả chi tiết cho phòng trọ này.'}
          </Text>

        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
           <Text style={styles.bottomPriceLabel}>Giá thuê</Text>
           <Text style={styles.bottomPriceValue}>{room.gia_thue?.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity style={styles.rentButton}>
          <Text style={styles.rentButtonText}>Liên hệ ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFE',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFE',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  backButtonErr: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonTextErr: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  
  heroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroImage: {
    height: 320,
    backgroundColor: '#F1F5F9',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconText: {
    fontSize: 22,
    color: '#1E293B',
    lineHeight: 24,
    marginTop: -2,
  },
  
  contentContainer: {
    padding: 24,
    backgroundColor: '#FAFCFE',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontWeight: '700',
    fontSize: 13,
  },
  tagArea: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tagAreaText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 20,
  },
  priceMonth: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  
  landlordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landlordAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  landlordInfo: {
    flex: 1,
    marginLeft: 16,
  },
  landlordName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  landlordRole: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DEF7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 20,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  utilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 48 - 12) / 2, // 2 columns
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  utilityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  utilityIcon: {
    fontSize: 16,
  },
  utilityText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20, // for safe area
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
  },
  rentButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  rentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
