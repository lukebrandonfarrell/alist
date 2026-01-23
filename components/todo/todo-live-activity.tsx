import { Todo } from '@/types/todo';
import { Voltra } from 'voltra';

interface TodoLiveActivityProps {
  todo: Todo;
  startAtMs: number;
  onComplete?: () => void;
}

/**
 * Creates a unique button identifier for a todo's done button
 */
export function getDoneButtonId(todoId: string): string {
  return `done-button-${todoId}`;
}

/**
 * Factory function that creates Live Activity UI JSX.
 * This is NOT a React component - it's a function that returns JSX.
 * This avoids React rendering issues when used with Voltra's Live Activities.
 * 
 * @param props - Props for the live activity
 * @returns JSX element tree (not rendered, just data structure)
 */
export function createTodoLiveActivityUI({ todo, startAtMs, onComplete }: TodoLiveActivityProps) {
  return (
    <Voltra.VStack spacing={12} alignment="leading" style={{ padding: 16, borderRadius: 14, backgroundColor: '#6E52E2' }}>
      {/* Middle: Task title and description aligned left */}
      <Voltra.VStack alignment="leading" spacing={4}>
        <Voltra.HStack alignment="top">
          <Voltra.VStack alignment="leading">
          <Voltra.Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {todo.name}
          </Voltra.Text>
          </Voltra.VStack>

          <Voltra.Spacer />

          <Voltra.VStack alignment="leading">
          <Voltra.Timer 
            durationMs={Number.MAX_SAFE_INTEGER}
            direction="up"
            textStyle="timer"
          />
          </Voltra.VStack>
        </Voltra.HStack>
        {todo.notes && (
          <Voltra.Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
            {todo.notes}
          </Voltra.Text>
        )}
      </Voltra.VStack>

      {/* Bottom: Done button aligned right */}
      <Voltra.HStack alignment="bottom">
        <Voltra.Spacer />
        {onComplete && (
          <Voltra.Button 
            id={getDoneButtonId(todo.id)}
            buttonStyle='plain'
            style={{ padding: 8, backgroundColor: 'white', borderRadius: 8 }}
          >
            <Voltra.Text style={{ color: '#6E52E2', fontSize: 14, fontWeight: '600' }}>
              Done
            </Voltra.Text>
          </Voltra.Button>
        )}
      </Voltra.HStack>
    </Voltra.VStack>
  );
}
