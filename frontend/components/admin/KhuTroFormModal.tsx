import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/admin/room-form.styles';
import { KhuTro } from '@/types';
import { showAlert } from '@/utils/alert';
import { uploadImageToSupabase } from '@/utils/upload';
import * as ImagePicker from 'expo-image-picker';

interface KhuTroFormModalProps {
  visible: boolean;
  editingKhuTro?: KhuTro | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function KhuTroFormModal({
  visible,
  editingKhuTro,
  onClose,
  onSaved,
}: KhuTroFormModalProps) {
  const isEdit = !!editingKhuTro;

  const [tenKhuTro, setTenKhuTro] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [phuong, setPhuong] = useState('');
  const [quanHuyen, setQuanHuyen] = useState('');
  const [thanhPho, setThanhPho] = useState('');
  const [moTa, setMoTa] = useState('');
  const [anhDaiDien, setAnhDaiDien] = useState('');
  const [trangThai, setTrangThai] = useState('HoatDong');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState<any[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setCheckingAdmin(true);

    const loadAdminOwners = async () => {
      try {
        const { data: profile } = await backendApi.get('/api/users/me');
        const admin = profile?.vai_tro === 'Admin' || profile?.vai_tro === 'QuanTri';
        if (!active) return;
        setIsAdmin(admin);
        if (admin) {
          const { data } = await backendApi.get('/api/users');
          if (active) setOwnerOptions((data || []).filter((user: any) => user.vai_tro === 'ChuTro'));
        }
      } catch (error) {
        console.log('LOAD khu tro owners ERROR:', error);
      } finally {
        if (active) setCheckingAdmin(false);
      }
    };

    loadAdminOwners();
    return () => {
      active = false;
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (isEdit && editingKhuTro) {
        setSelectedOwnerId(editingKhuTro.ma_chu_tro || '');
        setTenKhuTro(editingKhuTro.ten_khu_tro || '');
        setDiaChi(editingKhuTro.dia_chi || '');
        setPhuong(editingKhuTro.phuong || '');
        setQuanHuyen(editingKhuTro.quan_huyen || '');
        setThanhPho(editingKhuTro.thanh_pho || '');
        setMoTa(editingKhuTro.mo_ta || '');
        setAnhDaiDien(editingKhuTro.anh_dai_dien || '');
        setTrangThai(editingKhuTro.trang_thai || 'HoatDong');
      } else {
        setSelectedOwnerId('');
        resetForm();
      }
    }
  }, [visible, editingKhuTro, isEdit]);

  const resetForm = () => {
    setTenKhuTro('');
    setDiaChi('');
    setPhuong('');
    setQuanHuyen('');
    setThanhPho('');
    setMoTa('');
    setAnhDaiDien('');
    setTrangThai('HoatDong');
  };

  const validate = (): boolean => {
    if (!tenKhuTro.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập tên khu trọ.');
      return false;
    }
    if (!diaChi.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập địa chỉ.');
      return false;
    }
    if (!thanhPho.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập thành phố.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;
        const publicUrl = await uploadImageToSupabase(imageUri, 'images');
        setAnhDaiDien(publicUrl);
        showAlert('Thành công', 'Đã tải ảnh lên.');
      }
    } catch (error: any) {
      console.log('Lỗi chọn ảnh:', error);
      showAlert('Lỗi', 'Không thể tải ảnh lên: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (checkingAdmin) return;
    if (!validate()) return;
    setLoading(true);

    try {
      const user = firebaseAuth.currentUser;
      const userId = user?.uid;

      if (!userId) {
        showAlert('Lỗi', 'Không lấy được thông tin tài khoản.');
        return;
      }

      if (isAdmin && !isEdit && !selectedOwnerId) {
        showAlert('Thiếu chủ trọ', 'Hãy chọn chủ trọ sở hữu khu trọ này.');
        return;
      }

      const payload = {
        ten_khu_tro: tenKhuTro.trim(),
        dia_chi: diaChi.trim(),
        phuong: phuong.trim(),
        quan_huyen: quanHuyen.trim(),
        thanh_pho: thanhPho.trim(),
        mo_ta: moTa.trim(),
        anh_dai_dien: anhDaiDien.trim() || null,
        trang_thai: trangThai,
        ma_chu_tro: isAdmin ? selectedOwnerId : userId,
      };

      if (isEdit) {
        await backendApi.put(`/api/khu-tro/${editingKhuTro.ma_khu_tro}`, payload);
      } else {
        await backendApi.post('/api/khu-tro', payload);
      }

      showAlert('Thành công', isEdit ? 'Đã cập nhật khu trọ.' : 'Đã thêm khu trọ mới.');
      onSaved();
    } catch (error: any) {
      console.log('Lỗi lưu khu trọ:', error);
      showAlert('Lỗi', 'Không thể lưu thông tin khu trọ: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Sửa khu trọ' : 'Thêm khu trọ mới'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* BODY */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>

            {isAdmin && !isEdit && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Chủ trọ sở hữu *</Text>
                {ownerOptions.length === 0 ? (
                  <Text style={{ color: '#888', fontSize: 13 }}>Chưa có tài khoản chủ trọ để chọn.</Text>
                ) : (
                  <View style={{ gap: 6 }}>
                    {ownerOptions.map((owner) => (
                      <TouchableOpacity
                        key={owner.ma_nguoi_dung}
                        onPress={() => setSelectedOwnerId(owner.ma_nguoi_dung)}
                        style={{
                          padding: 10,
                          borderWidth: 1,
                          borderColor: selectedOwnerId === owner.ma_nguoi_dung ? '#007AFF' : '#E5E7EB',
                          borderRadius: 6,
                          backgroundColor: selectedOwnerId === owner.ma_nguoi_dung ? '#EAF3FF' : '#FFFFFF',
                        }}
                      >
                        <Text style={{ color: '#333', fontSize: 13 }}>
                          {owner.ho_ten || 'Chủ trọ'}{owner.email ? ` · ${owner.email}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              
              {anhDaiDien ? (
                <View style={{ marginBottom: 10 }}>
                  <Image source={{ uri: anhDaiDien }} style={[styles.imageThumb, { width: '100%', height: 160 }]} resizeMode="cover" />
                  <TouchableOpacity 
                    style={[styles.removeImageBtn, { position: 'absolute', top: 5, right: 5 }]} 
                    onPress={() => setAnhDaiDien('')}
                  >
                    <Text style={styles.removeImageBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity 
                style={styles.addImageBtn} 
                onPress={pickImage} 
                disabled={uploadingImage || loading}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.addImageBtnText}>{anhDaiDien ? 'Đổi ảnh khác' : '+ Chọn ảnh từ máy'}</Text>
                )}
              </TouchableOpacity>
              
              <Text style={{ fontSize: 12, color: '#888', marginTop: 10, marginBottom: 5 }}>Hoặc nhập URL ảnh trực tiếp:</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập đường dẫn ảnh (URL)..."
                placeholderTextColor="#999"
                value={anhDaiDien}
                onChangeText={setAnhDaiDien}
                editable={!loading && !uploadingImage}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tên khu trọ <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Trọ sinh viên Bách Khoa"
                placeholderTextColor="#999"
                value={tenKhuTro}
                onChangeText={setTenKhuTro}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Địa chỉ <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Số nhà, đường phố"
                placeholderTextColor="#999"
                value={diaChi}
                onChangeText={setDiaChi}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Phường/Xã</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Bách Khoa"
                  placeholderTextColor="#999"
                  value={phuong}
                  onChangeText={setPhuong}
                  editable={!loading}
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Quận/Huyện</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Hai Bà Trưng"
                  placeholderTextColor="#999"
                  value={quanHuyen}
                  onChangeText={setQuanHuyen}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Thành phố <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hà Nội"
                placeholderTextColor="#999"
                value={thanhPho}
                onChangeText={setThanhPho}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập mô tả về khu trọ..."
                placeholderTextColor="#999"
                value={moTa}
                onChangeText={setMoTa}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
            
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.chipRow}>
                {['HoatDong', 'TamDung'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, trangThai === s && styles.chipActive]}
                    onPress={() => setTrangThai(s)}
                    disabled={loading}
                  >
                    <Text style={[styles.chipText, trangThai === s && styles.chipTextActive]}>
                      {s === 'HoatDong' ? 'Hoạt động' : 'Tạm dừng'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={loading || checkingAdmin}
            >
              {loading || checkingAdmin ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>{isEdit ? 'Lưu thay đổi' : 'Thêm khu trọ'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
