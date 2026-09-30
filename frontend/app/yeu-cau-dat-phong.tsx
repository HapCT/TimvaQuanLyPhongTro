import { formatNumber } from '@/utils/format';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

type BookingStatus = 'ChoDuyet' | 'DaDuyet' | 'TuChoi';

interface Booking {
  ma_dat_phong: number;
  trang_thai: BookingStatus;
  ngay_dat?: string;
  ngay_tao?: string;
  ngay_du_kien_nhan_phong?: string | null;
  ghi_chu?: string | null;
  phong_tro?: {
    tieu_de?: string;
    so_phong?: string;
    gia_thue?: number;
    ten_khu_tro?: string;
    dia_chi?: string;
  };
}

const FILTERS: { id: BookingStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'ChoDuyet', label: 'Chờ duyệt' },
  { id: 'DaDuyet', label: 'Đã chấp nhận' },
  { id: 'TuChoi', label: 'Từ chối' },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  ChoDuyet: 'Đang chờ chủ trọ',
  DaDuyet: 'Đã được chấp nhận',
  TuChoi: 'Không được chấp nhận',
};

export default function YeuCauDatPhongScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/dat-phong');
      setBookings(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải yêu cầu đặt phòng.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === 'ALL' || booking.trang_thai === statusFilter
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 850, alignSelf: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#2563EB', fontSize: 14 }}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <View>
            <Text style={{ color: '#111827', fontSize: 21, fontWeight: '700' }}>Yêu cầu đặt phòng của tôi</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Theo dõi phản hồi từ chủ trọ.</Text>
          </View>
          <TouchableOpacity onPress={loadBookings} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setStatusFilter(filter.id)}
              style={{ paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: statusFilter === filter.id ? '#2563EB' : '#E5E7EB', borderRadius: 6, backgroundColor: statusFilter === filter.id ? '#EFF6FF' : '#FFFFFF' }}
            >
              <Text style={{ color: statusFilter === filter.id ? '#1D4ED8' : '#4B5563', fontSize: 13 }}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
        ) : filteredBookings.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 8, alignItems: 'center', gap: 10 }}>
            <Text style={{ color: '#4B5563', fontSize: 14 }}>Chưa có yêu cầu đặt phòng ở trạng thái này.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>Tìm phòng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredBookings.map((booking) => (
              <View key={booking.ma_dat_phong} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700', flex: 1 }}>
                    {booking.phong_tro?.tieu_de || `Phòng ${booking.phong_tro?.so_phong || ''}`}
                  </Text>
                  <Text style={{ color: booking.trang_thai === 'DaDuyet' ? '#15803D' : booking.trang_thai === 'TuChoi' ? '#B91C1C' : '#B45309', fontSize: 13, fontWeight: '600' }}>
                    {STATUS_LABEL[booking.trang_thai]}
                  </Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13 }}>{booking.phong_tro?.ten_khu_tro || 'Khu trọ'} · {booking.phong_tro?.dia_chi || 'Địa chỉ đang cập nhật'}</Text>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>
                  Ngày gửi: {booking.ngay_dat || booking.ngay_tao || '—'}
                  {booking.ngay_du_kien_nhan_phong ? ` · Dự kiến nhận: ${booking.ngay_du_kien_nhan_phong}` : ''}
                </Text>
                {!!booking.phong_tro?.gia_thue && <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>{formatNumber(booking.phong_tro.gia_thue)} đ/tháng</Text>}
                {!!booking.ghi_chu && <Text style={{ color: '#4B5563', fontSize: 13 }}>Ghi chú: {booking.ghi_chu}</Text>}
                {booking.trang_thai === 'DaDuyet' && (
                  <TouchableOpacity onPress={() => router.push('/hop-dong-cua-toi' as any)} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Xem hợp đồng và thanh toán →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
