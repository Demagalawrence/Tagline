import { useCallback, useEffect, useRef, useState } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';
import { qrService } from '@/services/qrService';
import { ScanSummary, ScannedQRType, ScannedContact } from '@/types';
import { successHaptic } from '@/utils/haptics';

const SCAN_COOLDOWN_MS = 1800;

export type ScannerStatus = 'loading' | 'permission' | 'ready' | 'error';

export function useScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [scanned, setScanned] = useState<ScanSummary | null>(null);
  const cooldownRef = useRef(false);

  const status: ScannerStatus = !permission ? 'loading' : mountError ? 'error' : permission.granted ? 'ready' : 'permission';

  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    const data = result.data?.trim() ?? '';
    if (!data) return;

    const partial = await qrService.parseScannedPayload(data);
    const type: ScannedQRType = partial.type ?? 'unknown';

    if (type !== 'unknown') {
      void successHaptic();
    }

    const contact: ScannedContact = {
      id: `scanned_${Date.now()}`,
      name: partial.name ?? 'Unknown contact',
      phone: partial.phone ?? '',
      whatsapp: partial.whatsapp ?? '',
      bio: partial.bio,
      avatar: partial.avatar,
      title: partial.title,
      company: partial.company,
      email: partial.email,
      scannedAt: new Date().toISOString(),
      type,
      rawPayload: data,
    };

    setScanned({ type, contact });

    // Re-enable scanning shortly after so the user can scan again if they cancel.
    setTimeout(() => {
      cooldownRef.current = false;
    }, SCAN_COOLDOWN_MS);
  }, []);

  const clearScanned = useCallback(() => {
    cooldownRef.current = false;
    setScanned(null);
  }, []);

  useEffect(() => {
    return () => {
      cooldownRef.current = false;
    };
  }, []);

  return {
    status,
    permission,
    requestPermission,
    torchOn,
    toggleTorch: () => setTorchOn((prev) => !prev),
    scanned,
    clearScanned,
    handleBarcodeScanned,
    setMountError,
  };
}
