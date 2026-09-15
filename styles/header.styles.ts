import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
