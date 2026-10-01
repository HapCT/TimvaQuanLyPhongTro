import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { firebaseAuth } from './firebase';

/**
 * Cấu hình BACKEND_URL tự động theo môi trường:
 * - Web (localhost)   : http://localhost:3000
 * - Mobile (Expo Go) : tự dùng IP máy chủ từ Expo Constants (debuggerHost)
 *
 * Có thể đặt EXPO_PUBLIC_BACKEND_URL khi dùng tunnel hoặc backend từ xa.
 */
const MANUAL_IP: string | null = null; // <- Đặt IP thủ công nếu cần, ví dụ: '192.168.1.10'
const PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.trim().replace(/\/+$/, '');

function getBackendUrl(): string {
  // Trên Web (máy tính): ưu tiên dùng localhost trực tiếp trừ khi có URL sản phẩm/remote thực tế (không phải localtunnel tạm thời)
  if (Platform.OS === 'web') {
    if (PUBLIC_BACKEND_URL && !PUBLIC_BACKEND_URL.includes('.loca.lt')) {
      return PUBLIC_BACKEND_URL;
    }
    return 'http://localhost:3000';
  }

  // Nếu đã đặt IP thủ công thì dùng luôn
  if (MANUAL_IP) {
    return `http://${MANUAL_IP}:3000`;
  }

  // Nếu có EXPO_PUBLIC_BACKEND_URL (như ngrok/tunnel đang chạy)
  if (PUBLIC_BACKEND_URL && !PUBLIC_BACKEND_URL.includes('.loca.lt')) {
    return PUBLIC_BACKEND_URL;
  }

  // Trên Mobile (Android/iOS Expo Go), lấy IP từ Expo debuggerHost (cùng mạng LAN với máy tính)
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0]; // Lấy phần IP, bỏ port
    return `http://${ip}:3000`;
  }

  // Fallback cuối cùng
  return 'http://localhost:3000';
}

export const BACKEND_URL = getBackendUrl();

export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(BACKEND_URL.includes('.loca.lt') ? { 'bypass-tunnel-reminder': 'true' } : {}),
  },
});

backendApi.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log để debug khi cần
console.log('🔗 BACKEND_URL:', BACKEND_URL);
