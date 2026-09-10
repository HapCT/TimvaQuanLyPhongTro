
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';

export default function Header() {
  const { width } = useWindowDimensions();

  const [hoTen, setHoTen] = useState('');
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
        .select('ho_ten')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error) {
        console.log('HEADER USER ERROR:', error);
        return;
      }

      if (data) {
        setHoTen(data.ho_ten);
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    zIndex: 100,
    elevation: 5,
  },

  header: {
    width: '100%',
    minHeight: 76,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  logoIcon: {
    fontSize: 24,
  },

  logoText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222',
  },

  logoSubText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },

  navigation: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  navText: {
    fontSize: 15,
    color: '#555',
  },

  activeNavText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: 'bold',
  },

  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  hello: {
    color: '#999',
    fontSize: 11,
  },

  userName: {
    color: '#222',
    fontSize: 14,
    fontWeight: 'bold',
    maxWidth: 140,
  },

  logout: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },

  logoutText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '600',
  },

  menuButton: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F3F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIcon: {
    fontSize: 25,
    color: '#222',
  },

  mobileMenu: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  mobileUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 5,
  },

  mobileItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },

  mobileIcon: {
    width: 40,
    fontSize: 20,
  },

  mobileText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },

  mobileLogout: {
    paddingVertical: 12,
  },

  mobileLogoutText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: '600',
  },
});

