import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function AgentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.linen },
        headerTintColor: colors.forest,
        headerTitleStyle: { fontFamily: 'Fraunces_700Bold' },
        contentStyle: { backgroundColor: colors.linen },
      }}
    >
      <Stack.Screen name="chat" options={{ title: 'Ask Nurch' }} />
    </Stack>
  );
}
