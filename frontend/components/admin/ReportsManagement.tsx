import { formatNumber } from '@/utils/format';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

interface Period {
  id: '7d' | '30d' | '12m' | 'all';
  label: string;
}

interface ReportUser {
  vai_tro: string;
  ngay_tao?: string;
}

interface ReportRoom {
  trang_thai?: string;
}

interface ReportBooking {
  trang_thai: string;
  ngay_tao?: string;
}

interface ReportPayment {
  so_tien: number;
  trang_thai: string;
  ngay_thanh_toan?: string;
  ngay_tao?: string;
}

interface ReportContract {
  thanh_toan?: ReportPayment[];
}

interface ReportReview {
  so_sao: number;
  trang_thai: string;
  ngay_tao?: string;
}

interface ReportSupportRequest {
  trang_thai: string;
}

const PERIODS: Period[] = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '12m', label: '12 tháng' },
  { id: 'all', label: 'Tất cả' },
];

const statusRows = [
  { key: 'ConTrong', label: 'Còn trống', color: '#15803D' },
  { key: 'DaThue', label: 'Đã thuê', color: '#2563EB' },
  { key: 'BaoTri', label: 'Bảo trì', color: '#B45309' },
];

export default function ReportsManagement() {
  const [period, setPeriod] = useState<Period['id']>('30d');
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState(false);
  const [users, setUsers] = useState<ReportUser[]>([]);
  const [rooms, setRooms] = useState<ReportRoom[]>([]);
  const [bookings, setBookings] = useState<ReportBooking[]>([]);
  const [contracts, setContracts] = useState<ReportContract[]>([]);
  const [reviews, setReviews] = useState<ReportReview[]>([]);
  const [supportRequests, setSupportRequests] = useState<ReportSupportRequest[]>([]);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        backendApi.get('/api/users'),
        backendApi.get('/api/phong-tro'),
        backendApi.get('/api/dat-phong'),
        backendApi.get('/api/hop-dong'),
        backendApi.get('/api/danh-gia/admin'),
        backendApi.get('/api/ho-tro/admin'),
      ]);
      const data = results.map((result) => result.status === 'fulfilled' ? result.value.data : null);
      setPartialError(results.some((result) => result.status === 'rejected'));
      setUsers(Array.isArray(data[0]) ? data[0] : []);
      setRooms(Array.isArray(data[1]?.rooms) ? data[1].rooms : []);
      setBookings(Array.isArray(data[2]) ? data[2] : []);
      setContracts(Array.isArray(data[3]) ? data[3] : []);
      setReviews(Array.isArray(data[4]) ? data[4] : []);
      setSupportRequests(Array.isArray(data[5]) ? data[5] : []);
    } catch (error: any) {
      console.log('LOAD ADMIN REPORT ERROR:', error?.response?.data || error);
      showAlert('Lỗi', 'Không thể tải báo cáo thống kê.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '12m' ? 365 : null;
  const inPeriod = (value?: string | null) => {
    if (periodDays === null) return true;
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime() - periodDays * 86400000;
  };

  const newUsers = users.filter((user) => inPeriod(user.ngay_tao));
  const periodBookings = bookings.filter((booking) => inPeriod(booking.ngay_tao));
  const completedBookings = periodBookings.filter((booking) => booking.trang_thai === 'DaDuyet' || booking.trang_thai === 'TuChoi');
  const acceptedBookings = periodBookings.filter((booking) => booking.trang_thai === 'DaDuyet').length;
  const acceptanceRate = completedBookings.length ? Math.round(acceptedBookings * 100 / completedBookings.length) : 0;
  const paidPayments = contracts.flatMap((contract) => contract.thanh_toan || [])
    .filter((payment) => payment.trang_thai === 'DaThanhToan' && inPeriod(payment.ngay_thanh_toan || payment.ngay_tao));
  const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.so_tien || 0), 0);
  const roomCounts = statusRows.map((status) => ({
    ...status,
    count: rooms.filter((room) => String(room.trang_thai || '').toLowerCase() === status.key.toLowerCase()).length,
  }));
  const averageStars = reviews.length
    ? (reviews.reduce((sum, review) => sum + Number(review.so_sao || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const openSupportCount = supportRequests.filter((request) => request.trang_thai !== 'DaGiaiQuyet').length;
  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthOffset = 5 - index;
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const inMonth = (dateValue?: string) => {
      if (!dateValue) return false;
      const date = new Date(dateValue);
      return !Number.isNaN(date.getTime()) && date >= month && date < nextMonth;
    };
    return {
      label: month.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' }),
      users: users.filter((user) => inMonth(user.ngay_tao)).length,
      bookings: bookings.filter((booking) => inMonth(booking.ngay_tao)).length,
    };
  });
  const maxMonthlyCount = Math.max(1, ...monthlyTrend.map((month) => month.users + month.bookings));

  const metric = (label: string, value: string | number, detail: string, color: string) => (
    <View key={label} style={{ flexGrow: 1, flexBasis: 150, minWidth: 135, paddingVertical: 14, paddingHorizontal: 16, borderLeftWidth: 3, borderLeftColor: color, backgroundColor: '#F8FAFC' }}>
      <Text style={{ color: '#6B7280', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#111827', fontSize: 22, fontWeight: '700', marginTop: 5 }}>{value}</Text>
      <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 3 }}>{detail}</Text>
    </View>
  );

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <View>
          <Text style={{ fontSize: 21, fontWeight: '700', color: '#111827' }}>Báo cáo thống kê</Text>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Tình hình vận hành và hoạt động trên hệ thống.</Text>
        </View>
        <TouchableOpacity
          onPress={loadReport}
          disabled={loading}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, backgroundColor: '#FFFFFF' }}
        >
          <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: '600' }}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 }}>
        {PERIODS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setPeriod(option.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: period === option.id ? '#007AFF' : '#E5E7EB', backgroundColor: period === option.id ? '#EAF3FF' : '#FFFFFF' }}
          >
            <Text style={{ color: period === option.id ? '#007AFF' : '#4B5563', fontSize: 13 }}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {partialError && (
        <Text style={{ color: '#B45309', backgroundColor: '#FFFBEB', padding: 10, fontSize: 13 }}>
          Một số nguồn dữ liệu chưa tải được. Hãy khởi động lại backend và làm mới báo cáo.
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 32 }} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {metric('Người dùng mới', newUsers.length, `${PERIODS.find((option) => option.id === period)?.label}`, '#2563EB')}
            {metric('Yêu cầu đặt phòng', periodBookings.length, `${acceptedBookings} đã duyệt`, '#0F766E')}
            {metric('Tỷ lệ chấp nhận', `${acceptanceRate}%`, `${completedBookings.length} yêu cầu đã xử lý`, '#7C3AED')}
            {metric('Thanh toán ghi nhận', `${formatNumber(totalPaid)} đ`, `${paidPayments.length} khoản đã thu`, '#15803D')}
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16, gap: 12 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>Tình trạng phòng</Text>
            {roomCounts.map((status) => (
              <View key={status.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ width: 95, color: '#4B5563', fontSize: 13 }}>{status.label}</Text>
                <View style={{ flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ width: `${rooms.length ? status.count * 100 / rooms.length : 0}%`, height: '100%', backgroundColor: status.color }} />
                </View>
                <Text style={{ width: 44, textAlign: 'right', color: '#1F2937', fontSize: 13, fontWeight: '600' }}>{status.count}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 }}>
            <View style={{ flex: 1, minWidth: 260, gap: 12 }}>
              <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>Người dùng và yêu cầu theo tháng</Text>
              {monthlyTrend.map((month) => (
                <View key={month.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ width: 48, color: '#6B7280', fontSize: 12 }}>{month.label}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ height: 7, width: `${month.users * 100 / maxMonthlyCount}%`, backgroundColor: '#2563EB', borderRadius: 4 }} />
                    <View style={{ height: 7, width: `${month.bookings * 100 / maxMonthlyCount}%`, backgroundColor: '#0F766E', borderRadius: 4 }} />
                  </View>
                  <Text style={{ width: 58, textAlign: 'right', color: '#4B5563', fontSize: 11 }}>{month.users} / {month.bookings}</Text>
                </View>
              ))}
              <Text style={{ color: '#6B7280', fontSize: 11 }}>Mỗi tháng: người dùng mới / yêu cầu đặt phòng.</Text>
            </View>

            <View style={{ flex: 1, minWidth: 240, gap: 12 }}>
              <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700' }}>Chất lượng và xử lý</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>Đánh giá trung bình</Text>
                <Text style={{ color: '#B45309', fontSize: 13, fontWeight: '700' }}>★ {averageStars} / 5 ({reviews.length})</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>Đánh giá bị ẩn</Text>
                <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '700' }}>{reviews.filter((review) => review.trang_thai === 'An').length}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>Hỗ trợ đang mở</Text>
                <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '700' }}>{openSupportCount}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                <Text style={{ color: '#4B5563', fontSize: 13 }}>Hợp đồng hiệu lực</Text>
                <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '700' }}>{contracts.filter((contract: any) => contract.trang_thai === 'DangHieuLuc').length}</Text>
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Thanh toán là số tiền chủ trọ ghi nhận thủ công, chưa tích hợp cổng thanh toán.</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
