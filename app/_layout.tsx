import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { HabitsProvider } from '@/contexts/habits-context';
import { TemplatesProvider } from '@/contexts/templates-context';
import { TodosProvider } from '@/contexts/todos-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SQLiteProvider } from 'expo-sqlite';
import { getDatabaseName, initDatabase } from '@/lib/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider
      databaseName={getDatabaseName()}
      onInit={initDatabase}
    >
      <ActionSheetProvider>
        <TodosProvider>
          <TemplatesProvider>
            <HabitsProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </HabitsProvider>
          </TemplatesProvider>
        </TodosProvider>
      </ActionSheetProvider>
    </SQLiteProvider>
  );
}
