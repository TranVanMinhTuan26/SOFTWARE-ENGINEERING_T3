import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { AdminGuard, DashboardGuard, OrderProcessingGuard, ProductManagementGuard, PromotionGuard, SuperAdminGuard, UserManagementGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { transitionOrderStatus } from '../task-06-don-hang/don-hang.service';
import { AdminCreateUserDto, AdminProductDto, AdminUpdateUserDto, CreatePromotionDto, TogglePromotionDto, UpdatePromotionDto, UpdateUserRoleDto, UpdateUserStatusDto } from './quan-tri.dto';
import { UpdateLoyaltyDto } from '../task-07-xac-thuc/xac-thuc.dto';
import { UpdateOrderStatusDto } from '../task-06-don-hang/don-hang.dto';
import { IngredientRepository } from '../task-10-ton-kho/kho-luu-tru-nguyen-lieu';
@Controller('admin')
export class DashboardController {
  constructor(private readonly ingredientRepo: IngredientRepository) {}

  @Get('summary') @UseGuards(DashboardGuard) async summary() {
    const [orders, products, users, revenue, lowStockIngredients] = await Promise.all([
      prisma.order.count({
        where: {
          OR: [
            { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
            {
              status: OrderStatus.CANCELLED,
              payment: { status: { in: ['SUCCESS', 'REFUNDED', 'REFUND_PENDING'] } },
            },
          ],
        },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.user.count(),
      prisma.order.aggregate({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
        _sum: { total: true },
      }),
      this.ingredientRepo.findLowStock(),
    ]);
    return {
      orders,
      products,
      users,
      revenue: revenue._sum.total || 0,
      lowStock: lowStockIngredients.length,
    };
  }
}

