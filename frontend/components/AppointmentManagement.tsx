import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

type AppointmentStatus = 'ChoXacNhan' | 'ChoKhachXacNhan' | 'DaXacNhan' | 'DaXem' | 'TuChoi' | 'DaHuy';

type Appointment = {
  ma_dat_lich: number;
  ma_phong: number;
  thoi_gian_hen: string;
  so_dien_thoai: string;
  ghi_chu?: string | null;
  trang_thai: AppointmentStatus;
  ho_ten?: string;
  phong_tro?: {
    tieu_de?: string;
    so_phong?: string;
    trang_thai?: string;
    so_cho_con_lai?: number;
    co_the_dat_thue?: boolean;
    ten_khu_tro?: string;
    dia_chi?: string;
  };
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  ChoXacNhan: 'Chờ xác nhận',
  ChoKhachXacNhan: 'Chờ người thuê phản hồi',
  DaXacNhan: 'Đã xác nhận',
  DaXem: 'Đã xem phòng',
  TuChoi: 'Đã từ chối',
  DaHuy: 'Đã hủy',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  ChoXacNhan: '#B45309',
  ChoKhachXacNhan: '#B45309',
  DaXacNhan: '#15803D',
  DaXem: '#2563EB',
  TuChoi: '#B91C1C',
  DaHuy: '#6B7280',
};

const formatDateTime = (value: string) => {
  if (!value) return 'Chưa xác định';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

export default function AppointmentManagement({ tenantView = false }: { tenantView?: boolean }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('09:00');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/dat-lich');
      setAppointments(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const updateStatus = async (appointment: Appointment, status: Exclude<AppointmentStatus, 'ChoXacNhan' | 'ChoKhachXacNhan'>) => {
    try {
      setProcessingId(appointment.ma_dat_lich);
      await backendApi.put(`/api/dat-lich/${appointment.ma_dat_lich}/status`, { trang_thai: status });
      setAppointments((previous) => previous.map((item) => (
        item.ma_dat_lich === appointment.ma_dat_lich ? { ...item, trang_thai: status } : item
      )));
      const message = status === 'DaXem' ? 'Đã hoàn tất buổi xem phòng.' : status === 'DaXacNhan' ? 'Đã xác nhận lịch hẹn.' : status === 'DaHuy' ? 'Đã hủy lịch hẹn.' : 'Đã từ chối lịch hẹn.';
      showAlert('Thành công', message);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật lịch hẹn.');
    } finally {
      setProcessingId(null);
    }
  };

  const beginReschedule = (appointment: Appointment) => {
    const dateTime = String(appointment.thoi_gian_hen).replace('T', ' ');
    setEditingId(appointment.ma_dat_lich);
    setEditDate(dateTime.slice(0, 10));
    setEditTime(dateTime.slice(11, 16) || '09:00');
  };

  const saveReschedule = async (appointment: Appointment) => {
    const newDateTime = `${editDate.trim()} ${editTime.trim()}:00`;
    try {
      setProcessingId(appointment.ma_dat_lich);
      const response = await backendApi.put(`/api/dat-lich/${appointment.ma_dat_lich}/reschedule`, { thoi_gian_hen: newDateTime });
      setAppointments((previous) => previous.map((item) => (
        item.ma_dat_lich === appointment.ma_dat_lich
          ? { ...item, thoi_gian_hen: response.data.thoi_gian_hen, trang_thai: response.data.trang_thai }
          : item
      )));
      setEditingId(null);
      showAlert('Đã gửi đề xuất', tenantView ? 'Chủ trọ cần xác nhận thời gian mới.' : 'Người thuê cần xác nhận thời gian mới.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể đổi lịch hẹn.');
    } finally {
      setProcessingId(null);
    }
  };

  const goToRoom = (roomId: number) => router.push({ pathname: '/room/[id]', params: { id: roomId } } as any);

  const visibleAppointments = appointments.filter(
    (item) => filter === 'ALL' || item.trang_thai === filter
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
            {tenantView ? 'Lịch hẹn xem phòng của tôi' : 'Lịch hẹn xem phòng'}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
            {tenantView ? 'Theo dõi và hủy các lịch hẹn chưa diễn ra.' : 'Xác nhận thời gian xem phòng với người thuê.'}
          </Text>
        </View>
        <TouchableOpacity onPress={loadAppointments} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {(['ALL', 'ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan', 'DaXem', 'TuChoi', 'DaHuy'] as const).map((value) => (
          <TouchableOpacity key={value} onPress={() => setFilter(value)} style={{ paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: filter === value ? '#2563EB' : '#E5E7EB', borderRadius: 6, backgroundColor: filter === value ? '#EFF6FF' : '#FFFFFF' }}>
            <Text style={{ color: filter === value ? '#1D4ED8' : '#4B5563', fontSize: 13 }}>
              {value === 'ALL' ? 'Tất cả' : STATUS_LABEL[value]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#2563EB" /> : visibleAppointments.length === 0 ? (
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: '#6B7280' }}>Chưa có lịch hẹn ở trạng thái này.</Text>
        </View>
      ) : visibleAppointments.map((appointment) => {
        const canRentRoom = appointment.phong_tro?.co_the_dat_thue
          ?? appointment.phong_tro?.trang_thai === 'ConTrong';
        return (
        <View key={appointment.ma_dat_lich} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <Text style={{ color: '#111827', fontSize: 15, fontWeight: '700', flex: 1 }}>
              {tenantView ? (appointment.phong_tro?.tieu_de || `Phòng #${appointment.ma_phong}`) : (appointment.ho_ten || 'Người thuê')}
            </Text>
            <Text style={{ color: STATUS_COLOR[appointment.trang_thai], fontWeight: '600', fontSize: 13 }}>
              {STATUS_LABEL[appointment.trang_thai]}
            </Text>
          </View>
          <Text style={{ color: '#4B5563', fontSize: 13 }}>
            {tenantView ? `${appointment.phong_tro?.ten_khu_tro || 'Khu trọ'} · ${appointment.phong_tro?.dia_chi || 'Địa chỉ đang cập nhật'}` : `${appointment.phong_tro?.tieu_de || `Phòng #${appointment.ma_phong}`} · ${appointment.phong_tro?.ten_khu_tro || 'Khu trọ'}`}
          </Text>
          <Text style={{ color: '#2563EB', fontSize: 14, fontWeight: '600' }}>
            Hẹn lúc: {formatDateTime(appointment.thoi_gian_hen)}
          </Text>
          <Text style={{ color: '#4B5563', fontSize: 13 }}>Số điện thoại: {appointment.so_dien_thoai || 'Chưa cập nhật'}</Text>
          {!!appointment.ghi_chu && <Text style={{ color: '#4B5563', fontSize: 13 }}>Ghi chú: {appointment.ghi_chu}</Text>}

          {editingId === appointment.ma_dat_lich && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  accessibilityLabel="Ngày hẹn mới"
                  placeholder="YYYY-MM-DD"
                  value={editDate}
                  onChangeText={setEditDate}
                  style={{ flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#111827' }}
                />
                <TextInput
                  accessibilityLabel="Giờ hẹn mới"
                  placeholder="09:00"
                  value={editTime}
                  onChangeText={setEditTime}
                  style={{ width: 100, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#111827' }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setEditingId(null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>Bỏ qua</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => saveReschedule(appointment)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#EAF3FF' }}>
                  {processingId === appointment.ma_dat_lich ? <ActivityIndicator size="small" color="#2563EB" /> : <Text style={{ color: '#2563EB', fontSize: 13 }}>Gửi giờ mới</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {appointment.trang_thai === 'ChoXacNhan' && !tenantView && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'TuChoi')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#FEF2F2' }}>
                <Text style={{ color: '#B91C1C', fontSize: 13 }}>Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'DaXacNhan')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#EAF3FF' }}>
                {processingId === appointment.ma_dat_lich ? <ActivityIndicator size="small" color="#2563EB" /> : <Text style={{ color: '#2563EB', fontSize: 13 }}>Xác nhận lịch</Text>}
              </TouchableOpacity>
            </View>
          )}
          {tenantView && appointment.trang_thai === 'ChoKhachXacNhan' && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'DaXacNhan')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#EAF3FF' }}>
                <Text style={{ color: '#2563EB', fontSize: 13 }}>Đồng ý giờ mới</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'TuChoi')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#FEF2F2' }}>
                <Text style={{ color: '#B91C1C', fontSize: 13 }}>Từ chối giờ mới</Text>
              </TouchableOpacity>
            </View>
          )}
          {tenantView && appointment.trang_thai === 'DaXem' && (
            <View style={{ backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, gap: 10, marginTop: 4 }}>
              <Text style={{ color: '#1E40AF', fontSize: 13, lineHeight: 19 }}>
                Bạn đã xem phòng này. Bạn thấy phòng thế nào?
              </Text>
              {!canRentRoom && (
                <Text style={{ color: '#B45309', fontSize: 13, lineHeight: 19 }}>
                  Phòng đã đủ người, hiện không còn chỗ để thuê chung.
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {canRentRoom && (
                  <TouchableOpacity onPress={() => goToRoom(appointment.ma_phong)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#2563EB' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Thuê phòng này</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => goToRoom(appointment.ma_phong)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFDBFE' }}>
                  <Text style={{ color: '#1D4ED8', fontSize: 13 }}>Viết đánh giá</Text>
                </TouchableOpacity>
                {canRentRoom && (
                  <TouchableOpacity onPress={() => goToRoom(appointment.ma_phong)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Text style={{ color: '#1D4ED8', fontSize: 13 }}>Đặt lịch xem lại</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          {!['DaXem', 'TuChoi', 'DaHuy'].includes(appointment.trang_thai) && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => beginReschedule(appointment)} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F3F4F6' }}>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>Đổi lịch</Text>
              </TouchableOpacity>
              {tenantView && appointment.trang_thai !== 'ChoKhachXacNhan' && (
                <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'DaHuy')} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>Hủy lịch hẹn</Text>
                </TouchableOpacity>
              )}
              {!tenantView && appointment.trang_thai === 'DaXacNhan' && new Date(String(appointment.thoi_gian_hen).replace(' ', 'T')) <= new Date() && (
                <TouchableOpacity disabled={processingId === appointment.ma_dat_lich} onPress={() => updateStatus(appointment, 'DaXem')} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#EFF6FF' }}>
                  <Text style={{ color: '#1D4ED8', fontSize: 13 }}>Đánh dấu đã xem</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        );
      })}
    </View>
  );
}