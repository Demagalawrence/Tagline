import * as SecureStore from 'expo-secure-store'

import { useQrDesignStore } from '@/store/useQrDesignStore'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => true),
}))

describe('useQrDesignStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useQrDesignStore.setState({
      design: { fg: '#0F172A', includeLogo: true, showLabel: true },
    })
  })

  it('starts with the default design', () => {
    expect(useQrDesignStore.getState().design).toEqual({
      fg: '#0F172A',
      includeLogo: true,
      showLabel: true,
    })
  })

  it('updates and persists the design', async () => {
    await useQrDesignStore.getState().setDesign({ fg: '#FF5E36' })
    expect(useQrDesignStore.getState().design.fg).toBe('#FF5E36')
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1)
  })

  it('hydrates a persisted design', async () => {
    ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ fg: '#1E3A8A', includeLogo: false, showLabel: true }),
    )
    await useQrDesignStore.getState().hydrate()
    expect(useQrDesignStore.getState().design).toEqual({
      fg: '#1E3A8A',
      includeLogo: false,
      showLabel: true,
    })
  })

  it('falls back to defaults when nothing is stored', async () => {
    ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null)
    await useQrDesignStore.getState().hydrate()
    expect(useQrDesignStore.getState().design.fg).toBe('#0F172A')
  })
})
