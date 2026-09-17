import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },

  // =========================
  // HEADER
  // =========================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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

  // =========================
  // SEARCH
  // =========================

  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 15,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,

  clearText: {
    fontSize: 17,
    color: '#999',
    paddingLeft: 10,
  },

  // =========================
  // FILTER
  // =========================

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 5,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  filterButtonActive: {
    backgroundColor: '#EAF3FF',
    borderColor: '#007AFF',
  },

  filterText: {
    fontSize: 13,
    color: '#666',
  },

  filterTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },

  // =========================
  // RESULT
  // =========================

  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 13,
    color: '#777',
  },

  resultNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 7,
    backgroundColor: '#FFF',
  },

  refreshText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // =========================
  // TABLE
  // =========================

  tableScroll: {
    width: '100%',
  },

  tableScrollContent: {
    minWidth: '100%',
    flexGrow: 1,
  },

  table: {
    width: '100%',
    minWidth: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  tableHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },

  tableRow: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
  },

  headerCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    paddingHorizontal: 12,
  },

  cell: {
    paddingHorizontal: 12,
  },

  avatarColumn: {
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nameColumn: {
    flex: 2.5,
    minWidth: 180,
    justifyContent: 'center',
  },

  phoneColumn: {
    flex: 1.8,
    minWidth: 140,
    justifyContent: 'center',
  },

  roleColumn: {
    flex: 1.4,
    minWidth: 120,
    justifyContent: 'center',
  },

  dateColumn: {
    flex: 1.2,
    minWidth: 110,
    justifyContent: 'center',
  },

  actionColumn: {
    flex: 1.2,
    minWidth: 120,
    justifyContent: 'center',
  },



  // =========================
  // AVATAR
  // =========================

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  defaultAvatarText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // =========================
  // TEXT
  // =========================

  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  currentAdminText: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 3,
  },

  phoneText: {
    fontSize: 13,
    color: '#555',
  },

  dateText: {
    fontSize: 13,
    color: '#666',
  },

  // =========================
  // ROLE
  // =========================

  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },

  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  roleAdmin: {
    backgroundColor: '#FDECEC',
  },

  roleChuTro: {
    backgroundColor: '#FFF4E5',
  },

  roleNguoiThue: {
    backgroundColor: '#EAF3FF',
  },

  roleUnknown: {
    backgroundColor: '#F1F1F1',
  },

  // =========================
  // ACTION
  // =========================

  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  changeRoleButton: {
    minWidth: 105,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BBD9FF',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FAFF',
  },

  changeRoleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },

  deleteButton: {
    minWidth: 75,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F5C2C0',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
  },

  deleteText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },

  lockedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },

  lockedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },


  // =========================
  // EMPTY
  // =========================

  emptyContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 42,
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
  // RLS NOTICE BANNER
  // =========================

  rlsNotice: {
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#FFE58F',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },

  rlsNoticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D48806',
    marginBottom: 4,
  },

  rlsNoticeText: {
    fontSize: 12,
    color: '#595959',
    lineHeight: 18,
  },

  rlsCodeBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },

  rlsCodeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#096DD9',
    fontWeight: '600',
  },

  // =========================
  // QUICK STATS ROW
  // =========================

  quickStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  quickStatCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    padding: 12,
  },

  quickStatTitle: {
    fontSize: 12,
    color: '#666',
  },

  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
  },

  // =========================
  // MOBILE CARDS LIST
  // =========================

  mobileCardList: {
    gap: 12,
  },

  mobileUserCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
  },

  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  mobileCardInfo: {
    flex: 1,
    marginLeft: 12,
  },

  mobileCardMeta: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginBottom: 12,
    gap: 4,
  },

  mobileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  mobileMetaLabel: {
    fontSize: 12,
    color: '#888',
  },

  mobileMetaValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },

  mobileCardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },

  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },

  toggleBtnActive: {
    backgroundColor: '#007AFF',
  },

  toggleBtnText: {
    fontSize: 12,
    color: '#4B5563',
  },

  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

