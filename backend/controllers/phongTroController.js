const pool = require('../config/db');

const PHONG_FIELDS = [
  'so_phong', 'tieu_de', 'tang', 'dien_tich', 'gia_thue', 'tien_coc',
  'so_nguoi_toi_da', 'mo_ta', 'trang_thai', 'ma_khu_tro',
];
const LOAI_GIAY_TO_BAT_BUOC = ['giayPhepKinhDoanh', 'bangKhaiPhongTro', 'dangKyTamTru'];

const pickFields = (obj, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
};

// Ai được xem bài này?
//  - Quản trị: tất cả | Người thuê/khách: chỉ bài đã duyệt | Chủ trọ: bài đã duyệt + bài của mình
const canView = (phong, khuTro, viewer) => {
  if (viewer?.role === 'QuanTri') return true;
  if (phong.trang_thai_duyet === 'DaDuyet') return true;
  return !!viewer && !!khuTro && khuTro.ma_chu_tro === viewer.id;
};

// Kiểm tra danh sách giấy tờ pháp lý (nếu có thì lưu vào database)
const validateLegalDocs = (legalDocs) => {
  const docs = legalDocs && typeof legalDocs === 'object' ? legalDocs : {};
  const rows = [];
  for (const [loai, url] of Object.entries(docs)) {
    if (url && typeof url === 'string' && url.trim().length > 0) {
      rows.push({ loai_giay_to: loai, duong_dan: url.trim() });
    }
  }
  return { rows };
};

const layChuKhu = async (maKhuTro) => {
  if (!maKhuTro) return null;
  const [rows] = await pool.query(
    'SELECT ma_khu_tro, ma_chu_tro FROM khu_tro WHERE ma_khu_tro = ?',
    [maKhuTro]
  );
  return rows[0] || null;
};

// Lấy phòng + kiểm tra phòng thuộc chủ trọ đang đăng nhập
const layPhongCuaToi = async (id, userId) => {
  const [rows] = await pool.query('SELECT ma_phong, ma_khu_tro FROM phong_tro WHERE ma_phong = ?', [id]);
  const phong = rows[0];
  if (!phong) return { status: 404, error: 'Không tìm thấy phòng trọ' };
  const kt = await layChuKhu(phong.ma_khu_tro);
  if (!kt || String(kt.ma_chu_tro || '').trim() !== String(userId || '').trim()) {
    return { status: 403, error: 'Đây không phải phòng của bạn.' };
  }
  return { phong };
};

const inClause = (arr) => arr.map(() => '?').join(',');

// ---------------------------------------------------------------------
const getAll = async (req, res) => {
  try {
    const [phongData] = await pool.query('SELECT * FROM phong_tro ORDER BY ma_phong DESC');
    const [khuTroData] = await pool.query('SELECT * FROM khu_tro');
    const [anhData] = await pool.query('SELECT * FROM anh_phong');
    const [ptiData] = await pool.query('SELECT * FROM phong_tien_ich');
    const [tienIchData] = await pool.query('SELECT * FROM tien_ich');

    const chuTroIds = [...new Set(khuTroData.map((k) => k.ma_chu_tro).filter(Boolean))];
    let chuTroMap = {};
    if (chuTroIds.length > 0) {
      const [chuTroData] = await pool.query(
        `SELECT ma_nguoi_dung, ho_ten FROM nguoi_dung WHERE ma_nguoi_dung IN (${inClause(chuTroIds)})`,
        chuTroIds
      );
      chuTroData.forEach((u) => { chuTroMap[u.ma_nguoi_dung] = u.ho_ten || 'Chưa cập nhật'; });
    }

    const khuTroMap = {};
    khuTroData.forEach((k) => { khuTroMap[k.ma_khu_tro] = k; });

    const tienIchMap = {};
    tienIchData.forEach((t) => { tienIchMap[t.ma_tien_ich] = t; });

    const anhByPhong = {};
    anhData.forEach((a) => {
      if (!anhByPhong[a.ma_phong]) anhByPhong[a.ma_phong] = [];
      anhByPhong[a.ma_phong].push(a);
    });

    const tienIchByPhong = {};
    ptiData.forEach((pti) => {
      const info = tienIchMap[pti.ma_tien_ich];
      if (!info) return;
      if (!tienIchByPhong[pti.ma_phong]) tienIchByPhong[pti.ma_phong] = [];
      tienIchByPhong[pti.ma_phong].push(info);
    });

    const merged = phongData.map((p) => {
      const khuTro = khuTroMap[p.ma_khu_tro] || null;
      const danhSachAnh = (anhByPhong[p.ma_phong] || []).sort((a, b) => {
        const aMain = a.anh_chinh || a.la_anh_dai_dien;
        const bMain = b.anh_chinh || b.la_anh_dai_dien;
        return aMain === bMain ? 0 : aMain ? -1 : 1;
      });
      const anhDaiDien = danhSachAnh[0]?.duong_dan_anh || null;

      return {
        ...p,
        khu_tro: khuTro,
        ten_chu_tro: khuTro ? chuTroMap[khuTro.ma_chu_tro] || null : null,
        anh_dai_dien: anhDaiDien,
        danh_sach_anh: danhSachAnh,
        danh_sach_tien_ich: tienIchByPhong[p.ma_phong] || [],
      };
    });

    const visible = merged.filter((p) => canView(p, p.khu_tro, req.user));

    res.json({ rooms: visible, khuTroList: khuTroData, tienIchList: tienIchData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------------------------------
const create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { roomData, images, selectedTienIch, legalDocs } = req.body;
    if (!roomData) return res.status(400).json({ error: 'Thiếu dữ liệu phòng.' });

    const kt = await layChuKhu(roomData.ma_khu_tro);
    if (!kt || String(kt.ma_chu_tro || '').trim() !== String(req.user.id || '').trim()) {
      return res.status(403).json({ error: 'Khu trọ này không thuộc về bạn.' });
    }

    const legal = validateLegalDocs(legalDocs);
    if (legal.error) return res.status(400).json({ error: legal.error });

    const data = pickFields(roomData, PHONG_FIELDS);
    data.trang_thai_duyet = 'ChoDuyet';

    await conn.beginTransaction();

    const cols = Object.keys(data);
    const [result] = await conn.query(
      `INSERT INTO phong_tro (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((c) => data[c])
    );
    const maPhong = result.insertId;

    for (const r of legal.rows) {
      await conn.query(
        'INSERT INTO ho_so_phap_ly (ma_phong, loai_giay_to, duong_dan) VALUES (?, ?, ?)',
        [maPhong, r.loai_giay_to, r.duong_dan]
      );
    }

    if (selectedTienIch && selectedTienIch.length > 0) {
      for (const ma_tien_ich of selectedTienIch) {
        await conn.query(
          'INSERT INTO phong_tien_ich (ma_phong, ma_tien_ich) VALUES (?, ?)',
          [maPhong, ma_tien_ich]
        );
      }
    }

    if (images && images.length > 0) {
      for (const img of images) {
        await conn.query(
          'INSERT INTO anh_phong (ma_phong, duong_dan_anh, anh_chinh) VALUES (?, ?, ?)',
          [maPhong, img.duong_dan_anh, !!(img.anh_chinh ?? img.la_anh_dai_dien)]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, ma_phong: maPhong, trang_thai_duyet: 'ChoDuyet' });
  } catch (error) {
    await conn.rollback();
    console.error('LỖI CREATE ROOM:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------
const update = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { roomData, images, selectedTienIch, legalDocs } = req.body;
    if (!roomData) return res.status(400).json({ error: 'Thiếu dữ liệu phòng.' });

    const own = await layPhongCuaToi(id, req.user.id);
    if (own.error) return res.status(own.status).json({ error: own.error });

    if (roomData.ma_khu_tro && String(roomData.ma_khu_tro) !== String(own.phong.ma_khu_tro)) {
      const kt = await layChuKhu(roomData.ma_khu_tro);
      if (!kt || kt.ma_chu_tro !== req.user.id) {
        return res.status(403).json({ error: 'Khu trọ này không thuộc về bạn.' });
      }
    }

    let legalRows = null;
    if (legalDocs) {
      const legal = validateLegalDocs(legalDocs);
      if (legal.error) return res.status(400).json({ error: legal.error });
      legalRows = legal.rows;
    }

    // Sửa nội dung bài => phải được duyệt lại
    const data = pickFields(roomData, PHONG_FIELDS);
    data.trang_thai_duyet = 'ChoDuyet';
    data.ly_do_tu_choi = null;
    data.ngay_duyet = null;
    data.nguoi_duyet = null;

    await conn.beginTransaction();

    const setClause = Object.keys(data).map((c) => `${c} = ?`).join(', ');
    await conn.query(`UPDATE phong_tro SET ${setClause} WHERE ma_phong = ?`, [...Object.values(data), id]);

    if (legalRows) {
      await conn.query('DELETE FROM ho_so_phap_ly WHERE ma_phong = ?', [id]);
      for (const r of legalRows) {
        await conn.query(
          'INSERT INTO ho_so_phap_ly (ma_phong, loai_giay_to, duong_dan) VALUES (?, ?, ?)',
          [id, r.loai_giay_to, r.duong_dan]
        );
      }
    }

    await conn.query('DELETE FROM phong_tien_ich WHERE ma_phong = ?', [id]);
    if (selectedTienIch && selectedTienIch.length > 0) {
      for (const ma_tien_ich of selectedTienIch) {
        await conn.query('INSERT INTO phong_tien_ich (ma_phong, ma_tien_ich) VALUES (?, ?)', [id, ma_tien_ich]);
      }
    }

    await conn.query('DELETE FROM anh_phong WHERE ma_phong = ?', [id]);
    if (images && images.length > 0) {
      for (const img of images) {
        await conn.query(
          'INSERT INTO anh_phong (ma_phong, duong_dan_anh, anh_chinh) VALUES (?, ?, ?)',
          [id, img.duong_dan_anh, !!(img.anh_chinh ?? img.la_anh_dai_dien)]
        );
      }
    }

    await conn.commit();
    res.json({ success: true, trang_thai_duyet: 'ChoDuyet' });
  } catch (error) {
    await conn.rollback();
    console.error('LỖI UPDATE ROOM:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const own = await layPhongCuaToi(id, req.user.id);
    if (own.error) return res.status(own.status).json({ error: own.error });

    // LƯU Ý: ảnh + giấy tờ trên Cloudinary KHÔNG tự xóa khi xóa dòng DB.
    // Nếu muốn dọn file thật, cần lưu "public_id" lúc upload rồi gọi
    // cloudinary.uploader.destroy(public_id) ở đây trước khi xóa DB.
    await pool.query('DELETE FROM phong_tro WHERE ma_phong = ?', [id]);
    res.json({ success: true, message: 'Đã xóa phòng thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------------------------------
// ADMIN: danh sách bài đăng kèm hồ sơ pháp lý
const listForReview = async (req, res) => {
  try {
    const status = req.query.status || 'ChoDuyet'; // ChoDuyet | DaDuyet | TuChoi | ALL

    const [allStatus] = await pool.query('SELECT trang_thai_duyet FROM phong_tro');
    const counts = { ChoDuyet: 0, DaDuyet: 0, TuChoi: 0 };
    allStatus.forEach((r) => {
      if (counts[r.trang_thai_duyet] !== undefined) counts[r.trang_thai_duyet]++;
    });

    let sql = 'SELECT * FROM phong_tro';
    const params = [];
    if (status !== 'ALL') {
      sql += ' WHERE trang_thai_duyet = ?';
      params.push(status);
    }
    sql += ' ORDER BY ma_phong DESC';
    const [phongs] = await pool.query(sql, params);

    if (phongs.length === 0) return res.json({ rooms: [], counts });

    const ids = phongs.map((p) => p.ma_phong);
    const khuIds = [...new Set(phongs.map((p) => p.ma_khu_tro).filter(Boolean))];

    const [khus] = khuIds.length
      ? await pool.query(`SELECT * FROM khu_tro WHERE ma_khu_tro IN (${inClause(khuIds)})`, khuIds)
      : [[]];
    const [anhs] = await pool.query(`SELECT * FROM anh_phong WHERE ma_phong IN (${inClause(ids)})`, ids);
    const [docs] = await pool.query(`SELECT * FROM ho_so_phap_ly WHERE ma_phong IN (${inClause(ids)})`, ids);
    const [ptis] = await pool.query(`SELECT * FROM phong_tien_ich WHERE ma_phong IN (${inClause(ids)})`, ids);
    const [tis] = await pool.query('SELECT * FROM tien_ich');

    const khuMap = {};
    khus.forEach((k) => { khuMap[k.ma_khu_tro] = k; });

    const chuIds = [...new Set(khus.map((k) => k.ma_chu_tro).filter(Boolean))];
    const chuMap = {};
    if (chuIds.length > 0) {
      const [chus] = await pool.query(
        `SELECT ma_nguoi_dung, ho_ten, so_dien_thoai, email FROM nguoi_dung WHERE ma_nguoi_dung IN (${inClause(chuIds)})`,
        chuIds
      );
      chus.forEach((u) => { chuMap[u.ma_nguoi_dung] = u; });
    }

    const tiMap = {};
    tis.forEach((t) => { tiMap[t.ma_tien_ich] = t; });

    // Ảnh + giấy tờ đều là URL công khai trên Cloudinary -> dùng thẳng,
    // không cần tạo signed URL tạm thời như hồi dùng Supabase Storage private bucket.
    const rooms = phongs.map((p) => {
      const khu = khuMap[p.ma_khu_tro] || null;
      return {
        ...p,
        khu_tro: khu,
        chu_tro: khu ? chuMap[khu.ma_chu_tro] || null : null,
        danh_sach_anh: anhs.filter((a) => a.ma_phong === p.ma_phong),
        danh_sach_tien_ich: ptis
          .filter((x) => x.ma_phong === p.ma_phong)
          .map((x) => tiMap[x.ma_tien_ich])
          .filter(Boolean),
        ho_so_phap_ly: docs
          .filter((d) => d.ma_phong === p.ma_phong)
          .map((d) => ({ ...d, url: d.duong_dan })),
      };
    });

    res.json({ rooms, counts });
  } catch (error) {
    console.error('LỖI LIST REVIEW:', error);
    res.status(500).json({ error: error.message });
  }
};

// ADMIN: duyệt / từ chối
const review = async (req, res) => {
  try {
    const { id } = req.params;
    const { ket_qua, ly_do } = req.body || {};

    if (!['DaDuyet', 'TuChoi'].includes(ket_qua)) {
      return res.status(400).json({ error: 'ket_qua phải là DaDuyet hoặc TuChoi.' });
    }
    if (ket_qua === 'TuChoi' && !String(ly_do || '').trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối.' });
    }

    const [result] = await pool.query(
      `UPDATE phong_tro
       SET trang_thai_duyet = ?, ly_do_tu_choi = ?, ngay_duyet = NOW(), nguoi_duyet = ?
       WHERE ma_phong = ?`,
      [ket_qua, ket_qua === 'TuChoi' ? String(ly_do).trim() : null, req.user.id, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy bài đăng.' });

    res.json({ success: true, trang_thai_duyet: ket_qua });
  } catch (error) {
    console.error('LỖI REVIEW:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật trạng thái phòng (Còn trống / Đã thuê)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trang_thai, trang_thai_duyet } = req.body || {};
    
    if (!trang_thai && !trang_thai_duyet) {
      return res.status(400).json({ error: 'Cần truyền trang_thai hoặc trang_thai_duyet' });
    }

    if (trang_thai) {
      await pool.query('UPDATE phong_tro SET trang_thai = ? WHERE ma_phong = ?', [trang_thai, id]);
    }
    if (trang_thai_duyet) {
      await pool.query('UPDATE phong_tro SET trang_thai_duyet = ? WHERE ma_phong = ?', [trang_thai_duyet, id]);
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('LỖI UPDATE STATUS:', error);
    res.status(500).json({ error: error.message });
  }
};

// ---------------------------------------------------------------------
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [phongRows] = await pool.query('SELECT * FROM phong_tro WHERE ma_phong = ?', [id]);
    const phong = phongRows[0];
    if (!phong) return res.status(404).json({ error: 'Không tìm thấy phòng trọ' });

    let khuTro = null;
    let tenChuTro = null;
    let soDienThoaiChuTro = null;

    if (phong.ma_khu_tro) {
      const [ktRows] = await pool.query('SELECT * FROM khu_tro WHERE ma_khu_tro = ?', [phong.ma_khu_tro]);
      khuTro = ktRows[0] || null;

      if (khuTro && khuTro.ma_chu_tro) {
        const [ctRows] = await pool.query(
          'SELECT ho_ten, so_dien_thoai FROM nguoi_dung WHERE ma_nguoi_dung = ?',
          [khuTro.ma_chu_tro]
        );
        if (ctRows[0]) {
          tenChuTro = ctRows[0].ho_ten;
          soDienThoaiChuTro = ctRows[0].so_dien_thoai;
        }
      }
    }

    if (!canView(phong, khuTro, req.user)) {
      return res.status(404).json({ error: 'Không tìm thấy phòng trọ' });
    }

    const [anhData] = await pool.query('SELECT * FROM anh_phong WHERE ma_phong = ?', [id]);
    const danhSachAnh = anhData.sort((a, b) => {
      const aMain = a.anh_chinh || a.la_anh_dai_dien;
      const bMain = b.anh_chinh || b.la_anh_dai_dien;
      return aMain === bMain ? 0 : aMain ? -1 : 1;
    });

    const [ptiData] = await pool.query('SELECT ma_tien_ich FROM phong_tien_ich WHERE ma_phong = ?', [id]);
    let danhSachTienIch = [];
    if (ptiData.length > 0) {
      const ids = ptiData.map((p) => p.ma_tien_ich);
      const [tiData] = await pool.query(
        `SELECT * FROM tien_ich WHERE ma_tien_ich IN (${inClause(ids)})`,
        ids
      );
      danhSachTienIch = tiData;
    }

    res.json({
      room: {
        ...phong,
        khu_tro: khuTro,
        ten_chu_tro: tenChuTro || 'Chủ nhà trọ',
        so_dien_thoai_chu_tro: soDienThoaiChuTro || '0901234567',
        danh_sach_anh: danhSachAnh,
        danh_sach_tien_ich: danhSachTienIch,
      },
    });
  } catch (error) {
    console.error('LỖI GET BY ID:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, listForReview, review, updateStatus };