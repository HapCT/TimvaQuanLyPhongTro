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
    flexWrap: 'wrap',
    gap: 10,
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

  quickStatCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EAF3FF',
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
    marginBottom: 12,
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
  // TABLE (DESKTOP)
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
    minHeight: 78,
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

  imageColumn: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },

  roomColumn: {
    flex: 2.2,
    minWidth: 170,
    justifyContent: 'center',
  },

  khuTroColumn: {
    flex: 2,
    minWidth: 160,
    justifyContent: 'center',
  },

  priceColumn: {
    flex: 1.4,
    minWidth: 120,
    justifyContent: 'center',
  },

  statusColumn: {
    flex: 1.2,
    minWidth: 120,
    justifyContent: 'center',
  },

  actionColumn: {
    flex: 1.6,
    minWidth: 160,
    justifyContent: 'center',
  },

  // =========================
  // IMAGE / THUMBNAIL
  // =========================

  roomThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },

  roomThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  roomThumbPlaceholderText: {
    fontSize: 18,
  },

  // =========================
  // TEXT
  // =========================

  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  roomSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  khuTroName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },

  khuTroAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  priceSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  // =========================
  // STATUS BADGE
  // =========================

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  statusTrong: {
    backgroundColor: '#E7F8EE',
  },

  statusTrongText: {
    color: '#1D9A5E',
  },

  statusDaThue: {
    backgroundColor: '#EAF3FF',
  },

  statusDaThueText: {
    color: '#007AFF',
  },

  statusBaoTri: {
    backgroundColor: '#FFF4E5',
  },

  statusBaoTriText: {
    color: '#B7791F',
  },

  statusUnknown: {
    backgroundColor: '#F1F1F1',
  },

  statusUnknownText: {
    color: '#555',
  },

  // =========================
  // ACTION
  // =========================

  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  detailButton: {
    minWidth: 80,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  detailButtonText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },

  statusButton: {
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

  statusButtonText: {
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

  // =========================
  // MOBILE CARD LIST
  // =========================

  mobileCardList: {
    gap: 12,
  },

  mobileRoomCard: {
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
    flexShrink: 1,
    textAlign: 'right',
  },

  mobileCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },

  // =========================
  // DETAIL PANEL (EXPANDED)
  // =========================

  detailPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 4,
  },

  detailText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },

  detailImageRow: {
    flexDirection: 'row',
    gap: 8,
  },

  detailImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },

  mainImageDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },

  mainImageDotText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '700',
  },

  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },

  amenityChipText: {
    fontSize: 12,
    color: '#444',
  },

  emptyAmenityText: {
    fontSize: 12,
    color: '#AAA',
    fontStyle: 'italic',
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
});
