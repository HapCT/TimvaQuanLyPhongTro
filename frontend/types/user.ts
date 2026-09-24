export type UserRole = 'NguoiThue' | 'ChuTro' | 'Admin' | 'QuanTri';

export type User = {
  ma_nguoi_dung: string;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  anh_dai_dien?: string | null;
  vai_tro: UserRole | string | null;
  ngay_tao?: string | null;
  ngay_cap_nhat?: string | null;
  email?: string | null;
  is_locked?: boolean | null;
};

export type RoleFilter = 'ALL' | 'NguoiThue' | 'ChuTro' | 'Admin';

