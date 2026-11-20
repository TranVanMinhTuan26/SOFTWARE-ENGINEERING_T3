import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { transitionOrderStatus } from '../task-06-don-hang/don-hang.service';
import { buildVnpayUrl, isVnpayConfigured, verifyVnpayCallback, vnpayConfigFromEnv } from './cong-vnpay.service';
import { CreateVnpayUrlDto } from './thanh-toan.dto';
import { processVnpayCallbackTransaction } from './tro-giup-giao-dich-vnpay';
import { settleSuccessfulPaymentAndLoyalty } from './thanh-toan.service';
import { findUserOrderByRef } from '../task-06-don-hang/ma-don-hang';

const POST_PAID_STATUSES = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

@Controller('payments')
export class VnpayController {
  @Post('vnpay/create')
  @UseGuards(TokenGuard)
  async createVnpayUrl(
    @Req() req: any,
    @Body() bodyDto: CreateVnpayUrlDto,
    @Query() queryDto: Record<string, string>
  ) {
    const orderId = bodyDto?.orderId || queryDto?.orderId || req.body?.orderId || req.query?.orderId;
    if (!orderId) throw new BadRequestException('orderId là bắt buộc');
    const currentUserId = req.user.sub || req.user.id;
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) {
      order = await findUserOrderByRef(prisma, currentUserId, orderId, { payment: true });
    }
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const userRole = (req.user.role || '').toUpperCase();
    if (order.userId !== currentUserId && !['ADMIN', 'MANAGER', 'STAFF'].includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }

    if (POST_PAID_STATUSES.includes(order.status)) {
      throw new BadRequestException('Đơn hàng đã được thanh toán');
    }

    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      throw new BadRequestException(`Trạng thái đơn hàng (${order.status}) không cho phép thực hiện thanh toán`);
    }

    if (order.payment && order.payment.method && order.payment.method === 'COD') {
      throw new BadRequestException('Đơn hàng chọn phương thức tiền mặt (COD) không thể thanh toán qua VNPay');
    }

    // Nếu số tiền đơn hàng là 0đ (100% discount / loyalty points): tự động hoàn tất luôn
    if (order.total === 0) {
      await prisma.$transaction(async (tx) => {
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
      return { paymentUrl: '', orderId: order.id, amount: 0, message: 'Đơn hàng 0đ đã được xác nhận thành công' };
    }

    const config = vnpayConfigFromEnv();
    if (!isVnpayConfigured(config)) {
      throw new BadRequestException('VNPay chưa được cấu hình');
    }

    // Gia hạn thời hạn thanh toán thêm 15 phút khi thanh toán lại
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentExpiresAt: newExpiresAt },
    });

    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const paymentUrl = buildVnpayUrl({
      order: { id: order.id, totalAmount: order.total },
      config,
      clientIp,
    });

    if (order.status === 'PAYMENT_FAILED') {
      await transitionOrderStatus(prisma, order.id, 'PENDING');
    }

    return { paymentUrl, orderId: order.id, amount: order.total, paymentExpiresAt: newExpiresAt };
  }

  @Get('vnpay/return')
  async vnpayReturn(@Query() query: Record<string, string>, @Req() req: any, @Res() res: any) {
    const config = vnpayConfigFromEnv();
    const valid = verifyVnpayCallback(query, config.hashSecret);
    const responseCode = query.vnp_ResponseCode;
    const orderId = query.vnp_TxnRef;
    const transactionRef = query.vnp_TransactionNo;
    const amount = Number(query.vnp_Amount) / 100;

    const webOrigin = (process.env.WEB_ORIGIN || 'http://localhost:3000').split(',')[0].trim();

    if (!valid) {
      return res.redirect(`${webOrigin}/orders?vnpay=invalid_signature&orderId=${orderId || ''}`);
    }

    if (responseCode !== '00' || query.vnp_TransactionStatus !== '00') {
      const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
      if (currentOrder && POST_PAID_STATUSES.includes(currentOrder.status)) {
        return res.redirect(`${webOrigin}/orders?vnpay=success&orderId=${orderId}&amount=${currentOrder.total}&code=00`);
      }
      try {
        await transitionOrderStatus(prisma, orderId, 'PAYMENT_FAILED', {
          paymentDetails: { responseCode },
        });
      } catch {}
      return res.redirect(`${webOrigin}/orders?vnpay=failed&orderId=${orderId}&code=${responseCode}`);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) return res.redirect(`${webOrigin}/orders?vnpay=not_found&orderId=${orderId}`);

    if (amount !== order.total) {
      return res.redirect(`${webOrigin}/orders?vnpay=invalid_amount&orderId=${orderId}`);
    }

    if (order.payment && order.payment.method && order.payment.method !== 'VNPay') {
      return res.redirect(`${webOrigin}/orders?vnpay=invalid_method&orderId=${orderId}`);
    }

    let outOfStock = false;
    await prisma.$transaction(async (tx) => {
      const result = await processVnpayCallbackTransaction(tx, {
        orderId,
        responseCode,
        transactionRef,
        reason: `VNPay payment for order ${orderId}`,
      });
      outOfStock = result.outOfStock;
    });

    if (outOfStock) {
      return res.redirect(`${webOrigin}/orders?vnpay=out_of_stock&orderId=${orderId}`);
    }

    return res.redirect(`${webOrigin}/orders?vnpay=success&orderId=${orderId}&amount=${order.total}&txn=${transactionRef || ''}&code=00`);
  }

  @Get('vnpay/ipn')
  @HttpCode(200)
  async vnpayIpn(@Query() query: Record<string, string>) {
    const config = vnpayConfigFromEnv();
    if (!verifyVnpayCallback(query, config.hashSecret)) {
      return { RspCode: '97', Message: 'Checksum failed' };
    }
    const orderId = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;
    const transactionRef = query.vnp_TransactionNo;
    const amount = Number(query.vnp_Amount) / 100;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) return { RspCode: '01', Message: 'Order not found' };
    if (amount !== order.total) return { RspCode: '04', Message: 'Amount invalid' };
    if (POST_PAID_STATUSES.includes(order.status)) return { RspCode: '02', Message: 'Order already confirmed' };
    if (order.payment && order.payment.method && order.payment.method !== 'VNPay') {
      return { RspCode: '03', Message: 'Invalid payment method' };
    }

    if (responseCode === '00' && query.vnp_TransactionStatus === '00') {
      let outOfStock = false;
      await prisma.$transaction(async (tx) => {
        const result = await processVnpayCallbackTransaction(tx, {
          orderId,
          responseCode,
          transactionRef,
          reason: `VNPay IPN for order ${orderId}`,
        });
        outOfStock = result.outOfStock;
      });

      if (outOfStock) {
        return { RspCode: '06', Message: 'Out of stock, order expired/cancelled; refund required' };
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    }

    if (!POST_PAID_STATUSES.includes(order.status)) {
      try {
        await transitionOrderStatus(prisma, orderId, 'PAYMENT_FAILED', {
          paymentDetails: { responseCode },
        });
      } catch {}
    }
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
