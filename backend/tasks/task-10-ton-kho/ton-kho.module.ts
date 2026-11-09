import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { PrismaClient } from '@prisma/client';
import { IngredientStockService } from './ton-kho-nguyen-lieu.service';
import { IngredientRepository } from './kho-luu-tru-nguyen-lieu';
import { setInventoryService } from './khoi-tao-ton-kho';
import { TxClient } from './kieu-ton-kho';
import { OrderUsageRepository } from './kho-luu-tru-su-dung-don';
import { PrismaIngredientRepository } from './prisma-nguyen-lieu.repository';
import { PrismaOrderUsageRepository } from './prisma-su-dung-don.repository';
import { PrismaRecipeRepository } from './prisma-cong-thuc.repository';
import { RecipeCalculator } from './bo-tinh-cong-thuc';
import { RecipeRepository } from './kho-luu-tru-cong-thuc';
import { SizeScalingPolicy } from './quy-tac-he-so-kich-co';
import { IngredientsController } from './nguyen-lieu.controller';
import { RecipesController } from './cong-thuc.controller';
import { InventoryGuard, ProductManagementGuard } from '../task-01-khoi-tao/bao-ve.guard';

/** Token DI cho client Prisma mà module kho dùng. */
export const INVENTORY_DB = Symbol('INVENTORY_DB');

/**
 * Module quản lý kho nguyên liệu: đăng ký các cài đặt cụ thể cho các lớp trừu tượng
 * (IngredientRepository, RecipeRepository, OrderUsageRepository) và export IngredientStockService.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local-development-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [IngredientsController, RecipesController],
  providers: [
    { provide: PrismaClient, useValue: prisma },
    { provide: INVENTORY_DB, useValue: prisma },
    { provide: RecipeCalculator, useFactory: () => new RecipeCalculator(new SizeScalingPolicy()) },
    { provide: IngredientRepository, useFactory: (db: TxClient) => new PrismaIngredientRepository(db), inject: [INVENTORY_DB] },
    { provide: RecipeRepository, useFactory: (db: TxClient) => new PrismaRecipeRepository(db), inject: [INVENTORY_DB] },
    { provide: OrderUsageRepository, useFactory: (db: TxClient) => new PrismaOrderUsageRepository(db), inject: [INVENTORY_DB] },
    IngredientStockService,
    InventoryGuard,
    ProductManagementGuard,
  ],
  exports: [IngredientStockService, IngredientRepository, RecipeRepository],
})
export class InventoryModule {
  constructor(service: IngredientStockService) {
    // Chia sẻ instance do NestJS tạo cho các hàm tự do (xem inventory.container.ts).
    setInventoryService(service);
  }
}

