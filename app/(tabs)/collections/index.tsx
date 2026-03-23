import { EmptyState } from '@/components/todo/empty-state';
import { CollectionForm } from '@/components/collection/collection-form';
import { CollectionItem } from '@/components/collection/collection-item';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useCollections } from '@/contexts/collections-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Collection } from '@/types/collection';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactNativeGrabScreen } from 'react-native-grab';

export default function CollectionsScreen() {
  const { collections, loading, createCollection, updateCollection, deleteCollection, completeCollection, restoreCollection } = useCollections();
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const handleCreate = async (name: string) => {
    await createCollection(name);
  };

  const handleEdit = async (name: string) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, { name });
      setEditingCollection(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCollection(id);
  };

  const handlePressCollection = (collection: Collection) => {
    router.push(`/(tabs)/collections/${collection.id}` as Parameters<typeof router.push>[0]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </View>
    );
  }

  return (
    <ReactNativeGrabScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Collections</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            setEditingCollection(null);
            setFormVisible(true);
          }}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          message="Tap the + button to create your first collection"
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {collections.map((collection) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onPress={() => handlePressCollection(collection)}
              onComplete={() => completeCollection(collection.id)}
              onRestore={() => restoreCollection(collection.id)}
              onEdit={() => {
                setEditingCollection(collection);
                setFormVisible(true);
              }}
              onDelete={() => handleDelete(collection.id)}
            />
          ))}
        </ScrollView>
      )}

      <CollectionForm
        visible={formVisible}
        collection={editingCollection}
        onClose={() => {
          setFormVisible(false);
          setEditingCollection(null);
        }}
        onSubmit={editingCollection ? handleEdit : handleCreate}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
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
