// Màn hình Quản lý Khu trọ của Chủ Trọ
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';
import { onAuthStateChanged } from 'firebase/auth';

export default function LandlordKhuTroScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1000;

  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myKhuTroList, setMyKhuTroList] = useState<any[]>([]);

  // Modal
  const [formVisible, setFormVisible] = useState(false);
  const [editingKhu, setEditingKhu] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [tenKhuTro, setTenKhuTro] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [quanHuyen, setQuanHuyen] = useState('');
  const [thanhPho, setThanhPho] = useState('Hà Nội');
  const [moTa, setMoTa] = useState('');
  const [trangThai, setTrangThai] = useState('HoatDong');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        loadLandlordKhuTro(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadLandlordKhuTro = async (user = firebaseAuth.currentUser) => {
    try {
      setLoading(true);
      if (!user) return;
      setLandlordId(user.uid);

      const res = await backendApi.get('/api/khu-tro');
      const allKhu = res.data || [];
      const landlordKhu = allKhu.filter(
        (k: any) => String(k.ma_chu_tro || '').trim() === String(user.uid).trim()
      );
      setMyKhuTroList(landlordKhu);
    } catch (e) {
      console.log('LOAD KHU TRO ERROR:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (khu?: any) => {
    if (khu) {
      setEditingKhu(khu);
      setTenKhuTro(khu.ten_khu_tro || '');
      setDiaChi(khu.dia_chi || '');
      setQuanHuyen(khu.quan_huyen || '');
      setThanhPho(khu.thanh_pho || 'Hà Nội');
      setMoTa(khu.mo_ta || '');
      setTrangThai(khu.trang_thai || 'HoatDong');
    } else {
      setEditingKhu(null);
      setTenKhuTro('');
      setDiaChi('');
      setQuanHuyen('');
      setThanhPho('Hà Nội');
      setMoTa('');
      setTrangThai('HoatDong');
    }
    setFormVisible(true);
  };

  const handleSaveKhuTro = async () => {
    if (!tenKhuTro.trim() || !diaChi.trim() || !landlordId) {
      const msg = 'Vui lòng điền Tên khu trọ và Địa chỉ chi tiết.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Thông báo', msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ten_khu_tro: tenKhuTro.trim(),
        dia_chi: diaChi.trim(),
        quan_huyen: quanHuyen.trim() || null,
        thanh_pho: thanhPho.trim() || 'Hà Nội',
        mo_ta: moTa.trim() || null,
        trang_thai: trangThai,
        ma_chu_tro: landlordId,
      };

      if (editingKhu) {
        await backendApi.put(`/api/khu-tro/${editingKhu.ma_khu_tro}`, payload);
      } else {
        await backendApi.post('/api/khu-tro', payload);
      }

      setFormVisible(false);
      loadLandlordKhuTro();
      const msg = editingKhu ? 'Cập nhật khu trọ thành công!' : 'Thêm khu trọ mới thành công!';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Thành công', msg);
    } catch (e: any) {
      console.log('SAVE KHU TRO ERROR:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKhuTro = async (maKhuTro: any) => {
    const confirmDelete = async () => {
      try {
        await backendApi.delete(`/api/khu-tro/${maKhuTro}`);
        setMyKhuTroList((prev) => prev.filter((k) => k.ma_khu_tro !== maKhuTro));
      } catch (e) {
        console.log('DELETE KHU TRO ERROR:', e);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Bạn có chắc chắn muốn xóa khu trọ này không? Tất cả phòng trọ thuộc khu này cũng sẽ bị ảnh hưởng.')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa khu trọ này không?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

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

        {/* HEADER BAR */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.title}>🏢 Khu trọ của tôi ({myKhuTroList.length})</Text>
            <Text style={styles.subTitle}>Quản lý các tòa nhà, dãy nhà trọ do bạn sở hữu</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenForm()}>
            <Text style={styles.addBtnText}>+ Thêm khu trọ mới</Text>
          </TouchableOpacity>
        </View>

        {/* DANH SÁCH KHU TRỌ */}
        {myKhuTroList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44 }}>🏢</Text>
            <Text style={styles.emptyText}>Chưa có khu trọ nào được tạo</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => handleOpenForm()}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>+ Thêm khu trọ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {myKhuTroList.map((khu) => (
              <View
                key={khu.ma_khu_tro}
                style={[
                  styles.card,
                  {
                    width: (isMobile
                      ? '100%'
                      : (Platform.OS === 'web' ? 'calc(50% - 8px)' : '48.5%')) as any,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>🏢</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{khu.ten_khu_tro}</Text>
                    <Text style={styles.cardSub}>
                      📍 {[khu.dia_chi, khu.quan_huyen, khu.thanh_pho].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>

                {khu.mo_ta && <Text style={styles.cardDesc}>{khu.mo_ta}</Text>}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenForm(khu)}>
                    <Text style={styles.editBtnText}>✏️ Chỉnh sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteKhuTro(khu.ma_khu_tro)}>
                    <Text style={styles.deleteBtnText}>🗑️ Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </View>

      {/* MODAL FORM KHU TRỌ */}
      <Modal visible={formVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingKhu ? '✏️ Cập nhật khu trọ' : '➕ Thêm khu trọ mới'}
              </Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Text style={{ fontSize: 20, color: '#999' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>Tên khu trọ *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Khu trọ Xanh, Nhà trọ Minh Trí..."
                value={tenKhuTro}
                onChangeText={setTenKhuTro}
              />

              <Text style={[styles.label, { marginTop: 10 }]}>Địa chỉ chi tiết *</Text>
              <TextInput
                style={styles.input}
                placeholder="Số 123 Đường Cầu Giấy..."
                value={diaChi}
                onChangeText={setDiaChi}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Quận / Huyện</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Quận Cầu Giấy"
                    value={quanHuyen}
                    onChangeText={setQuanHuyen}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tỉnh / Thành phố</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Hà Nội"
                    value={thanhPho}
                    onChangeText={setThanhPho}
                  />
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 10 }]}>Trạng thái khu trọ</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: trangThai === 'HoatDong' ? '#34C759' : '#CBD5E1',
                    backgroundColor: trangThai === 'HoatDong' ? '#F0FDF4' : '#F8FAFC',
                    alignItems: 'center',
                  }}
                  onPress={() => setTrangThai('HoatDong')}
                >
                  <Text style={{ fontWeight: 'bold', color: trangThai === 'HoatDong' ? '#15803D' : '#64748B' }}>
                    🟢 Hoạt động
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: trangThai === 'TamDung' ? '#F59E0B' : '#CBD5E1',
                    backgroundColor: trangThai === 'TamDung' ? '#FEF3C7' : '#F8FAFC',
                    alignItems: 'center',
                  }}
                  onPress={() => setTrangThai('TamDung')}
                >
                  <Text style={{ fontWeight: 'bold', color: trangThai === 'TamDung' ? '#B45309' : '#64748B' }}>
                    🟡 Tạm dừng
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 10 }]}>Mô tả bổ sung</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Ví dụ: Khu trọ có camera 24/7, giờ giấc tự do..."
                multiline
                value={moTa}
                onChangeText={setMoTa}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
                <Text style={{ color: '#666', fontWeight: 'bold' }}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveKhuTro} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {editingKhu ? 'Cập nhật' : 'Thêm mới'}
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
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  mainContent: {
    width: '100%',
    alignSelf: 'center',
  },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  cardSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F7FB',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#EEF5FF',
    paddingVertical: 8,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    maxWidth: 500,
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
