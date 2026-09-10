import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { useProfileStore } from '@/store/useProfileStore';
import { spacing } from '@/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const privacy = useProfileStore((s) => s.privacy);
  const updatePrivacy = useProfileStore((s) => s.updatePrivacy);

  const items = [
    { key: 'showPhone' as const, title: 'Show phone number', subtitle: 'Visible to people who scan your QR' },
    { key: 'showWhatsapp' as const, title: 'Show WhatsApp', subtitle: 'Let others open a chat with you' },
    { key: 'showPhoto' as const, title: 'Show profile photo', subtitle: 'Your avatar appears in your profile' },
    { key: 'allowDiscovery' as const, title: 'Allow nearby discovery', subtitle: 'Findable by nearby users offline' },
    { key: 'allowOfflineSharing' as const, title: 'Allow offline sharing', subtitle: 'Share over local Wi-Fi without data' },
  ];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ScreenHeader title="Privacy" subtitle="Control what others see" onBack={() => router.back()} />
      <View style={styles.content}>
        <Card padded={false}>
          {items.map((item, i) => (
            <ListItem
              key={item.key}
              title={item.title}
              subtitle={item.subtitle}
              switchValue={privacy[item.key]}
              onSwitchChange={(v) => void updatePrivacy({ [item.key]: v })}
              last={i === items.length - 1}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
});
