import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { showAlert } from '@/utils/alert';

interface SupportRequest {
  ma_yeu_cau: number;
  tieu_de: string;
  noi_dung: string;
  trang_thai: 'Moi' | 'DangXuLy' | 'DaGiaiQuyet';
  phan_hoi_admin?: string | null;
  ngay_tao?: string;
}

const STATUS_LABELS = {
  Moi: 'Mới tiếp nhận',
  DangXuLy: 'Đang xử lý',
  DaGiaiQuyet: 'Đã giải quyết',
};

export default function HoTroScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/ho-tro/mine');
      setRequests(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải yêu cầu hỗ trợ.');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSessionAndLoad = useCallback(async () => {
    await firebaseAuth.authStateReady();
    if (!firebaseAuth.currentUser) {
      router.replace('/login');
      return;
    }
    await loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    checkSessionAndLoad();
  }, [checkSessionAndLoad]);

  const submitRequest = async () => {
    if (!title.trim() || !details.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung yêu cầu.');
      return;
    }

    try {
      setSubmitting(true);
      await backendApi.post('/api/ho-tro', { tieu_de: title.trim(), noi_dung: details.trim() });
      setTitle('');
      setDetails('');
      await loadRequests();
      showAlert('Đã gửi', 'Yêu cầu hỗ trợ đã được gửi đến quản trị viên.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể gửi yêu cầu hỗ trợ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, backgroundColor: '#F5F7FA', minHeight: '100%' }}>
      <View style={{ width: '100%', maxWidth: 820, alignSelf: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#007AFF', fontSize: 14 }}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 20, gap: 12 }}>
          <Text style={{ color: '#1F2937', fontSize: 21, fontWeight: '700' }}>Gửi yêu cầu hỗ trợ</Text>
          <Text style={{ color: '#6B7280', fontSize: 13 }}>Mô tả vấn đề bạn cần hỗ trợ. Bạn có thể xem phản hồi bên dưới.</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề"
            maxLength={200}
            style={{ height: 44, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12 }}
          />
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Nội dung cần hỗ trợ"
            multiline
            style={{ minHeight: 120, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, padding: 12, textAlignVertical: 'top' }}
          />
          <TouchableOpacity
            onPress={submitRequest}
            disabled={submitting}
            style={{ minHeight: 42, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 6, backgroundColor: '#007AFF' }}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Gửi yêu cầu</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '700' }}>Yêu cầu của tôi</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : requests.length === 0 ? (
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Bạn chưa gửi yêu cầu hỗ trợ nào.</Text>
          ) : requests.map((request) => (
            <View key={request.ma_yeu_cau} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>{request.tieu_de}</Text>
                <Text style={{ color: '#007AFF', fontSize: 13 }}>{STATUS_LABELS[request.trang_thai]}</Text>
              </View>
              <Text style={{ color: '#4B5563', fontSize: 14 }}>{request.noi_dung}</Text>
              {!!request.phan_hoi_admin && (
                <View style={{ backgroundColor: '#F3F7FC', borderRadius: 6, padding: 12, gap: 4 }}>
                  <Text style={{ color: '#1F2937', fontWeight: '600', fontSize: 13 }}>Phản hồi quản trị viên</Text>
                  <Text style={{ color: '#4B5563', fontSize: 13 }}>{request.phan_hoi_admin}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}