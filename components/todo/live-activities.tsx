import { useTodos } from '@/contexts/todos-context';
import { Todo } from '@/types/todo';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Voltra } from 'voltra';
import { useLiveActivity } from 'voltra/client';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function FocusedTaskActivity({ todo }: { todo: Todo }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (!todo.focusedAt || todo.completedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(todo.focusedAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todo.focusedAt, todo.completedAt]);

  const ui = useMemo(
    () => (
      <Voltra.VStack style={{ padding: 16, borderRadius: 14, backgroundColor: '#6E52E2' }}>
        <Voltra.HStack>
          <Voltra.VStack style={{ flex: 1 }}>
            <Voltra.Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {todo.name}
            </Voltra.Text>
            {todo.notes && (
              <Voltra.Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 4 }}>
                {todo.notes}
              </Voltra.Text>
            )}
          </Voltra.VStack>
          <Voltra.Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 12 }}>
            {formatTime(elapsedSeconds)}
          </Voltra.Text>
        </Voltra.HStack>
      </Voltra.VStack>
    ),
    [todo.name, todo.notes, elapsedSeconds]
  );

  const { start, end } = useLiveActivity(
    ui,
    {
      activityName: `focused-task-${todo.id}`,
      autoStart: false,
      deepLinkUrl: `/tasks`,
    }
  );

  useEffect(() => {
    if (todo.focusedAt && !todo.completedAt) {
      start();
    } else {
      end();
    }
  }, [todo.focusedAt, todo.completedAt, start, end]);

  return null;
}

export function LiveActivitiesManager() {
  const { todos } = useTodos();

  // Only render on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const focusedTasks = todos.filter(t => t.focusedAt !== null && t.completedAt === null);

  return (
    <>
      {focusedTasks.map(todo => (
        <FocusedTaskActivity key={todo.id} todo={todo} />
      ))}
    </>
  );
}
