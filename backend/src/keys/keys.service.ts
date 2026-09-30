import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DeviceKey } from '../entities/device-key.entity'

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(DeviceKey) private keys: Repository<DeviceKey>,
  ) {}

  async register(userId: string, publicKey: string, label = ''): Promise<DeviceKey> {
    // A public key is unique per device; re-registering the same key is a no-op
    // so a reinstall that regenerates an identical key does not orphan history.
    const existing = await this.keys.findOne({ where: { userId, publicKey } })
    if (existing) return existing

    const key = await this.keys.save(DeviceKey.create(userId, publicKey, label))
    return key
  }

  async findById(id: string): Promise<DeviceKey> {
    const key = await this.keys.findOneBy({ id })
    if (!key) throw new NotFoundException('Device key not found')
    return key
  }

  async listForUser(userId: string): Promise<DeviceKey[]> {
    return this.keys.find({ where: { userId }, order: { createdAt: 'ASC' } })
  }

  async revoke(userId: string, id: string): Promise<DeviceKey> {
    const key = await this.findById(id)
    if (key.userId !== userId) throw new NotFoundException('Device key not found')
    key.status = 'revoked'
    return this.keys.save(key)
  }
}
