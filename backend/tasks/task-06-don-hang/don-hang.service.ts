import { Inject, Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export * from './tao-don-hang.service';
export * from './huy-don-hang.service';
export * from './chuyen-trang-thai-don.service';
export * from './het-han-don-hang.service';

import {
  kiemTraVaChuanBiDongDonHang,
  thucThiTaoDonHangCotLoi,
  xuLyTaoDonHang,
  taoDonHangTuGioHang,
  xuLyThanhToanGioHang,
  validateAndPrepareOrderItems,
  executeOrderCreationCore,
  processOrderCreation,
  createOrderFromCart,
  processCartCheckout,
} from './tao-don-hang.service';
import { huyDonHangVaHoanTien, cancelOrderWithRefund } from './huy-don-hang.service';
import {
  chuyenTrangThaiDonHang,
  thucThiChuyenTrangThaiDonHang,
  transitionOrderStatus,
  executeOrderStatusTransition,
} from './chuyen-trang-thai-don.service';
import { hetHanCacDonQuaHan, expireOverdueOrders } from './het-han-don-hang.service';

@Injectable()
export class OrderService implements OnModuleInit, OnModuleDestroy {
  private expireIntervalTimer?: NodeJS.Timeout;

  constructor(@Optional() @Inject(PrismaClient) private prisma?: PrismaClient) {}

  onModuleInit() {
    if (this.prisma && process.env.NODE_ENV !== 'test') {
      this.expireIntervalTimer = setInterval(async () => {
        try {
          await hetHanCacDonQuaHan(this.prisma);
        } catch {}
      }, 60000);
      if (this.expireIntervalTimer.unref) {
        this.expireIntervalTimer.unref();
      }
    }
  }

  onModuleDestroy() {
    if (this.expireIntervalTimer) {
      clearInterval(this.expireIntervalTimer);
    }
  }

  // Phương thức tiếng Việt
  kiemTraVaChuanBiDongDonHang = kiemTraVaChuanBiDongDonHang;
  thucThiTaoDonHangCotLoi = thucThiTaoDonHangCotLoi;
  xuLyTaoDonHang = xuLyTaoDonHang;
  taoDonHangTuGioHang = taoDonHangTuGioHang;
  xuLyThanhToanGioHang = xuLyThanhToanGioHang;
  huyDonHangVaHoanTien = huyDonHangVaHoanTien;
  chuyenTrangThaiDonHang = chuyenTrangThaiDonHang;
  thucThiChuyenTrangThaiDonHang = thucThiChuyenTrangThaiDonHang;
  hetHanCacDonQuaHan = hetHanCacDonQuaHan;

  // Aliases tương thích ngược
  validateAndPrepareOrderItems = validateAndPrepareOrderItems;
  executeOrderCreationCore = executeOrderCreationCore;
  processOrderCreation = processOrderCreation;
  createOrderFromCart = createOrderFromCart;
  processCartCheckout = processCartCheckout;
  cancelOrderWithRefund = cancelOrderWithRefund;
  transitionOrderStatus = transitionOrderStatus;
  executeOrderStatusTransition = executeOrderStatusTransition;
  expireOverdueOrders = expireOverdueOrders;
}
