import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { styles } from '@/styles/header.styles';

export default function Header() {
  const { width } = useWindowDimensions();

  const [hoTen, setHoTen] = useState('');
  const [vaiTro, setVaiTro] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const isMobile = width < 768;

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('ho_ten, vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error) {
        console.log('HEADER USER ERROR:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
        setVaiTro(String(data.vai_tro || '').trim());
      }
    } catch (error) {
      console.log('GET USER ERROR:', error);
    }
  };

  const navigate = (path: any) => {
    setMenuOpen(false);
    router.push(path);
  };

  const logout = async () => {
    setMenuOpen(false);

    await supabase.auth.signOut();

    router.replace('/login');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        {/* LOGO */}
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => navigate('/home')}
        >
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🏠</Text>
          </View>

          <View>
            <Text style={styles.logoText}>Tìm Trọ</Text>

            {!isMobile && (
              <Text style={styles.logoSubText}>
                Tìm nơi ở phù hợp
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* DESKTOP */}
        {!isMobile && (
          <>
            <View style={styles.navigation}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigate('/home')}
              >
                <Text style={styles.activeNavText}>
                  Trang chủ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigate('/search')}
              >
                <Text style={styles.navText}>
                  Tìm phòng
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => navigate('/favorite')}
              >
                <Text style={styles.navText}>
                  ♡ Yêu thích
                </Text>
              </TouchableOpacity>

              {(vaiTro === 'Admin' || vaiTro === 'QuanTri') && (
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigate('/admin')}
                >
                  <Text style={[styles.navText, { color: '#D9363E', fontWeight: 'bold' }]}>
                    🛡️ Quản trị
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rightArea}>
              <TouchableOpacity
                style={styles.userButton}
                onPress={() => navigate('/profile')}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {hoTen
                      ? hoTen.charAt(0).toUpperCase()
                      : 'U'}
                  </Text>
                </View>

                <View>
                  <Text style={styles.hello}>
                    Xin chào
                  </Text>

                  <Text
                    style={styles.userName}
                    numberOfLines={1}
                  >
                    {hoTen || 'Người dùng'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logout}
                onPress={logout}
              >
                <Text style={styles.logoutText}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* MOBILE BUTTON */}
        {isMobile && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(!menuOpen)}
          >
            <Text style={styles.menuIcon}>
              {menuOpen ? '✕' : '☰'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <View style={styles.mobileMenu}>
          <View style={styles.mobileUser}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {hoTen
                  ? hoTen.charAt(0).toUpperCase()
                  : 'U'}
              </Text>
            </View>

            <View>
              <Text style={styles.hello}>
                Xin chào
              </Text>

              <Text style={styles.userName}>
                {hoTen || 'Người dùng'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.mobileItem}
            onPress={() => navigate('/home')}
          >
            <Text style={styles.mobileIcon}>🏠</Text>
            <Text style={styles.mobileText}>
              Trang chủ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mobileItem}
            onPress={() => navigate('/search')}
          >
            <Text style={styles.mobileIcon}>🔍</Text>
            <Text style={styles.mobileText}>
              Tìm phòng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mobileItem}
            onPress={() => navigate('/favorite')}
          >
            <Text style={styles.mobileIcon}>♡</Text>
            <Text style={styles.mobileText}>
              Yêu thích
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mobileItem}
            onPress={() => navigate('/profile')}
          >
            <Text style={styles.mobileIcon}>👤</Text>
            <Text style={styles.mobileText}>
              Cá nhân
            </Text>
          </TouchableOpacity>

          {(vaiTro === 'Admin' || vaiTro === 'QuanTri') && (
            <TouchableOpacity
              style={styles.mobileItem}
              onPress={() => navigate('/admin')}
            >
              <Text style={styles.mobileIcon}>🛡️</Text>
              <Text style={[styles.mobileText, { color: '#D9363E', fontWeight: 'bold' }]}>
                Trang Quản trị
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.mobileLogout}
            onPress={logout}
          >
            <Text style={styles.mobileLogoutText}>
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

