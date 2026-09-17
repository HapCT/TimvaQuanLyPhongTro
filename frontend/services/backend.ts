import axios from 'axios';

// URL của máy chủ Backend (thay thế nếu dùng IP thật trên điện thoại)
export const BACKEND_URL = 'http://10.91.130.131:3000';

export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
