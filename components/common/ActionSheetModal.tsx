import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/common/action-sheet.styles';

export type ActionSheetOption = {
  key: string;
  label: string;
  destructive?: boolean;
};

interface ActionSheetModalProps {
  visible: boolean;
  title: string;
  message?: string;
  options: ActionSheetOption[];
  onSelect: (key: string) => void;
  onCancel: () => void;
}

// Dùng thay cho Alert.alert với nhiều lựa chọn, vì Alert.alert không hiển thị
// được trên web (react-native-web coi đó là no-op). Modal thì hoạt động giống
// nhau trên cả web lẫn thiết bị di động.
export default function ActionSheetModal({
  visible,
  title,
  message,
  options,
  onSelect,
  onCancel,
}: ActionSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.optionList}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.optionButton}
                onPress={() => onSelect(opt.key)}
              >
                <Text style={[styles.optionText, opt.destructive && styles.optionTextDestructive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
