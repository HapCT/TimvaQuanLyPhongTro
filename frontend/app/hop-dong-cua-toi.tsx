import { formatNumber } from '@/utils/format';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import BillingManagement from '@/components/BillingManagement';
import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

interface Payment {
  ma_thanh_toan: number;
  so_tien: number;
  ngay_thanh_toan?: string;
  ngay_tao?: string;
  phuong_thuc?: string | null;
  noi_dung?: string | null;
  trang_thai: string;
}

interface Contract {
  ma_hop_dong: number;
  ngay_bat_dau: string;
  ngay_ket_thuc?: string | null;
  gia_thue: number;
  tien_coc: number;
  dieu_khoan?: string | null;
  trang_thai: string;
  phong?: {
    tieu_de?: string;
    so_phong?: string;
    ten_khu_tro?: string;
    dia_chi?: string;
    dien_tich?: number | null;
    tang?: number | null;
    so_nguoi_dang_o?: number;
    so_nguoi_toi_da?: number;
    so_cho_con_lai?: number;
  };
  thanh_toan?: Payment[];
}

export default function HopDongCuaToiScreen() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contracts' | 'billing'>('contracts');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/hop-dong');
      setContracts(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải hợp đồng của bạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 850, alignSelf: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#2563EB', fontSize: 14 }}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <View>
            <Text style={{ color: '#111827', fontSize: 21, fontWeight: '700' }}>Hợp đồng & thanh toán</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Xem hợp đồng, hóa đơn theo kỳ và số dư còn nợ.</Text>
          </View>
          <TouchableOpacity onPress={loadContracts} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', padding: 4, gap: 4, backgroundColor: '#E9EEF5', borderRadius: 8 }}>
          {[
            { key: 'contracts' as const, label: `Hợp đồng (${contracts.length})` },
            { key: 'billing' as const, label: 'Hóa đơn & thanh toán' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderRadius: 6, backgroundColor: activeTab === tab.key ? '#FFFFFF' : 'transparent' }}
            >
              <Text style={{ color: activeTab === tab.key ? '#1D4ED8' : '#4B5563', fontSize: 13, fontWeight: activeTab === tab.key ? '700' : '500' }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'contracts' && (
        loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 30 }} />
        ) : contracts.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 8, alignItems: 'center', gap: 10 }}>
            <Text style={{ color: '#4B5563', fontSize: 14 }}>Bạn chưa có hợp đồng nào.</Text>
            <TouchableOpacity onPress={() => router.push('/yeu-cau-dat-phong' as any)}>
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>Xem yêu cầu đặt phòng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {contracts.map((contract) => {
              const paid = (contract.thanh_toan || []).filter((payment) => payment.trang_thai === 'DaThanhToan');
              const totalPaid = paid.reduce((sum, payment) => sum + Number(payment.so_tien || 0), 0);
              return (
                <View key={contract.ma_hop_dong} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>
                        {contract.phong?.tieu_de || 'Phòng trọ'}{contract.phong?.so_phong ? ` · Phòng ${contract.phong.so_phong}` : ''}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{contract.phong?.ten_khu_tro || 'Khu trọ'}</Text>
                    </View>
                    <Text style={{ color: contract.trang_thai === 'DangHieuLuc' ? '#15803D' : '#6B7280', fontSize: 13, fontWeight: '600' }}>
                      {contract.trang_thai === 'DangHieuLuc' ? 'Đang hiệu lực' : contract.trang_thai === 'KetThuc' ? 'Đã kết thúc' : 'Đã hủy'}
                    </Text>
                  </View>
                  {!!contract.phong?.dia_chi && <Text style={{ color: '#4B5563', fontSize: 12 }}>Địa chỉ: {contract.phong.dia_chi}</Text>}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    <Text style={{ color: '#4B5563', fontSize: 12 }}>Diện tích: {contract.phong?.dien_tich ?? '--'} m²</Text>
                    <Text style={{ color: '#4B5563', fontSize: 12 }}>Tầng: {contract.phong?.tang ?? '--'}</Text>
                    <Text style={{ color: '#4B5563', fontSize: 12 }}>
                      Sức chứa: {contract.phong?.so_nguoi_dang_o ?? 0}/{contract.phong?.so_nguoi_toi_da ?? '--'} · còn {contract.phong?.so_cho_con_lai ?? '--'} chỗ
                    </Text>
                  </View>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>
                    Thời hạn: {contract.ngay_bat_dau}{contract.ngay_ket_thuc ? ` đến ${contract.ngay_ket_thuc}` : ' · Không thời hạn'}
                  </Text>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>
                    Giá thuê: {formatNumber(contract.gia_thue)} đ/tháng · Tiền cọc: {formatNumber(contract.tien_coc)} đ
                  </Text>
                  {!!contract.dieu_khoan && <Text style={{ color: '#4B5563', fontSize: 13 }}>Điều khoản: {contract.dieu_khoan}</Text>}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, gap: 7 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>Khoản thu cũ, ngoài hóa đơn</Text>
                      <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600' }}>Đã ghi nhận {formatNumber(totalPaid)} đ</Text>
                    </View>
                    {paid.length === 0 ? (
                      <Text style={{ color: '#6B7280', fontSize: 12 }}>Chưa có khoản thanh toán được ghi nhận.</Text>
                    ) : paid.map((payment) => (
                      <Text key={payment.ma_thanh_toan} style={{ color: '#4B5563', fontSize: 12 }}>
                        {payment.ngay_thanh_toan || payment.ngay_tao || ''} · {formatNumber(payment.so_tien)} đ · {payment.phuong_thuc || 'Chưa rõ'} · {payment.noi_dung || 'Thanh toán'}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )
        )}
        {activeTab === 'billing' && <BillingManagement tenantView />}
      </View>
    </ScrollView>
  );
}
