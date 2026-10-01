import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

const STATUS_COLORS: Record<SupportStatus, { bg: string; text: string; border: string }> = {
  Moi: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  DangXuLy: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  DaGiaiQuyet: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};

const QUICK_REPLIES = [
  'Đã ghi nhận, tôi sẽ kiểm tra và khắc phục trong hôm nay.',
  'Vui lòng liên hệ trực tiếp qua số điện thoại của tôi để được hỗ trợ nhanh hơn.',
  'Sự cố đã được xử lý xong. Cảm ơn bạn đã phản hồi!',
  'Tôi sẽ đến kiểm tra phòng trong vòng 24 giờ. Bạn vui lòng ở nhà để tiện kiểm tra.',
];

export default function LandlordSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<SupportStatus | 'TatCa'>('TatCa');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await backendApi.get('/api/ho-tro/chu-tro');
      setRequests(res.data || []);
      setResponses(
        Object.fromEntries(
          (res.data || []).map((item: SupportRequest) => [
            item.ma_yeu_cau,
            item.phan_hoi_admin || '',
          ])
        )
      );
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filterStatus === 'TatCa' ? requests : requests.filter((r) => r.trang_thai === filterStatus);

  const paginated = filtered.slice(
    (currentPage - 1) * ADMIN_PAGE_SIZE,
    currentPage * ADMIN_PAGE_SIZE
  );

  const updateRequest = async (request: SupportRequest, status: SupportStatus) => {
    try {
      setProcessingId(request.ma_yeu_cau);
      await backendApi.patch(`/api/ho-tro/chu-tro/${request.ma_yeu_cau}`, {
        status,
        response: responses[request.ma_yeu_cau] || '',
      });
      setRequests((prev) =>
        prev.map((item) =>
          item.ma_yeu_cau === request.ma_yeu_cau
            ? { ...item, trang_thai: status, phan_hoi_admin: responses[request.ma_yeu_cau] || '' }
            : item
        )
      );
      showAlert('Thành công', 'Đã gửi phản hồi đến người thuê.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật yêu cầu.');
    } finally {
      setProcessingId(null);
    }
  };

  const countByStatus = (status: SupportStatus) =>
    requests.filter((r) => r.trang_thai === status).length;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* HEADER */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Yêu cầu hỗ trợ từ người thuê</Text>
          <Text style={styles.sectionSub}>
            Xem và phản hồi yêu cầu từ các phòng thuộc khu trọ của bạn.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadRequests} disabled={loading}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      {!loading && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(
            [
              { label: 'Tất cả', value: 'TatCa', count: requests.length, bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
              { label: 'Mới', value: 'Moi', count: countByStatus('Moi'), bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
              { label: 'Đang xử lý', value: 'DangXuLy', count: countByStatus('DangXuLy'), bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
              { label: 'Đã giải quyết', value: 'DaGiaiQuyet', count: countByStatus('DaGiaiQuyet'), bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => {
                setFilterStatus(tab.value as any);
                setCurrentPage(1);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: filterStatus === tab.value ? tab.bg : '#F9FAFB',
                borderWidth: 1,
                borderColor: filterStatus === tab.value ? tab.border : '#E5E7EB',
              }}
            >
              <Text
                style={{
                  color: filterStatus === tab.value ? tab.text : '#6B7280',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* NỘI DUNG */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Không có yêu cầu hỗ trợ</Text>
          <Text style={styles.emptyText}>
            {filterStatus === 'TatCa'
              ? 'Người thuê chưa gửi yêu cầu hỗ trợ nào cho phòng của bạn.'
              : `Không có yêu cầu ở trạng thái "${STATUS_LABELS[filterStatus as SupportStatus]}".`}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {paginated.map((request) => {
            const sc = STATUS_COLORS[request.trang_thai];
            return (
              <View
                key={request.ma_yeu_cau}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 10,
                  padding: 16,
                  gap: 12,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                {/* TIÊU ĐỀ + TRẠNG THÁI */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }}>
                    {request.tieu_de}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: sc.bg,
                      borderWidth: 1,
                      borderColor: sc.border,
                    }}
                  >
                    <Text style={{ color: sc.text, fontSize: 12, fontWeight: '600' }}>
                      {STATUS_LABELS[request.trang_thai]}
                    </Text>
                  </View>
                </View>

                {/* THÔNG TIN NGƯỜI GỬI */}
                <Text style={{ color: '#6B7280', fontSize: 13 }}>
                  👤 {request.ho_ten || 'Người thuê'} ·{' '}
                  {request.so_dien_thoai || request.email || 'Không có liên hệ'}
                </Text>

                {/* PHÒNG */}
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                >
                  <View
                    style={{
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '600' }}>
                      🏠 {request.ten_phong || `Mã #${request.ma_phong}`}
                      {request.ten_khu_tro ? ` — ${request.ten_khu_tro}` : ''}
                    </Text>
                  </View>
                  {!!request.ma_phong && (
                    <TouchableOpacity
                      onPress={() => router.push(`/room/${request.ma_phong}` as any)}
                      style={{
                        backgroundColor: '#2563EB',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>
                        🔍 Xem phòng
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* NỘI DUNG YÊU CẦU */}
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 6,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20 }}>
                    {request.noi_dung}
                  </Text>
                </View>

                {/* QUICK REPLY + Ô NHẬP */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                    💬 Phản hồi cho người thuê:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_REPLIES.map((tmpl) => (
                      <TouchableOpacity
                        key={tmpl}
                        onPress={() =>
                          setResponses((prev) => ({ ...prev, [request.ma_yeu_cau]: tmpl }))
                        }
                        style={{
                          backgroundColor: '#F0FDF4',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#BBF7D0',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#15803D' }}>
                          💡 {tmpl.slice(0, 36)}…
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    value={responses[request.ma_yeu_cau] || ''}
                    onChangeText={(val) =>
                      setResponses((prev) => ({ ...prev, [request.ma_yeu_cau]: val }))
                    }
                    placeholder="Nhập phản hồi cho người thuê..."
                    multiline
                    style={{
                      minHeight: 72,
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 6,
                      padding: 10,
                      textAlignVertical: 'top',
                      backgroundColor: '#FAFAFA',
                      fontSize: 13,
                    }}
                  />
                </View>

                {/* NÚT TRẠNG THÁI + GỬI */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {(['Moi', 'DangXuLy', 'DaGiaiQuyet'] as SupportStatus[]).map((status) => (
                      <TouchableOpacity
                        key={status}
                        disabled={processingId === request.ma_yeu_cau}
                        onPress={() => updateRequest(request, status)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 6,
                          backgroundColor:
                            request.trang_thai === status
                              ? STATUS_COLORS[status].bg
                              : '#F3F4F6',
                          borderWidth: 1,
                          borderColor:
                            request.trang_thai === status
                              ? STATUS_COLORS[status].border
                              : '#E5E7EB',
                        }}
                      >
                        <Text
                          style={{
                            color:
                              request.trang_thai === status
                                ? STATUS_COLORS[status].text
                                : '#6B7280',
                            fontSize: 12,
                            fontWeight: request.trang_thai === status ? '600' : '400',
                          }}
                        >
                          {STATUS_LABELS[status]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    disabled={processingId === request.ma_yeu_cau}
                    onPress={() =>
                      updateRequest(
                        request,
                        request.trang_thai === 'Moi' ? 'DangXuLy' : request.trang_thai
                      )
                    }
                    style={{
                      backgroundColor: '#16A34A',
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                      {processingId === request.ma_yeu_cau ? 'Đang gửi...' : '✉️ Gửi phản hồi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          onPageChange={setCurrentPage}
        />
      )}
    </ScrollView>
  );
}
