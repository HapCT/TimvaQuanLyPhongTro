import { supabase } from '@/services/supabase';

export const uploadImageToSupabase = async (uri: string, bucketName: string = 'images'): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Tìm phần mở rộng của file
    const uriParts = uri.split('.');
    const fileExt = uriParts[uriParts.length - 1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    throw error;
  }
};
