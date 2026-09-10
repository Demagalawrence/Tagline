import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { QRCard } from '@/components/QRCard';
import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { ListItem } from '@/components/ListItem';
import { StatusBadge } from '@/components/StatusBadge';
import { useProfileStore } from '@/store/useProfileStore';
import { useQrDesignStore } from '@/store/useQrDesignStore';
import { qrService } from '@/services/qrService';
import { QRType } from '@/types';
import { spacing } from '@/theme';
import { selectionHaptic, successHaptic } from '@/utils/haptics';

const TYPE_OPTIONS: { value: QRType; label: string; subtitle: string }[] = [
  { value: 'profile', label: 'Profile', subtitle: 'Opens your full profile' },
  { value: 'whatsapp', label: 'WhatsApp', subtitle: 'Starts a WhatsApp chat' },
  { value: 'offline', label: 'Offline', subtitle: 'Share over local Wi-Fi' },
];

export default function MyQrScreen() {
  const { colors } = useAppTheme();
  const profile = useProfileStore((s) => s.profile);
  const design = useQrDesignStore((s) => s.design);
  const setDesign = useQrDesignStore((s) => s.setDesign);
  const [type, setType] = useState<QRType>('profile');
  const [customizing, setCustomizing] = useState(false);
  const [payload, setPayload] = useState<string>(() => qrService.generatePayload(profile, type) as string);

  useEffect(() => {
    let active = true;
    const generated = qrService.generatePayload(profile, type);
    if (typeof generated === 'string') {
      setPayload(generated);
    } else {
      void generated.then((value) => {
        if (active) setPayload(value);
      });
    }
    return () => {
      active = false;
    };
  }, [profile, type]);

  const share = async () => {
    void successHaptic();
    try {
      await Share.share({
        message: `${profile.name} — scan this ConnectQR code to connect: ${payload}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text variant="title">My QR</Text>
          <StatusBadge label="Profile" tone="accent" dot />
        </View>
        <Text variant="body" color="secondary">
          Scan to connect
        </Text>
      </View>

      <QRCard
        payload={payload}
        type={type}
        size={210}
        color={design.fg}
        showLogo={design.includeLogo}
        logo={profile.avatar}
        label={profile.name}
      />

      <View style={styles.section}>
        <Text variant="label" color="secondary" style={styles.sectionTitle}>
          QR type
        </Text>
        <Card padded={false}>
          {TYPE_OPTIONS.map((opt, i) => {
            const active = type === opt.value;
            return (
              <ListItem
                key={opt.value}
                title={opt.label}
                subtitle={opt.subtitle}
                valueLabel={active ? 'Selected' : undefined}
                last={i === TYPE_OPTIONS.length - 1}
                onPress={() => {
                  void selectionHaptic();
                  setType(opt.value);
                }}
              />
            );
          })}
        </Card>
      </View>

      <View style={styles.actions}>
        <Button label="Share QR" onPress={share} icon="share-outline" fullWidth />
        <Button label="Customize" onPress={() => setCustomizing(true)} variant="secondary" icon="color-palette-outline" fullWidth />
      </View>

      <BottomSheet visible={customizing} onClose={() => setCustomizing(false)} title="Customize your QR">
        <View style={styles.sheetContent}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {[
              { label: 'Ink', value: '#0F172A' },
              { label: 'Coral', value: '#FF5E36' },
              { label: 'Forest', value: '#14532D' },
              { label: 'Navy', value: '#1E3A8A' },
            ].map((opt) => {
              const active = design.fg === opt.value;
              return (
                <Button
                  key={opt.value}
                  label={opt.label}
                  variant={active ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => {
                    void selectionHaptic();
                    void setDesign({ fg: opt.value });
                  }}
                />
              );
            })}
          </View>

          <ListItem
            title="Include my photo"
            subtitle="Shows your avatar inside the QR code"
            switchValue={design.includeLogo}
            onSwitchChange={(v) => void setDesign({ includeLogo: v })}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['6xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  sheetContent: {
    paddingBottom: spacing.xl,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
