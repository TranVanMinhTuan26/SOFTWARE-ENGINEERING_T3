import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

function tryLoadEnv(): void {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'apps/api/.env'),
    path.join(process.cwd(), '../../.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../../.env'),
    path.join(__dirname, '../../../../../.env'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
          if (m && !m[1].startsWith('#')) {
            const val = m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
            if (!process.env[m[1]] || process.env[m[1]] === '') {
              process.env[m[1]] = val;
            }
          }
        }
      } catch {}
    }
  }
}
tryLoadEnv();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './tasks/task-01-khoi-tao/ung-dung.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  app.enableCors({origin: allowedOrigin.split(',').map(v => v.trim()), credentials: true});
  app.useGlobalPipes(new ValidationPipe({whitelist:true, transform:true}));
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`BrewLite API listening on ${port}`);
}
bootstrap();
