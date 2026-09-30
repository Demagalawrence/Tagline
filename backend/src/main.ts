import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })
  const logger = new Logger('Bootstrap')

  // Security headers. The API serves JSON only, so the default CSP is tight
  // already; no exceptions needed.
  app.use(helmet())

  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  const origin = process.env.CORS_ORIGIN || 'http://localhost:8081'
  app.enableCors({
    origin: origin === '*' ? true : origin.split(',').map((o) => o.trim()),
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Reject unknown keys outright rather than dropping them silently, so a
      // typo in a client payload surfaces instead of being ignored.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('ConnectQR API')
    .setDescription('Backend API for ConnectQR — scan, share, connect.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const doc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, doc)

  const port = Number(process.env.PORT || 3000)
  await app.listen(port)

  logger.log(`ConnectQR API listening on http://localhost:${port}`)
  logger.log(`Swagger docs at http://localhost:${port}/docs`)
  logger.log(`Health check at http://localhost:${port}/api/health`)
}

bootstrap().catch((error) => {
  console.error('Failed to start ConnectQR API', error)
  process.exit(1)
})
