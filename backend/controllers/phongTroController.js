const supabaseAdmin = require('../config/supabase');

const getAll = async (req, res) => {
  try {
    // Gọi song song 5 bảng như trước kia, nhưng thực hiện trên Backend để giảm tải cho Frontend
    const [phongRes, khuTroRes, anhRes, ptiRes, tienIchRes] = await Promise.all([
      supabaseAdmin.from('phong_tro').select('*').order('ngay_tao', { ascending: false }),
      supabaseAdmin.from('khu_tro').select('*'),
      supabaseAdmin.from('anh_phong').select('*'),
      supabaseAdmin.from('phong_tien_ich').select('*'),
      supabaseAdmin.from('tien_ich').select('*'),
    ]);

    if (phongRes.error) throw phongRes.error;

    const phongData = phongRes.data || [];
    const khuTroData = khuTroRes.data || [];
    const anhData = anhRes.data || [];
    const ptiData = ptiRes.data || [];
    const tienIchData = tienIchRes.data || [];

    // Lấy thông tin chủ trọ
    const chuTroIds = Array.from(new Set(khuTroData.map(k => k.ma_chu_tro).filter(Boolean)));
    let chuTroMap = {};
    if (chuTroIds.length > 0) {
      const { data: chuTroData } = await supabaseAdmin
        .from('nguoi_dung')
        .select('ma_nguoi_dung, ho_ten')
        .in('ma_nguoi_dung', chuTroIds);
      if (chuTroData) {
        chuTroData.forEach(u => chuTroMap[u.ma_nguoi_dung] = u.ho_ten || 'Chưa cập nhật');
      }
    }

    const khuTroMap = {};
    khuTroData.forEach(k => khuTroMap[k.ma_khu_tro] = k);

    const tienIchMap = {};
    tienIchData.forEach(t => tienIchMap[t.ma_tien_ich] = t);

    const anhByPhong = {};
    anhData.forEach(a => {
      if (!anhByPhong[a.ma_phong]) anhByPhong[a.ma_phong] = [];
      anhByPhong[a.ma_phong].push(a);
    });

    const tienIchByPhong = {};
    ptiData.forEach(pti => {
      const info = tienIchMap[pti.ma_tien_ich];
      if (!info) return;
      if (!tienIchByPhong[pti.ma_phong]) tienIchByPhong[pti.ma_phong] = [];
      tienIchByPhong[pti.ma_phong].push(info);
    });

    // Ghép dữ liệu trả về Frontend
    const merged = phongData.map(p => {
      const khuTro = khuTroMap[p.ma_khu_tro] || null;
      const danhSachAnh = (anhByPhong[p.ma_phong] || []).sort((a, b) =>
        a.anh_chinh === b.anh_chinh ? 0 : a.anh_chinh ? -1 : 1
      );
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

    res.json({
      rooms: merged,
      khuTroList: khuTroData,
      tienIchList: tienIchData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { roomData, images, selectedTienIch } = req.body;
    
    // Tự động sửa lỗi sai chính tả từ app gửi lên (Trong -> ConTrong)
    if (roomData.trang_thai === 'Trong') {
      roomData.trang_thai = 'ConTrong';
    }

    // 1. Thêm phòng
    const { data: newRoom, error: roomError } = await supabaseAdmin
      .from('phong_tro')
      .insert(roomData)
      .select()
      .single();

    if (roomError) throw roomError;
    const maPhong = newRoom.ma_phong;

    // 2. Thêm tiện ích
    if (selectedTienIch && selectedTienIch.length > 0) {
      const ptiRows = selectedTienIch.map(ma_tien_ich => ({ ma_phong: maPhong, ma_tien_ich }));
      await supabaseAdmin.from('phong_tien_ich').insert(ptiRows);
    }

    // 3. Thêm ảnh
    if (images && images.length > 0) {
      const anhRows = images.map(img => ({
        ma_phong: maPhong,
        duong_dan_anh: img.duong_dan_anh,
        anh_chinh: img.anh_chinh
      }));
      await supabaseAdmin.from('anh_phong').insert(anhRows);
    }

    res.status(201).json({ success: true, ma_phong: maPhong });
  } catch (error) {
    console.error("LỖI CREATE ROOM:", error);
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomData, images, selectedTienIch } = req.body;
    
    // Tự động sửa lỗi sai chính tả từ app gửi lên (Trong -> ConTrong)
    if (roomData.trang_thai === 'Trong') {
      roomData.trang_thai = 'ConTrong';
    }

    // 1. Cập nhật phòng
    const { error: roomError } = await supabaseAdmin
      .from('phong_tro')
      .update(roomData)
      .eq('ma_phong', id);

    if (roomError) throw roomError;

    // 2. Cập nhật tiện ích (Xóa hết rồi chèn lại)
    await supabaseAdmin.from('phong_tien_ich').delete().eq('ma_phong', id);
    if (selectedTienIch && selectedTienIch.length > 0) {
      const ptiRows = selectedTienIch.map(ma_tien_ich => ({ ma_phong: id, ma_tien_ich }));
      await supabaseAdmin.from('phong_tien_ich').insert(ptiRows);
    }

    // 3. Cập nhật ảnh (Xóa hết rồi chèn lại)
    await supabaseAdmin.from('anh_phong').delete().eq('ma_phong', id);
    if (images && images.length > 0) {
      const anhRows = images.map(img => ({
        ma_phong: id,
        duong_dan_anh: img.duong_dan_anh,
        anh_chinh: img.anh_chinh
      }));
      await supabaseAdmin.from('anh_phong').insert(anhRows);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("LỖI UPDATE ROOM:", error);
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    // Xóa phòng sẽ tự xóa ảnh và tiện ích nếu DB có thiết lập cascade.
    // Dù sao thì backend cũng lo phần này thay cho app.
    const { error } = await supabaseAdmin
      .from('phong_tro')
      .delete()
      .eq('ma_phong', id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa phòng thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: phong, error } = await supabaseAdmin
      .from('phong_tro')
      .select('*')
      .eq('ma_phong', id)
      .maybeSingle();

    if (error || !phong) {
      return res.status(404).json({ error: 'Không tìm thấy phòng trọ' });
    }

    let khuTro = null;
    let tenChuTro = null;
    let soDienThoaiChuTro = null;

    if (phong.ma_khu_tro) {
      const { data: kt } = await supabaseAdmin
        .from('khu_tro')
        .select('*')
        .eq('ma_khu_tro', phong.ma_khu_tro)
        .maybeSingle();
      khuTro = kt;

      if (kt && kt.ma_chu_tro) {
        const { data: chuTro } = await supabaseAdmin
          .from('nguoi_dung')
          .select('ho_ten, so_dien_thoai')
          .eq('ma_nguoi_dung', kt.ma_chu_tro)
          .maybeSingle();

        if (chuTro) {
          tenChuTro = chuTro.ho_ten;
          soDienThoaiChuTro = chuTro.so_dien_thoai;
        }
      }
    }

    const { data: anhData } = await supabaseAdmin
      .from('anh_phong')
      .select('*')
      .eq('ma_phong', id);

    const danhSachAnh = (anhData || []).sort((a, b) =>
      a.anh_chinh === b.anh_chinh ? 0 : a.anh_chinh ? -1 : 1
    );

    const { data: ptiData } = await supabaseAdmin
      .from('phong_tien_ich')
      .select('ma_tien_ich')
      .eq('ma_phong', id);

    let danhSachTienIch = [];
    if (ptiData && ptiData.length > 0) {
      const ids = ptiData.map((p) => p.ma_tien_ich);
      const { data: tiData } = await supabaseAdmin
        .from('tien_ich')
        .select('*')
        .in('ma_tien_ich', ids);
      danhSachTienIch = tiData || [];
    }

    res.json({
      room: {
        ...phong,
        khu_tro: khuTro,
        ten_chu_tro: tenChuTro || 'Chủ nhà trọ',
        so_dien_thoai_chu_tro: soDienThoaiChuTro || khuTro?.so_dien_thoai || '0901234567',
        danh_sach_anh: danhSachAnh,
        danh_sach_tien_ich: danhSachTienIch,
      },
    });
  } catch (error) {
    console.error('LỖI GET BY ID:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
