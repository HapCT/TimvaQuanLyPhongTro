const pool = require('../config/db');
const { notifyUser } = require('../services/notifications');
const { getRoomOccupancy } = require('../services/roomOccupancy');

const getAll = async (req, res) => {
  try {
    let sql = `
      SELECT dp.*,
             nd.ho_ten AS nguoi_thue_ho_ten,
             nd.so_dien_thoai AS nguoi_thue_so_dien_thoai,
             nd.anh_dai_dien AS nguoi_thue_anh_dai_dien,
             p.tieu_de AS phong_tieu_de,
             p.so_phong AS phong_so_phong,
             p.gia_thue AS phong_gia_thue,
             p.ma_khu_tro,
             k.ten_khu_tro,
             k.dia_chi AS khu_tro_dia_chi
      FROM dat_phong dp
      LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dp.ma_nguoi_thue
      LEFT JOIN phong_tro p ON p.ma_phong = dp.ma_phong
      LEFT JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
    `;
    const params = [];

    if (req.user.role === 'ChuTro') {
      sql += ' WHERE k.ma_chu_tro = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'QuanTri') {
      sql += ' WHERE dp.ma_nguoi_thue = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY dp.ngay_tao DESC';

    const [rows] = await pool.query(sql, params);

    // Map kết quả tương thích cho frontend
    const result = rows.map((b) => ({
      ...b,
      ma_dat_lich: b.ma_dat_phong, // backward compatibility
      ho_ten: b.nguoi_thue_ho_ten || 'Khách đặt phòng',
      so_dien_thoai: b.nguoi_thue_so_dien_thoai || 'Chưa cập nhật',
      ngay_xem: b.ngay_du_kien_nhan_phong || b.ngay_dat,
      phong_tro: {
        ma_phong: b.ma_phong,
        tieu_de: b.phong_tieu_de,
        so_phong: b.phong_so_phong,
        gia_thue: b.phong_gia_thue,
        ma_khu_tro: b.ma_khu_tro,
        ten_khu_tro: b.ten_khu_tro,
        dia_chi: b.khu_tro_dia_chi,
      },
    }));

    res.json(result);
  } catch (error) {
    console.error('DAT PHONG GET ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  let connection;
  try {
    const { ma_phong, ngay_du_kien_nhan_phong, so_nguoi, ghi_chu } = req.body;
    if (!ma_phong) {
      return res.status(400).json({ error: 'Thiếu mã phòng.' });
    }

    const peopleCount = Number(so_nguoi ?? 1);
    if (!Number.isInteger(peopleCount) || peopleCount < 1) {
      return res.status(400).json({ error: 'Số người thuê phải lớn hơn 0.' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [roomRows] = await connection.query(
      `SELECT p.ma_phong, p.trang_thai, p.trang_thai_duyet,
              p.so_nguoi_toi_da, k.ma_chu_tro
       FROM phong_tro p
       JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE p.ma_phong = ? LIMIT 1 FOR UPDATE`,
      [ma_phong]
    );
    const room = roomRows[0];
    if (!room) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy phòng trọ.' });
    }
    if (room.trang_thai_duyet !== 'DaDuyet') {
      await connection.rollback();
      return res.status(400).json({ error: 'Phòng chưa được duyệt đăng.' });
    }
    if (room.trang_thai === 'BaoTri') {
      await connection.rollback();
      return res.status(409).json({ error: 'Phòng hiện không còn trống.' });
    }

    const occupied = await getRoomOccupancy(connection, room.ma_phong);
    const available = Math.max(0, Number(room.so_nguoi_toi_da || 1) - occupied);
    if (available === 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Phòng đã đủ người, không còn chỗ trống.' });
    }
    if (peopleCount > available) {
      await connection.rollback();
      return res.status(409).json({ error: `Phòng chỉ còn ${available} chỗ; yêu cầu ${peopleCount} người không phù hợp.` });
    }

    const [existingRows] = await connection.query(
      `SELECT dp.ma_dat_phong FROM dat_phong dp
       WHERE dp.ma_phong = ? AND dp.ma_nguoi_thue = ?
         AND (dp.trang_thai = 'ChoDuyet' OR (
           dp.trang_thai = 'DaDuyet' AND (
             NOT EXISTS (SELECT 1 FROM hop_dong hd WHERE hd.ma_dat_phong = dp.ma_dat_phong)
             OR EXISTS (SELECT 1 FROM hop_dong hd WHERE hd.ma_dat_phong = dp.ma_dat_phong AND hd.trang_thai = 'DangHieuLuc')
           )
         ))
       LIMIT 1`,
      [room.ma_phong, req.user.id]
    );
    if (existingRows[0]) {
      await connection.rollback();
      return res.status(409).json({ error: 'Bạn đã có yêu cầu đang chờ duyệt cho phòng này.' });
    }

    const [result] = await connection.query(
      `INSERT INTO dat_phong (ma_phong, ma_nguoi_thue, ngay_du_kien_nhan_phong, so_nguoi, ghi_chu, trang_thai)
       VALUES (?, ?, ?, ?, ?, 'ChoDuyet')`,
      [room.ma_phong, req.user.id, ngay_du_kien_nhan_phong || null, peopleCount, ghi_chu || null]
    );

    const [rows] = await connection.query('SELECT * FROM dat_phong WHERE ma_dat_phong = ?', [result.insertId]);
    await connection.commit();
    await notifyUser({
      userId: room.ma_chu_tro,
      title: 'Yêu cầu thuê phòng mới',
      body: 'Có người thuê vừa gửi yêu cầu cho phòng của bạn.',
      type: 'DatPhong',
    });
    res.status(201).json(rows[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('CREATE DAT PHONG ERROR:', error);
    res.status(400).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const updateStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;

    if (!['DaDuyet', 'TuChoi'].includes(trang_thai)) {
      return res.status(400).json({ error: 'Trạng thái phải là DaDuyet hoặc TuChoi.' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [requestRows] = await connection.query(
      `SELECT dp.ma_dat_phong, dp.trang_thai, dp.ma_phong, dp.ma_nguoi_thue,
              dp.so_nguoi, k.ma_chu_tro
       FROM dat_phong dp
       JOIN phong_tro p ON p.ma_phong = dp.ma_phong
       JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE dp.ma_dat_phong = ? LIMIT 1 FOR UPDATE`,
      [id]
    );
    const request = requestRows[0];
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu đặt phòng.' });
    }
    if (req.user.role !== 'QuanTri' && String(request.ma_chu_tro) !== String(req.user.id)) {
      await connection.rollback();
      return res.status(403).json({ error: 'Yêu cầu này không thuộc phòng của bạn.' });
    }
    if (request.trang_thai !== 'ChoDuyet') {
      await connection.rollback();
      return res.status(409).json({ error: 'Yêu cầu đã được xử lý trước đó.' });
    }

    const [roomRows] = await connection.query(
      'SELECT ma_phong, so_nguoi_toi_da, trang_thai FROM phong_tro WHERE ma_phong = ? LIMIT 1 FOR UPDATE',
      [request.ma_phong]
    );
    const room = roomRows[0];
    if (!room) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy phòng trọ.' });
    }
    if (trang_thai === 'DaDuyet') {
      if (room.trang_thai === 'BaoTri') {
        await connection.rollback();
        return res.status(409).json({ error: 'Phòng đang bảo trì, không thể duyệt yêu cầu thuê.' });
      }
      const occupied = await getRoomOccupancy(connection, room.ma_phong);
      const available = Math.max(0, Number(room.so_nguoi_toi_da || 1) - occupied);
      if (Number(request.so_nguoi) > available) {
        await connection.rollback();
        return res.status(409).json({ error: `Phòng chỉ còn ${available} chỗ, không đủ cho yêu cầu ${request.so_nguoi} người.` });
      }
    }

    const [updateResult] = await connection.query(
      'UPDATE dat_phong SET trang_thai = ? WHERE ma_dat_phong = ? AND trang_thai = \'ChoDuyet\'',
      [trang_thai, id]
    );
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Yêu cầu vừa được xử lý ở nơi khác.' });
    }

    if (trang_thai === 'DaDuyet') {
      await connection.query("UPDATE phong_tro SET trang_thai = 'DaThue' WHERE ma_phong = ?", [room.ma_phong]);
    }
    const [rows] = await connection.query('SELECT * FROM dat_phong WHERE ma_dat_phong = ?', [id]);
    await connection.commit();
    await notifyUser({
      userId: request.ma_nguoi_thue,
      title: trang_thai === 'DaDuyet' ? 'Yêu cầu thuê đã được duyệt' : 'Yêu cầu thuê bị từ chối',
      body: trang_thai === 'DaDuyet' ? 'Chủ trọ đã chấp nhận yêu cầu thuê phòng của bạn.' : 'Chủ trọ đã từ chối yêu cầu thuê phòng của bạn.',
      type: 'DatPhong',
    });
    res.json(rows[0] || { success: true, trang_thai });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('UPDATE STATUS CATCH ERROR:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getAll, create, updateStatus };