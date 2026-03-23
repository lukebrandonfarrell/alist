import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Collection } from '@/types/collection';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CollectionItemProps {
  collection: Collection;
  onPress: () => void;
  onComplete: () => void;
  onRestore: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CollectionItem({
  collection,
  onPress,
  onComplete,
  onRestore,
  onEdit,
  onDelete,
}: CollectionItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isCompleted = collection.completedAt !== null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Collection?',
      `Are you sure you want to delete "${collection.name}"? All items in this collection will be deleted. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            { color: colors.text },
            isCompleted && styles.completedText,
          ]}
          numberOfLines={1}
        >
          {collection.name}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              onEdit();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <IconSymbol name="square.and.pencil" size={16} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              handleDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <IconSymbol name="trash" size={16} color="#e53935" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              isCompleted ? onRestore() : onComplete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <IconSymbol
              name={isCompleted ? 'arrow.uturn.backward' : 'checkmark.circle'}
              size={20}
              color={isCompleted ? colors.icon : '#34C759'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});
