import { EmptyState } from '@/components/todo/empty-state';
import { CollectionItemForm } from '@/components/collection/collection-item-form';
import { CollectionItemRow } from '@/components/collection/collection-item-row';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useCollections } from '@/contexts/collections-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CollectionItem } from '@/types/collection';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactNativeGrabScreen } from 'react-native-grab';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    collections,
    getItemsForCollection,
    loadItemsForCollection,
    createCollectionItem,
    updateCollectionItem,
    deleteCollectionItem,
    completeCollectionItem,
    restoreCollectionItem,
    completeCollection,
    restoreCollection,
  } = useCollections();
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [itemFormVisible, setItemFormVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const collection = id ? collections.find(c => c.id === id) : null;
  const items = id ? getItemsForCollection(id) : [];

  useEffect(() => {
    if (id) {
      loadItemsForCollection(id);
    }
  }, [id, loadItemsForCollection]);

  useEffect(() => {
    if (id && !collection) {
      router.back();
    }
  }, [id, collection, router]);

  const handleAddItem = async (name: string, description?: string) => {
    if (!id) return;
    await createCollectionItem(id, name, description);
  };

  const handleEditItem = async (name: string, description?: string) => {
    if (editingItem) {
      await updateCollectionItem(editingItem.id, { name, description });
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteCollectionItem(itemId);
  };

  if (!id) {
    return null;
  }

  if (!collection) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  const completedCount = items.filter(i => i.completedAt !== null).length;
  const totalCount = items.length;
  const isCollectionComplete = collection.completedAt !== null;

  return (
    <ReactNativeGrabScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {collection.name}
          </Text>
          {totalCount > 0 && (
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {completedCount}/{totalCount} items
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionButton, { backgroundColor: colors.tint }]}
            onPress={() => setItemFormVisible(true)}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.completeCollectionButton,
              { backgroundColor: isCollectionComplete ? colors.icon + '40' : colors.tint + '30' },
            ]}
            onPress={() => (isCollectionComplete ? restoreCollection(id) : completeCollection(id))}
          >
            <IconSymbol
              name={isCollectionComplete ? 'arrow.uturn.backward' : 'checkmark.circle'}
              size={20}
              color={colors.tint}
            />
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          message="Tap the + button to add an item to this collection"
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <CollectionItemRow
              key={item.id}
              item={item}
              onToggleComplete={() =>
                item.completedAt ? restoreCollectionItem(item.id) : completeCollectionItem(item.id)
              }
              onEdit={() => {
                setEditingItem(item);
                setItemFormVisible(true);
              }}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}
        </ScrollView>
      )}

      <CollectionItemForm
        visible={itemFormVisible}
        item={editingItem}
        onClose={() => {
          setItemFormVisible(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
      />
      </View>
    </ReactNativeGrabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeCollectionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
});
