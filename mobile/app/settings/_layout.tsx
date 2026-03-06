import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.linen },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontFamily: 'Fraunces_700Bold' },
        contentStyle: { backgroundColor: colors.linen },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
