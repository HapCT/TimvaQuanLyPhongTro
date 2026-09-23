// Màn hình Quản lý Lịch hẹn xem phòng của Chủ Trọ
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
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';

export default function LandlordDatLichScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1000;

  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadLandlordAppointments();
  }, []);

  const loadLandlordAppointments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setLandlordId(user.id);

      // Gọi API lấy lịch hẹn cho các phòng của chủ trọ này
      const res = await backendApi.get(`/api/dat-lich?chuTroId=${user.id}`);
      setAppointments(res.data || []);
    } catch (e) {
      console.log('LOAD APPOINTMENTS ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái duyệt/từ chối lịch hẹn
  const handleUpdateStatus = async (id: any, newStatus: string) => {
    try {
      setAppointments((prev) =>
        prev.map((a) => (a.ma_dat_lich === id ? { ...a, trang_thai: newStatus } : a))
      );

      await backendApi.put(`/api/dat-lich/${id}/status`, { trang_thai: newStatus });

      const statusText = newStatus === 'DaDuyet' ? 'Chấp nhận' : 'Từ chối';
      const msg = `Đã ${statusText} lịch hẹn xem phòng!`;
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Thành công', msg);
    } catch (e) {
      console.log('UPDATE STATUS ERROR:', e);
    }
  };

  const handleCallClient = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterStatus === 'ALL') return true;
      return a.trang_thai === filterStatus;
    });
  }, [appointments, filterStatus]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={[styles.mainContent, { maxWidth: isDesktop ? 1250 : '100%' }]}>

        {/* HEADER */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.title}>📅 Lịch hẹn xem phòng ({appointments.length})</Text>
            <Text style={styles.subTitle}>Danh sách khách hàng đăng ký đặt lịch hẹn xem trực tiếp</Text>
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

        {/* DANH SÁCH LỊCH HẸN */}
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44 }}>📅</Text>
            <Text style={styles.emptyText}>Chưa có lịch hẹn xem phòng nào</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredAppointments.map((app) => (
              <View key={app.ma_dat_lich} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>👤 {app.ho_ten || 'Khách xem phòng'}</Text>
                    <Text style={styles.clientPhone}>📞 SĐT: {app.so_dien_thoai}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          app.trang_thai === 'DaDuyet'
                            ? '#34C759'
                            : app.trang_thai === 'TuChoi'
                            ? '#FF3B30'
                            : '#FF9500',
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {app.trang_thai === 'DaDuyet'
                        ? 'Đã duyệt'
                        : app.trang_thai === 'TuChoi'
                        ? 'Đã từ chối'
                        : 'Chờ duyệt'}
                    </Text>
                  </View>
                </View>

                {/* THÔNG TIN PHÒNG & THỜI GIAN */}
                <View style={styles.detailBox}>
                  <Text style={styles.roomText}>
                    🏠 Phòng: <Text style={{ fontWeight: 'bold' }}>{app.phong_tro?.tieu_de || `Mã phòng #${app.ma_phong}`}</Text>
                  </Text>

                  <Text style={styles.timeText}>
                    ⏰ Thời gian hẹn: <Text style={{ fontWeight: 'bold', color: '#007AFF' }}>{app.gio_xem || '09:00'} - ngày {app.ngay_xem}</Text>
                  </Text>

                  {app.ghi_chu && <Text style={styles.noteText}>💬 Ghi chú: {app.ghi_chu}</Text>}
                </View>

                {/* HÀNH ĐỘNG DUYỆT / TỪ CHỐI / GỌI */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCallClient(app.so_dien_thoai)}
                  >
                    <Text style={styles.callBtnText}>📞 Gọi ngay</Text>
                  </TouchableOpacity>

                  {app.trang_thai !== 'DaDuyet' && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleUpdateStatus(app.ma_dat_lich, 'DaDuyet')}
                    >
                      <Text style={styles.approveBtnText}>✓ Chấp nhận</Text>
                    </TouchableOpacity>
                  )}

                  {app.trang_thai !== 'TuChoi' && (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleUpdateStatus(app.ma_dat_lich, 'TuChoi')}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    marginTop: 10,
  },

  list: {
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  clientPhone: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  roomText: {
    fontSize: 14,
    color: '#333',
  },
  timeText: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  callBtn: {
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C6E0FF',
  },
  callBtnText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CEEAD6',
  },
  approveBtnText: {
    color: '#137333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: '#FCE8E6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FAD2CF',
  },
  rejectBtnText: {
    color: '#C5221F',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
