import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="my-qr" />
      <Tabs.Screen name="offline" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
