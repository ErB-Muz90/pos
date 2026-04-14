import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());
  app.useStaticAssets(join(process.cwd(), '..', 'public'));

  // CORS — support comma-separated list of allowed origins
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3006';
  const allowedOrigins = frontendUrl.split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Banduka POS API')
    .setDescription('Production-ready POS system with eTIMS integration')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('branches', 'Branch management')
    .addTag('users', 'User management')
    .addTag('products', 'Product catalog')
    .addTag('categories', 'Product categories')
    .addTag('inventory', 'Inventory management')
    .addTag('customers', 'Customer management')
    .addTag('sales', 'Sales transactions')
    .addTag('payments', 'Payment processing')
    .addTag('shifts', 'Cashier shifts')
    .addTag('etims', 'eTIMS integration')
    .addTag('reports', 'Reports and analytics')
    .addTag('accounting', 'Accounting module')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for terminal authentication',
      },
      'API-Key',
    )
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://staging-api.banduka.co.ke', 'Staging')
    .addServer('https://api.banduka.co.ke', 'Production')
    .build();

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const enableSwagger =
    !isProduction || configService.get<string>('ENABLE_SWAGGER') === 'true';

  if (enableSwagger) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
    🚀 Banduka POS Backend is running!
    📝 API Documentation: http://localhost:${port}/api/docs
    🔗 API Endpoint: http://localhost:${port}/api/v1
    🌍 Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
