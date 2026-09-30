import { apiRequest } from './api'
import { STORAGE_KEYS } from '@/constants'
import * as storage from '@/utils/storage'

export interface DeviceKeyDto {
  id: string
  publicKey: string
  label: string
  status: 'active' | 'revoked'
  createdAt: string
}

export interface KeysService {
  register(publicKey: string, label?: string): Promise<DeviceKeyDto>
  list(): Promise<DeviceKeyDto[]>
  get(id: string): Promise<Pick<DeviceKeyDto, 'id' | 'publicKey' | 'status'>>
  revoke(id: string): Promise<DeviceKeyDto>
}

class ApiKeysService implements KeysService {
  register(publicKey: string, label = ''): Promise<DeviceKeyDto> {
    return apiRequest<DeviceKeyDto>('/api/keys', {
      method: 'POST',
      body: { publicKey, label },
      auth: true,
    })
  }

  list(): Promise<DeviceKeyDto[]> {
    return apiRequest<DeviceKeyDto[]>('/api/keys', { auth: true })
  }

  get(id: string): Promise<Pick<DeviceKeyDto, 'id' | 'publicKey' | 'status'>> {
    return apiRequest(`/api/keys/${encodeURIComponent(id)}`)
  }

  revoke(id: string): Promise<DeviceKeyDto> {
    return apiRequest<DeviceKeyDto>(`/api/keys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    })
  }
}

export const keysService: KeysService = new ApiKeysService()

/** Remembers which registered key this device signs with. */
export async function getRegisteredKeyId(): Promise<string | null> {
  return storage.getItem<string>(STORAGE_KEYS.deviceKeyId)
}

export async function setRegisteredKeyId(id: string): Promise<void> {
  await storage.setItem(STORAGE_KEYS.deviceKeyId, id)
}

export async function clearRegisteredKeyId(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.deviceKeyId)
}
