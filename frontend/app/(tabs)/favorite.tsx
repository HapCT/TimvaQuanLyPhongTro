import { formatNumber } from '@/utils/format';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { useFavorites } from '@/hooks/use-favorites';

export default function FavoriteScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const { favoriteRooms, loading, isLoggedIn, reload, toggleFavorite } = useFavorites();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12, backgroundColor: '#F8FAFC' }}>
        <Text style={{ color: '#1F2937', fontSize: 19, fontWeight: '700' }}>Đăng nhập để lưu phòng yêu thích</Text>
        <TouchableOpacity onPress={() => router.push('/login')} style={{ backgroundColor: '#2563EB', borderRadius: 6, paddingHorizontal: 18, paddingVertical: 11 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: isMobile ? 16 : 28, paddingBottom: 40, backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View>
            <Text style={{ color: '#111827', fontSize: 22, fontWeight: '700' }}>Phòng đã lưu</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{favoriteRooms.length} phòng yêu thích</Text>
          </View>
          <TouchableOpacity onPress={reload} style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6 }}>
            <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {favoriteRooms.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 56, gap: 12 }}>
            <Text style={{ color: '#6B7280', fontSize: 15 }}>Bạn chưa lưu phòng nào.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>Tìm phòng trọ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {favoriteRooms.map((room) => (
              <View key={room.ma_phong} style={{ width: isMobile ? '100%' : '48%', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.ma_phong } } as any)}>
                  <Image source={{ uri: room.anh_dai_dien || 'https://placehold.co/600x360/e8f0fe/007AFF?text=Phong+Tro' }} style={{ width: '100%', height: 190 }} resizeMode="cover" />
                  <View style={{ padding: 14, gap: 6 }}>
                    <Text numberOfLines={2} style={{ color: '#1F2937', fontSize: 16, fontWeight: '700' }}>{room.tieu_de || `Phòng ${room.so_phong}`}</Text>
                    <Text numberOfLines={1} style={{ color: '#6B7280', fontSize: 13 }}>{[room.khu_tro?.ten_khu_tro, room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho].filter(Boolean).join(', ') || room.khu_tro?.dia_chi || 'Chưa cập nhật địa chỉ'}</Text>
                    <Text style={{ color: '#2563EB', fontSize: 15, fontWeight: '700' }}>{formatNumber(room.gia_thue || 0)} đ/tháng</Text>
                  </View>
                </TouchableOpacity>
                <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 12, alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => void toggleFavorite(room.ma_phong)}>
                    <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>♥ Bỏ lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
