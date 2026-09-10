import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="appearance" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="security" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
