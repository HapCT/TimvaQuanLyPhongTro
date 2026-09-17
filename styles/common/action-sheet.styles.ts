import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },

  message: {
    fontSize: 13,
    color: '#777',
    marginBottom: 14,
  },

  optionList: {
    gap: 8,
    marginBottom: 10,
  },

  optionButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  optionTextDestructive: {
    color: '#E53935',
  },

  cancelButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
});
