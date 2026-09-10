import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { QrCode } from '@/features/qr/QrCode';
import { radius, spacing } from '@/theme';
import { QRType } from '@/types';

interface QRCardProps {
  payload: string;
  type: QRType;
  size?: number;
  color?: string;
  showLogo?: boolean;
  logo?: string;
  label?: string;
  footerLabel?: string;
}

export function QRCard({ payload, type, size = 220, color = '#0F172A', showLogo = false, logo, label, footerLabel = 'Scan to connect' }: QRCardProps) {
  const { colors } = useAppTheme();

  const typeLabel = useMemo(() => {
    switch (type) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'profile':
        return 'Profile';
      case 'offline':
        return 'Offline';
    }
  }, [type]);

  return (
    <Card style={styles.card} elevated>
      <View style={[styles.qrWrap, { backgroundColor: colors.qrBg, borderRadius: radius.xl }]}>
        <QrCode value={payload} size={size} color={color} showLogo={showLogo} logo={logo} />
      </View>
      {label ? (
        <Text variant="subheading" align="center" style={styles.name}>
          {label}
        </Text>
      ) : null}
      <Text variant="caption" color="muted" align="center">
        {typeLabel} · {footerLabel}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  qrWrap: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.18)',
  },
  name: {
    marginBottom: spacing.sm,
  },
});
