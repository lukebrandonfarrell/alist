import { CollectionsProvider } from '@/contexts/collections-context';
import { HabitsProvider } from '@/contexts/habits-context';
import { TemplatesProvider } from '@/contexts/templates-context';
import { TodosProvider } from '@/contexts/todos-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDatabaseName, initDatabase } from '@/lib/database';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { ReactNativeGrabRoot } from 'react-native-grab';
import 'react-native-reanimated';

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
              <CollectionsProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <ReactNativeGrabRoot>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                </ReactNativeGrabRoot>
                </ThemeProvider>
              </CollectionsProvider>
            </HabitsProvider>
          </TemplatesProvider>
        </TodosProvider>
      </ActionSheetProvider>
    </SQLiteProvider>
  );
}