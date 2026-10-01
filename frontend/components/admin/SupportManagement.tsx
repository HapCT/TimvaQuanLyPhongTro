import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Pagination, { ADMIN_PAGE_SIZE } from '@/components/admin/Pagination';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';

type SupportStatus = 'Moi' | 'DangXuLy' | 'DaGiaiQuyet';

interface SupportRequest {
  ma_yeu_cau: number;
  tieu_de: string;
  noi_dung: string;
  trang_thai: SupportStatus;
  phan_hoi_admin?: string | null;
  ngay_tao?: string;
  ho_ten?: string;
  email?: string;
  so_dien_thoai?: string;
  ma_phong?: number | null;
  ten_phong?: string | null;
  ten_khu_tro?: string | null;
}

const STATUS_LABELS: Record<SupportStatus, string> = {
  Moi: 'Mới tiếp nhận',
  DangXuLy: 'Đang xử lý',
  DaGiaiQuyet: 'Đã giải quyết',
};

export default function SupportManagement() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/ho-tro/admin');
      setRequests(response.data || []);
      setResponses(Object.fromEntries((response.data || []).map((item: SupportRequest) => [
        item.ma_yeu_cau,
        item.phan_hoi_admin || '',
      ])));
    } catch (error: any) {
      console.log('LOAD SUPPORT REQUESTS ERROR:', error?.response?.data || error);
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  const paginatedRequests = requests.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const updateRequest = async (request: SupportRequest, status: SupportStatus) => {
    try {
      setProcessingId(request.ma_yeu_cau);
      await backendApi.patch(`/api/ho-tro/${request.ma_yeu_cau}`, {
        status,
        response: responses[request.ma_yeu_cau] || '',
      });
      setRequests((previous) => previous.map((item) => (
        item.ma_yeu_cau === request.ma_yeu_cau
          ? { ...item, trang_thai: status, phan_hoi_admin: responses[request.ma_yeu_cau] || '' }
          : item
      )));
      showAlert('Thành công', 'Đã cập nhật yêu cầu hỗ trợ.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật yêu cầu.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Yêu cầu hỗ trợ</Text>
          <Text style={styles.sectionSub}>Tiếp nhận yêu cầu và phản hồi cho người dùng.</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadRequests} disabled={loading}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Chưa có yêu cầu hỗ trợ</Text>
          <Text style={styles.emptyText}>Yêu cầu mới từ người dùng sẽ xuất hiện tại đây.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {paginatedRequests.map((request) => (
            <View
              key={request.ma_yeu_cau}
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 10 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{request.tieu_de}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>{STATUS_LABELS[request.trang_thai]}</Text>
              </View>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>
                {request.ho_ten || 'Người dùng'} · {request.email || request.so_dien_thoai || 'Không có thông tin liên hệ'}
              </Text>

              {!!(request.ten_phong || request.ten_khu_tro || request.ma_phong) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '600' }}>
                      🏠 Phòng: {request.ten_phong || `Mã #${request.ma_phong}`} {request.ten_khu_tro ? `(${request.ten_khu_tro})` : ''}
                    </Text>
                  </View>

                  {!!request.ma_phong && (
                    <TouchableOpacity
                      onPress={() => router.push(`/room/${request.ma_phong}` as any)}
                      style={{ backgroundColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>🔍 Xem chi tiết phòng</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
                    📌 Yêu cầu chung
                  </Text>
                </View>
              )}

              <Text style={{ color: '#374151', fontSize: 14 }}>{request.noi_dung}</Text>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                  💬 Gợi ý / Phản hồi tư vấn cho người dùng:
                </Text>
                {/* Mẫu câu gợi ý nhanh cho Admin */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Đã ghi nhận, ban quản lý sẽ kiểm tra và khắc phục trong ngày.',
                    'Vui lòng liên hệ trực tiếp SĐT chủ trọ/quản lý để được hỗ trợ gấp.',
                    'Sự cố đã được xử lý hoàn tất. Cảm ơn bạn đã phản hồi!',
                  ].map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl}
                      onPress={() => setResponses((previous) => ({ ...previous, [request.ma_yeu_cau]: tmpl }))}
                      style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' }}
                    >
                      <Text style={{ fontSize: 11, color: '#4B5563' }}>💡 {tmpl.slice(0, 32)}...</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  value={responses[request.ma_yeu_cau] || ''}
                  onChangeText={(value) => setResponses((previous) => ({ ...previous, [request.ma_yeu_cau]: value }))}
                  placeholder="Nhập nội dung tư vấn, phản hồi hoặc hướng giải quyết cho người dùng..."
                  multiline
                  style={{ minHeight: 72, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, padding: 10, textAlignVertical: 'top', backgroundColor: '#FAFAFA', fontSize: 13 }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(['Moi', 'DangXuLy', 'DaGiaiQuyet'] as SupportStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      disabled={processingId === request.ma_yeu_cau}
                      onPress={() => updateRequest(request, status)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: request.trang_thai === status ? '#EAF3FF' : '#F3F4F6' }}
                    >
                      <Text style={{ color: request.trang_thai === status ? '#007AFF' : '#4B5563', fontSize: 13, fontWeight: request.trang_thai === status ? '600' : '400' }}>
                        {STATUS_LABELS[status]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  disabled={processingId === request.ma_yeu_cau}
                  onPress={() => updateRequest(request, request.trang_thai === 'Moi' ? 'DangXuLy' : request.trang_thai)}
                  style={{ backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                    {processingId === request.ma_yeu_cau ? 'Đang gửi...' : '✉️ Gửi phản hồi'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && <Pagination currentPage={currentPage} totalItems={requests.length} onPageChange={setCurrentPage} />}
    </View>
  );
}