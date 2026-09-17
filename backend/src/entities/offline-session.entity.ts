import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { OfflineSession as OfflineSessionDto, NearbyDevice } from '../common/types';

@Entity('offline_sessions')
export class OfflineSession {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  networkName: string;

  @Column()
  sessionToken: string;

  @Column({ type: 'int', default: 900 })
  expiresInSeconds: number;

  @Column({ type: 'boolean', default: true })
  isSharing: boolean;

  @Column({ type: 'text', default: '[]' })
  connectedDevicesJson: string;

  toDto(): OfflineSessionDto {
    let connectedDevices: NearbyDevice[] = [];
    try {
      connectedDevices = JSON.parse(this.connectedDevicesJson) as NearbyDevice[];
    } catch {
      connectedDevices = [];
    }
    return {
      id: this.id,
      networkName: this.networkName,
      sessionToken: this.sessionToken,
      expiresInSeconds: this.expiresInSeconds,
      isSharing: this.isSharing,
      connectedDevices,
    };
  }
}