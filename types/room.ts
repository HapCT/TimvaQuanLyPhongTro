export type RoomStatus = 'ConTrong' | 'DaThue' | 'BaoTri' | string;

export type KhuTro = {
  ma_khu_tro: number;
  ma_chu_tro: string;
  ten_khu_tro: string | null;
  mo_ta?: string | null;
  dia_chi: string | null;
  phuong?: string | null;
  quan_huyen?: string | null;
  thanh_pho: string | null;
  vi_do?: number | null;
  kinh_do?: number | null;
  anh_dai_dien?: string | null;
  trang_thai?: string | null;
  ngay_tao?: string | null;
  ngay_cap_nhat?: string | null;
};

export type AnhPhong = {
  ma_anh: number;
  ma_phong: number;
  duong_dan_anh: string;
  anh_chinh?: boolean | null;
  ngay_tao?: string | null;
};

export type TienIch = {
  ma_tien_ich: number;
  ten_tien_ich: string;
  bieu_tuong?: string | null;
  mo_ta?: string | null;
  ngay_tao?: string | null;
};

export type PhongTienIch = {
  ma_phong: number;
  ma_tien_ich: number;
};

export type PhongTro = {
  ma_phong: number;
  ma_khu_tro: number;
  so_phong: string | null;
  tieu_de: string | null;
  mo_ta?: string | null;
  dien_tich?: number | null;
  gia_thue: number | null;
  tien_coc?: number | null;
  tang?: number | null;
  so_nguoi_toi_da?: number | null;
  trang_thai: RoomStatus | null;
  ngay_tao?: string | null;
  ngay_cap_nhat?: string | null;
};

// Phòng đã được ghép thêm thông tin khu trọ, chủ trọ, ảnh và tiện ích để hiển thị ở trang quản trị
export type RoomWithDetails = PhongTro & {
  khu_tro?: KhuTro | null;
  ten_chu_tro?: string | null;
  anh_dai_dien?: string | null;
  danh_sach_anh: AnhPhong[];
  danh_sach_tien_ich: TienIch[];
};

export type RoomStatusFilter = 'ALL' | string;
