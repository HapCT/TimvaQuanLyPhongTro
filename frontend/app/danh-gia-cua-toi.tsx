import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

interface Review {
  ma_danh_gia: number;
  ma_phong: number;
  so_sao: number;
  noi_dung?: string | null;
  trang_thai: 'HienThi' | 'An';
  ngay_tao?: string;
  tieu_de?: string;
  so_phong?: string;
}

export default function DanhGiaCuaToiScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/danh-gia/mine');
      setReviews(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải đánh giá của bạn.');
    } finally {
      setLoading(false);
    }
  };

  const removeReview = (review: Review) => {
    showAlert('Xóa đánh giá', 'Bạn có chắc muốn xóa đánh giá này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(review.ma_danh_gia);
            await backendApi.delete(`/api/danh-gia/${review.ma_danh_gia}`);
            setReviews((previous) => previous.filter((item) => item.ma_danh_gia !== review.ma_danh_gia));
            showAlert('Đã xóa', 'Đánh giá đã được xóa.');
          } catch (error: any) {
            showAlert('Lỗi', error?.response?.data?.error || 'Không thể xóa đánh giá.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 850, alignSelf: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#2563EB', fontSize: 14 }}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <View>
            <Text style={{ color: '#111827', fontSize: 21, fontWeight: '700' }}>Đánh giá của tôi</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Theo dõi trạng thái hiển thị các đánh giá bạn đã gửi.</Text>
          </View>
          <TouchableOpacity onPress={loadReviews} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
        ) : reviews.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 24, alignItems: 'center', gap: 10 }}>
            <Text style={{ color: '#4B5563', fontSize: 14 }}>Bạn chưa gửi đánh giá nào.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>Tìm phòng để đánh giá</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {reviews.map((review) => (
              <View key={review.ma_danh_gia} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>{review.tieu_de || `Phòng #${review.ma_phong}`}</Text>
                  <Text style={{ color: review.trang_thai === 'HienThi' ? '#15803D' : '#B45309', fontSize: 13 }}>
                    {review.trang_thai === 'HienThi' ? 'Đang hiển thị' : 'Đã ẩn bởi quản trị viên'}
                  </Text>
                </View>
                <Text style={{ color: '#B45309', fontSize: 14 }}>{'★'.repeat(review.so_sao)}{'☆'.repeat(5 - review.so_sao)}</Text>
                <Text style={{ color: '#4B5563', fontSize: 14 }}>{review.noi_dung}</Text>
                <TouchableOpacity
                  onPress={() => removeReview(review)}
                  disabled={deletingId === review.ma_danh_gia}
                  style={{ alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 6, backgroundColor: '#FEF2F2' }}
                >
                  {deletingId === review.ma_danh_gia
                    ? <ActivityIndicator size="small" color="#B91C1C" />
                    : <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '600' }}>Xóa đánh giá</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
