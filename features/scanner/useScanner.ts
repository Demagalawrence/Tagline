import { useCallback, useEffect, useRef, useState } from 'react'
import { useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { qrService } from '@/services/qrService'
import { ParseResult, ScanSummary, ScannedQRType, ScannedContact, TrustLevel } from '@/types'
import { successHaptic, errorHaptic } from '@/utils/haptics'

const SCAN_COOLDOWN_MS = 1800

export type ScannerStatus = 'loading' | 'permission' | 'ready' | 'error'

export interface ScanSummaryWithTrust extends ScanSummary {
  trust: TrustLevel
}

export function useScanner() {
  const [permission, requestPermission] = useCameraPermissions()
  const [torchOn, setTorchOn] = useState(false)
  const [mountError, setMountError] = useState(false)
  const [scanned, setScanned] = useState<ScanSummaryWithTrust | null>(null)
  const cooldownRef = useRef(false)

  const status: ScannerStatus = !permission
    ? 'loading'
    : mountError
      ? 'error'
      : permission.granted
        ? 'ready'
        : 'permission'

  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (cooldownRef.current) return
    cooldownRef.current = true

    const data = result.data?.trim() ?? ''
    if (!data) return

    let parsed: ParseResult
    try {
      parsed = await qrService.parseScannedPayload(data)
    } catch {
      cooldownRef.current = false
      return
    }
    const partial = parsed.contact
    const type: ScannedQRType = partial.type ?? 'unknown'

    // Only claim success for a code we actually understood, and warn loudly on
    // one that failed its integrity check.
    if (parsed.trust === 'verified' || parsed.trust === 'none') {
      if (type !== 'unknown') {
        void successHaptic()
      }
    } else {
      void errorHaptic()
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
    }

    setScanned({ type, contact, trust: parsed.trust })

    // Re-enable scanning shortly after so the user can scan again if they cancel.
    setTimeout(() => {
      cooldownRef.current = false
    }, SCAN_COOLDOWN_MS)
  }, [])

  const clearScanned = useCallback(() => {
    cooldownRef.current = false
    setScanned(null)
  }, [])

  useEffect(() => {
    return () => {
      cooldownRef.current = false
    }
  }, [])

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
  }
}
