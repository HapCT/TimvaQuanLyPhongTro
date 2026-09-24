const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { chuTroId } = req.query;

    let sql = `
      SELECT
        dp.*,
        nd.ho_ten AS nd_ho_ten,
        nd.so_dien_thoai AS nd_so_dien_thoai,
        nd.anh_dai_dien AS nd_anh_dai_dien,
        pt.tieu_de AS pt_tieu_de,
        pt.so_phong AS pt_so_phong,
        pt.gia_thue AS pt_gia_thue,
        pt.ma_khu_tro AS pt_ma_khu_tro
      FROM dat_phong dp
      LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dp.ma_nguoi_thue
      LEFT JOIN phong_tro pt ON pt.ma_phong = dp.ma_phong
    `;
    const params = [];

    if (chuTroId) {
      const [khuTroRows] = await pool.query(
        'SELECT ma_khu_tro FROM khu_tro WHERE ma_chu_tro = ?',
        [chuTroId]
      );
      const khuTroIds = khuTroRows.map((k) => k.ma_khu_tro);
      if (khuTroIds.length === 0) return res.json([]);

      const [phongRows] = await pool.query(
        `SELECT ma_phong FROM phong_tro WHERE ma_khu_tro IN (?)`,
        [khuTroIds]
      );
      const maPhongIds = phongRows.map((p) => p.ma_phong);
      if (maPhongIds.length === 0) return res.json([]);

      sql += ' WHERE dp.ma_phong IN (?)';
      params.push(maPhongIds);
    }

    sql += ' ORDER BY dp.ngay_tao DESC';

    const [bookings] = await pool.query(sql, params);

    const result = bookings.map((b) => ({
      ma_phong: b.ma_phong,
      ma_nguoi_thue: b.ma_nguoi_thue,
      ngay_dat: b.ngay_dat,
      ngay_du_kien_nhan_phong: b.ngay_du_kien_nhan_phong,
      ghi_chu: b.ghi_chu,
      trang_thai: b.trang_thai,
      ngay_tao: b.ngay_tao,
      ngay_cap_nhat: b.ngay_cap_nhat,
      ma_dat_phong: b.ma_dat_phong,
      ma_dat_lich: b.ma_dat_phong,
      nguoi_dung: {
        ho_ten: b.nd_ho_ten,
        so_dien_thoai: b.nd_so_dien_thoai,
        anh_dai_dien: b.nd_anh_dai_dien,
      },
      phong_tro: {
        tieu_de: b.pt_tieu_de,
        so_phong: b.pt_so_phong,
        gia_thue: b.pt_gia_thue,
        ma_khu_tro: b.pt_ma_khu_tro,
      },
      ho_ten: b.nd_ho_ten || 'Khách xem phòng',
      so_dien_thoai: b.nd_so_dien_thoai || 'Chưa cập nhật',
      ngay_xem: b.ngay_du_kien_nhan_phong || b.ngay_dat,
    }));

    res.json(result);
  } catch (error) {
    console.error('DAT PHONG GET ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { ma_phong, ma_nguoi_thue, ngay_du_kien_nhan_phong, ghi_chu, ho_ten, so_dien_thoai } = req.body;
    const now = new Date();

    let uid = req.user?.id || ma_nguoi_thue;

    // Nếu không có uid (khách chưa đăng nhập), tự sinh mã khách tạm
    if (!uid) {
      uid = `GUEST_${Date.now()}`;
    }

    // Đảm bảo nguoi_dung có tồn tại để thỏa mãn khóa ngoại fk_dat_phong_nguoi_thue
    const [rows] = await pool.query('SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1', [uid]);
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO nguoi_dung (ma_nguoi_dung, ho_ten, so_dien_thoai, vai_tro) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), so_dien_thoai = VALUES(so_dien_thoai)`,
        [uid, ho_ten || 'Khách xem phòng', so_dien_thoai || null, 'NguoiThue']
      );
    }

    const newBooking = {
      ma_phong,
      ma_nguoi_thue: uid,
      ngay_dat: now,
      ngay_du_kien_nhan_phong: ngay_du_kien_nhan_phong || now,
      ghi_chu: ghi_chu || null,
      trang_thai: 'ChoDuyet',
      ngay_tao: now,
      ngay_cap_nhat: now,
    };

    const [result] = await pool.query('INSERT INTO dat_phong SET ?', [newBooking]);
    const [createdRows] = await pool.query(
      'SELECT * FROM dat_phong WHERE ma_dat_phong = ?',
      [result.insertId]
    );

    console.log('✅ ĐÃ LƯU ĐẶT LỊCH XEM PHÒNG VÀO DATABASE! ID:', result.insertId);
    res.status(201).json(createdRows[0]);
  } catch (error) {
    console.error('LỖI TAO DAT PHONG:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;

    await pool.query(
      'UPDATE dat_phong SET ? WHERE ma_dat_phong = ?',
      [{ trang_thai, ngay_cap_nhat: new Date() }, id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM dat_phong WHERE ma_dat_phong = ?',
      [id]
    );

    res.json(rows[0] || { success: true, trang_thai });
  } catch (error) {
    console.error('UPDATE STATUS CATCH ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  create,
  updateStatus,
};
