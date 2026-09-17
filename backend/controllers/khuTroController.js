const supabaseAdmin = require('../config/supabase');

const getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('khu_tro')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const khuTro = req.body;
    const { data, error } = await supabaseAdmin
      .from('khu_tro')
      .insert(khuTro)
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('khu_tro')
      .update(updateData)
      .eq('ma_khu_tro', id)
      .select();

    if (error) throw error;
    res.json(data[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('khu_tro')
      .delete()
      .eq('ma_khu_tro', id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa thành công' });
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
