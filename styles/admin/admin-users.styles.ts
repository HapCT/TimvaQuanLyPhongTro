import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },

  // HEADER

  header: {
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#222',
  },

  headerSubtitle: {
    marginTop: 5,
    color: '#777',
    fontSize: 13,
  },

  backButton: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
  },

  backButtonText: {
    color: '#333',
    fontWeight: '600',
  },

  scrollContent: {
    width: '100%',
    maxWidth: 1300,
    alignSelf: 'center',
    padding: 25,
    paddingBottom: 60,
  },

  // STATS

  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 22,
  },

  statsMobile: {
    flexWrap: 'wrap',
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  statNumber: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#777',
  },

  // SEARCH

  searchContainer: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 15,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,

  clearText: {
    color: '#888',
    fontSize: 18,
    padding: 5,
  },

  // FILTER

  filterScroll: {
    marginBottom: 20,
  },

  filterButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  filterText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  refreshText: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // RESULT

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },

  resultCount: {
    fontSize: 13,
    color: '#777',
  },

  // USER LIST

  userList: {
    gap: 10,
  },

  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90,
  },

  number: {
    width: 28,
    alignItems: 'center',
  },

  numberText: {
    color: '#999',
    fontSize: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },

  avatarText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },

  userPhone: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  userId: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 5,
  },

  // ROLE

  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginHorizontal: 10,
  },

  roleAdmin: {
    backgroundColor: '#FDECEC',
  },

  roleOwner: {
    backgroundColor: '#FFF4DD',
  },

  roleTenant: {
    backgroundColor: '#E8F4EA',
  },

  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#444',
  },

  // ACTION

  actions: {
    flexDirection: 'row',
    gap: 7,
  },

  actionsMobile: {
    flexDirection: 'column',
  },

  roleButton: {
    backgroundColor: '#EAF3FF',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  roleButtonText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  deleteButton: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  deleteButtonText: {
    color: '#D9363E',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // EMPTY

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    color: '#888',
  },
});
