import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { OrderProcessingGuard, TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { expireOverdueOrders, processCartCheckout, processOrderCreation, transitionOrderStatus } from './don-hang.service';
import { CheckoutDto, CreateOrderDto, UpdateOrderStatusDto } from './don-hang.dto';
import { processPaymentTransaction, settleSuccessfulPaymentAndLoyalty } from '../task-08-thanh-toan/thanh-toan.service';
import { findUserOrderByRef } from './ma-don-hang';
import { buildVnpayUrl, vnpayConfigFromEnv } from '../task-08-thanh-toan/cong-vnpay.service';
@Controller('orders')
export class OrderController {
  constructor(private jwt:JwtService) {}
  @Post() @UseGuards(TokenGuard) async create(@Req() req:any,@Body() dto:CreateOrderDto) {
    const paymentMethod = dto.paymentMethod || 'VNPay';
    if (paymentMethod === 'COD' && process.env.ENABLE_COD_PAYMENT !== 'true') {
      throw new BadRequestException(
        'Phương thức thanh toán tiền mặt (COD) đã bị tắt. Vui lòng chọn thanh toán không tiền mặt (VNPay, Ví điện tử, Thẻ ngân hàng).',
      );
    }
    const paymentExpiresAt = paymentMethod === 'VNPay' ? new Date(Date.now() + 15 * 60 * 1000) : null;
    return prisma.$transaction(async tx => {
      const order = await processOrderCreation(tx, {
        userId: req.user.sub || req.user.id,
        items: dto.items,
        promotionCode: dto.promotionCode,
        pointsUsed: dto.pointsUsed,
        paymentExpiresAt,
      });

      if (paymentMethod === 'COD') {
        await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey: `cod-${order.id}`,
            amount: order.total,
            method: 'COD',
            status: 'PENDING',
            provider: 'COD',
            responseCode: 'COD_PENDING_COLLECTION',
          },
        });
      }

      return order;
    });
  }

  @Post('expire-overdue')
  @UseGuards(OrderProcessingGuard)
  async expireOverdue() {
    return expireOverdueOrders(prisma);
  }
  @Post('checkout')
  @UseGuards(TokenGuard)
  async checkoutFromCart(@Req() req: any, @Body() body: CheckoutDto) {
    const userId = req.user.sub || req.user.id;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.connection?.remoteAddress || '127.0.0.1';
    return processCartCheckout(prisma, {
      userId,
      paymentMethod: body?.paymentMethod,
      promotionCode: body?.promotionCode,
      pointsUsed: body?.pointsUsed,
      clientIp,
    });
  }
  @Get('me')
  @UseGuards(TokenGuard)
  async mine(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    try {
      await expireOverdueOrders(prisma, { now: new Date() });
    } catch {}

    return prisma.order.findMany({
      where: {
        userId,
        OR: [
          { status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] } },
          {
            status: 'CANCELLED',
            payment: { status: { in: ['SUCCESS', 'REFUNDED', 'REFUND_PENDING'] } },
          },
        ],
      },
      include: { items: { include: { product: true } }, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Get(':id') @UseGuards(TokenGuard) async detail(@Req() req:any,@Param('id') id:string) {
    const order = await findUserOrderByRef(prisma, req.user.sub || req.user.id, id, {
      items: { include: { product: true } },
      payment: true,
    });
    if(!order) throw new NotFoundException('Không tìm thấy đơn hàng'); return order;
  }
  @UseGuards(OrderProcessingGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return transitionOrderStatus(prisma, id, body.status, {
      cancelReason: body?.cancelReason,
    });
  }

  @Post(':id/cancel')
  @UseGuards(TokenGuard)
  async cancelOwnOrder(@Req() req: any, @Param('id') id: string, @Body() body: { reason?: string }) {
    const userId = req.user.sub || req.user.id;
    const order = await findUserOrderByRef(prisma, userId, id);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    return transitionOrderStatus(prisma, order.id, 'CANCELLED', {
      cancelReason: body?.reason,
    });
  }

  @Post(':id/retry-payment')
  @UseGuards(TokenGuard)
  async retryPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body?: { method?: string; simulateFailure?: boolean }
  ) {
    const userId = req.user.sub || req.user.id;
    // 1. Kiểm tra đơn hàng thuộc về người dùng đang đăng nhập (hỗ trợ cả UUID và mã rút gọn #BLxxxxxx)
    let order = await findUserOrderByRef(prisma, userId, id, {
      payment: true,
      items: { include: { product: true } },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng của bạn để thanh toán lại');
    }

    // 2. Trạng thái thanh toán phải là FAILED hoặc PENDING (nếu là PAID hoặc đã hoàn tất thì trả 409)
    const paidStatuses = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
    if (paidStatuses.includes(order.status) || order.payment?.status === 'SUCCESS') {
      throw new ConflictException('Đơn hàng đã được thanh toán trước đó, không thể thanh toán lại');
    }

    // 3. Đơn chưa bị hủy và chưa hết hạn
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Đơn hàng đã bị hủy, không thể thanh toán lại');
    }

    // 4. Kiểm tra phương thức thanh toán trước khi cập nhật trạng thái đơn
    const chosenMethod = body?.method || order.payment?.method || 'VNPay';
    if (chosenMethod.toUpperCase() === 'COD' && process.env.ENABLE_COD_PAYMENT !== 'true') {
      throw new BadRequestException(
        'Phương thức thanh toán tiền mặt (COD) đã bị tắt. Vui lòng chọn thanh toán không tiền mặt (VNPay, Ví điện tử, Thẻ ngân hàng).',
      );
    }
    const isVnpay = chosenMethod.toUpperCase().includes('VNPAY');
    if (!isVnpay && !['Ví điện tử', 'Thẻ ngân hàng', 'COD'].includes(chosenMethod)) {
      throw new BadRequestException(`Phương thức thanh toán "${chosenMethod}" không hợp lệ`);
    }

    // Gia hạn thời hạn thanh toán thêm 15 phút khi thanh toán lại
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentExpiresAt: newExpiresAt,
        status: order.status === 'PAYMENT_FAILED' ? 'PENDING' : order.status,
      },
    });

    if (isVnpay) {
      if (order.total === 0) {
        await prisma.$transaction(async (tx: any) => {
          await settleSuccessfulPaymentAndLoyalty(tx, {
            orderId: order.id,
            method: 'VNPay',
            amount: 0,
            provider: 'VNPAY',
            transactionRef: `ZERO-${Date.now()}`,
            responseCode: '00',
            reason: `Thanh toán đơn hàng 0đ #${order.id}`,
            existingOrder: order,
          });
        });
        const settledOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: { payment: true, items: { include: { product: true } } },
        });
        return {
          success: true,
          paymentUrl: null,
          order: settledOrder,
        };
      }
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.connection?.remoteAddress || '127.0.0.1';
      const paymentUrl = buildVnpayUrl({
        order: { id: order.id, totalAmount: order.total },
        config: vnpayConfigFromEnv(),
        clientIp,
      });
      return {
        success: true,
        paymentUrl,
        order,
      };
    }

    // Thanh toán Ví điện tử / Thẻ ngân hàng / Thẻ ATM
    const idempotencyKey = `retry-${order.id}-${Date.now()}`;
    const payment = await processPaymentTransaction(prisma, {
      userId,
      orderId: order.id,
      method: chosenMethod,
      idempotencyKey,
      simulateFailure: body?.simulateFailure === true,
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { payment: true, items: { include: { product: true } } },
    });

    return {
      success: payment.status === 'SUCCESS',
      payment,
      order: updatedOrder,
    };
  }
}
