import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  scrollContent: {
    paddingTop: 10,
    paddingBottom: 50,
  },

  content: {
    width: '100%',
    alignSelf: 'center',
  },

  greeting: {
    marginTop: 15,
    marginBottom: 20,
  },

  greetingTitle: {
    fontWeight: 'bold',
    color: '#222',
  },

  greetingText: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  // HERO

  hero: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minHeight: 270,
    flexDirection: 'row',
    overflow: 'hidden',
  },

  heroLeft: {
    flex: 1,
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  heroDescription: {
    color: '#EAF3FF',
    marginTop: 12,
    marginBottom: 20,
    maxWidth: 600,
    lineHeight: 21,
  },

  heroRight: {
    width: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },

  house: {
    fontSize: 115,
  },

  // SEARCH

  searchBox: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    height: 52,
    color: '#222',
    fontSize: 14,
    outlineStyle: 'none',
  } as any,

  searchButton: {
    backgroundColor: '#0066D6',
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mobileSearchButton: {
    backgroundColor: '#0066D6',
    minHeight: 48,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // SECTION

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 30,
    marginBottom: 5,
  },

  sectionDescription: {
    fontSize: 13,
    color: '#888',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 5,
    marginBottom: 15,
  },

  seeAll: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // FILTER

  filterRow: {
    flexDirection: 'row',
    gap: 14,
  },

  filterMobile: {
    flexDirection: 'column',
  },

  filterCard: {
    flex: 1,
    minHeight: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterIcon: {
    fontSize: 26,
    marginRight: 12,
  },

  filterInfo: {
    flex: 1,
  },

  filterLabel: {
    color: '#888',
    fontSize: 12,
  },

  filterValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  // ROOM

  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },

  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 5,
  },

  roomImage: {
    width: '100%',
    backgroundColor: '#EEEEEE',
  },

  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#007AFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heartText: {
    fontSize: 25,
    color: '#555',
  },

  roomInfo: {
    padding: 15,
  },

  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    lineHeight: 21,
    minHeight: 42,
  },

  address: {
    color: '#777',
    fontSize: 13,
    marginTop: 8,
  },

  roomBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  price: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  area: {
    color: '#666',
    fontSize: 13,
  },

  // NEW ROOMS

  newRooms: {
    gap: 12,
  },

  newRoom: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  newImage: {
    width: 120,
    height: 95,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
  },

  newInfo: {
    flex: 1,
    marginLeft: 14,
  },

  newName: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
  },

  newAddress: {
    color: '#777',
    fontSize: 12,
    marginTop: 7,
  },

  newBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  newPrice: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  newArea: {
    color: '#666',
    fontSize: 12,
  },

  arrow: {
    fontSize: 22,
    color: '#999',
    paddingHorizontal: 10,
  },

  // FOOTER

  footer: {
    marginTop: 50,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },

  footerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },

  footerText: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },

  copyright: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  },
});
