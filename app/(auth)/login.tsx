
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { styles } from '@/styles/auth/login.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // =========================
  // KIỂM TRA PHIÊN ĐĂNG NHẬP
  // =========================
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: nguoiDung } = await supabase
          .from('nguoi_dung')
          .select('vai_tro')
          .eq('ma_nguoi_dung', user.id)
          .maybeSingle();

        const role = String(nguoiDung?.vai_tro || '').trim();
        if (role === 'Admin' || role === 'QuanTri') {
          router.replace('/admin');
          return;
        } else if (role === 'ChuTro') {
          router.replace('/chu-tro' as any);
          return;
        } else if (role === 'NguoiThue') {
          router.replace('/home');
          return;
        }
      }
    } catch (error) {
      console.log('CHECK SESSION ERROR:', error);
    } finally {
      setCheckingSession(false);
    }
  };

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

      if (vaiTro === 'Admin' || vaiTro === 'QuanTri') {
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

        router.replace('/chu-tro' as any);

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

  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F7FA',
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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


