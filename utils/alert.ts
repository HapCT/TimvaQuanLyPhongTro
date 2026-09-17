import { customAlertRef, AlertButton } from '@/components/CustomAlert';

/**
 * Hiển thị thông báo sử dụng CustomAlert (đẹp trên cả mobile và web).
 * Hàm này dùng chung cú pháp với Alert.alert của React Native.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (customAlertRef.current) {
    customAlertRef.current.show(title, message, buttons);
  } else {
    // Fallback trong trường hợp CustomAlert chưa mount (hiếm)
    console.log(`[ALERT FALLBACK] ${title} - ${message}`);
  }
}
