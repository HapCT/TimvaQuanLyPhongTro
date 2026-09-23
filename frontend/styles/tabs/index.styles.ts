import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFE', // Soft background
  },

  scrollContent: {
    padding: 20,
    paddingTop: 50, // Account for safe area
    paddingBottom: 90, // Space for tabs
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  smallText: {
    fontSize: 14,
    color: '#8E9AAF',
    marginBottom: 4,
    fontWeight: '500',
  },

  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  titleArea: {
    marginTop: 20,
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  subTitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  searchBox: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  searchIcon: {
    fontSize: 24,
    color: '#94A3B8',
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  filterButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },

  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  banner: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    marginTop: 24,
    padding: 24,
    minHeight: 160,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  bannerContent: {
    flex: 1,
    zIndex: 2,
  },

  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  bannerText: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },

  bannerButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  bannerButtonText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },

  bannerEmoji: {
    fontSize: 80,
    position: 'absolute',
    right: -5,
    bottom: -10,
    opacity: 0.9,
    zIndex: 1,
    transform: [{ rotate: '-10deg' }],
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
    marginTop: 32,
    marginBottom: 16,
  },

  seeAll: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '700',
  },

  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },

  roomImage: {
    width: 120,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  roomInfo: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 4,
    justifyContent: 'space-between',
  },

  roomName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 4,
  },

  roomAddress: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  roomBottom: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roomPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },

  roomArea: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  favorite: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  favoriteText: {
    fontSize: 20,
    color: '#FF4757',
    marginTop: 2,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },

  quickRow: {
    flexDirection: 'row',
    gap: 16,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },

  quickIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  quickText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },

  logoutButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    flexDirection: 'row',
  },

  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
