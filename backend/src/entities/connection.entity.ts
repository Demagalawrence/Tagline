import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ScannedContact } from '../common/types';

@Entity('connections')
export class Connection {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  whatsapp: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'timestamp' })
  scannedAt: Date;

  @Column({ default: 'unknown' })
  type: string;

  @Column({ default: '' })
  rawPayload: string;

  toContact(): ScannedContact {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      whatsapp: this.whatsapp,
      bio: this.bio,
      avatar: this.avatar,
      title: this.title,
      company: this.company,
      email: this.email,
      scannedAt: this.scannedAt instanceof Date ? this.scannedAt.toISOString() : String(this.scannedAt),
      type: (this.type as ScannedContact['type']) || 'unknown',
      rawPayload: this.rawPayload,
    };
  }
}