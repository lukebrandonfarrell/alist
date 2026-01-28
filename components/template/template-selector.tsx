import { EmptyState } from '@/components/todo/empty-state';
import { Colors } from '@/constants/theme';
import { useTemplates } from '@/contexts/templates-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskTemplate } from '@/types/task-template';
import { useActionSheet } from '@expo/react-native-action-sheet';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TemplateSelectorProps {
  onSelect: (template: TaskTemplate) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { templates } = useTemplates();
  const { showActionSheetWithOptions } = useActionSheet();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleShowTemplates = useCallback(() => {
    if (templates.length === 0) {
      return;
    }

    const options = [
      ...templates.map(t => t.name),
      'Cancel',
    ];
    const cancelButtonIndex = templates.length;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: 'Select a Template',
      },
      (selectedIndex?: number) => {
        if (selectedIndex !== undefined && selectedIndex < templates.length) {
          onSelect(templates[selectedIndex]);
        }
      }
    );
  }, [templates, showActionSheetWithOptions, onSelect]);

  if (templates.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No templates yet"
          message="Create a template to quickly add tasks"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.tint }]}
      onPress={handleShowTemplates}
    >
      <Text style={styles.buttonText}>Select Template</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
