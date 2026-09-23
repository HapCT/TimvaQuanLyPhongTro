// Trang quản lý phòng trọ dành riêng cho Chủ Trọ
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';

export default function LandlordRoomsScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1000;

  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [myKhuTroList, setMyKhuTroList] = useState<any[]>([]);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [tienIchList, setTienIchList] = useState<any[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterKhuTro, setFilterKhuTro] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal Thêm/Sửa phòng
  const [formVisible, setFormVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTieuDe, setFormTieuDe] = useState('');
  const [formSoPhong, setFormSoPhong] = useState('');
  const [formGiaThue, setFormGiaThue] = useState('');
  const [formTienCoc, setFormTienCoc] = useState('');
  const [formDienTich, setFormDienTich] = useState('');
  const [formTrangThai, setFormTrangThai] = useState('ConTrong');
  const [formMaKhuTro, setFormMaKhuTro] = useState('');
  const [formAnhDaiDien, setFormAnhDaiDien] = useState('');
  const [formMoTa, setFormMoTa] = useState('');
  const [selectedTienIch, setSelectedTienIch] = useState<string[]>([]);

  useEffect(() => {
    loadLandlordData();
  }, []);

  const loadLandlordData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLandlordId(user.id);

      // 1. Tải toàn bộ phòng trọ & khu trọ từ backend API
      const response = await backendApi.get('/api/phong-tro');
      const { rooms = [], khuTroList = [], tienIchList = [] } = response.data || {};

      setTienIchList(tienIchList);

      // 2. Lọc khu trọ do chủ trọ này sở hữu
      const landlordKhuTro = khuTroList.filter((k: any) => k.ma_chu_tro === user.id);
      setMyKhuTroList(landlordKhuTro);

      const landlordKhuTroIds = landlordKhuTro.map((k: any) => k.ma_khu_tro);

      // 3. Lọc danh sách phòng thuộc các khu trọ của chủ trọ
      const filteredRooms = rooms.filter((r: any) =>
        landlordKhuTroIds.includes(r.ma_khu_tro) || r.khu_tro?.ma_chu_tro === user.id
      );

      setMyRooms(filteredRooms);
    } catch (e) {
      console.log('LOAD LANDLORD DATA ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = myRooms.length;
    const inStock = myRooms.filter((r) => r.trang_thai === 'ConTrong' || r.trang_thai === 'Trong').length;
    const rented = myRooms.filter((r) => r.trang_thai === 'DaThue').length;
    return { total, inStock, rented, khuTroCount: myKhuTroList.length };
  }, [myRooms, myKhuTroList]);

  // Lọc phòng hiển thị
  const displayedRooms = useMemo(() => {
    return myRooms.filter((r) => {
      const keyword = search.trim().toLowerCase();
      const matchKeyword =
        !keyword ||
        (r.tieu_de || '').toLowerCase().includes(keyword) ||
        (r.so_phong || '').toLowerCase().includes(keyword) ||
        (r.khu_tro?.ten_khu_tro || '').toLowerCase().includes(keyword);

      const matchKhu = filterKhuTro === 'ALL' || String(r.ma_khu_tro) === String(filterKhuTro);
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ConTrong' && (r.trang_thai === 'ConTrong' || r.trang_thai === 'Trong')) ||
        (filterStatus === 'DaThue' && r.trang_thai === 'DaThue');

      return matchKeyword && matchKhu && matchStatus;
    });
  }, [myRooms, search, filterKhuTro, filterStatus]);

  // Đổi nhanh trạng thái phòng (Còn trống <-> Đã thuê)
  const handleToggleStatus = async (room: any) => {
    const currentStatus = room.trang_thai === 'DaThue' ? 'DaThue' : 'ConTrong';
    const newStatus = currentStatus === 'ConTrong' ? 'DaThue' : 'ConTrong';

    // Cập nhật UI tạm thời
    setMyRooms((prev) =>
      prev.map((r) => (r.ma_phong === room.ma_phong ? { ...r, trang_thai: newStatus } : r))
    );

    try {
      // Cập nhật Database
      await supabase
        .from('phong_tro')
        .update({ trang_thai: newStatus })
        .eq('ma_phong', room.ma_phong);

      if (Platform.OS === 'web') {
        // notification nhẹ
      }
    } catch (e) {
      console.log('TOGGLE STATUS ERROR:', e);
      // Revert if error
      setMyRooms((prev) =>
        prev.map((r) => (r.ma_phong === room.ma_phong ? { ...r, trang_thai: currentStatus } : r))
      );
    }
  };

  // Mở modal thêm/sửa
  const handleOpenForm = (room?: any) => {
    if (room) {
      setEditingRoom(room);
      setFormTieuDe(room.tieu_de || '');
      setFormSoPhong(room.so_phong || '');
      setFormGiaThue(String(room.gia_thue || ''));
      setFormTienCoc(String(room.tien_coc || ''));
      setFormDienTich(String(room.dien_tich || ''));
      setFormTrangThai(room.trang_thai === 'DaThue' ? 'DaThue' : 'ConTrong');
      setFormMaKhuTro(String(room.ma_khu_tro || ''));
      setFormAnhDaiDien(room.anh_dai_dien || '');
      setFormMoTa(room.mo_ta || '');
      setSelectedTienIch((room.danh_sach_tien_ich || []).map((t: any) => t.ma_tien_ich));
    } else {
      setEditingRoom(null);
      setFormTieuDe('');
      setFormSoPhong('');
      setFormGiaThue('');
      setFormTienCoc('');
      setFormDienTich('');
      setFormTrangThai('ConTrong');
      setFormMaKhuTro(myKhuTroList[0]?.ma_khu_tro || '');
      setFormAnhDaiDien('');
      setFormMoTa('');
      setSelectedTienIch([]);
    }
    setFormVisible(true);
  };

  // Lưu thông tin phòng trọ
  const handleSaveRoom = async () => {
    if (!formSoPhong.trim() || !formGiaThue.trim() || !formMaKhuTro) {
      const msg = 'Vui lòng điền Số phòng, Giá thuê và Chọn khu trọ.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Thông báo', msg);
      return;
    }

    setSubmitting(true);
    try {
      const roomPayload = {
        tieu_de: formTieuDe.trim() || `Phòng ${formSoPhong.trim()}`,
        so_phong: formSoPhong.trim(),
        gia_thue: parseFloat(formGiaThue) || 0,
        tien_coc: parseFloat(formTienCoc) || parseFloat(formGiaThue) || 0,
        dien_tich: parseFloat(formDienTich) || 0,
        trang_thai: formTrangThai,
        ma_khu_tro: formMaKhuTro,
        anh_dai_dien: formAnhDaiDien.trim() || null,
        mo_ta: formMoTa.trim() || null,
      };

      if (editingRoom) {
        // Cập nhật
        await backendApi.put(`/api/phong-tro/${editingRoom.ma_phong}`, {
          roomData: roomPayload,
          selectedTienIch,
        });
      } else {
        // Tạo mới
        await backendApi.post('/api/phong-tro', {
          roomData: roomPayload,
          selectedTienIch,
          images: formAnhDaiDien.trim() ? [{ duong_dan_anh: formAnhDaiDien.trim(), anh_chinh: true }] : [],
        });
      }

      setFormVisible(false);
      loadLandlordData();
      const successMsg = editingRoom ? 'Cập nhật phòng trọ thành công!' : 'Tạo phòng trọ mới thành công!';
      if (Platform.OS === 'web') alert(successMsg); else Alert.alert('Thành công', successMsg);
    } catch (e: any) {
      console.log('SAVE ROOM ERROR:', e);
      const errMsg = e.response?.data?.error || 'Có lỗi xảy ra khi lưu phòng trọ.';
      if (Platform.OS === 'web') alert(errMsg); else Alert.alert('Lỗi', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa phòng trọ
  const handleDeleteRoom = async (maPhong: any) => {
    const confirmDelete = async () => {
      try {
        await backendApi.delete(`/api/phong-tro/${maPhong}`);
        setMyRooms((prev) => prev.filter((r) => r.ma_phong !== maPhong));
      } catch (e) {
        console.log('DELETE ROOM ERROR:', e);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Bạn có chắc chắn muốn xóa phòng trọ này không?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa phòng trọ này không?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Đang tải dữ liệu phòng trọ...</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
      <View style={[styles.mainContent, { maxWidth: isDesktop ? 1250 : '100%' }]}>

        {/* THỐNG KÊ NHANH */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statText}>Tổng phòng trọ</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#34C759' }]}>
            <Text style={[styles.statNum, { color: '#34C759' }]}>{stats.inStock}</Text>
            <Text style={styles.statText}>🟢 Còn trống</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#FF3B30' }]}>
            <Text style={[styles.statNum, { color: '#FF3B30' }]}>{stats.rented}</Text>
            <Text style={styles.statText}>🔴 Đã cho thuê</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#007AFF' }]}>
            <Text style={[styles.statNum, { color: '#007AFF' }]}>{stats.khuTroCount}</Text>
            <Text style={styles.statText}>🏢 Khu trọ sở hữu</Text>
          </View>
        </View>

        {/* CÔNG CỤ TÌM KIẾM & HÀNH ĐỘNG */}
        <View style={styles.actionCard}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo số phòng, tên phòng, khu trọ..."
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filterRow}>
            {/* LỌC KHU TRỌ */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.filterChip, filterKhuTro === 'ALL' && styles.filterChipActive]}
                onPress={() => setFilterKhuTro('ALL')}
              >
                <Text style={[styles.filterChipText, filterKhuTro === 'ALL' && styles.filterChipTextActive]}>
                  Tất cả khu trọ ({stats.khuTroCount})
                </Text>
              </TouchableOpacity>
              {myKhuTroList.map((k) => (
                <TouchableOpacity
                  key={k.ma_khu_tro}
                  style={[styles.filterChip, String(filterKhuTro) === String(k.ma_khu_tro) && styles.filterChipActive]}
                  onPress={() => setFilterKhuTro(k.ma_khu_tro)}
                >
                  <Text style={[styles.filterChipText, String(filterKhuTro) === String(k.ma_khu_tro) && styles.filterChipTextActive]}>
                    🏢 {k.ten_khu_tro}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* NÚT THÊM PHÒNG */}
            <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenForm()}>
              <Text style={styles.addBtnText}>+ Thêm phòng mới</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DANH SÁCH PHÒNG TRỌ */}
        <Text style={styles.sectionTitle}>
          📋 Danh sách phòng trọ ({displayedRooms.length})
        </Text>

        {displayedRooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44 }}>🏘️</Text>
            <Text style={styles.emptyText}>Chưa có phòng trọ nào phù hợp</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => handleOpenForm()}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>+ Thêm phòng trọ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomGrid}>
            {displayedRooms.map((room) => {
              const isConTrong = room.trang_thai === 'ConTrong' || room.trang_thai === 'Trong';
              return (
                <View
                  key={room.ma_phong}
                  style={[
                    styles.roomCard,
                    {
                      width: (isMobile
                        ? '100%'
                        : (Platform.OS === 'web' ? 'calc(50% - 8px)' : '48.5%')) as any,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri: room.anh_dai_dien || 'https://placehold.co/400x300/e8f0fe/007AFF?text=Phong+Tro',
                    }}
                    style={styles.roomImg}
                  />

                  {/* NÚT ĐỔI TRẠNG THÁI NHANH */}
                  <TouchableOpacity
                    style={[
                      styles.toggleStatusBadge,
                      { backgroundColor: isConTrong ? '#34C759' : '#FF3B30' },
                    ]}
                    onPress={() => handleToggleStatus(room)}
                  >
                    <Text style={styles.toggleStatusText}>
                      {isConTrong ? '🟢 Còn trống (Bấm đổi)' : '🔴 Đã cho thuê (Bấm đổi)'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.roomBody}>
                    <Text style={styles.roomTitle} numberOfLines={1}>
                      {room.tieu_de || `Phòng ${room.so_phong}`}
                    </Text>
                    <Text style={styles.roomKhuText} numberOfLines={1}>
                      🏢 {room.khu_tro?.ten_khu_tro || 'Khu trọ'} - Số phòng: {room.so_phong}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceVal}>{room.gia_thue?.toLocaleString('vi-VN')} đ/tháng</Text>
                      <Text style={styles.areaVal}>{room.dien_tich ? `${room.dien_tich} m²` : '--'}</Text>
                    </View>

                    {/* HÀNH ĐỘNG SỬA / XÓA */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleOpenForm(room)}
                      >
                        <Text style={styles.editBtnText}>✏️ Chỉnh sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteRoom(room.ma_phong)}
                      >
                        <Text style={styles.deleteBtnText}>🗑️ Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </View>

      {/* MODAL THÊM / SỬA PHÒNG TRỌ */}
      <Modal visible={formVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? '✏️ Cập nhật thông tin phòng' : '➕ Thêm phòng trọ mới'}
              </Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Text style={styles.label}>Chọn khu trọ *</Text>
              <View style={styles.khuPickerRow}>
                {myKhuTroList.map((k) => (
                  <TouchableOpacity
                    key={k.ma_khu_tro}
                    style={[
                      styles.khuPickerItem,
                      String(formMaKhuTro) === String(k.ma_khu_tro) && styles.khuPickerItemActive,
                    ]}
                    onPress={() => setFormMaKhuTro(k.ma_khu_tro)}
                  >
                    <Text
                      style={[
                        styles.khuPickerText,
                        String(formMaKhuTro) === String(k.ma_khu_tro) && styles.khuPickerTextActive,
                      ]}
                    >
                      🏢 {k.ten_khu_tro}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Số phòng *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: 101, 202..."
                    value={formSoPhong}
                    onChangeText={setFormSoPhong}
                  />
                </View>

                <View style={{ flex: 1.5 }}>
                  <Text style={styles.label}>Tiêu đề bài đăng</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tên phòng..."
                    value={formTieuDe}
                    onChangeText={setFormTieuDe}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Giá thuê (VNĐ/tháng) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2500000"
                    keyboardType="numeric"
                    value={formGiaThue}
                    onChangeText={setFormGiaThue}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tiền cọc (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2500000"
                    keyboardType="numeric"
                    value={formTienCoc}
                    onChangeText={setFormTienCoc}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Diện tích (m²)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25"
                    keyboardType="numeric"
                    value={formDienTich}
                    onChangeText={setFormDienTich}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Trạng thái phòng</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        formTrangThai === 'ConTrong' && { backgroundColor: '#34C759', borderColor: '#34C759' },
                      ]}
                      onPress={() => setFormTrangThai('ConTrong')}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: formTrangThai === 'ConTrong' ? '#FFF' : '#333' }}>
                        🟢 Còn trống
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusToggleBtn,
                        formTrangThai === 'DaThue' && { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
                      ]}
                      onPress={() => setFormTrangThai('DaThue')}
                    >
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: formTrangThai === 'DaThue' ? '#FFF' : '#333' }}>
                        🔴 Đã thuê
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 10 }]}>URL Hình ảnh đại diện</Text>
              <TextInput
                style={styles.input}
                placeholder="https://... (Đường dẫn ảnh đại diện)"
                value={formAnhDaiDien}
                onChangeText={setFormAnhDaiDien}
              />

              <Text style={[styles.label, { marginTop: 10 }]}>Mô tả phòng trọ</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Mô tả tiện ích, vị trí, giờ giấc..."
                multiline
                value={formMoTa}
                onChangeText={setFormMoTa}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRoom} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {editingRoom ? 'Cập nhật' : 'Thêm mới'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  mainContent: {
    width: '100%',
    alignSelf: 'center',
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#8E8E93',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // ACTION CARD
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F5F7FB',
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#555',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },

  // GRID & ROOM CARD
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    position: 'relative',
  },
  roomImg: {
    width: '100%',
    height: 160,
    backgroundColor: '#EEEEEE',
  },
  toggleStatusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  roomBody: {
    padding: 12,
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  roomKhuText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F7FB',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  areaVal: {
    fontSize: 12,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#EEF5FF',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6E0FF',
  },
  editBtnText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  deleteBtnText: {
    color: '#FF4D4F',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // MODAL FORM
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F5F7FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#222',
    outlineStyle: 'none',
  } as any,
  khuPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  khuPickerItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F7FB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  khuPickerItemActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  khuPickerText: {
    fontSize: 12,
    color: '#555',
  },
  khuPickerTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F5F7FB',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F5F7FB',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
});
