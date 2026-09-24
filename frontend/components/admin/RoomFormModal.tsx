import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';
import { KhuTro, TienIch, RoomStatus, AnhPhong, RoomWithDetails } from '@/types';
import { styles } from '@/styles/admin/room-form.styles';
import { showAlert } from '@/utils/alert';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToSupabase } from '@/utils/upload';

const STATUS_OPTIONS: { key: RoomStatus; label: string }[] = [
  { key: 'ConTrong', label: 'Còn trống' },
  { key: 'DaThue', label: 'Đã thuê' },
  { key: 'BaoTri', label: 'Bảo trì' },
];

type ImageEntry = {
  // ma_anh chỉ có khi ảnh đã tồn tại trong DB (chế độ sửa)
  ma_anh?: number;
  duong_dan_anh: string;
  anh_chinh: boolean;
};

interface RoomFormModalProps {
  visible: boolean;
  khuTroList: KhuTro[];
  tienIchList: TienIch[];
  editingRoom?: RoomWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RoomFormModal({
  visible,
  khuTroList,
  tienIchList,
  editingRoom,
  onClose,
  onSaved,
}: RoomFormModalProps) {
  const isEdit = !!editingRoom;

  const [maKhuTro, setMaKhuTro] = useState<number | null>(null);
  const [soPhong, setSoPhong] = useState('');
  const [tieuDe, setTieuDe] = useState('');
  const [moTa, setMoTa] = useState('');
  const [dienTich, setDienTich] = useState('');
  const [giaThue, setGiaThue] = useState('');
  const [tienCoc, setTienCoc] = useState('');
  const [tang, setTang] = useState('');
  const [soNguoiToiDa, setSoNguoiToiDa] = useState('');
  const [trangThai, setTrangThai] = useState<RoomStatus>('ConTrong');
  const [selectedTienIch, setSelectedTienIch] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  // Nạp lại dữ liệu form mỗi khi mở modal (thêm mới hoặc sửa)
  useEffect(() => {
    if (!visible) return;

    if (editingRoom) {
      setMaKhuTro(editingRoom.ma_khu_tro);
      setSoPhong(editingRoom.so_phong || '');
      setTieuDe(editingRoom.tieu_de || '');
      setMoTa(editingRoom.mo_ta || '');
      setDienTich(editingRoom.dien_tich != null ? String(editingRoom.dien_tich) : '');
      setGiaThue(editingRoom.gia_thue != null ? String(editingRoom.gia_thue) : '');
      setTienCoc(editingRoom.tien_coc != null ? String(editingRoom.tien_coc) : '');
      setTang(editingRoom.tang != null ? String(editingRoom.tang) : '');
      setSoNguoiToiDa(editingRoom.so_nguoi_toi_da != null ? String(editingRoom.so_nguoi_toi_da) : '');
      setTrangThai(editingRoom.trang_thai || 'Trong');
      setSelectedTienIch(new Set(editingRoom.danh_sach_tien_ich.map((t) => t.ma_tien_ich)));
      setImages(
        editingRoom.danh_sach_anh.map((a) => ({
          ma_anh: a.ma_anh,
          duong_dan_anh: a.duong_dan_anh,
          anh_chinh: !!a.anh_chinh,
        }))
      );
    } else {
      setMaKhuTro(khuTroList[0]?.ma_khu_tro ?? null);
      setSoPhong('');
      setTieuDe('');
      setMoTa('');
      setDienTich('');
      setGiaThue('');
      setTienCoc('');
      setTang('');
      setSoNguoiToiDa('');
      setTrangThai('Trong');
      setSelectedTienIch(new Set());
      setImages([]);
    }
    setNewImageUrl('');
  }, [visible, editingRoom, khuTroList]);

  const toggleTienIch = (id: number) => {
    setSelectedTienIch((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      { duong_dan_anh: newImageUrl.trim(), anh_chinh: prev.length === 0 },
    ]);
    setNewImageUrl('');
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Cấp quyền', 'Bạn cần cấp quyền truy cập thư viện ảnh để tải ảnh lên.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickingImage(true);
        const imageUri = result.assets[0].uri;
        const publicUrl = await uploadImageToSupabase(imageUri, 'images');
        
        setImages((prev) => [
          ...prev,
          { duong_dan_anh: publicUrl, anh_chinh: prev.length === 0 },
        ]);
        
        showAlert('Thành công', 'Đã tải ảnh lên thành công.');
      }
    } catch (error: any) {
      console.log('Lỗi chọn ảnh:', error);
      showAlert('Lỗi', 'Không thể tải ảnh lên: ' + error.message);
    } finally {
      setPickingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Nếu vừa xóa ảnh chính, đặt ảnh đầu tiên còn lại làm ảnh chính
      if (next.length > 0 && !next.some((i) => i.anh_chinh)) {
        next[0] = { ...next[0], anh_chinh: true };
      }
      return next;
    });
  };

  const setMainImage = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, anh_chinh: i === index })));
  };

  const parseNumber = (value: string): number | null => {
    const trimmed = value.trim().replace(',', '.');
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isNaN(n) ? null : n;
  };

  const validate = (): string | null => {
    if (!maKhuTro) return 'Vui lòng chọn khu trọ.';
    if (!soPhong.trim()) return 'Vui lòng nhập số phòng.';
    const gia = parseNumber(giaThue);
    if (gia === null || gia <= 0) return 'Vui lòng nhập giá thuê hợp lệ.';
    return null;
  };

  const handleSave = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      showAlert('Thiếu thông tin', errorMsg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ma_khu_tro: maKhuTro,
        so_phong: soPhong.trim(),
        tieu_de: tieuDe.trim() || null,
        mo_ta: moTa.trim() || null,
        dien_tich: parseNumber(dienTich),
        gia_thue: parseNumber(giaThue),
        tien_coc: parseNumber(tienCoc),
        tang: parseNumber(tang),
        so_nguoi_toi_da: parseNumber(soNguoiToiDa),
        trang_thai: trangThai,
      };

      const apiPayload = {
        roomData: payload,
        images: images,
        selectedTienIch: Array.from(selectedTienIch)
      };

      if (isEdit && editingRoom) {
        const response = await backendApi.put(`/api/phong-tro/${editingRoom.ma_phong}`, apiPayload);
        if (!response.data.success) throw new Error('Cập nhật thất bại');
      } else {
        const response = await backendApi.post('/api/phong-tro', apiPayload);
        if (!response.data.success) throw new Error('Thêm mới thất bại');
      }

      showAlert('Thành công', isEdit ? 'Đã cập nhật phòng trọ.' : 'Đã thêm phòng trọ mới.');
      onSaved();
      onClose();
    } catch (e) {
      console.log('SAVE ROOM ERROR:', e);
      showAlert('Lỗi', 'Có lỗi xảy ra khi lưu phòng trọ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Sửa phòng trọ' : 'Thêm phòng trọ mới'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {/* KHU TRỌ */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Khu trọ <Text style={styles.required}>*</Text>
              </Text>
              {khuTroList.length === 0 ? (
                <Text style={styles.emptyHint}>Chưa có khu trọ nào. Hãy tạo khu trọ trước khi thêm phòng.</Text>
              ) : (
                <View style={styles.chipRow}>
                  {khuTroList.map((k) => (
                    <TouchableOpacity
                      key={k.ma_khu_tro}
                      style={[styles.chip, maKhuTro === k.ma_khu_tro && styles.chipActive]}
                      onPress={() => setMaKhuTro(k.ma_khu_tro)}
                    >
                      <Text style={[styles.chipText, maKhuTro === k.ma_khu_tro && styles.chipTextActive]}>
                        {k.ten_khu_tro || `Khu #${k.ma_khu_tro}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* SỐ PHÒNG + TIÊU ĐỀ */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>
                  Số phòng <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 101"
                  placeholderTextColor="#999"
                  value={soPhong}
                  onChangeText={setSoPhong}
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Tiêu đề</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Phòng đẹp, thoáng mát"
                  placeholderTextColor="#999"
                  value={tieuDe}
                  onChangeText={setTieuDe}
                />
              </View>
            </View>

            {/* MÔ TẢ */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Mô tả chi tiết về phòng..."
                placeholderTextColor="#999"
                value={moTa}
                onChangeText={setMoTa}
                multiline
              />
            </View>

            {/* GIÁ THUÊ + TIỀN CỌC */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>
                  Giá thuê (đ/tháng) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2500000"
                  placeholderTextColor="#999"
                  value={giaThue}
                  onChangeText={setGiaThue}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Tiền cọc (đ)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2500000"
                  placeholderTextColor="#999"
                  value={tienCoc}
                  onChangeText={setTienCoc}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* DIỆN TÍCH + TẦNG + SỐ NGƯỜI TỐI ĐA */}
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Diện tích (m²)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 20"
                  placeholderTextColor="#999"
                  value={dienTich}
                  onChangeText={setDienTich}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.label}>Tầng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2"
                  placeholderTextColor="#999"
                  value={tang}
                  onChangeText={setTang}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số người tối đa</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 2"
                placeholderTextColor="#999"
                value={soNguoiToiDa}
                onChangeText={setSoNguoiToiDa}
                keyboardType="numeric"
              />
            </View>

            {/* TRẠNG THÁI */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.chipRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, trangThai === opt.key && styles.chipActive]}
                    onPress={() => setTrangThai(opt.key)}
                  >
                    <Text style={[styles.chipText, trangThai === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TIỆN ÍCH */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tiện ích</Text>
              {tienIchList.length === 0 ? (
                <Text style={styles.emptyHint}>Chưa có tiện ích nào trong hệ thống.</Text>
              ) : (
                <View style={styles.chipRow}>
                  {tienIchList.map((t) => (
                    <TouchableOpacity
                      key={t.ma_tien_ich}
                      style={[styles.chip, selectedTienIch.has(t.ma_tien_ich) && styles.chipActive]}
                      onPress={() => toggleTienIch(t.ma_tien_ich)}
                    >
                      <Text
                        style={[styles.chipText, selectedTienIch.has(t.ma_tien_ich) && styles.chipTextActive]}
                      >
                        {t.bieu_tuong ? `${t.bieu_tuong} ` : ''}
                        {t.ten_tien_ich}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* HÌNH ẢNH */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Hình ảnh (dán đường dẫn URL ảnh)</Text>
              <View style={styles.imageAddRow}>
                <TextInput
                  style={styles.imageInput}
                  placeholder="https://..."
                  placeholderTextColor="#999"
                  value={newImageUrl}
                  onChangeText={setNewImageUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addImageBtn} onPress={addImage}>
                  <Text style={styles.addImageBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.addImageBtn, { alignSelf: 'flex-start', marginTop: 10, backgroundColor: '#2196F3' }]} 
                onPress={handlePickImage}
                disabled={pickingImage}
              >
                {pickingImage ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addImageBtnText}>+ Chọn ảnh từ máy</Text>
                )}
              </TouchableOpacity>

              {images.length === 0 ? (
                <Text style={styles.emptyHint}>Chưa có ảnh nào được thêm.</Text>
              ) : (
                <View style={styles.imageList}>
                  {images.map((img, index) => (
                    <View key={`${img.duong_dan_anh}-${index}`} style={styles.imageRow}>
                      <Image source={{ uri: img.duong_dan_anh }} style={styles.imageThumb} />
                      <Text style={styles.imageUrlText} numberOfLines={1}>
                        {img.duong_dan_anh}
                      </Text>
                      <TouchableOpacity
                        style={[styles.mainToggle, img.anh_chinh && styles.mainToggleActive]}
                        onPress={() => setMainImage(index)}
                      >
                        <Text style={[styles.mainToggleText, img.anh_chinh && styles.mainToggleTextActive]}>
                          {img.anh_chinh ? 'Ảnh chính' : 'Đặt chính'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                        <Text style={styles.removeImageBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>{isEdit ? 'Lưu thay đổi' : 'Thêm phòng'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
