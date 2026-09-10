import { Redirect, Stack } from 'expo-router';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export default function OnboardingLayout() {
  const isComplete = useOnboardingStore((s) => s.isComplete);

  if (isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
