import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CandleDto, CandlePointer, GetCandlesDto, GetCandlesResultDto, SearchDto, SearchResultDto } from './dto';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('TradingLounge - Data API')
    .setDescription('API for financial data')
    .setVersion('1.0')
    .addTag('TAG')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [SearchDto, SearchResultDto, GetCandlesDto, GetCandlesResultDto, CandlePointer, CandleDto],
  });

  SwaggerModule.setup('api', app, document);

  const configService = new ConfigService();
  await app.listen(configService.get<number>('PORT') || 8080);
}

bootstrap();
