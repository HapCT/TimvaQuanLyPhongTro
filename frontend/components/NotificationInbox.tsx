import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

type NotificationItem = {
  ma_thong_bao: number;
  tieu_de: string;
  noi_dung: string;
  loai_thong_bao?: string | null;
  da_doc: number | boolean;
  ngay_tao: string;
};

const formatDate = (value: string) => {
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

export default function NotificationInbox() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [listResponse, countResponse] = await Promise.all([
        backendApi.get('/api/thong-bao'),
        backendApi.get('/api/thong-bao/unread-count'),
      ]);
      setItems(listResponse.data || []);
      setUnreadCount(Number(countResponse.data?.count || 0));
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markRead = async (item: NotificationItem) => {
    if (Boolean(item.da_doc)) return;
    try {
      setProcessingId(item.ma_thong_bao);
      await backendApi.patch(`/api/thong-bao/${item.ma_thong_bao}/read`);
      setItems((previous) => previous.map((entry) => (
        entry.ma_thong_bao === item.ma_thong_bao ? { ...entry, da_doc: 1 } : entry
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể đánh dấu đã đọc.');
    } finally {
      setProcessingId(null);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await backendApi.patch('/api/thong-bao/read-all');
      setItems((previous) => previous.map((item) => ({ ...item, da_doc: 1 })));
      setUnreadCount(0);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể đánh dấu tất cả đã đọc.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ color: '#111827', fontSize: 21, fontWeight: '700' }}>Thông báo</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{unreadCount} chưa đọc</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={loadNotifications} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={markAllRead} disabled={markingAll || unreadCount === 0} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, opacity: unreadCount === 0 ? 0.5 : 1 }}>
            <Text style={{ color: '#4B5563', fontSize: 13 }}>{markingAll ? 'Đang lưu...' : 'Đọc tất cả'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} /> : items.length === 0 ? (
        <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>Bạn chưa có thông báo.</Text>
        </View>
      ) : items.map((item) => {
        const isUnread = !Boolean(item.da_doc);
        return (
          <View key={item.ma_thong_bao} style={{ backgroundColor: isUnread ? '#EFF6FF' : '#FFFFFF', borderWidth: 1, borderColor: isUnread ? '#BFDBFE' : '#E5E7EB', borderRadius: 8, padding: 14, gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ color: '#111827', fontSize: 15, fontWeight: isUnread ? '700' : '600', flex: 1 }}>{item.tieu_de}</Text>
              {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginTop: 5 }} />}
            </View>
            <Text style={{ color: '#4B5563', fontSize: 13, lineHeight: 19 }}>{item.noi_dung}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>{formatDate(item.ngay_tao)}</Text>
              {isUnread && (
                <TouchableOpacity disabled={processingId === item.ma_thong_bao} onPress={() => markRead(item)}>
                  <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600' }}>{processingId === item.ma_thong_bao ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
