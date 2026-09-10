
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '../services/supabase';

export default function RegisterScreen() {
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [vaiTro, setVaiTro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // =========================
    // KIỂM TRA HỌ TÊN
    // =========================

    if (!hoTen.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập họ và tên.'
      );
      return;
    }

    if (hoTen.trim().length < 2) {
      Alert.alert(
        'Thông tin không hợp lệ',
        'Họ và tên phải có ít nhất 2 ký tự.'
      );
      return;
    }

    // =========================
    // KIỂM TRA SỐ ĐIỆN THOẠI
    // =========================

    if (!soDienThoai.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập số điện thoại.'
      );
      return;
    }

    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;

    if (!phoneRegex.test(soDienThoai.trim())) {
      Alert.alert(
        'Số điện thoại không hợp lệ',
        'Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số.\n\nVí dụ: 0987654321'
      );
      return;
    }

    // =========================
    // KIỂM TRA EMAIL
    // =========================

    if (!email.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập email.'
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        'Email không hợp lệ',
        'Vui lòng nhập đúng định dạng email.\n\nVí dụ: example@gmail.com'
      );
      return;
    }

    // =========================
    // KIỂM TRA MẬT KHẨU
    // =========================

    if (!matKhau) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập mật khẩu.'
      );
      return;
    }

    if (matKhau.length < 6) {
      Alert.alert(
        'Mật khẩu không hợp lệ',
        'Mật khẩu phải có ít nhất 6 ký tự.'
      );
      return;
    }

    // =========================
    // KIỂM TRA XÁC NHẬN MẬT KHẨU
    // =========================

    if (!xacNhanMatKhau) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập lại mật khẩu.'
      );
      return;
    }

    if (matKhau !== xacNhanMatKhau) {
      Alert.alert(
        'Mật khẩu không khớp',
        'Mật khẩu xác nhận không giống mật khẩu bạn đã nhập.'
      );
      return;
    }

    // =========================
    // KIỂM TRA VAI TRÒ
    // =========================

    if (!vaiTro) {
      Alert.alert(
        'Chưa chọn vai trò',
        'Vui lòng chọn Người thuê hoặc Chủ trọ.'
      );
      return;
    }

    // =========================
    // BẮT ĐẦU ĐĂNG KÝ
    // =========================

    setLoading(true);

    try {
      console.log('========================');
      console.log('BẮT ĐẦU ĐĂNG KÝ');
      console.log('EMAIL:', email.trim());
      console.log('HỌ TÊN:', hoTen.trim());
      console.log(
        'SỐ ĐIỆN THOẠI:',
        soDienThoai.trim()
      );
      console.log('VAI TRÒ:', vaiTro);
      console.log('========================');

      // =========================
      // 1. TẠO TÀI KHOẢN AUTH
      // =========================

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email: email.trim(),
        password: matKhau,
      });

      console.log('AUTH DATA:', authData);
      console.log('AUTH ERROR:', authError);

      // =========================
      // XỬ LÝ LỖI AUTH
      // =========================

      if (authError) {
        const message =
          authError.message.toLowerCase();

        if (
          message.includes('already registered') ||
          message.includes('already exists')
        ) {
          Alert.alert(
            'Email đã được đăng ký',
            'Email này đã tồn tại trong hệ thống.\n\nVui lòng sử dụng email khác hoặc quay lại trang đăng nhập.'
          );
        } else if (
          message.includes('invalid email')
        ) {
          Alert.alert(
            'Email không hợp lệ',
            'Email bạn nhập không đúng định dạng.'
          );
        } else if (
          message.includes('password')
        ) {
          Alert.alert(
            'Mật khẩu không hợp lệ',
            authError.message
          );
        } else {
          Alert.alert(
            'Đăng ký thất bại',
            authError.message
          );
        }

        return;
      }

      if (!authData.user) {
        Alert.alert(
          'Đăng ký thất bại',
          'Không tạo được tài khoản. Vui lòng thử lại.'
        );
        return;
      }

      const userId = authData.user.id;

      console.log(
        'AUTH USER ID:',
        userId
      );

      // =========================
      // 2. KIỂM TRA SESSION
      // =========================

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      console.log(
        'SESSION:',
        sessionData.session
      );

      /*
       * Nếu Supabase đang bật xác nhận email
       * thì session có thể bằng null.
       */

      if (!sessionData.session) {
        Alert.alert(
          'Đăng ký thành công',
          'Tài khoản đã được tạo.\n\nVui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.',
          [
            {
              text: 'Đến trang đăng nhập',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );

        return;
      }

      // =========================
      // 3. LƯU THÔNG TIN NGƯỜI DÙNG
      // =========================

      const {
        error: userError,
      } = await supabase
        .from('nguoi_dung')
        .insert({
          ma_nguoi_dung: userId,
          ho_ten: hoTen.trim(),
          so_dien_thoai: soDienThoai.trim(),
          vai_tro: vaiTro,
        });

      console.log(
        'USER ERROR:',
        userError
      );

      // =========================
      // XỬ LÝ LỖI INSERT
      // =========================

      if (userError) {
        console.log(
          'KHÔNG LƯU ĐƯỢC NGƯỜI DÙNG:',
          userError
        );

        if (
          userError.code === '23505'
        ) {
          Alert.alert(
            'Tài khoản đã tồn tại',
            'Thông tin người dùng này đã tồn tại trong hệ thống.'
          );
        } else if (
          userError.code === '42501'
        ) {
          Alert.alert(
            'Không có quyền thực hiện',
            'Tài khoản đã được tạo nhưng hệ thống không cho phép lưu thông tin người dùng.\n\nVui lòng kiểm tra RLS trong Supabase.'
          );
        } else {
          Alert.alert(
            'Không lưu được thông tin',
            userError.message
          );
        }

        return;
      }

      // =========================
      // 4. ĐĂNG KÝ THÀNH CÔNG
      // =========================

      console.log(
        'ĐĂNG KÝ THÀNH CÔNG'
      );

      // Đăng xuất tài khoản vừa tạo
      await supabase.auth.signOut();

      Alert.alert(
        'Đăng ký thành công 🎉',
        'Tài khoản của bạn đã được tạo thành công.\n\nBạn sẽ được chuyển đến trang đăng nhập.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );

    } catch (error) {
      console.log(
        'REGISTER CATCH ERROR:',
        error
      );

      Alert.alert(
        'Có lỗi xảy ra',
        'Không thể hoàn tất đăng ký. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>

        <Text style={styles.title}>
          Đăng ký tài khoản
        </Text>

        <Text style={styles.subtitle}>
          Tạo tài khoản để sử dụng hệ thống
        </Text>

        {/* HỌ TÊN */}
        <Text style={styles.label}>
          Họ và tên
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên"
          value={hoTen}
          onChangeText={setHoTen}
          editable={!loading}
        />

        {/* SỐ ĐIỆN THOẠI */}
        <Text style={styles.label}>
          Số điện thoại
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          value={soDienThoai}
          onChangeText={setSoDienThoai}
          editable={!loading}
          maxLength={10}
        />

        {/* EMAIL */}
        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {/* MẬT KHẨU */}
        <Text style={styles.label}>
          Mật khẩu
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          secureTextEntry
          value={matKhau}
          onChangeText={setMatKhau}
          editable={!loading}
        />

        {/* XÁC NHẬN MẬT KHẨU */}
        <Text style={styles.label}>
          Xác nhận mật khẩu
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          value={xacNhanMatKhau}
          onChangeText={setXacNhanMatKhau}
          editable={!loading}
        />

        {/* VAI TRÒ */}
        <Text style={styles.label}>
          Vai trò
        </Text>

        <View style={styles.roleContainer}>

          <TouchableOpacity
            style={[
              styles.roleButton,
              vaiTro === 'NguoiThue' &&
                styles.roleButtonActive,
            ]}
            onPress={() =>
              setVaiTro('NguoiThue')
            }
            disabled={loading}
          >
            <Text
              style={[
                styles.roleText,
                vaiTro === 'NguoiThue' &&
                  styles.roleTextActive,
              ]}
            >
              Người thuê
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              vaiTro === 'ChuTro' &&
                styles.roleButtonActive,
            ]}
            onPress={() =>
              setVaiTro('ChuTro')
            }
            disabled={loading}
          >
            <Text
              style={[
                styles.roleText,
                vaiTro === 'ChuTro' &&
                  styles.roleTextActive,
              ]}
            >
              Chủ trọ
            </Text>
          </TouchableOpacity>

        </View>

        {/* NÚT ĐĂNG KÝ */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            loading &&
              styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <Text style={styles.registerText}>
              Đăng ký
            </Text>
          )}
        </TouchableOpacity>

        {/* ĐĂNG NHẬP */}
        <TouchableOpacity
          onPress={() =>
            router.replace('/login')
          }
          disabled={loading}
        >
          <Text style={styles.loginText}>
            Đã có tài khoản? Đăng nhập
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fb',
  },

  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 25,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 12,
    color: '#374151',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    fontSize: 15,
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  roleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  roleTextActive: {
    color: '#ffffff',
  },

  registerButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  registerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  loginText: {
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 20,
  },
});



