import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fb',
  },

  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 25,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },

  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 12,
    color: '#374151',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    fontSize: 15,
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  roleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  roleTextActive: {
    color: '#ffffff',
  },

  registerButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  registerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  loginText: {
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 20,
  },
});
