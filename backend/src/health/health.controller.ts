import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness and database connectivity' })
  async check() {
    const startedAt = Date.now()
    let database: 'up' | 'down' = 'down'
    try {
      await this.dataSource.query('SELECT 1')
      database = 'up'
    } catch {
      database = 'down'
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      checkedInMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }
  }
}
