import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { AnalyticsEvent } from '../entities/analytics-event.entity'

export interface TrackInput {
  name: string
  userId?: string
  properties?: Record<string, unknown>
  platform?: string
  appVersion?: string
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private events: Repository<AnalyticsEvent>,
  ) {}

  async track(input: TrackInput): Promise<AnalyticsEvent> {
    return this.events.save(AnalyticsEvent.create(input))
  }

  /** Rollup used by the internal dashboard: event name -> total. */
  async summary(sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
    const events = await this.events.find({
      where: { createdAt: MoreThan(since) },
      select: ['name'],
    })

    const totals = new Map<string, number>()
    for (const e of events) {
      totals.set(e.name, (totals.get(e.name) ?? 0) + 1)
    }

    return {
      sinceDays,
      total: events.length,
      byName: [...totals.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }
  }
}
