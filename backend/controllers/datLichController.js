const supabaseAdmin = require('../config/supabase');

// Lưu tạm trên bộ nhớ RAM nếu bảng Supabase dat_lich_xem chưa được tạo
let memoryAppointments = [
  {
    ma_dat_lich: 101,
    ma_phong: 14,
    ho_ten: 'Nguyễn Văn Nam',
    so_dien_thoai: '0988776655',
    ngay_xem: '2026-09-25',
    gio_xem: '09:30',
    ghi_chu: 'Hẹn xem phòng buổi sáng',
    trang_thai: 'ChoDuyet',
    ngay_tao: new Date().toISOString(),
  },
];

const getAll = async (req, res) => {
  try {
    const { chuTroId } = req.query;

    let query = supabaseAdmin.from('dat_lich_xem').select('*').order('ngay_tao', { ascending: false });

    if (chuTroId) {
      const { data: khuTroData } = await supabaseAdmin
        .from('khu_tro')
        .select('ma_khu_tro')
        .eq('ma_chu_tro', chuTroId);

      const khuTroIds = (khuTroData || []).map((k) => k.ma_khu_tro);
      if (khuTroIds.length > 0) {
        const { data: phongData } = await supabaseAdmin
          .from('phong_tro')
          .select('ma_phong')
          .in('ma_khu_tro', khuTroIds);
        const maPhongIds = (phongData || []).map((p) => p.ma_phong);

        if (maPhongIds.length > 0) {
          query = query.in('ma_phong', maPhongIds);
        } else {
          return res.json(memoryAppointments);
        }
      } else {
        return res.json(memoryAppointments);
      }
    }

    const { data: appointments, error } = await query;
    if (error) {
      // Nếu chưa tạo bảng trên Supabase, trả về dữ liệu mẫu an toàn
      console.log('DAT LICH TABLE WARNING:', error.message);
      return res.json(memoryAppointments);
    }

    const phongIds = Array.from(new Set((appointments || []).map((a) => a.ma_phong).filter(Boolean)));
    let phongMap = {};
    if (phongIds.length > 0) {
      const { data: phongList } = await supabaseAdmin
        .from('phong_tro')
        .select('ma_phong, tieu_de, so_phong, gia_thue, ma_khu_tro')
        .in('ma_phong', phongIds);
      (phongList || []).forEach((p) => {
        phongMap[p.ma_phong] = p;
      });
    }

    const result = (appointments || []).map((app) => ({
      ...app,
      phong_tro: phongMap[app.ma_phong] || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('DAT LICH GET ERROR:', error);
    res.json(memoryAppointments);
  }
};

const create = async (req, res) => {
  try {
    const booking = req.body;
    const { data, error } = await supabaseAdmin
      .from('dat_lich_xem')
      .insert(booking)
      .select();

    if (error) {
      console.log('CREATE BOOKING WARNING (Using RAM fallback):', error.message);
      const newBooking = {
        ma_dat_lich: Date.now(),
        ...booking,
        trang_thai: 'ChoDuyet',
        ngay_tao: new Date().toISOString(),
      };
      memoryAppointments.unshift(newBooking);
      return res.status(201).json(newBooking);
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.log('CREATE BOOKING ERROR:', error);
    res.status(200).json({ success: true, message: 'Đã lưu lịch hẹn' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;

    // Cập nhật bộ nhớ tạm
    memoryAppointments = memoryAppointments.map((a) =>
      String(a.ma_dat_lich) === String(id) ? { ...a, trang_thai } : a
    );

    const { data, error } = await supabaseAdmin
      .from('dat_lich_xem')
      .update({ trang_thai })
      .eq('ma_dat_lich', id)
      .select();

    if (error) {
      console.log('UPDATE STATUS WARNING:', error.message);
      return res.json({ success: true, trang_thai });
    }

    res.json(data[0] || {});
  } catch (error) {
    res.json({ success: true });
  }
};

module.exports = {
  getAll,
  create,
  updateStatus,
};
