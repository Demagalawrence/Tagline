import { ConnectionsService } from './connections.service'
import { Connection } from '../entities/connection.entity'
import { User } from '../entities/user.entity'
import { ScannedContact } from '../common/types'
import { Repository } from 'typeorm'

describe('ConnectionsService', () => {
  let service: ConnectionsService
  const users = { findOneBy: jest.fn() }
  const connections = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((c: Partial<Connection>) => c),
    save: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ConnectionsService(
      connections as unknown as Repository<Connection>,
      users as unknown as Repository<User>,
    )
  })

  function entity(overrides: Partial<Connection> = {}): Connection {
    const e = new Connection()
    Object.assign(e, {
      id: 'conn_1',
      userId: 'usr_1',
      name: 'Alice',
      phone: '+256700111111',
      whatsapp: '+256700111111',
      scannedAt: new Date('2026-01-01T00:00:00Z'),
      type: 'whatsapp',
      rawPayload: 'https://wa.me/256700111111',
      ...overrides,
    })
    return e
  }

  describe('save', () => {
    it('persists a scanned contact', async () => {
      connections.save.mockImplementation((c: Connection) => ({
        ...c,
        id: c.id,
        scannedAt: c.scannedAt,
        toContact() {
          return {
            id: this.id,
            name: this.name,
            phone: this.phone,
            whatsapp: this.whatsapp,
            scannedAt: this.scannedAt.toISOString(),
            type: this.type,
            rawPayload: this.rawPayload,
          }
        },
      }))

      const contact: Partial<ScannedContact> = {
        name: 'Alice',
        phone: '+256700111111',
        whatsapp: '+256700111111',
        type: 'whatsapp',
        rawPayload: 'https://wa.me/256700111111',
      }

      const result = await service.save('usr_1', contact as ScannedContact)

      expect(connections.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'usr_1', name: 'Alice', type: 'whatsapp' }),
      )
      expect(result.id).toMatch(/^conn_/)
      expect(result.name).toBe('Alice')
    })
  })

  describe('getRecent', () => {
    it('maps entities to contact DTOs ordered by scan time', async () => {
      connections.find.mockResolvedValue([entity()])
      const result = await service.getRecent('usr_1')

      expect(connections.find).toHaveBeenCalledWith({
        where: { userId: 'usr_1' },
        order: { scannedAt: 'DESC' },
      })
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'conn_1',
          name: 'Alice',
          scannedAt: '2026-01-01T00:00:00.000Z',
        }),
      )
    })
  })

  describe('delete', () => {
    it('returns false when nothing was deleted', async () => {
      connections.delete.mockResolvedValue({ affected: 0 })
      await expect(service.delete('usr_1', 'conn_1')).resolves.toBe(false)
    })

    it('returns true when a row was deleted', async () => {
      connections.delete.mockResolvedValue({ affected: 1 })
      await expect(service.delete('usr_1', 'conn_1')).resolves.toBe(true)
    })
  })

  describe('setTags', () => {
    it('trims, drops blanks and removes duplicates', async () => {
    const saved = await service.setTags('usr_1', 'con_1', [
      '  Work ',
      'work',
      '   ',
      'Vip',
    ])
    expect(saved?.tags).toEqual(['Work', 'Vip'])
  })

  it('caps the number of tags even when the client sends more', async () => {
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`)
    const saved = await service.setTags('usr_1', 'con_1', many)
    expect(saved?.tags).toHaveLength(12)
  })      const row = entity({ tags: ['whatsapp'] })
      row.toContact = () => ({ ...row, tags: row.tags }) as never
      connections.findOneBy.mockResolvedValue(row)
      connections.save.mockImplementation((c: Connection) => c)

      await service.setTags('usr_1', 'conn_1', ['  client ', 'client', '  ', 'follow-up'])

      expect(connections.save).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['client', 'follow-up'] }),
      )
    })

    it('keeps an explicitly empty tag list', async () => {
      const row = entity({ tags: ['whatsapp'] })
      connections.findOneBy.mockResolvedValue(row)
      connections.save.mockImplementation((c: Connection) => c)

      await service.setTags('usr_1', 'conn_1', [])

      expect(connections.save).toHaveBeenCalledWith(expect.objectContaining({ tags: [] }))
    })

    it('only touches connections owned by the caller', async () => {
      connections.findOneBy.mockResolvedValue(null)

      await expect(service.setTags('usr_1', 'conn_other', ['x'])).resolves.toBeNull()
      expect(connections.findOneBy).toHaveBeenCalledWith({ userId: 'usr_1', id: 'conn_other' })
      expect(connections.save).not.toHaveBeenCalled()
    })
  })

  describe('getTagSummary', () => {
    it('counts tags across connections, most used first', async () => {
      connections.find.mockResolvedValue([
        entity({ id: 'c1', tags: ['client', 'vip'] }),
        entity({ id: 'c2', tags: ['client'] }),
      ])

      const result = await service.getTagSummary('usr_1')

      expect(result).toEqual([
        { tag: 'client', count: 2 },
        { tag: 'vip', count: 1 },
      ])
    })
  })

  describe('getNearbyDevices', () => {
    it('only returns offline-type connections as peers', async () => {
      const rows = [
        entity({ type: 'offline', name: 'Peer One', id: 'abc' }),
        entity({ type: 'whatsapp', name: 'Not A Peer' }),
      ]
      connections.find.mockImplementation((opts: { where: { type: string } }) =>
        Promise.resolve(rows.filter((r) => r.type === opts.where.type)),
      )

      const result = await service.getNearbyDevices('usr_1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'peer_abc', name: 'Peer One', status: 'waiting' }),
      )
    })
  })
})
