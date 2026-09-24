import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Linking,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';
import { styles } from '@/styles/admin/rooms-management.styles';

export default function RoomReviewManagement() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rooms, setRooms] = useState<any[]>([]);
  const [counts, setCounts] = useState({ ChoDuyet: 0, DaDuyet: 0, TuChoi: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ChoDuyet' | 'DaDuyet' | 'TuChoi' | 'ALL'>('ChoDuyet');

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal Từ chối
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectRoomId, setRejectRoomId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Modal Xem ảnh phóng to
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadReviewRooms();
  }, [activeTab]);

  const loadReviewRooms = async () => {
    try {
      setLoading(true);
      const res = await backendApi.get(`/api/phong-tro/admin/review?status=${activeTab}`);
      if (res.data) {
        setRooms(res.data.rooms || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (e: any) {
      console.log('LOAD REVIEW ERROR:', e);
      showAlert('Lỗi', 'Không thể tải danh sách bài đăng duyệt.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (id: number) => {
    const doApprove = async () => {
      try {
        setProcessingId(id);
        await backendApi.patch(`/api/phong-tro/${id}/duyet`, {
          ket_qua: 'DaDuyet',
        });
        showAlert('Thành công', 'Đã duyệt bài đăng!');
        loadReviewRooms();
      } catch (e: any) {
        console.log('APPROVE ERROR:', e);
        showAlert('Lỗi', e.response?.data?.error || 'Có lỗi xảy ra khi duyệt bài.');
      } finally {
        setProcessingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Bạn có chắc chắn muốn DUYỆT bài đăng phòng trọ này không?')) {
        doApprove();
      }
    } else {
      Alert.alert('Xác nhận duyệt', 'Bạn có chắc chắn muốn DUYỆT bài đăng phòng trọ này không?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Duyệt bài', onPress: doApprove },
      ]);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectRoomId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập lý do từ chối bài đăng.');
      return;
    }

    try {
      setProcessingId(rejectRoomId);
      await backendApi.patch(`/api/phong-tro/${rejectRoomId}/duyet`, {
        ket_qua: 'TuChoi',
        ly_do: rejectReason.trim(),
      });
      setRejectModalVisible(false);
      showAlert('Thành công', 'Đã từ chối bài đăng.');
      loadReviewRooms();
    } catch (e: any) {
      console.log('REJECT ERROR:', e);
      showAlert('Lỗi', e.response?.data?.error || 'Có lỗi xảy ra khi từ chối bài.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'DaDuyet') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#DEF7EC' }]}>
          <Text style={{ color: '#03543F', fontWeight: 'bold', fontSize: 12 }}>🟢 Đã duyệt</Text>
        </View>
      );
    }
    if (status === 'TuChoi') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FDE8E8' }]}>
          <Text style={{ color: '#9B1C1C', fontWeight: 'bold', fontSize: 12 }}>🔴 Từ chối</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#FEF08A' }]}>
        <Text style={{ color: '#854D0E', fontWeight: 'bold', fontSize: 12 }}>⏳ Chờ duyệt</Text>
      </View>
    );
  };

  return (
    <View style={{ gap: 16 }}>
      {/* TIÊU ĐỀ SECTION */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Duyệt bài đăng phòng trọ</Text>
          <Text style={styles.sectionSub}>Kiểm tra thông tin & hồ sơ pháp lý phòng trọ do Chủ trọ đăng tải.</Text>
        </View>
      </View>

      {/* TABS LỌC THEO TRẠNG THÁI */}
      <View style={styles.quickStatsRow}>
        <TouchableOpacity
          style={[styles.quickStatCard, activeTab === 'ChoDuyet' && styles.quickStatCardActive]}
          onPress={() => setActiveTab('ChoDuyet')}
        >
          <Text style={styles.quickStatTitle}>⏳ Chờ duyệt</Text>
          <Text style={[styles.quickStatValue, { color: '#D97706' }]}>{counts.ChoDuyet || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickStatCard, activeTab === 'DaDuyet' && styles.quickStatCardActive]}
          onPress={() => setActiveTab('DaDuyet')}
        >
          <Text style={styles.quickStatTitle}>🟢 Đã duyệt</Text>
          <Text style={[styles.quickStatValue, { color: '#059669' }]}>{counts.DaDuyet || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickStatCard, activeTab === 'TuChoi' && styles.quickStatCardActive]}
          onPress={() => setActiveTab('TuChoi')}
        >
          <Text style={styles.quickStatTitle}>🔴 Từ chối</Text>
          <Text style={[styles.quickStatValue, { color: '#DC2626' }]}>{counts.TuChoi || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickStatCard, activeTab === 'ALL' && styles.quickStatCardActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={styles.quickStatTitle}>📋 Tất cả bài đăng</Text>
          <Text style={[styles.quickStatValue, { color: '#2563EB' }]}>
            {(counts.ChoDuyet || 0) + (counts.DaDuyet || 0) + (counts.TuChoi || 0)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH BÀI ĐĂNG */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 8, color: '#666' }}>Đang tải danh sách bài đăng...</Text>
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40 }}>📄</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginTop: 8 }}>
            Không có bài đăng nào {activeTab === 'ChoDuyet' ? 'đang chờ duyệt' : ''}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {rooms.map((room) => {
            const isExpanded = expandedIds.has(room.ma_phong);
            const anhDaiDien = room.danh_sach_anh?.[0]?.duong_dan_anh || room.anh_dai_dien;

            return (
              <View
                key={room.ma_phong}
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  gap: 12,
                }}
              >
                {/* HEADER BÀI ĐĂNG */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                    {anhDaiDien ? (
                      <Image source={{ uri: anhDaiDien }} style={{ width: 64, height: 64, borderRadius: 8 }} />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24 }}>🏠</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={2}>
                        {room.tieu_de || `Phòng ${room.so_phong}`}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#4B5563' }}>
                        📍 {room.khu_tro?.ten_khu_tro} - {room.khu_tro?.dia_chi}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563EB' }}>
                        💰 {(room.gia_thue || 0).toLocaleString('vi-VN')} đ/tháng | Coc: {(room.tien_coc || 0).toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  </View>
                  {renderStatusBadge(room.trang_thai_duyet)}
                </View>

                {/* THÔNG TIN CHỦ TRỌ & HỒ SƠ PHÁP LÝ NHANH */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    👤 <Text style={{ fontWeight: '600' }}>Chủ trọ:</Text> {room.chu_tro?.ho_ten || 'N/A'} ({room.chu_tro?.so_dien_thoai || 'N/A'})
                  </Text>
                  <Text style={{ fontSize: 13, color: '#374151' }}>
                    📋 <Text style={{ fontWeight: '600' }}>Hồ sơ pháp lý:</Text> {room.ho_so_phap_ly?.length || 0} giấy tờ
                  </Text>
                  {room.trang_thai_duyet === 'TuChoi' && !!room.ly_do_tu_choi && (
                    <Text style={{ fontSize: 13, color: '#DC2626', width: '100%' }}>
                      ⚠️ <Text style={{ fontWeight: '600' }}>Lý do từ chối:</Text> {room.ly_do_tu_choi}
                    </Text>
                  )}
                </View>

                {/* NÚT THAO TÁC */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <TouchableOpacity
                    style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderRadius: 6 }}
                    onPress={() => toggleExpand(room.ma_phong)}
                  >
                    <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 13 }}>
                      {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết hồ sơ'}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {room.trang_thai_duyet !== 'TuChoi' && (
                      <TouchableOpacity
                        style={{ paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#FEE2E2', borderRadius: 6 }}
                        onPress={() => openRejectModal(room.ma_phong)}
                        disabled={processingId === room.ma_phong}
                      >
                        <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>✕ Từ chối</Text>
                      </TouchableOpacity>
                    )}

                    {room.trang_thai_duyet !== 'DaDuyet' && (
                      <TouchableOpacity
                        style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#2563EB', borderRadius: 6 }}
                        onPress={() => handleApprove(room.ma_phong)}
                        disabled={processingId === room.ma_phong}
                      >
                        {processingId === room.ma_phong ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>✓ Duyệt bài đăng</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* CHI TIẾT BÀI ĐĂNG & HỒ SƠ PHÁP LÝ (EXPANDED) */}
                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, gap: 12 }}>
                    {/* HỒ SƠ PHÁP LÝ */}
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                        📜 Giấy tờ pháp lý bắt buộc:
                      </Text>
                      {(!room.ho_so_phap_ly || room.ho_so_phap_ly.length === 0) ? (
                        <Text style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>Chưa tải lên hồ sơ pháp lý.</Text>
                      ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                          {room.ho_so_phap_ly.map((doc: any, index: number) => {
                            const nameMap: Record<string, string> = {
                              giayPhepKinhDoanh: 'Giấy phép kinh doanh',
                              bangKhaiPhongTro: 'Bảng khai phòng trọ',
                              dangKyTamTru: 'Đăng ký tạm trú',
                            };
                            const title = nameMap[doc.loai_giay_to] || doc.loai_giay_to;
                            const imgUrl = doc.url || doc.duong_dan;

                            return (
                              <TouchableOpacity
                                key={index}
                                style={{
                                  width: isMobile ? '100%' : '31%',
                                  backgroundColor: '#F3F4F6',
                                  borderRadius: 8,
                                  padding: 8,
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                                onPress={() => {
                                  if (imgUrl) setPreviewImage(imgUrl);
                                }}
                              >
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{title}</Text>
                                {imgUrl ? (
                                  <Image source={{ uri: imgUrl }} style={{ width: '100%', height: 120, borderRadius: 6 }} resizeMode="cover" />
                                ) : (
                                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Không có ảnh</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* HÌNH ẢNH PHÒNG */}
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                        📸 Hình ảnh phòng trọ ({room.danh_sach_anh?.length || 0}):
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {(room.danh_sach_anh || []).map((img: any, idx: number) => (
                            <TouchableOpacity key={idx} onPress={() => setPreviewImage(img.duong_dan_anh)}>
                              <Image source={{ uri: img.duong_dan_anh }} style={{ width: 100, height: 75, borderRadius: 6 }} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* MÔ TẢ PHÒNG */}
                    {!!room.mo_ta && (
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>📝 Mô tả chi tiết:</Text>
                        <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>{room.mo_ta}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL TỪ CHỐI BÀI ĐĂNG */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', width: '100%', maxWidth: 450, borderRadius: 12, padding: 20, gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Từ chối bài đăng phòng trọ</Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              Vui lòng nhập lý do từ chối để Chủ trọ biết và cập nhật lại hồ sơ/bài đăng.
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                padding: 12,
                minHeight: 90,
                textAlignVertical: 'top',
                fontSize: 14,
              }}
              placeholder="VD: Thiếu ảnh Giấy phép kinh doanh / Thông tin mô tả không chính xác..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#F3F4F6' }}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={{ color: '#4B5563', fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, backgroundColor: '#DC2626' }}
                onPress={handleConfirmReject}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Xác nhận từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL PREVIEW ẢNH PHÓNG TO */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setPreviewImage(null)}
        >
          {!!previewImage && (
            <Image source={{ uri: previewImage }} style={{ width: '90%', height: '80%' }} resizeMode="contain" />
          )}
          <Text style={{ color: '#FFF', marginTop: 12, fontSize: 14 }}>Chạm vào màn hình để đóng</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
