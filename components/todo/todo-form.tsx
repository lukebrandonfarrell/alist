import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Modal, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Todo } from '@/types/todo';

interface TodoFormProps {
  visible: boolean;
  todo?: Todo | null;
  onClose: () => void;
  onSubmit: (name: string, notes?: string) => void;
}

export function TodoForm({ visible, todo, onClose, onSubmit }: TodoFormProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(500, { duration: 300 });
    }
  }, [visible]);

  useEffect(() => {
    if (todo) {
      setName(todo.name);
      setNotes(todo.notes || '');
    } else {
      setName('');
      setNotes('');
    }
  }, [todo, visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), notes.trim() || undefined);
      setName('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, overlayAnimatedStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View style={[styles.modal, { backgroundColor: colors.background }, modalAnimatedStyle]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {todo ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Task name"
            placeholderTextColor={colors.icon}
            value={name}
            onChangeText={setName}
            autoFocus
            onSubmitEditing={handleSubmit}
          />

          <TextInput
            style={[styles.input, styles.notesInput, { color: colors.text, borderColor: colors.icon }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.icon}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.tint }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {todo ? 'Save' : 'Add'}
            </Text>
          </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
