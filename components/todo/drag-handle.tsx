import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export function DragHandle() {
  return (
    <View style={styles.container}>
      <IconSymbol name="line.3.horizontal" size={24} color="#999" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
