import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Icon } from '@/components/Icon';
import { radius, spacing } from '@/theme';
import type { ScannerStatus } from '@/features/scanner/useScanner';

interface ScannerViewProps {
  status: ScannerStatus;
  torchOn: boolean;
  onToggleTorch: () => void;
  onRequestPermission: () => void;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onMountError: () => void;
}

function ScanLine() {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 190,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translateY]);

  return (
    <View style={styles.lineWrap} pointerEvents="none">
      <Animated.View style={[styles.line, { transform: [{ translateY }] }]} />
    </View>
  );
}

function FrameCorners() {
  const { colors } = useAppTheme();
  const corner = { borderColor: colors.primary } as const;
  return (
    <>
      <View style={[styles.corner, styles.cornerTL, corner]} />
      <View style={[styles.corner, styles.cornerTR, corner]} />
      <View style={[styles.corner, styles.cornerBL, corner]} />
      <View style={[styles.corner, styles.cornerBR, corner]} />
    </>
  );
}

export function ScannerView({ status, torchOn, onToggleTorch, onRequestPermission, onBarcodeScanned, onMountError }: ScannerViewProps) {
  const { colors } = useAppTheme();

  if (status === 'permission' || status === 'loading') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <View style={styles.stateCard}>
          <View style={[styles.stateIcon, { backgroundColor: colors.primaryLight }]}>
            <Icon name="scan" size={30} color={colors.primary} />
          </View>
          <Text variant="subheading" align="center">
            Camera access needed
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.stateMessage}>
            ConnectQR uses your camera to scan QR codes. Your camera feed is never stored.
          </Text>
          <Button label="Grant camera access" onPress={() => void onRequestPermission()} fullWidth style={{ marginTop: spacing.lg }} />
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <View style={styles.stateCard}>
          <View style={[styles.stateIcon, { backgroundColor: colors.statusWarningBg }]}>
            <Icon name="camera-outline" size={30} color={colors.statusWarning} />
          </View>
          <Text variant="subheading" align="center">
            Camera unavailable
          </Text>
          <Text variant="body" color="secondary" align="center" style={styles.stateMessage}>
            We couldn't start your camera. Close the screen and try again.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
        onMountError={onMountError}
        active
      />

      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.28)' }]} pointerEvents="none">
        <View style={styles.instruction}>
          <Text variant="body" color="inverse" align="center" style={{ fontWeight: '600' }}>
            Align the QR code inside the frame
          </Text>
        </View>

        <View style={styles.frame}>
          <FrameCorners />
          <ScanLine />
        </View>

        <View style={styles.flashWrap} pointerEvents="box-none">
          <IconButton
            name={torchOn ? 'flash' : 'flash-outline'}
            onPress={onToggleTorch}
            accessibilityLabel={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            size={54}
            variant={torchOn ? 'solid' : 'soft'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    position: 'absolute',
    top: 64,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  lineWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  line: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 8,
    borderRadius: radius.full,
    shadowColor: '#FF5E36',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radius.lg },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radius.lg },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radius.lg },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radius.lg },
  flashWrap: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
  },
  stateCard: {
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateMessage: {
    maxWidth: 320,
    marginTop: spacing.sm,
  },
});
