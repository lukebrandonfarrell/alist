import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CollectionItem as CollectionItemType } from '@/types/collection';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CollectionItemRowProps {
  item: CollectionItemType;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CollectionItemRow({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
}: CollectionItemRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isCompleted = item.completedAt !== null;
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Item?',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const handleToggleComplete = () => {
    if (!isCompleted && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        onToggleComplete();
        setIsAnimating(false);
      }, 250);
    } else if (isCompleted) {
      onToggleComplete();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        onPress={e => {
          e.stopPropagation();
          handleToggleComplete();
        }}
        style={styles.checkbox}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol
          name={isCompleted || isAnimating ? 'checkmark.circle.fill' : 'circle'}
          size={24}
          color={isCompleted || isAnimating ? '#34C759' : colors.icon}
        />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            (isCompleted || isAnimating) && styles.completedText,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.description ? (
          <Text
            style={[styles.description, { color: colors.icon }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={e => {
          e.stopPropagation();
          handleDelete();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.deleteButton}
      >
        <IconSymbol name="trash" size={16} color="#e53935" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  checkbox: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  deleteButton: {
    padding: 4,
  },
});
