import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { prisma } from './ket-noi-prisma';
import { AdminOrdersController } from '../task-10-quan-tri/don-hang.controller';
import { AdminProductsController } from '../task-10-quan-tri/san-pham.controller';
import { AdminPromotionsController, PublicPromotionsController } from '../task-10-quan-tri/khuyen-mai.controller';
import { AdminUsersController } from '../task-10-quan-tri/nguoi-dung.controller';
import { AdminSettingsController, PublicSettingsController } from '../task-10-quan-tri/cai-dat.controller';
import { ToppingsController } from '../task-10-quan-tri/topping.controller';
import { DashboardController } from '../task-10-quan-tri/bang-dieu-khien.controller';
import { CartController } from '../task-05-gio-hang/gio-hang.module';
import { CheckoutController, OrderController } from '../task-06-don-hang/don-hang.module';
import { AuthController, AuthService, UsersController } from '../task-07-xac-thuc/xac-thuc.module';
import { VnpayController } from '../task-08-thanh-toan/thanh-toan.module';
import { ApiController } from '../task-02-san-pham/san-pham.module';
import {
  AdminGuard,
  DashboardGuard,
  InventoryGuard,
  OrderProcessingGuard,
  ProductManagementGuard,
  PromotionGuard,
  SuperAdminGuard,
  TokenGuard,
  UserManagementGuard,
} from './bao-ve.guard';
import { CartService } from '../task-05-gio-hang/gio-hang.service';
import { OrderService } from '../task-06-don-hang/don-hang.service';
import { InventoryModule } from '../task-10-ton-kho/ton-kho.module';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET là bắt buộc và phải được cấu hình an toàn trên môi trường Production');
}

@Module({
  imports: [
    InventoryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local-development-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    ApiController,
    OrderController,
    CartController,
    CheckoutController,
    VnpayController,
    DashboardController,
    AdminProductsController,
    AdminOrdersController,
    AdminUsersController,
    AdminPromotionsController,
    AdminSettingsController,
    PublicSettingsController,
    ToppingsController,
  ],
  providers: [
    { provide: PrismaClient, useValue: prisma },
    AuthService,
    CartService,
    TokenGuard,
    AdminGuard,
    SuperAdminGuard,
    ProductManagementGuard,
    OrderProcessingGuard,
    InventoryGuard,
    UserManagementGuard,
    PromotionGuard,
    DashboardGuard,
    OrderService,
  ],
  exports: [
    AuthService,
    CartService,
    TokenGuard,
    AdminGuard,
    SuperAdminGuard,
    ProductManagementGuard,
    OrderProcessingGuard,
    InventoryGuard,
    UserManagementGuard,
    PromotionGuard,
    DashboardGuard,
    OrderService,
  ],
})
export class AppModule {}

