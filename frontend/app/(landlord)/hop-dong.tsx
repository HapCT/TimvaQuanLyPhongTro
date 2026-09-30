import { formatNumber } from '@/utils/format';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import BillingManagement from '@/components/BillingManagement';
import { backendApi } from '@/services/backend';
import { styles } from '@/styles/admin/admin.styles';
import { showAlert } from '@/utils/alert';

interface Booking {
  ma_dat_phong: number;
  trang_thai: string;
  ho_ten?: string;
  phong_tro?: { tieu_de?: string; so_phong?: string; gia_thue?: number; ten_khu_tro?: string };
}

interface Payment {
  ma_thanh_toan: number;
  so_tien: number;
  ngay_thanh_toan?: string;
  ngay_tao?: string;
  phuong_thuc?: string | null;
  noi_dung?: string | null;
}

interface Contract {
  ma_hop_dong: number;
  ma_dat_phong: number;
  ngay_bat_dau: string;
  ngay_ket_thuc?: string | null;
  gia_thue: number;
  tien_coc: number;
  trang_thai: string;
  dieu_khoan?: string | null;
  nguoi_thue?: { ho_ten?: string; so_dien_thoai?: string };
  phong?: { tieu_de?: string; so_phong?: string; ten_khu_tro?: string };
  thanh_toan: Payment[];
}

export default function HopDongScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [terms, setTerms] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingResponse, contractResponse] = await Promise.all([
        backendApi.get('/api/dat-phong'),
        backendApi.get('/api/hop-dong'),
      ]);
      setBookings(bookingResponse.data || []);
      setContracts(contractResponse.data || []);
    } catch (error: any) {
      console.log('LOAD CONTRACTS ERROR:', error?.response?.data || error);
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải hợp đồng và thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const contractedBookingIds = new Set(contracts.map((contract) => String(contract.ma_dat_phong)));
  const eligibleBookings = bookings.filter((booking) => (
    booking.trang_thai === 'DaDuyet' && !contractedBookingIds.has(String(booking.ma_dat_phong))
  ));

  const createContract = async () => {
    if (!selectedBooking) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      showAlert('Ngày không hợp lệ', 'Nhập ngày bắt đầu theo định dạng YYYY-MM-DD.');
      return;
    }

    try {
      setSaving(true);
      await backendApi.post('/api/hop-dong', {
        ma_dat_phong: selectedBooking.ma_dat_phong,
        ngay_bat_dau: startDate,
        ngay_ket_thuc: endDate || null,
        dieu_khoan: terms.trim() || null,
      });
      setSelectedBooking(null);
      setEndDate('');
      setTerms('');
      await loadData();
      showAlert('Thành công', 'Đã tạo hợp đồng từ yêu cầu đặt phòng được duyệt.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tạo hợp đồng.');
    } finally {
      setSaving(false);
    }
  };

  const endContract = (contract: Contract) => {
    showAlert('Kết thúc hợp đồng', 'Bạn có chắc muốn chuyển hợp đồng sang trạng thái kết thúc?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Kết thúc',
        onPress: async () => {
          try {
            await backendApi.patch(`/api/hop-dong/${contract.ma_hop_dong}/status`, { status: 'KetThuc' });
            await loadData();
          } catch (error: any) {
            showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật hợp đồng.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 20 }}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Hợp đồng & Thanh toán</Text>
            <Text style={styles.sectionSub}>Tạo hợp đồng từ booking đã duyệt và theo dõi các khoản đã thu.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadData} disabled={loading}>
            <Text style={styles.refreshText}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Booking đã duyệt</Text>
              <Text style={styles.sectionSub}>Chỉ yêu cầu chưa có hợp đồng mới xuất hiện ở đây.</Text>
            </View>
            <Text style={styles.resultNumber}>{eligibleBookings.length}</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 24 }} />
          ) : eligibleBookings.length === 0 ? (
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 16 }}>Chưa có booking đủ điều kiện tạo hợp đồng.</Text>
          ) : (
            <View style={{ gap: 10, marginTop: 14 }}>
              {eligibleBookings.map((booking) => (
                <View key={booking.ma_dat_phong} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6 }}>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: '#1F2937', fontWeight: '600', fontSize: 14 }}>{booking.phong_tro?.tieu_de || `Phòng #${booking.phong_tro?.so_phong || ''}`}</Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{booking.ho_ten || 'Người thuê'} · {booking.phong_tro?.ten_khu_tro || 'Khu trọ'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBooking(booking);
                      setStartDate(new Date().toISOString().slice(0, 10));
                    }}
                    style={{ backgroundColor: '#007AFF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Tạo hợp đồng</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Danh sách hợp đồng</Text>
              <Text style={styles.sectionSub}>Hợp đồng và lịch sử thanh toán gắn với từng phòng.</Text>
            </View>
            <Text style={styles.resultNumber}>{contracts.length}</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 24 }} />
          ) : contracts.length === 0 ? (
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 16 }}>Chưa có hợp đồng.</Text>
          ) : (
            <View style={{ gap: 12, marginTop: 14 }}>
              {contracts.map((contract) => (
                <View key={contract.ma_hop_dong} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ flex: 1, minWidth: 200 }}>
                      <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>{contract.phong?.tieu_de || `Phòng ${contract.phong?.so_phong || ''}`}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{contract.nguoi_thue?.ho_ten || 'Người thuê'} · {contract.phong?.ten_khu_tro || 'Khu trọ'}</Text>
                    </View>
                    <Text style={{ color: contract.trang_thai === 'DangHieuLuc' ? '#15803D' : '#6B7280', fontSize: 13, fontWeight: '600' }}>
                      {contract.trang_thai === 'DangHieuLuc' ? 'Đang hiệu lực' : contract.trang_thai === 'KetThuc' ? 'Đã kết thúc' : 'Đã hủy'}
                    </Text>
                  </View>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>
                    Thời hạn: {contract.ngay_bat_dau}{contract.ngay_ket_thuc ? ` đến ${contract.ngay_ket_thuc}` : ' · Không thời hạn'}
                  </Text>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>
                    Thuê {formatNumber(contract.gia_thue)} đ/tháng · Cọc {formatNumber(contract.tien_coc)} đ
                  </Text>
                  {!!contract.dieu_khoan && <Text style={{ color: '#4B5563', fontSize: 13 }}>Điều khoản: {contract.dieu_khoan}</Text>}

                  <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, gap: 6 }}>
                    <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>Khoản thu cũ, ngoài hóa đơn ({contract.thanh_toan?.length || 0})</Text>
                    {(contract.thanh_toan || []).map((payment) => (
                      <Text key={payment.ma_thanh_toan} style={{ color: '#4B5563', fontSize: 12 }}>
                        {payment.ngay_thanh_toan || payment.ngay_tao || ''} · {formatNumber(payment.so_tien)} đ · {payment.phuong_thuc || 'Chưa rõ'} · {payment.noi_dung || 'Thanh toán'}
                      </Text>
                    ))}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {contract.trang_thai === 'DangHieuLuc' && (
                        <TouchableOpacity onPress={() => endContract(contract)} style={{ backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                          <Text style={{ color: '#4B5563', fontSize: 13 }}>Kết thúc hợp đồng</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.sectionCard}>
          <BillingManagement />
        </View>
      </View>
      <Modal visible={!!selectedBooking} transparent animationType="fade" onRequestClose={() => setSelectedBooking(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, gap: 12 }}>
            <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Tạo hợp đồng thuê</Text>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>{selectedBooking?.phong_tro?.tieu_de || 'Booking đã duyệt'}</Text>
            <TextInput value={startDate} onChangeText={setStartDate} placeholder="Ngày bắt đầu (YYYY-MM-DD)" style={{ height: 44, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 10 }} />
            <TextInput value={endDate} onChangeText={setEndDate} placeholder="Ngày kết thúc (không bắt buộc)" style={{ height: 44, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 10 }} />
            <TextInput value={terms} onChangeText={setTerms} placeholder="Điều khoản (không bắt buộc)" multiline style={{ minHeight: 84, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, padding: 10, textAlignVertical: 'top' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => setSelectedBooking(null)} style={{ paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ color: '#4B5563' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={createContract} style={{ backgroundColor: '#007AFF', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Tạo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}