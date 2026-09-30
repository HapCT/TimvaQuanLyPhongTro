import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import Pagination, { ADMIN_PAGE_SIZE } from '@/components/admin/Pagination';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';

interface Review {
  ma_danh_gia: number;
  ma_phong: number;
  so_sao: number;
  noi_dung?: string | null;
  ngay_tao?: string;
  ho_ten?: string;
  tieu_de?: string;
  so_phong?: string;
  trang_thai: 'HienThi' | 'An';
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HienThi' | 'An'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/danh-gia/admin');
      setReviews(response.data || []);
    } catch (error: any) {
      console.log('LOAD REVIEWS ERROR:', error?.response?.data || error);
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(
    (review) => statusFilter === 'ALL' || review.trang_thai === statusFilter
  );
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const updateStatus = async (review: Review) => {
    const nextStatus = review.trang_thai === 'HienThi' ? 'An' : 'HienThi';
    try {
      setProcessingId(review.ma_danh_gia);
      await backendApi.patch(`/api/danh-gia/${review.ma_danh_gia}/status`, { status: nextStatus });
      setReviews((previous) => previous.map((item) => (
        item.ma_danh_gia === review.ma_danh_gia ? { ...item, trang_thai: nextStatus } : item
      )));
      showAlert('Thành công', nextStatus === 'An' ? 'Đã ẩn đánh giá.' : 'Đã khôi phục đánh giá.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật đánh giá.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Quản lý đánh giá</Text>
          <Text style={styles.sectionSub}>Kiểm duyệt đánh giá về phòng trọ trên toàn hệ thống.</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadReviews} disabled={loading}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {[
          { value: 'ALL' as const, label: `Tất cả (${reviews.length})` },
          { value: 'HienThi' as const, label: 'Đang hiển thị' },
          { value: 'An' as const, label: 'Đã ẩn' },
        ].map((filter) => (
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
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
          <Text style={styles.emptyText}>Đánh giá mới sẽ xuất hiện tại đây.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {paginatedReviews.map((review) => (
            <View
              key={review.ma_danh_gia}
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 8 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>
                  {review.ho_ten || 'Người dùng'} · {'★'.repeat(Math.min(5, Math.max(0, review.so_sao)))}
                </Text>
                <Text style={{ color: review.trang_thai === 'HienThi' ? '#15803D' : '#B91C1C', fontSize: 13 }}>
                  {review.trang_thai === 'HienThi' ? 'Đang hiển thị' : 'Đã ẩn'}
                </Text>
              </View>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>
                {review.tieu_de || `Phòng #${review.ma_phong}`}
                {review.so_phong ? ` · Phòng ${review.so_phong}` : ''}
              </Text>
              <Text style={{ color: '#374151', fontSize: 14 }}>{review.noi_dung || 'Không có nội dung.'}</Text>
              <TouchableOpacity
                disabled={processingId === review.ma_danh_gia}
                onPress={() => updateStatus(review)}
                style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: review.trang_thai === 'HienThi' ? '#FEF2F2' : '#EAF3FF' }}
              >
                {processingId === review.ma_danh_gia
                  ? <ActivityIndicator size="small" color="#007AFF" />
                  : <Text style={{ color: review.trang_thai === 'HienThi' ? '#B91C1C' : '#007AFF', fontSize: 13 }}>
                    {review.trang_thai === 'HienThi' ? 'Ẩn đánh giá' : 'Khôi phục'}
                  </Text>}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!loading && <Pagination currentPage={currentPage} totalItems={filteredReviews.length} onPageChange={setCurrentPage} />}
    </View>
  );
}