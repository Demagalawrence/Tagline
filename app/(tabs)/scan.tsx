import { useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useScanner } from '@/features/scanner/useScanner';
import { ScannerView } from '@/features/scanner/ScannerView';
import { useScanHistoryStore } from '@/store/useScanHistoryStore';

export default function ScanScreen() {
  const router = useRouter();
  const {
    status,
    requestPermission,
    torchOn,
    toggleTorch,
    scanned,
    clearScanned,
    handleBarcodeScanned,
    setMountError,
  } = useScanner();

  const handledRef = useRef(false);

  useEffect(() => {
    if (!scanned || handledRef.current) return;
    handledRef.current = true;

    const contact = scanned.contact;
    const payload = encodeURIComponent(contact.rawPayload);
    void useScanHistoryStore.getState().add(contact);

    const timer = setTimeout(() => {
      if (scanned.type === 'unknown') {
        Alert.alert(
          'Code not recognized',
          'This QR code isn\'t a ConnectQR, WhatsApp, or Offline code. We didn\'t open it for your safety.',
          [{ text: 'OK', onPress: clearScanned }],
        );
      } else {
        router.push(`/profile/scanned?payload=${payload}&id=${encodeURIComponent(contact.id ?? 'scanned')}`);
      }
      handledRef.current = false;
    }, 350);

    return () => {
      clearTimeout(timer);
      handledRef.current = false;
    };
  }, [scanned, router, clearScanned]);

  return (
    <View style={styles.fill}>
      <ScannerView
        status={status}
        torchOn={torchOn}
        onToggleTorch={toggleTorch}
        onRequestPermission={requestPermission}
        onBarcodeScanned={handleBarcodeScanned}
        onMountError={() => setMountError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000',
  },
});
