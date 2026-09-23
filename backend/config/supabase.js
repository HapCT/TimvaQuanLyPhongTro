require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://izhjfxuxlvifmeglgquc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'DANH_KHOA_SERVICE_ROLE_CUA_BAN_VAO_DAY') {
  console.warn("⚠️ CẢNH BÁO: Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY trong file .env!");
  console.warn("👉 Vui lòng điền SUPABASE_SERVICE_ROLE_KEY vào backend/.env để dùng đầy đủ các tính năng Admin.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder_key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabaseAdmin;
