const supabaseAdmin = require('../config/supabase');

const getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tien_ich')
      .select('*')
      .order('ma_tien_ich', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { ten_tien_ich } = req.body;
    if (!ten_tien_ich) {
      return res.status(400).json({ error: 'Tên tiện ích không được để trống' });
    }

    const { data, error } = await supabaseAdmin
      .from('tien_ich')
      .insert([{ ten_tien_ich }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_tien_ich } = req.body;

    if (!ten_tien_ich) {
      return res.status(400).json({ error: 'Tên tiện ích không được để trống' });
    }

    const { data, error } = await supabaseAdmin
      .from('tien_ich')
      .update({ ten_tien_ich })
      .eq('ma_tien_ich', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem tiện ích có đang được sử dụng ở phong_tien_ich không
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('phong_tien_ich')
      .select('ma_tien_ich')
      .eq('ma_tien_ich', id)
      .limit(1);

    if (usageError) throw usageError;

    if (usageData && usageData.length > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa do tiện ích đang được sử dụng bởi các phòng trọ.' 
      });
    }

    const { error } = await supabaseAdmin
      .from('tien_ich')
      .delete()
      .eq('ma_tien_ich', id);

    if (error) throw error;

    res.json({ success: true, message: 'Đã xóa tiện ích thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
