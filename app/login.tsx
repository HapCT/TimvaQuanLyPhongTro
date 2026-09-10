
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Thông báo', 'Email không hợp lệ.');
      return;
    }

    if (!matKhau) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // =========================
      // ĐĂNG NHẬP SUPABASE AUTH
      // =========================

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: matKhau,
      });

      console.log('=========================');
      console.log('LOGIN ERROR:', authError);
      console.log('AUTH USER:', authData.user);
      console.log('=========================');

      if (authError) {
        Alert.alert(
          'Đăng nhập thất bại',
          'Email hoặc mật khẩu không chính xác.'
        );

        setLoading(false);
        return;
      }

      if (!authData.user) {
        Alert.alert(
          'Lỗi',
          'Không tìm thấy thông tin tài khoản.'
        );

        setLoading(false);
        return;
      }

      // =========================
      // LẤY THÔNG TIN NGƯỜI DÙNG
      // =========================

      const {
        data: nguoiDung,
        error: roleError,
      } = await supabase
        .from('nguoi_dung')
        .select(
          'ma_nguoi_dung, ho_ten, vai_tro'
        )
        .eq(
          'ma_nguoi_dung',
          authData.user.id
        )
        .maybeSingle();

      console.log('=========================');
      console.log(
        'AUTH USER ID:',
        authData.user.id
      );
      console.log(
        'NGUOI DUNG:',
        nguoiDung
      );
      console.log(
        'ROLE ERROR:',
        roleError
      );
      console.log('=========================');

      // =========================
      // KHÔNG TÌM THẤY NGƯỜI DÙNG
      // =========================

      if (roleError || !nguoiDung) {
        console.log(
          'LỖI LẤY NGƯỜI DÙNG:',
          roleError
        );

        await supabase.auth.signOut();

        Alert.alert(
          'Lỗi tài khoản',
          'Không tìm thấy thông tin người dùng trong hệ thống.'
        );

        setLoading(false);
        return;
      }

      // =========================
      // KIỂM TRA VAI TRÒ
      // =========================

      const vaiTro = String(
        nguoiDung.vai_tro || ''
      ).trim();

      console.log('=========================');
      console.log('VAI TRÒ THỰC TẾ:', vaiTro);
      console.log(
        'HO TÊN:',
        nguoiDung.ho_ten
      );
      console.log('=========================');

      if (!vaiTro) {
        await supabase.auth.signOut();

        Alert.alert(
          'Lỗi tài khoản',
          'Tài khoản chưa được thiết lập vai trò.'
        );

        setLoading(false);
        return;
      }

      // =========================
      // ADMIN
      // =========================

      if (vaiTro === 'Admin') {
        console.log(
          '>>> ADMIN LOGIN THÀNH CÔNG'
        );

        console.log(
          '>>> ĐANG ĐIỀU HƯỚNG → /admin'
        );

        setLoading(false);

        router.replace('/admin');

        return;
      }

      // =========================
      // CHỦ TRỌ
      // =========================

      if (vaiTro === 'ChuTro') {
        console.log(
          '>>> CHỦ TRỌ LOGIN THÀNH CÔNG'
        );

        console.log(
          '>>> ĐANG ĐIỀU HƯỚNG → /chu-tro'
        );

        setLoading(false);

        router.replace('/chu-tro');

        return;
      }

      // =========================
      // NGƯỜI THUÊ
      // =========================

      if (vaiTro === 'NguoiThue') {
        console.log(
          '>>> NGƯỜI THUÊ LOGIN THÀNH CÔNG'
        );

        console.log(
          '>>> ĐANG ĐIỀU HƯỚNG → /home'
        );

        setLoading(false);

        router.replace('/home');

        return;
      }

      // =========================
      // VAI TRÒ KHÔNG HỢP LỆ
      // =========================

      console.log(
        '>>> VAI TRÒ KHÔNG HỢP LỆ:',
        vaiTro
      );

      await supabase.auth.signOut();

      Alert.alert(
        'Lỗi tài khoản',
        `Vai trò "${vaiTro}" không hợp lệ.`
      );

      setLoading(false);

    } catch (error) {
      console.log(
        'LOGIN CATCH ERROR:',
        error
      );

      await supabase.auth.signOut();

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.'
      );

      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContainer
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.box}>

          <Text style={styles.title}>
            Đăng nhập
          </Text>

          <Text style={styles.subtitle}>
            Tìm & Quản lý Phòng Trọ
          </Text>

          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* MẬT KHẨU */}

          <Text style={styles.label}>
            Mật khẩu
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#888"
            value={matKhau}
            onChangeText={setMatKhau}
            secureTextEntry
            editable={!loading}
          />

          {/* LOGIN */}

          <TouchableOpacity
            style={[
              styles.button,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  color="#fff"
                />

                <Text
                  style={[
                    styles.buttonText,
                    {
                      marginLeft: 8,
                    },
                  ]}
                >
                  Đang đăng nhập...
                </Text>
              </>
            ) : (
              <Text
                style={styles.buttonText}
              >
                Đăng nhập
              </Text>
            )}
          </TouchableOpacity>

          {/* REGISTER */}

          <TouchableOpacity
            onPress={() =>
              router.push('/register')
            }
            disabled={loading}
          >
            <Text
              style={styles.registerText}
            >
              Chưa có tài khoản? Đăng ký
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  box: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 14,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 3,
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
  },

  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 7,
    color: '#333',
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 18,
    color: '#222',
    backgroundColor: '#FFFFFF',
  },

  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  registerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007AFF',
    fontSize: 15,
  },
});

