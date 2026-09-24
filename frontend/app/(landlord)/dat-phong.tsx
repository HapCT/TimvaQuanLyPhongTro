// Màn hình Quản lý Yêu cầu Đặt phòng của Chủ Trọ (Bảng dat_phong)
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';

export default function LandlordDatPhongScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1000;

  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadLandlordBookings();
  }, []);

  const loadLandlordBookings = async () => {
    try {
      setLoading(true);
      const user = firebaseAuth.currentUser;
      if (!user) return;
      setLandlordId(user.uid);

      // Gọi API lấy danh sách đặt phòng thuộc các phòng của chủ trọ này
      const res = await backendApi.get(`/api/dat-phong?chuTroId=${user.uid}`);
      setBookings(res.data || []);
    } catch (e) {
      console.log('LOAD BOOKINGS ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái duyệt/từ chối đặt phòng
  const handleUpdateStatus = async (id: any, newStatus: string) => {
    try {
      setBookings((prev) =>
        prev.map((b) =>
          b.ma_dat_phong === id || b.ma_dat_lich === id
            ? { ...b, trang_thai: newStatus }
            : b
        )
      );

      await backendApi.put(`/api/dat-phong/${id}/status`, { trang_thai: newStatus });

      const statusText = newStatus === 'DaDuyet' ? 'Chấp nhận' : 'Từ chối';
      const msg = `Đã ${statusText} yêu cầu đặt phòng!`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thành công', msg);
    } catch (e) {
      console.log('UPDATE STATUS ERROR:', e);
    }
  };

  const handleCallClient = (phone: string) => {
    if (phone && phone !== 'Chưa cập nhật') {
      Linking.openURL(`tel:${phone}`);
    } else {
      const msg = 'Khách hàng chưa cập nhật số điện thoại.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Thông báo', msg);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus === 'ALL') return true;
      return b.trang_thai === filterStatus;
    });
  }, [bookings, filterStatus]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải yêu cầu đặt phòng...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={[styles.mainContent, { maxWidth: isDesktop ? 1250 : '100%' }]}>
        {/* HEADER BAR */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.title}>📋 Yêu cầu đặt phòng ({bookings.length})</Text>
            <Text style={styles.subTitle}>
              Danh sách khách hàng đăng ký đặt phòng từ ứng dụng (Bảng dữ liệu: dat_phong)
            </Text>
          </View>
        </View>

        {/* BỘ LỌC TRẠNG THÁI */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ChoDuyet', label: '⏳ Chờ duyệt' },
            { id: 'DaDuyet', label: '✅ Đã chấp nhận' },
            { id: 'TuChoi', label: '❌ Đã từ chối' },
          ].map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[styles.chip, filterStatus === st.id && styles.chipActive]}
              onPress={() => setFilterStatus(st.id)}
            >
              <Text style={[styles.chipText, filterStatus === st.id && styles.chipTextActive]}>
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DANH SÁCH ĐẶT PHÒNG */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44 }}>📋</Text>
            <Text style={styles.emptyText}>Chưa có yêu cầu đặt phòng nào</Text>
            <Text style={styles.emptySubText}>
              Khi người dùng chọn đặt phòng từ trang chi tiết, yêu cầu sẽ hiển thị tại đây.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredBookings.map((b) => (
              <View key={b.ma_dat_phong || b.ma_dat_lich} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>👤 {b.ho_ten || 'Khách đặt phòng'}</Text>
                    <Text style={styles.clientPhone}>📞 SĐT: {b.so_dien_thoai || 'Chưa cập nhật'}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          b.trang_thai === 'DaDuyet'
                            ? '#34C759'
                            : b.trang_thai === 'TuChoi'
                            ? '#FF3B30'
                            : '#FF9500',
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {b.trang_thai === 'DaDuyet'
                        ? 'Đã duyệt'
                        : b.trang_thai === 'TuChoi'
                        ? 'Đã từ chối'
                        : 'Chờ duyệt'}
                    </Text>
                  </View>
                </View>

                {/* THÔNG TIN PHÒNG & THỜI GIAN */}
                <View style={styles.detailBox}>
                  <Text style={styles.roomText}>
                    🏠 Phòng:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {b.phong_tro?.tieu_de || `Mã phòng #${b.ma_phong}`}
                    </Text>
                    {b.phong_tro?.so_phong ? ` (Phòng ${b.phong_tro.so_phong})` : ''}
                  </Text>

                  {b.phong_tro?.gia_thue && (
                    <Text style={styles.priceText}>
                      💵 Giá thuê: <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>{Number(b.phong_tro.gia_thue).toLocaleString('vi-VN')} đ/tháng</Text>
                    </Text>
                  )}

                  {b.ngay_du_kien_nhan_phong && (
                    <Text style={styles.timeText}>
                      📅 Ngày dự kiến nhận phòng:{' '}
                      <Text style={{ fontWeight: 'bold', color: '#10B981' }}>
                        {formatDate(b.ngay_du_kien_nhan_phong)}
                      </Text>
                    </Text>
                  )}

                  <Text style={styles.dateText}>
                    🕒 Ngày gửi yêu cầu: {formatDate(b.ngay_dat || b.ngay_tao)}
                  </Text>

                  {b.ghi_chu && <Text style={styles.noteText}>💬 Ghi chú: {b.ghi_chu}</Text>}
                </View>

                {/* HÀNH ĐỘNG DUYỆT / TỪ CHỐI / GỌI */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCallClient(b.so_dien_thoai)}
                  >
                    <Text style={styles.callBtnText}>📞 Gọi khách</Text>
                  </TouchableOpacity>

                  {b.trang_thai !== 'DaDuyet' && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleUpdateStatus(b.ma_dat_phong || b.ma_dat_lich, 'DaDuyet')}
                    >
                      <Text style={styles.approveBtnText}>✓ Chấp nhận</Text>
                    </TouchableOpacity>
                  )}

                  {b.trang_thai !== 'TuChoi' && (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleUpdateStatus(b.ma_dat_phong || b.ma_dat_lich, 'TuChoi')}
                    >
                      <Text style={styles.rejectBtnText}>✕ Từ chối</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  mainContent: {
    width: '100%',
    alignSelf: 'center',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  subTitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  clientPhone: {
    fontSize: 13,
    color: '#4A5568',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  roomText: {
    fontSize: 13,
    color: '#334155',
  },
  priceText: {
    fontSize: 13,
    color: '#334155',
  },
  timeText: {
    fontSize: 13,
    color: '#334155',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  noteText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  callBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  approveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
