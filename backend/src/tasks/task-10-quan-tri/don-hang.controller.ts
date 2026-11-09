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
@Controller('admin')
export class AdminOrdersController {
@Get('orders') @UseGuards(OrderProcessingGuard) orders() {
    return prisma.order.findMany({
      where: {
        OR: [
          { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED] } },
          {
            status: OrderStatus.CANCELLED,
            payment: { status: { in: ['SUCCESS', 'REFUNDED', 'REFUND_PENDING'] } },
          },
        ],
      },
      include: {
        user: { select: { email: true, fullName: true, phone: true } },
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

@Patch('orders/:id/status')
  @UseGuards(OrderProcessingGuard)
  async updateOrder(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return transitionOrderStatus(prisma, id, body.status, {
      cancelReason: body?.cancelReason,
    });
  }
}
