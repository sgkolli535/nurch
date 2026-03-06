import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function GardenLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.linen },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontFamily: 'Fraunces_700Bold' },
        contentStyle: { backgroundColor: colors.linen },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="create" options={{ title: 'Create Garden' }} />
      <Stack.Screen name="add-plant" options={{ title: 'Add Plant' }} />
      <Stack.Screen name="add-zone" options={{ title: 'Add Zone' }} />
    </Stack>
  );
}
