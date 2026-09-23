import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

<<<<<<< HEAD
/**
 * Cấu hình BACKEND_URL tự động theo môi trường:
 * - Web (localhost)   : http://localhost:3000
 * - Mobile (Expo Go) : tự dùng IP máy chủ từ Expo Constants (debuggerHost)
 *
 * Nếu cần đặt thủ công, thay MANUAL_IP bằng IP LAN của máy bạn (ví dụ: '192.168.1.10')
 */
const MANUAL_IP: string | null = null; // <- Đặt IP thủ công nếu cần, ví dụ: '192.168.1.10'

function getBackendUrl(): string {
  // Nếu đã đặt IP thủ công thì dùng luôn
  if (MANUAL_IP) {
    return `http://${MANUAL_IP}:3000`;
  }

  // Trên Web luôn dùng localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // Trên Mobile (Android/iOS), lấy IP từ Expo debuggerHost (cùng mạng LAN với máy tính)
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0]; // Lấy phần IP, bỏ port
    return `http://${ip}:3000`;
  }

  // Fallback cuối cùng
  return 'http://localhost:3000';
}

export const BACKEND_URL = getBackendUrl();
=======
// URL của máy chủ Backend (thay thế nếu dùng IP thật trên điện thoại)
export const BACKEND_URL = 'http://10.91.130.131:3000';
>>>>>>> de48903ed550643542b229580638f9bfc52d4866

export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log để debug khi cần
console.log('🔗 BACKEND_URL:', BACKEND_URL);
