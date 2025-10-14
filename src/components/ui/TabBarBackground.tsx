import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}
