import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { styles } from '@/styles/admin/room-form.styles';
import { TienIch } from '@/types/room';
import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

type TienIchFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingTienIch: TienIch | null;
};

export default function TienIchFormModal({
  visible,
  onClose,
  onSaved,
  editingTienIch,
}: TienIchFormModalProps) {
  const [tenTienIch, setTenTienIch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingTienIch) {
        setTenTienIch(editingTienIch.ten_tien_ich || '');
      } else {
        setTenTienIch('');
      }
    }
  }, [visible, editingTienIch]);

  const handleSave = async () => {
    try {
      if (!tenTienIch.trim()) {
        showAlert('Lỗi', 'Vui lòng nhập tên tiện ích.');
        return;
      }

      setSaving(true);
      const payload = { ten_tien_ich: tenTienIch.trim() };

      if (editingTienIch) {
        await backendApi.put(`/api/tien-ich/${editingTienIch.ma_tien_ich}`, payload);
        showAlert('Thành công', 'Đã cập nhật tiện ích.');
      } else {
        await backendApi.post('/api/tien-ich', payload);
        showAlert('Thành công', 'Đã thêm tiện ích mới.');
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.log('SAVE TIEN ICH ERROR:', error);
      const msg = error.response?.data?.error || 'Đã có lỗi xảy ra khi lưu.';
      showAlert('Lỗi', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingTienIch ? 'Cập nhật tiện ích' : 'Thêm tiện ích mới'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* TÊN TIỆN ÍCH */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Tên tiện ích <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Chỗ để xe, Ban công, Giờ giấc tự do..."
                value={tenTienIch}
                onChangeText={setTenTienIch}
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu tiện ích</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
