
import React, { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/auth/login.styles';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // =========================
  // KIỂM TRA PHIÊN ĐĂNG NHẬP
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        try {
          const { data: nguoiDung } = await backendApi.get('/api/users/me');
          const role = String(nguoiDung?.vai_tro || '').trim();
          if (role === 'Admin' || role === 'QuanTri') {
            if (Platform.OS !== 'web') {
              await signOut(firebaseAuth);
              Alert.alert('Thông báo', 'Tài khoản Admin chỉ được phép đăng nhập trên máy tính (Web).');
              setCheckingSession(false);
              return;
            }
            router.replace('/admin');
            return;
          } else if (role === 'ChuTro') {
            router.replace('/(landlord)' as any);
            return;
          } else if (role === 'NguoiThue') {
            router.replace('/(tabs)');
            return;
          }
        } catch (error) {
          console.log('CHECK SESSION ERROR:', error);
        }
      }
      setCheckingSession(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Địa chỉ email không đúng định dạng. Ví dụ: user@example.com');
      return;
    }

    if (!matKhau) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), matKhau);
      const { data: nguoiDung } = await backendApi.get('/api/users/me');

      const vaiTro = String(nguoiDung.vai_tro || '').trim();

      if (!vaiTro) {
        await signOut(firebaseAuth);
        setErrorMessage('Tài khoản chưa được thiết lập vai trò.');
        setLoading(false);
        return;
      }

      // THÔNG BÁO CHÀO MỪNG
      const hoTen = nguoiDung.ho_ten || 'bạn';
      let roleLabel = 'Khách thuê';
      if (vaiTro === 'Admin' || vaiTro === 'QuanTri') roleLabel = 'Quản trị viên';
      else if (vaiTro === 'ChuTro') roleLabel = 'Chủ nhà trọ';

      const welcomeMsg = `🎉 Đăng nhập thành công! Chào mừng ${hoTen} (${roleLabel})`;
      setSuccessMessage(welcomeMsg);
      setErrorMessage(null);

      // ĐIỀU HƯỚNG THEO VAI TRÒ
      setTimeout(() => {
        setLoading(false);

        if (vaiTro === 'Admin' || vaiTro === 'QuanTri') {
          if (Platform.OS !== 'web') {
            signOut(firebaseAuth);
            setErrorMessage('Tài khoản Admin chỉ được phép đăng nhập trên máy tính (Web).');
            setSuccessMessage(null);
            return;
          }
          router.replace('/admin');
          return;
        }

        if (vaiTro === 'ChuTro') {
          router.replace('/(landlord)' as any);
          return;
        }

        if (vaiTro === 'NguoiThue') {
          router.replace('/(tabs)');
          return;
        }

        setErrorMessage(`Vai trò "${vaiTro}" không hợp lệ.`);
      }, 750);

    } catch (error: any) {
      console.log('LOGIN CATCH ERROR:', error);
      await signOut(firebaseAuth).catch(() => undefined);
      setErrorMessage(error?.code === 'auth/invalid-credential'
        ? 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!'
        : error?.response?.data?.error || error?.message || 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại.');
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

          {/* THÔNG BÁO LỖI NẾU CÓ */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* THÔNG BÁO CHÀO MỪNG NẾU THÀNH CÔNG */}
          {successMessage && (
            <View style={styles.successBox}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* EMAIL */}
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
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
            onChangeText={(text) => {
              setMatKhau(text);
              if (errorMessage) setErrorMessage(null);
            }}
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


