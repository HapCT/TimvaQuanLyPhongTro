import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // =========================
  // MAIN
  // =========================

  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
  },

  // =========================
  // SIDEBAR
  // =========================

  sidebar: {
    width: 250,
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },

  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },

  logoSub: {
    fontSize: 11,
    color: '#888',
    marginLeft: 10,
    marginTop: 3,
    marginBottom: 30,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },

  menuItemActive: {
    backgroundColor: '#EAF3FF',
  },

  menuIcon: {
    width: 30,
    fontSize: 19,
  },

  menuText: {
    fontSize: 15,
    color: '#444',
  },

  menuTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },

  sidebarBottom: {
    marginTop: 'auto',
    paddingBottom: 20,
  },

  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 15,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  adminInfoText: {
    flex: 1,
    marginLeft: 10,
  },

  adminName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },

  adminRole: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  logoutButton: {
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
  },

  // =========================
  // CONTENT
  // =========================

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 30,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },

  headerSub: {
    fontSize: 15,
    color: '#777',
    marginTop: 5,
  },

  // =========================
  // STAT CARD
  // =========================

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },

  statCard: {
    flex: 1,
    minWidth: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  statIconText: {
    fontSize: 20,
  },

  statTitle: {
    fontSize: 14,
    color: '#666',
  },

  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 5,
  },

  statDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },

  // =========================
  // SECTION
  // =========================

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },

  sectionSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },

  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },

  // =========================
  // LOADING
  // =========================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },

  // =========================
  // BLOCK MOBILE
  // =========================

  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F5F7FA',
  },

  blockedIcon: {
    fontSize: 65,
    marginBottom: 20,
  },

  blockedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },

  blockedText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },

  blockedSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 450,
  },

  blockedButton: {
    marginTop: 25,
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },

  blockedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // =========================
  // MOBILE NAVIGATION
  // =========================

  mobileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  mobileHeaderSubtitle: {
    fontSize: 11,
    color: '#888',
  },

  mobileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  mobileNavScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  mobileNavChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },

  mobileNavChipActive: {
    backgroundColor: '#007AFF',
  },

  mobileNavChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },

  mobileNavChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  mobileContent: {
    flex: 1,
  },

  mobileContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  backHomeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  backHomeButtonText: {
    fontSize: 12,
    color: '#4B5563',
  },
});

