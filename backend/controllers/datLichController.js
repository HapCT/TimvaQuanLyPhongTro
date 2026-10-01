const pool = require('../config/db');
const { notifyUser } = require('../services/notifications');
const { getRoomOccupancy, getRoomOccupancyMap } = require('../services/roomOccupancy');

const parseFutureDateTime = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)
    || date.getHours() !== Number(hour) || date.getMinutes() !== Number(minute) || date.getSeconds() !== Number(second)) return null;
  return date > new Date() ? date : null;
};

const getAppointmentAccess = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT dl.ma_dat_lich, dl.ma_phong, dl.ma_nguoi_thue,
            dl.thoi_gian_hen, dl.trang_thai, k.ma_chu_tro
     FROM dat_lich_xem dl
     JOIN phong_tro p ON p.ma_phong = dl.ma_phong
     JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
     WHERE dl.ma_dat_lich = ? LIMIT 1`,
    [req.params.id]
  );
  const appointment = rows[0];
  if (!appointment) {
    res.status(404).json({ error: 'Không tìm thấy lịch hẹn.' });
    return null;
  }

  const isOwner = req.user.role === 'ChuTro' && String(appointment.ma_chu_tro) === String(req.user.id);
  const isAdmin = req.user.role === 'QuanTri';
  const isTenant = req.user.role === 'NguoiThue' && String(appointment.ma_nguoi_thue) === String(req.user.id);
  if (!isOwner && !isAdmin && !isTenant) {
    res.status(403).json({ error: 'Bạn không có quyền thao tác lịch hẹn này.' });
    return null;
  }

  return { appointment, isOwner, isAdmin, isTenant };
};

const getAll = async (req, res) => {
  try {
    let sql = `
      SELECT dl.*, nd.ho_ten, nd.so_dien_thoai,
              p.tieu_de AS phong_tieu_de, p.so_phong AS phong_so_phong,
              p.trang_thai AS phong_trang_thai, p.so_nguoi_toi_da,
             k.ten_khu_tro, k.dia_chi AS khu_tro_dia_chi,
             k.ma_chu_tro
      FROM dat_lich_xem dl
      JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dl.ma_nguoi_thue
      JOIN phong_tro p ON p.ma_phong = dl.ma_phong
      JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro`;
    const params = [];

    if (req.user.role === 'ChuTro') {
      sql += ' WHERE k.ma_chu_tro = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'QuanTri') {
      sql += ' WHERE dl.ma_nguoi_thue = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY dl.thoi_gian_hen ASC, dl.ngay_tao DESC';
    const [rows] = await pool.query(sql, params);
    const occupancyByRoom = await getRoomOccupancyMap(pool);
    res.json(rows.map((item) => ({
      ...item,
      phong_tro: {
        ma_phong: item.ma_phong,
        tieu_de: item.phong_tieu_de,
        so_phong: item.phong_so_phong,
        trang_thai: item.phong_trang_thai,
        so_nguoi_dang_o: occupancyByRoom.get(Number(item.ma_phong)) || 0,
        so_cho_con_lai: Math.max(0, Number(item.so_nguoi_toi_da || 1) - (occupancyByRoom.get(Number(item.ma_phong)) || 0)),
        co_the_dat_thue: item.phong_trang_thai !== 'BaoTri'
          && Number(item.so_nguoi_toi_da || 1) > (occupancyByRoom.get(Number(item.ma_phong)) || 0),
        ten_khu_tro: item.ten_khu_tro,
        dia_chi: item.khu_tro_dia_chi,
      },
    })));
  } catch (error) {
    console.error('DAT LICH GET ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { ma_phong, thoi_gian_hen, so_dien_thoai, ghi_chu } = req.body;
    const roomId = Number(ma_phong);
    const appointmentTime = String(thoi_gian_hen || '').trim();
    const phone = String(so_dien_thoai || '').trim();

    if (!Number.isInteger(roomId) || roomId < 1) return res.status(400).json({ error: 'Mã phòng không hợp lệ.' });
    if (!parseFutureDateTime(appointmentTime)) return res.status(400).json({ error: 'Thời gian hẹn phải hợp lệ và ở tương lai.' });
    if (!phone || !/^[0-9+().\-\s]{8,20}$/.test(phone)) return res.status(400).json({ error: 'Số điện thoại không hợp lệ.' });

    const [roomRows] = await pool.query(
            `SELECT p.ma_phong, p.trang_thai, p.trang_thai_duyet,
              p.so_nguoi_toi_da, k.ma_chu_tro
       FROM phong_tro p JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE p.ma_phong = ? LIMIT 1`,
      [roomId]
    );
    const room = roomRows[0];
    if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng trọ.' });
    if (room.trang_thai_duyet !== 'DaDuyet') return res.status(400).json({ error: 'Phòng chưa được duyệt đăng.' });
    if (room.trang_thai === 'BaoTri') return res.status(409).json({ error: 'Phòng hiện đang bảo trì.' });
    const occupied = await getRoomOccupancy(pool, roomId);
    if (occupied >= Number(room.so_nguoi_toi_da || 1)) {
      return res.status(409).json({ error: 'Phòng đã đủ người, không còn chỗ trống để xem thuê chung.' });
    }

    const [duplicateRows] = await pool.query(
      `SELECT ma_dat_lich FROM dat_lich_xem
       WHERE ma_phong = ? AND ma_nguoi_thue = ? AND thoi_gian_hen = ?
         AND trang_thai IN ('ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan') LIMIT 1`,
      [roomId, req.user.id, appointmentTime]
    );
    if (duplicateRows[0]) return res.status(409).json({ error: 'Bạn đã có lịch hẹn tương tự đang được xử lý.' });

    const [result] = await pool.query(
      `INSERT INTO dat_lich_xem
       (ma_phong, ma_nguoi_thue, thoi_gian_hen, so_dien_thoai, ghi_chu, trang_thai)
       VALUES (?, ?, ?, ?, ?, 'ChoXacNhan')`,
      [roomId, req.user.id, appointmentTime, phone, String(ghi_chu || '').trim() || null]
    );
    const [rows] = await pool.query('SELECT * FROM dat_lich_xem WHERE ma_dat_lich = ?', [result.insertId]);
    await notifyUser({
      userId: room.ma_chu_tro,
      title: 'Lịch xem phòng mới',
      body: `Có lịch xem phòng vào ${appointmentTime}.`,
      type: 'DatLich',
    });
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('DAT LICH CREATE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const status = String(req.body.trang_thai || '').trim();
    if (!['DaXacNhan', 'TuChoi', 'DaHuy', 'DaXem'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái lịch hẹn không hợp lệ.' });
    }

    const access = await getAppointmentAccess(req, res);
    if (!access) return;
    const { appointment, isOwner, isAdmin, isTenant } = access;

    if (status === 'DaHuy') {
      if (!['ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan'].includes(appointment.trang_thai)) {
        return res.status(409).json({ error: 'Chỉ có thể hủy lịch đang chờ hoặc đã xác nhận.' });
      }
    } else if (status === 'DaXem') {
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Chỉ chủ trọ hoặc quản trị viên được hoàn tất buổi xem.' });
      if (appointment.trang_thai !== 'DaXacNhan') return res.status(409).json({ error: 'Chỉ lịch đã xác nhận mới được đánh dấu đã xem.' });
      const [dueRows] = await pool.query('SELECT thoi_gian_hen <= NOW() AS da_den_gio FROM dat_lich_xem WHERE ma_dat_lich = ?', [req.params.id]);
      if (!dueRows[0]?.da_den_gio) return res.status(409).json({ error: 'Chỉ đánh dấu đã xem sau thời gian hẹn.' });
    } else if (appointment.trang_thai === 'ChoXacNhan') {
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Chỉ chủ trọ hoặc quản trị viên được xác nhận lịch.' });
    } else if (appointment.trang_thai === 'ChoKhachXacNhan') {
      if (!isTenant) return res.status(403).json({ error: 'Người thuê cần phản hồi thời gian mới.' });
    } else {
      return res.status(409).json({ error: 'Lịch hẹn không còn chờ xác nhận.' });
    }

    if (status === 'DaHuy' && !isTenant && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy lịch hẹn này.' });
    }

    const [result] = await pool.query(
      'UPDATE dat_lich_xem SET trang_thai = ? WHERE ma_dat_lich = ? AND trang_thai = ?',
      [status, req.params.id, appointment.trang_thai]
    );
    if (result.affectedRows === 0) return res.status(409).json({ error: 'Lịch hẹn vừa được cập nhật ở nơi khác.' });
    const recipientId = isTenant ? appointment.ma_chu_tro : appointment.ma_nguoi_thue;
    const statusMessage = {
      DaXacNhan: 'Lịch xem phòng của bạn đã được xác nhận.',
      TuChoi: 'Lịch xem phòng của bạn đã bị từ chối.',
      DaHuy: 'Lịch xem phòng đã được hủy.',
      DaXem: 'Buổi xem phòng đã được hoàn tất.',
    };
    await notifyUser({ userId: recipientId, title: 'Cập nhật lịch xem phòng', body: statusMessage[status], type: 'DatLich' });
    res.json({ success: true, trang_thai: status });
  } catch (error) {
    console.error('DAT LICH UPDATE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const reschedule = async (req, res) => {
  try {
    const appointmentTime = String(req.body.thoi_gian_hen || '').trim();
    if (!parseFutureDateTime(appointmentTime)) return res.status(400).json({ error: 'Thời gian hẹn mới phải hợp lệ và ở tương lai.' });

    const access = await getAppointmentAccess(req, res);
    if (!access) return;
    const { appointment, isTenant } = access;
    if (!['ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan'].includes(appointment.trang_thai)) {
      return res.status(409).json({ error: 'Chỉ có thể đổi lịch đang chờ hoặc đã xác nhận.' });
    }

    const [duplicateRows] = await pool.query(
      `SELECT ma_dat_lich FROM dat_lich_xem
       WHERE ma_phong = ? AND ma_nguoi_thue = ? AND thoi_gian_hen = ?
         AND ma_dat_lich <> ? AND trang_thai IN ('ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan') LIMIT 1`,
      [appointment.ma_phong, appointment.ma_nguoi_thue, appointmentTime, appointment.ma_dat_lich]
    );
    if (duplicateRows[0]) return res.status(409).json({ error: 'Đã có lịch hẹn tương tự đang được xử lý.' });

    const waitingStatus = access.isOwner || access.isAdmin ? 'ChoKhachXacNhan' : 'ChoXacNhan';
    const [result] = await pool.query(
      `UPDATE dat_lich_xem SET thoi_gian_hen = ?, trang_thai = ?
      WHERE ma_dat_lich = ? AND trang_thai IN ('ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan')`,
      [appointmentTime, waitingStatus, appointment.ma_dat_lich]
    );
    if (result.affectedRows === 0) return res.status(409).json({ error: 'Lịch hẹn vừa được cập nhật ở nơi khác.' });
    const recipientId = isTenant ? appointment.ma_chu_tro : appointment.ma_nguoi_thue;
    await notifyUser({
      userId: recipientId,
      title: 'Đề xuất đổi lịch xem phòng',
      body: `Thời gian hẹn mới: ${appointmentTime}. Vui lòng mở lịch hẹn để phản hồi.`,
      type: 'DatLich',
    });
    res.json({ success: true, thoi_gian_hen: appointmentTime, trang_thai: waitingStatus });
  } catch (error) {
    console.error('DAT LICH RESCHEDULE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, updateStatus, reschedule };