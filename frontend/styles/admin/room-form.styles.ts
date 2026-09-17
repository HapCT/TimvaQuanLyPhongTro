import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  card: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },

  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },

  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeBtnText: {
    fontSize: 15,
    color: '#555',
  },

  body: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  fieldGroup: {
    marginBottom: 16,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },

  fieldHalf: {
    flex: 1,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },

  required: {
    color: '#E53935',
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#222',
  } as any,

  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    textAlignVertical: 'top',
  } as any,

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  chipActive: {
    backgroundColor: '#EAF3FF',
    borderColor: '#007AFF',
  },

  chipText: {
    fontSize: 13,
    color: '#666',
  },

  chipTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },

  emptyHint: {
    fontSize: 12,
    color: '#AAA',
    fontStyle: 'italic',
  },

  imageAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  imageInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#222',
  } as any,

  addImageBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addImageBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  imageList: {
    gap: 8,
  },

  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 8,
  },

  imageThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },

  imageUrlText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },

  mainToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
  },

  mainToggleActive: {
    backgroundColor: '#007AFF',
  },

  mainToggleText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },

  mainToggleTextActive: {
    color: '#FFF',
  },

  removeImageBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeImageBtnText: {
    fontSize: 13,
    color: '#E53935',
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },

  saveBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },

  saveBtnDisabled: {
    backgroundColor: '#9CC3F5',
  },

  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },

  addRoomButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addRoomButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
