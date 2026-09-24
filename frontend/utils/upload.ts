import { BACKEND_URL } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { Platform } from 'react-native';

/**
 * Trích xuất tên file, đuôi mở rộng và MIME type an toàn từ URI
 */
const parseFileInfo = (uri: string) => {
  let fileExt = 'jpg';
  let mimeType = 'image/jpeg';

  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,/);
    if (match) {
      mimeType = match[1];
      const sub = mimeType.split('/')[1];
      fileExt = sub === 'jpeg' ? 'jpg' : (sub || 'jpg');
    }
  } else {
    // Xóa query params & hash nếu có
    const cleanUri = uri.split('?')[0].split('#')[0];
    const parts = cleanUri.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toLowerCase();
      if (/^[a-z0-9]{3,4}$/.test(ext)) {
        fileExt = ext === 'jpeg' ? 'jpg' : ext;
        if (fileExt === 'png') mimeType = 'image/png';
        else if (fileExt === 'webp') mimeType = 'image/webp';
        else if (fileExt === 'gif') mimeType = 'image/gif';
        else if (fileExt === 'heic' || fileExt === 'heif') mimeType = 'image/heic';
        else mimeType = 'image/jpeg';
      }
    }
  }

  const fileName = `upload_${Date.now()}.${fileExt}`;
  return { fileName, fileExt, mimeType };
};

/**
 * Upload ảnh lên Cloudinary thông qua backend API /api/upload
 */
export const uploadImage = async (uri: string, _bucketName: string = 'images'): Promise<string> => {
  try {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập.');
    const token = await user.getIdToken();

    const { fileName, mimeType } = parseFileInfo(uri);
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // Trên Web, fetch uri sang Blob rồi đóng gói thành File object
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      const file = new File([blob], fileName, { type: blob.type || mimeType });
      formData.append('file', file);
    } else {
      // Trên React Native Mobile (Android / iOS)
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || `Upload thất bại (${response.status})`);
    }

    const data = await response.json();
    return data.url as string;
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    throw error;
  }
};

export const uploadImageToSupabase = uploadImage;
