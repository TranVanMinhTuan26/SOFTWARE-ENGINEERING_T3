import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { OrderProcessingGuard, TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { expireOverdueOrders, processCartCheckout, processOrderCreation, transitionOrderStatus } from './don-hang.service';
import { CheckoutDto, CreateOrderDto, UpdateOrderStatusDto } from './don-hang.dto';
@Controller('checkout')
export class CheckoutController {
  @Post()
  @UseGuards(TokenGuard)
  async checkout(@Req() req: any, @Body() body: CheckoutDto) {
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
}
