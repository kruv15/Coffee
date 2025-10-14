import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface LoadingSpinnerProps {
  visible: boolean;
  text?: string;
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
}

export function LoadingSpinner({
  visible,
  text = 'Cargando...',
  size = 'large',
  color = Colors.light.primary,
  overlay = true,
}: LoadingSpinnerProps) {
  if (!visible) return null;

  const content = (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={[styles.text, { color }]}>{text}</Text>}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
}

interface InlineSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export function InlineSpinner({
  size = 'small',
  color = Colors.light.primary,
  text,
}: InlineSpinnerProps) {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.inlineText, { color }]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 120,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});
