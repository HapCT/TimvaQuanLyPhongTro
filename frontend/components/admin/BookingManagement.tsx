import { formatNumber } from '@/utils/format';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import Pagination, { ADMIN_PAGE_SIZE } from '@/components/admin/Pagination';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';

type BookingStatus = 'ChoDuyet' | 'DaDuyet' | 'TuChoi';

interface Booking {
  ma_dat_phong: number;
  ma_phong: number;
  trang_thai: BookingStatus;
  ngay_du_kien_nhan_phong?: string | null;
  ngay_tao?: string | null;
  ghi_chu?: string | null;
  ho_ten?: string;
  so_dien_thoai?: string;
  phong_tro?: {
    tieu_de?: string;
    so_phong?: string;
    gia_thue?: number;
    ten_khu_tro?: string;
  };
}

const STATUS_FILTERS: { value: BookingStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ChoDuyet', label: 'Chờ duyệt' },
  { value: 'DaDuyet', label: 'Đã duyệt' },
  { value: 'TuChoi', label: 'Từ chối' },
];

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/dat-phong');
      setBookings(response.data || []);
    } catch (error: any) {
      console.log('ADMIN LOAD BOOKINGS ERROR:', error?.response?.data || error);
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải yêu cầu đặt phòng.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => statusFilter === 'ALL' || booking.trang_thai === statusFilter
  );
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const updateStatus = async (booking: Booking, status: Exclude<BookingStatus, 'ChoDuyet'>) => {
    try {
      setProcessingId(booking.ma_dat_phong);
      await backendApi.put(`/api/dat-phong/${booking.ma_dat_phong}/status`, { trang_thai: status });
      setBookings((previous) => previous.map((item) => (
        item.ma_dat_phong === booking.ma_dat_phong ? { ...item, trang_thai: status } : item
      )));
      showAlert('Thành công', status === 'DaDuyet' ? 'Đã chấp nhận yêu cầu.' : 'Đã từ chối yêu cầu.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật yêu cầu.');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Yêu cầu đặt phòng</Text>
          <Text style={styles.sectionSub}>Xem và xử lý yêu cầu của người thuê trên toàn hệ thống.</Text>
        </View>
        <TouchableOpacity
          style={{ paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, backgroundColor: '#FFFFFF' }}
          onPress={loadBookings}
          disabled={loading}
        >
          <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: '600' }}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setStatusFilter(filter.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: statusFilter === filter.value ? '#007AFF' : '#E5E7EB',
              borderRadius: 6,
              backgroundColor: statusFilter === filter.value ? '#EAF3FF' : '#FFFFFF',
            }}
          >
            <Text style={{ color: statusFilter === filter.value ? '#007AFF' : '#4B5563', fontSize: 13 }}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Không có yêu cầu đặt phòng</Text>
          <Text style={styles.emptyText}>Yêu cầu mới sẽ xuất hiện tại đây.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {paginatedBookings.map((booking) => (
            <View
              key={booking.ma_dat_phong}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 16,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                {booking.ho_ten || 'Người thuê'} · {booking.phong_tro?.tieu_de || `Phòng #${booking.ma_phong}`}
              </Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>
                Số điện thoại: {booking.so_dien_thoai || 'Chưa cập nhật'}
              </Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>
                Khu trọ: {booking.phong_tro?.ten_khu_tro || 'Chưa xác định'}
                {booking.phong_tro?.so_phong ? ` · Phòng ${booking.phong_tro.so_phong}` : ''}
              </Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>
                Ngày dự kiến nhận: {booking.ngay_du_kien_nhan_phong || 'Chưa chọn'}
                {booking.phong_tro?.gia_thue ? ` · ${formatNumber(booking.phong_tro.gia_thue)} đ/tháng` : ''}
              </Text>
              {!!booking.ghi_chu && <Text style={{ color: '#4B5563', fontSize: 13 }}>Ghi chú: {booking.ghi_chu}</Text>}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Text style={{ color: booking.trang_thai === 'DaDuyet' ? '#15803D' : booking.trang_thai === 'TuChoi' ? '#B91C1C' : '#B45309', fontSize: 13, fontWeight: '600' }}>
                  {STATUS_FILTERS.find((filter) => filter.value === booking.trang_thai)?.label}
                </Text>
                {booking.trang_thai === 'ChoDuyet' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      disabled={processingId === booking.ma_dat_phong}
                      onPress={() => updateStatus(booking, 'TuChoi')}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#FEF2F2' }}
                    >
                      <Text style={{ color: '#B91C1C', fontSize: 13 }}>Từ chối</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={processingId === booking.ma_dat_phong}
                      onPress={() => updateStatus(booking, 'DaDuyet')}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#EAF3FF' }}
                    >
                      {processingId === booking.ma_dat_phong
                        ? <ActivityIndicator size="small" color="#007AFF" />
                        : <Text style={{ color: '#007AFF', fontSize: 13 }}>Chấp nhận</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredBookings.length}
          onPageChange={setCurrentPage}
        />
      )}
    </View>
  );
}