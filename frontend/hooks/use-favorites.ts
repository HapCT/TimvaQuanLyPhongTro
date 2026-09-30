import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { showAlert } from '@/utils/alert';

export interface FavoriteRoom {
  ma_phong: number;
  tieu_de?: string | null;
  so_phong?: string | null;
  gia_thue?: number | null;
  dien_tich?: number | null;
  trang_thai?: string | null;
  anh_dai_dien?: string | null;
  ngay_luu?: string | null;
  khu_tro?: {
    ten_khu_tro?: string | null;
    dia_chi?: string | null;
    quan_huyen?: string | null;
    thanh_pho?: string | null;
  };
}

export function useFavorites() {
  const [favoriteRooms, setFavoriteRooms] = useState<FavoriteRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const favoriteIds = new Set(favoriteRooms.map((room) => Number(room.ma_phong)));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setFavoriteRooms([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await backendApi.get('/api/yeu-thich');
        setFavoriteRooms(response.data || []);
      } catch (error) {
        console.log('LOAD FAVORITES ERROR:', error);
        setFavoriteRooms([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const reload = async () => {
    if (!firebaseAuth.currentUser) {
      setFavoriteRooms([]);
      return;
    }
    try {
      setLoading(true);
      const response = await backendApi.get('/api/yeu-thich');
      setFavoriteRooms(response.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải danh sách phòng đã lưu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (roomId: number) => {
    if (!firebaseAuth.currentUser) return false;
    const isSaved = favoriteIds.has(Number(roomId));

    try {
      if (isSaved) {
        await backendApi.delete(`/api/yeu-thich/${roomId}`);
        setFavoriteRooms((previous) => previous.filter((room) => Number(room.ma_phong) !== Number(roomId)));
      } else {
        await backendApi.post(`/api/yeu-thich/${roomId}`);
        await reload();
      }
      return true;
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật phòng đã lưu.');
      return false;
    }
  };

  return { favoriteRooms, favoriteIds, loading, isLoggedIn, reload, toggleFavorite };
}
