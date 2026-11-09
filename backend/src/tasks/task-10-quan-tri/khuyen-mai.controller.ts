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
function parsePromotionExpiresAt(raw: string | null | undefined): Date | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const endOfDay = new Date(`${trimmed}T23:59:59.999`);
    if (isNaN(endOfDay.getTime())) {
      throw new BadRequestException('Hạn sử dụng khuyến mãi không hợp lệ');
    }
    return endOfDay;
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new BadRequestException('Hạn sử dụng khuyến mãi không hợp lệ');
  }
  return parsed;
}

@Controller('admin')
export class AdminPromotionsController {
@Get('promotions') @UseGuards(PromotionGuard) promotions() {
    return prisma.promotion.findMany({ orderBy: { code: 'asc' } });
  }

@Post('promotions') @UseGuards(PromotionGuard) async createPromotion(@Body() dto: CreatePromotionDto) {
    const cleanCode = (dto.code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Mã khuyến mãi không được để trống');
    }
    const percent = dto.percentOff !== undefined && dto.percentOff !== null ? Number(dto.percentOff) : 0;
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new BadRequestException('Phần trăm khuyến mãi phải là số nguyên từ 0 đến 100');
    }
    const rawFixed = dto.discountAmount !== undefined ? dto.discountAmount : dto.fixedAmount;
    const discountAmount = rawFixed !== undefined && rawFixed !== null ? Number(rawFixed) : 0;
    if (!Number.isInteger(discountAmount) || discountAmount < 0) {
      throw new BadRequestException('Số tiền giảm giá cố định phải là số nguyên không âm');
    }
    if (percent === 0 && discountAmount === 0) {
      throw new BadRequestException('Khuyến mãi phải có mức giảm phần trăm (> 0%) hoặc giảm tiền cố định (> 0đ)');
    }
    const expiresAt = parsePromotionExpiresAt(dto.expiresAt);

    const existing = await prisma.promotion.findUnique({ where: { code: cleanCode } });
    if (existing) {
      throw new ConflictException(`Mã khuyến mãi "${cleanCode}" đã tồn tại`);
    }
    const defaultDesc =
      discountAmount > 0 && percent > 0
        ? `Giảm ${percent}% + ${discountAmount.toLocaleString('vi-VN')}đ`
        : discountAmount > 0
        ? `Giảm giá ${discountAmount.toLocaleString('vi-VN')}đ`
        : `Giảm giá ${percent}%`;
    return prisma.promotion.create({
      data: {
        code: cleanCode,
        description: (dto.description || '').trim() || defaultDesc,
        percentOff: percent,
        discountAmount,
        expiresAt,
        active: dto.active !== false,
      },
    });
  }

@Patch('promotions/:id') @UseGuards(PromotionGuard) async togglePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Không tìm thấy khuyến mãi');

    const updateData: any = {};
    if (dto.percentOff !== undefined) {
      const percent = Number(dto.percentOff);
      if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
        throw new BadRequestException('Phần trăm khuyến mãi phải là số nguyên từ 0 đến 100');
      }
      updateData.percentOff = percent;
    }
    const rawFixed = dto.discountAmount !== undefined ? dto.discountAmount : dto.fixedAmount;
    if (rawFixed !== undefined) {
      const discountAmount = Number(rawFixed);
      if (!Number.isInteger(discountAmount) || discountAmount < 0) {
        throw new BadRequestException('Số tiền giảm giá cố định phải là số nguyên không âm');
      }
      updateData.discountAmount = discountAmount;
    }
    if (updateData.percentOff !== undefined || updateData.discountAmount !== undefined) {
      const nextPercent = updateData.percentOff !== undefined ? updateData.percentOff : promo.percentOff || 0;
      const nextFixed =
        updateData.discountAmount !== undefined ? updateData.discountAmount : (promo as any).discountAmount || 0;
      if (nextPercent === 0 && nextFixed === 0) {
        throw new BadRequestException('Khuyến mãi phải có mức giảm phần trăm (> 0%) hoặc giảm tiền cố định (> 0đ)');
      }
    }
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = parsePromotionExpiresAt(dto.expiresAt);
    }
    if (dto.code !== undefined) {
      const cleanCode = dto.code.trim().toUpperCase();
      if (!cleanCode) throw new BadRequestException('Mã khuyến mãi không được để trống');
      const duplicate = await prisma.promotion.findFirst({
        where: { code: cleanCode, id: { not: promo.id } },
      });
      if (duplicate) throw new ConflictException(`Mã khuyến mãi "${cleanCode}" đã tồn tại`);
      updateData.code = cleanCode;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }
    if (dto.active !== undefined) {
      updateData.active = !!dto.active;
    }

    return prisma.promotion.update({ where: { id: promo.id }, data: updateData });
  }

@Delete('promotions/:id') @UseGuards(PromotionGuard) async deletePromotion(@Param('id') id: string) {
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Không tìm thấy khuyến mãi');
    return prisma.promotion.delete({ where: { id: promo.id } });
  }
}

@Controller('promotions')
export class PublicPromotionsController {
  @Get()
  async getActivePromotions() {
    const now = new Date();
    return prisma.promotion.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { code: 'asc' },
    });
  }
}
