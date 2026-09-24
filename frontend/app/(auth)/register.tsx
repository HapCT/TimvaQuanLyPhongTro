
import React, { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/auth/register.styles';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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

    const phoneRegex = /^0[0-9]{9}$/;

    if (!phoneRegex.test(soDienThoai.trim())) {
      Alert.alert(
        'Số điện thoại không hợp lệ',
        'Vui lòng nhập số điện thoại gồm 10 chữ số bắt đầu bằng 0.\n\nVí dụ: 0987654321'
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

      const authData = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), matKhau);
      await backendApi.post('/api/users/sync-profile', {
        ho_ten: hoTen.trim(),
        so_dien_thoai: soDienThoai.trim(),
        email: email.trim(),
        vai_tro: vaiTro,
      });

      // =========================
      // 4. ĐĂNG KÝ THÀNH CÔNG
      // =========================

      console.log(
        'ĐĂNG KÝ THÀNH CÔNG'
      );

      // Đăng xuất tài khoản vừa tạo
      await signOut(firebaseAuth);

      Alert.alert(
        'Đăng ký thành công',
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

      const err = error as any;
      let errorTitle = 'Có lỗi xảy ra';
      let errorMsg = 'Không thể hoàn tất đăng ký. Vui lòng kiểm tra kết nối mạng và thử lại.';

      if (err?.code === 'auth/email-already-in-use') {
        errorTitle = 'Email đã được đăng ký';
        errorMsg = 'Địa chỉ email này đã có tài khoản. Vui lòng dùng email khác hoặc đăng nhập.';
      } else if (err?.code === 'auth/weak-password') {
        errorTitle = 'Mật khẩu quá yếu';
        errorMsg = 'Mật khẩu phải có ít nhất 6 ký tự và không quá đơn giản.';
      } else if (err?.code === 'auth/invalid-email') {
        errorTitle = 'Email không hợp lệ';
        errorMsg = 'Địa chỉ email không đúng định dạng. Ví dụ: example@gmail.com';
      } else if (err?.code === 'auth/network-request-failed') {
        errorTitle = 'Lỗi kết nối mạng';
        errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorTitle = 'Quá nhiều yêu cầu';
        errorMsg = 'Bạn đã thực hiện quá nhiều lần. Vui lòng thử lại sau vài phút.';
      } else if (err?.response?.data?.error) {
        errorTitle = 'Lỗi từ máy chủ';
        errorMsg = err.response.data.error;
      }
      Alert.alert(errorTitle, errorMsg);

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




