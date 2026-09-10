import { memo } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius } from '@/theme';

interface QrCodeProps {
  value: string;
  size?: number;
  color?: string;
  logo?: string; // image uri or asset
  showLogo?: boolean;
  testID?: string;
}

export const QrCode = memo(function QrCode({ value, size = 220, color = '#0F172A', logo, showLogo = false, testID }: QrCodeProps) {
  const { colors } = useAppTheme();
  const bg = '#FFFFFF';

  if (!value) return null;

  return (
    <QRCode
      value={value}
      size={size}
      color={color}
      backgroundColor={bg}
      ecl="M"
      quietZone={16}
      logo={showLogo && logo ? { uri: logo } : undefined}
      logoSize={Math.round(size * 0.18)}
      logoBackgroundColor={bg}
      logoMargin={2}
      logoBorderRadius={radius.sm}
      testID={testID}
    />
  );
});
