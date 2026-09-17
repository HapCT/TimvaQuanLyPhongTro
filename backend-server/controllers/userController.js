const supabaseAdmin = require('../config/supabase');

const getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('nguoi_dung')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) throw error;

    // Lấy danh sách users từ Supabase Auth để lấy trạng thái khóa (banned_until)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    let authMap = {};
    if (!authError && authData?.users) {
      authData.users.forEach(u => {
        authMap[u.id] = {
          is_locked: !!u.banned_until
        };
      });
    }

    const mergedData = data.map(user => ({
      ...user,
      is_locked: authMap[user.ma_nguoi_dung]?.is_locked || false
    }));

    res.json(mergedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Xóa từ auth (Supabase Auth)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    // Lưu ý: xóa auth có thể trigger xóa nguoi_dung nếu có cấu hình cascade trong CSDL, 
    // Nếu không, ta tự xóa tiếp.
    
    const { error: dbError } = await supabaseAdmin
      .from('nguoi_dung')
      .delete()
      .eq('ma_nguoi_dung', id);

    if (dbError && dbError.code !== 'PGRST116') {
       // Bỏ qua lỗi nếu record không tồn tại (đã bị xóa bởi cascade)
       console.log('DB Delete Warning:', dbError);
    }

    res.json({ success: true, message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const toggleLock = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_locked } = req.body;
    
    // Nếu muốn khóa, set ban_duration là 876000h (100 năm). Mở khóa thì set là 'none'.
    const ban_duration = is_locked ? '876000h' : 'none';
    
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration });
    
    if (authError) throw authError;

    res.json({ success: true, message: is_locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
  } catch (error) {
    console.error("LỖI TOGGLE LOCK USER:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  remove,
  toggleLock
};
