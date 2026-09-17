import React, { useState, useImperativeHandle, forwardRef, RefObject } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

// Singleton ref để gọi từ bất kỳ đâu trong app (nhất là trong hàm showAlert bên ngoài React tree)
export const customAlertRef: RefObject<any> = React.createRef();

const CustomAlert = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useImperativeHandle(ref, () => ({
    show: (title: string, message?: string, buttons?: AlertButton[]) => {
      setOptions({ title, message, buttons });
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    hide: () => {
      closeAlert();
    }
  }));

  const closeAlert = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setOptions(null);
      if (callback) callback();
    });
  };

  const handleButtonPress = (btn: AlertButton) => {
    closeAlert(() => {
      if (btn.onPress) {
        btn.onPress();
      }
    });
  };

  if (!visible || !options) return null;

  // Nếu không truyền nút nào, mặc định là nút "OK"
  const buttons = options.buttons && options.buttons.length > 0 
    ? options.buttons 
    : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertBox, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{options.title}</Text>
          {!!options.message && <Text style={styles.message}>{options.message}</Text>}

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    buttons.length === 2 && styles.buttonHalf
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      }
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: '#f1f1f1',
  },
  buttonDestructive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: '#333',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default CustomAlert;
