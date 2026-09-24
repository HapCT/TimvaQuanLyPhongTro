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
import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/utils/upload';

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

  // Modal pháp lý trước khi đăng bài mới
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalChecked, setLegalChecked] = useState({
    giayPhepKinhDoanh: false,
    bangKhaiPhongTro: false,
    dangKyTamTru: false,
    ketQuaDieuTra: false,
    camKetGia: false,
  });
  // Phí đăng bài: 50.000 đ/bài. Reset về 0 khi phòng DaThue (ẩn bài)
  const PHI_DANG_BAI = 50000;
  const [phiDaDuyet, setPhiDaDuyet] = useState(false); // đánh dấu đã xác nhận phí

  // Modal Thêm/Sửa phòng
  const [formVisible, setFormVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTieuDe, setFormTieuDe] = useState('');
  const [formSoPhong, setFormSoPhong] = useState('');
  const [formTang, setFormTang] = useState('1');
  const [formSoNguoiToiDa, setFormSoNguoiToiDa] = useState('2');
  const [formGiaThue, setFormGiaThue] = useState('');
  const [formTienCoc, setFormTienCoc] = useState('');
  const [formDienTich, setFormDienTich] = useState('');
  const [formTrangThai, setFormTrangThai] = useState('ConTrong');
  const [formMaKhuTro, setFormMaKhuTro] = useState('');
  const [formAnhDaiDien, setFormAnhDaiDien] = useState('');
  const [formMoTa, setFormMoTa] = useState('');
  const [selectedTienIch, setSelectedTienIch] = useState<string[]>([]);

  // State Ảnh phòng & Hồ sơ pháp lý
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [legalDocUrls, setLegalDocUrls] = useState<{
    giayPhepKinhDoanh?: string;
    bangKhaiPhongTro?: string;
    dangKyTamTru?: string;
  }>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Chọn & Upload Ảnh phòng từ thư viện
  const handlePickRoomImages = async () => {
    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          const url = await uploadImage(asset.uri);
          uploadedUrls.push(url);
        }
        setRoomImages((prev) => [...prev, ...uploadedUrls]);
        if (!formAnhDaiDien && uploadedUrls.length > 0) {
          setFormAnhDaiDien(uploadedUrls[0]);
        }
      }
    } catch (e: any) {
      console.log('PICK IMAGE ERROR:', e);
      const msg = e.message || 'Có lỗi xảy ra khi chọn ảnh phòng trọ.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Lỗi', msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Chọn & Upload Giấy tờ pháp lý
  const handlePickLegalDoc = async (docKey: 'giayPhepKinhDoanh' | 'bangKhaiPhongTro' | 'dangKyTamTru') => {
    try {
      setUploadingDocKey(docKey);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const url = await uploadImage(result.assets[0].uri);
        setLegalDocUrls((prev) => ({ ...prev, [docKey]: url }));
        setLegalChecked((prev) => ({ ...prev, [docKey]: true }));
      }
    } catch (e: any) {
      console.log('PICK LEGAL DOC ERROR:', e);
      const msg = e.message || 'Có lỗi xảy ra khi tải giấy tờ.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Lỗi', msg);
    } finally {
      setUploadingDocKey(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        loadLandlordData(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadLandlordData = async (user = firebaseAuth.currentUser) => {
    try {
      setLoading(true);
      if (!user) return;

      setLandlordId(user.uid);

      // 1. Tải danh sách Khu trọ trực tiếp từ API /api/khu-tro
      const khuResponse = await backendApi.get('/api/khu-tro');
      const allKhuTro = khuResponse.data || [];

      // 2. CHỈ LỌC KHU TRỌ MÀ CHỦ TRỌ NÀY TẠO (ma_chu_tro === user.uid)
      const landlordKhuTro = allKhuTro.filter(
        (k: any) => String(k.ma_chu_tro || '').trim() === String(user.uid).trim()
      );
      setMyKhuTroList(landlordKhuTro);

      // 3. Tải danh sách tiện ích trực tiếp từ API /api/tien-ich
      try {
        const tiRes = await backendApi.get('/api/tien-ich');
        setTienIchList(tiRes.data || []);
      } catch (_e) {
        setTienIchList([]);
      }

      // 4. Tải danh sách phòng trọ từ /api/phong-tro
      const response = await backendApi.get('/api/phong-tro');
      const { rooms = [], tienIchList: fallbackTi = [] } = response.data || {};

      if (tienIchList.length === 0 && fallbackTi.length > 0) {
        setTienIchList(fallbackTi);
      }

      const landlordKhuTroIds = landlordKhuTro.map((k: any) => String(k.ma_khu_tro));

      // 4. CHỈ LỌC PHÒNG THUỘC CÁC KHU TRỌ CỦA CHỦ TRỌ NÀY
      const filteredRooms = rooms.filter((r: any) =>
        landlordKhuTroIds.includes(String(r.ma_khu_tro)) ||
        String(r.khu_tro?.ma_chu_tro || '').trim() === String(user.uid).trim()
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
  // Khi chuyển sang DaThue: ẩn bài khỏi người thuê, KHÔNG thu phí thêm
  // Khi chuyển lại ConTrong: hiện bài trở lại, thu phí bình thường
  const handleToggleStatus = async (room: any) => {
    const currentStatus = room.trang_thai === 'DaThue' ? 'DaThue' : 'ConTrong';
    const newStatus = currentStatus === 'ConTrong' ? 'DaThue' : 'ConTrong';

    // Thông báo ý nghĩa việc đổi trạng thái
    const msg =
      newStatus === 'DaThue'
        ? '🔴 Phòng sẽ được ẩn khỏi danh sách tìm trọ. Bài đăng tạm ngưng, phí đăng bài sẽ không bị tính thêm.'
        : '🟢 Phòng sẽ hiển thị trở lại cho người thuê tìm kiếm.';

    const doToggle = async () => {
      // Cập nhật UI tạm thời
      setMyRooms((prev) =>
        prev.map((r) => (r.ma_phong === room.ma_phong ? { ...r, trang_thai: newStatus } : r))
      );
      try {
        await backendApi.patch(`/api/phong-tro/${room.ma_phong}`, { trang_thai: newStatus });
      } catch (e) {
        console.log('TOGGLE STATUS ERROR:', e);
        setMyRooms((prev) =>
          prev.map((r) => (r.ma_phong === room.ma_phong ? { ...r, trang_thai: currentStatus } : r))
        );
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(msg + '\n\nXác nhận đổi trạng thái?')) {
        doToggle();
      }
    } else {
      Alert.alert('Đổi trạng thái phòng', msg, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: doToggle },
      ]);
    }
  };

  // Kiểm tra pháp lý đã chọn đủ chưa
  const isLegalComplete = Object.values(legalChecked).every(Boolean);

  // Mở modal thêm/sửa
  // - Nếu thêm mới: bắt buộc qua modal pháp lý + xác nhận phí trước
  // - Nếu sửa: mở thẳng form
  const handleOpenForm = (room?: any) => {
    if (room) {
      // Chỉnh sửa phòng hiện có – bỏ qua pháp lý
      setEditingRoom(room);
      setFormTieuDe(room.tieu_de || room.ten_phong || '');
      setFormSoPhong(room.so_phong || '');
      setFormTang(String(room.tang || '1'));
      setFormSoNguoiToiDa(String(room.so_nguoi_toi_da || '2'));
      setFormGiaThue(String(room.gia_thue || ''));
      setFormTienCoc(String(room.tien_coc || ''));
      setFormDienTich(String(room.dien_tich || ''));
      setFormTrangThai(room.trang_thai === 'DaThue' ? 'DaThue' : 'ConTrong');
      setFormMaKhuTro(String(room.ma_khu_tro || ''));
      setFormAnhDaiDien(room.anh_dai_dien || '');
      setFormMoTa(room.mo_ta || '');
      setSelectedTienIch((room.danh_sach_tien_ich || []).map((t: any) => t.ma_tien_ich));
      setRoomImages((room.danh_sach_anh || []).map((a: any) => a.duong_dan_anh || a.url).filter(Boolean));
      setLegalDocUrls({});
      setFormVisible(true);
    } else {
      // Đăng phòng mới – bắt buộc xác nhận pháp lý + phí
      setEditingRoom(null);
      setFormTieuDe('');
      setFormSoPhong('');
      setFormTang('1');
      setFormSoNguoiToiDa('2');
      setFormGiaThue('');
      setFormTienCoc('');
      setFormDienTich('');
      setFormTrangThai('ConTrong');
      setFormMaKhuTro(myKhuTroList[0]?.ma_khu_tro || '');
      setFormAnhDaiDien('');
      setFormMoTa('');
      setSelectedTienIch([]);
      setRoomImages([]);
      setLegalDocUrls({});
      setLegalChecked({
        giayPhepKinhDoanh: false,
        bangKhaiPhongTro: false,
        dangKyTamTru: false,
        ketQuaDieuTra: false,
        camKetGia: false,
      });
      setPhiDaDuyet(false);
      setLegalModalVisible(true); // Hiện modal pháp lý trước
    }
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
        so_phong: formSoPhong.trim(),
        tieu_de: formTieuDe.trim() || `Phòng ${formSoPhong.trim()}`,
        tang: parseInt(formTang) || 1,
        so_nguoi_toi_da: parseInt(formSoNguoiToiDa) || 2,
        gia_thue: parseFloat(formGiaThue) || 0,
        tien_coc: parseFloat(formTienCoc) || parseFloat(formGiaThue) || 0,
        dien_tich: parseFloat(formDienTich) || 0,
        trang_thai: formTrangThai,
        ma_khu_tro: formMaKhuTro,
        anh_dai_dien: formAnhDaiDien.trim() || roomImages[0] || null,
        mo_ta: formMoTa.trim() || null,
      };

      const imagesPayload = roomImages.map((url, idx) => ({
        duong_dan_anh: url,
        anh_chinh: url === formAnhDaiDien || idx === 0,
        la_anh_dai_dien: url === formAnhDaiDien || idx === 0,
      }));

      if (formAnhDaiDien.trim() && !roomImages.includes(formAnhDaiDien.trim())) {
        imagesPayload.unshift({ duong_dan_anh: formAnhDaiDien.trim(), anh_chinh: true, la_anh_dai_dien: true });
      }

      if (editingRoom) {
        // Cập nhật
        await backendApi.put(`/api/phong-tro/${editingRoom.ma_phong}`, {
          roomData: roomPayload,
          selectedTienIch,
          images: imagesPayload,
          legalDocs: legalDocUrls,
        });
      } else {
        // Tạo mới
        await backendApi.post('/api/phong-tro', {
          roomData: roomPayload,
          selectedTienIch,
          images: imagesPayload,
          legalDocs: legalDocUrls,
        });
      }

      setFormVisible(false);
      loadLandlordData();
      const successMsg = editingRoom ? 'Cập nhật phòng trọ thành công!' : 'Tạo phòng trọ mới thành công! Bài đăng sẽ được Admin duyệt.';
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
                  <Text style={styles.label}>Tầng</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    keyboardType="numeric"
                    value={formTang}
                    onChangeText={setFormTang}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Số người tối đa</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2"
                    keyboardType="numeric"
                    value={formSoNguoiToiDa}
                    onChangeText={setFormSoNguoiToiDa}
                  />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
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

              {/* UPLOAD HÌNH ẢNH PHÒNG TRỌ */}
              <View style={{ marginTop: 14, gap: 8 }}>
                <Text style={styles.label}>📸 Hình ảnh phòng trọ ({roomImages.length} ảnh)</Text>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007AFF',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    justify: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onPress={handlePickRoomImages}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={{ color: '#FFF', fontSize: 16 }}>📷</Text>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                        Tải ảnh từ thiết bị (Chọn nhiều ảnh)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* DANH SÁCH ẢNH XEM TRƯỚC */}
                {roomImages.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {roomImages.map((url, idx) => (
                        <View key={idx} style={{ position: 'relative' }}>
                          <Image source={{ uri: url }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              backgroundColor: '#FF3B30',
                              borderRadius: 12,
                              width: 22,
                              height: 22,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                            onPress={() => setRoomImages((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                          {formAnhDaiDien === url && (
                            <View style={{ position: 'absolute', bottom: 2, left: 2, backgroundColor: '#34C759', paddingHorizontal: 4, borderRadius: 4 }}>
                              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Chính</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* CHỌN TIỆN ÍCH */}
              <View style={{ marginTop: 14, gap: 8 }}>
                <Text style={styles.label}>✨ Tiện ích phòng trọ</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {tienIchList.map((ti) => {
                    const isSelected = selectedTienIch.includes(ti.ma_tien_ich);
                    return (
                      <TouchableOpacity
                        key={ti.ma_tien_ich}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#007AFF' : '#E2E8F0',
                          backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                        }}
                        onPress={() => {
                          setSelectedTienIch((prev) =>
                            isSelected ? prev.filter((id) => id !== ti.ma_tien_ich) : [...prev, ti.ma_tien_ich]
                          );
                        }}
                      >
                        <Text style={{ fontSize: 13, color: isSelected ? '#007AFF' : '#475569', fontWeight: isSelected ? '700' : '500' }}>
                          {ti.bieu_tuong ? `${ti.bieu_tuong} ` : ''}{ti.ten_tien_ich}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Mô tả phòng trọ</Text>
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

      {/* ============================================ */}
      {/* MODAL YÊU CẦU PHÁP LÝ + PHÍ ĐĂNG BÀI       */}
      {/* ============================================ */}
      <Modal visible={legalModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: 16 }]}>📋 Yêu cầu pháp lý đăng phòng</Text>
              <TouchableOpacity onPress={() => setLegalModalVisible(false)}>
                <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>

              {/* MÔ TẢ CHÍNH SÁCH */}
              <View style={{
                backgroundColor: '#FFF8E1',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#F59E0B',
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#92400E', marginBottom: 6 }}>
                  ⚠️ Vì sao cần giấy tờ pháp lý?
                </Text>
                <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 20 }}>
                  Để bảo vệ người thuê khỏi tin đăng giả mạo, hệ thống yêu cầu chủ trọ xác nhận đầy đủ
                  giấy tờ pháp lý trước khi bài đăng được hiển thị công khai.
                  {'\n\n'}Nếu phòng đã được thuê mà bài vẫn còn hiển thị, đây có thể là hành vi lừa đảo
                  và sẽ bị khóa tài khoản vĩnh viễn.
                </Text>
              </View>

              {/* DANH SÁCH XÁC NHẬN PHÁP LÝ */}
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 10 }}>
                ✅ Xác nhận đầy đủ các mục sau:
              </Text>

              {[
                {
                  key: 'giayPhepKinhDoanh' as const,
                  icon: '🏢',
                  title: 'Giấy phép kinh doanh nhà trọ',
                  desc: 'Có giấy phép đăng ký kinh doanh loại hình cho thuê nhà ở hợp pháp',
                },
                {
                  key: 'bangKhaiPhongTro' as const,
                  icon: '📄',
                  title: 'Bảng khai thông tin phòng trọ',
                  desc: 'Phòng trọ đã được khai báo đầy đủ diện tích, địa chỉ, số phòng với cơ quan quản lý',
                },
                {
                  key: 'dangKyTamTru' as const,
                  icon: '🪪',
                  title: 'Đăng ký tạm trú/tạm vắng',
                  desc: 'Cam kết thực hiện đăng ký tạm trú cho người thuê theo quy định pháp luật',
                },
                {
                  key: 'ketQuaDieuTra' as const,
                  icon: '🔍',
                  title: 'Cam kết không có tranh chấp pháp lý',
                  desc: 'Phòng trọ không đang trong tranh chấp, thế chấp hoặc bị kê biên',
                },
                {
                  key: 'camKetGia' as const,
                  icon: '💰',
                  title: 'Cam kết giá thuê đúng thực tế',
                  desc: 'Giá thuê hiển thị đúng với giá thực tế, không thu thêm khoản ẩn',
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    backgroundColor: legalChecked[item.key] ? '#F0FDF4' : '#FAFAFA',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: legalChecked[item.key] ? '#34C759' : '#E2E8F0',
                    padding: 12,
                    marginBottom: 10,
                    gap: 10,
                  }}
                  onPress={() =>
                    setLegalChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: legalChecked[item.key] ? '#34C759' : '#CBD5E1',
                    backgroundColor: legalChecked[item.key] ? '#34C759' : '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 1,
                  }}>
                    {legalChecked[item.key] && (
                      <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1A202C' }}>
                      {item.icon} {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {item.desc}
                    </Text>

                    {['giayPhepKinhDoanh', 'bangKhaiPhongTro', 'dangKyTamTru'].includes(item.key) && (
                      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          style={{
                            backgroundColor: legalDocUrls[item.key as keyof typeof legalDocUrls] ? '#16A34A' : '#2563EB',
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            alignSelf: 'flex-start',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          onPress={() => handlePickLegalDoc(item.key as any)}
                          disabled={uploadingDocKey === item.key}
                        >
                          {uploadingDocKey === item.key ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                              {legalDocUrls[item.key as keyof typeof legalDocUrls] ? '✓ Đã tải lên Cloudinary' : '📤 Tải ảnh giấy tờ'}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {!!legalDocUrls[item.key as keyof typeof legalDocUrls] && (
                          <Image
                            source={{ uri: legalDocUrls[item.key as keyof typeof legalDocUrls] }}
                            style={{ width: 36, height: 36, borderRadius: 4 }}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* PHÍ ĐĂNG BÀI */}
              <View style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                padding: 14,
                marginTop: 6,
                borderWidth: 1.5,
                borderColor: phiDaDuyet ? '#007AFF' : '#BFDBFE',
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E40AF', marginBottom: 4 }}>
                  💳 Phí đăng bài
                </Text>
                <Text style={{ fontSize: 13, color: '#3730A3', lineHeight: 20 }}>
                  Mỗi bài đăng phòng trọ mới sẽ được thu phí{' '}
                  <Text style={{ fontWeight: 'bold', color: '#1D4ED8' }}>
                    {PHI_DANG_BAI.toLocaleString('vi-VN')} đồng
                  </Text>{' '}
                  để duy trì hệ thống và ngăn chặn đăng tin lừa đảo.
                  {'\n'}
                  Khi phòng chuyển sang trạng thái "Đã thuê", bài sẽ tự động ẩn và
                  <Text style={{ fontWeight: 'bold' }}> không thu phí thêm</Text>.
                  Khi đăng lại (chuyển về Còn trống) sẽ tính phí mới.
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 12,
                    gap: 8,
                  }}
                  onPress={() => setPhiDaDuyet((v) => !v)}
                >
                  <View style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: phiDaDuyet ? '#007AFF' : '#93C5FD',
                    backgroundColor: phiDaDuyet ? '#007AFF' : '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {phiDaDuyet && (
                      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: '600', flex: 1 }}>
                    Tôi đồng ý thanh toán phí đăng bài{' '}
                    {PHI_DANG_BAI.toLocaleString('vi-VN')} đ (demo – chưa tích hợp cổng thanh toán)
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>

            {/* ACTION BUTTONS */}
            <View style={[styles.modalActionRow, { marginTop: 16 }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLegalModalVisible(false)}
              >
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!isLegalComplete || !phiDaDuyet) && { backgroundColor: '#CBD5E1' },
                ]}
                disabled={!isLegalComplete || !phiDaDuyet}
                onPress={() => {
                  setLegalModalVisible(false);
                  setFormVisible(true); // Mở form đăng phòng sau khi xác nhận pháp lý
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                  {isLegalComplete && phiDaDuyet ? '✅ Tiếp tục đăng phòng' : 'Chưa hoàn tất'}
                </Text>
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
