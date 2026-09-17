import { ConnectionsService } from './connections.service';
import { Connection } from '../entities/connection.entity';
import { ScannedContact } from '../common/types';

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  const connections: any = {
    find: jest.fn(),
    create: jest.fn((c: any) => c),
    save: jest.fn((c: any) => c),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConnectionsService(connections);
  });

  function entity(overrides: Partial<Connection> = {}): Connection {
    const e = new Connection();
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
    });
    return e;
  }

  describe('save', () => {
    it('persists a scanned contact', async () => {
      connections.save.mockImplementation((c: any) => ({
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
          };
        },
      }));

      const contact: Partial<ScannedContact> = {
        name: 'Alice',
        phone: '+256700111111',
        whatsapp: '+256700111111',
        type: 'whatsapp',
        rawPayload: 'https://wa.me/256700111111',
      };

      const result = await service.save('usr_1', contact as ScannedContact);

      expect(connections.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'usr_1', name: 'Alice', type: 'whatsapp' }),
      );
      expect(result.id).toMatch(/^conn_/);
      expect(result.name).toBe('Alice');
    });
  });

  describe('getRecent', () => {
    it('maps entities to contact DTOs ordered by scan time', async () => {
      connections.find.mockResolvedValue([entity()]);
      const result = await service.getRecent('usr_1');

      expect(connections.find).toHaveBeenCalledWith({
        where: { userId: 'usr_1' },
        order: { scannedAt: 'DESC' },
      });
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'conn_1', name: 'Alice', scannedAt: '2026-01-01T00:00:00.000Z' }),
      );
    });
  });

  describe('delete', () => {
    it('returns false when nothing was deleted', async () => {
      connections.delete.mockResolvedValue({ affected: 0 });
      await expect(service.delete('usr_1', 'conn_1')).resolves.toBe(false);
    });

    it('returns true when a row was deleted', async () => {
      connections.delete.mockResolvedValue({ affected: 1 });
      await expect(service.delete('usr_1', 'conn_1')).resolves.toBe(true);
    });
  });

  describe('getNearbyDevices', () => {
    it('only returns offline-type connections as peers', async () => {
      const rows = [entity({ type: 'offline', name: 'Peer One', id: 'abc' }), entity({ type: 'whatsapp', name: 'Not A Peer' })];
      connections.find.mockImplementation((opts: any) =>
        Promise.resolve(rows.filter((r) => r.type === opts.where.type)),
      );

      const result = await service.getNearbyDevices('usr_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'peer_abc', name: 'Peer One', status: 'waiting' }),
      );
    });
  });
});