import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { SuperAdminGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { PublicStoreSettingsDto, UpdateStoreSettingsDto } from './quan-tri.dto';

const DEFAULT_STORE_SETTINGS = {
  id: 'default',
  storeName: 'BrewLite Specialty Coffee & Tea',
  hotline: '1900 6868 - 0988 123 456',
  phone: '1900 6868 - 0988 123 456',
  address: '123 Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  email: 'contact@brewlite.vn',
  openHours: '06:30 - 22:30 hàng ngày',
  website: 'https://brewlite.vn',
  facebook: 'https://facebook.com/brewlite',
  instagram: 'https://instagram.com/brewlite',
  pointRate: '1000',
  pointRedeem: '100',
  pointToMoneyRate: '100',
  autoPrintBill: true,
  notificationSound: true,
  allowTakeaway: true,
};

function formatPublicSettings(record: any): PublicStoreSettingsDto {
  return {
    storeName: record?.storeName || DEFAULT_STORE_SETTINGS.storeName,
    hotline: record?.hotline || record?.phone || DEFAULT_STORE_SETTINGS.hotline,
    phone: record?.phone || record?.hotline || DEFAULT_STORE_SETTINGS.phone,
    address: record?.address || DEFAULT_STORE_SETTINGS.address,
    email: record?.email || DEFAULT_STORE_SETTINGS.email,
    openHours: record?.openHours || DEFAULT_STORE_SETTINGS.openHours,
    website: record?.website || DEFAULT_STORE_SETTINGS.website,
    facebook: record?.facebook || DEFAULT_STORE_SETTINGS.facebook,
    instagram: record?.instagram || DEFAULT_STORE_SETTINGS.instagram,
  };
}

@Controller('admin')
export class AdminSettingsController {
  @Get('settings')
  @UseGuards(SuperAdminGuard)
  async getSettings() {
    let settings = await prisma.storeSettings.findFirst();
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: DEFAULT_STORE_SETTINGS,
      });
    }
    return settings;
  }

  @Get('settings/public')
  async getSettingsPublic(): Promise<PublicStoreSettingsDto> {
    const settings = await prisma.storeSettings.findFirst();
    return formatPublicSettings(settings);
  }

  @Get('settings/loyalty-policy')
  async getAdminLoyaltyPolicy() {
    const settings = await prisma.storeSettings.findFirst();
    return {
      pointRate: settings?.pointRate || DEFAULT_STORE_SETTINGS.pointRate,
      pointRedeem: settings?.pointRedeem || DEFAULT_STORE_SETTINGS.pointRedeem,
      pointToMoneyRate: (settings as any)?.pointToMoneyRate || DEFAULT_STORE_SETTINGS.pointToMoneyRate,
    };
  }

  @Put('settings')
  @UseGuards(SuperAdminGuard)
  async updateSettings(@Body() dto: UpdateStoreSettingsDto) {
    if (dto.pointRate !== undefined && dto.pointRate !== '') {
      const val = Number(dto.pointRate);
      if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
        throw new BadRequestException('Tỷ lệ tích điểm (VNĐ chi tiêu = 1 điểm) phải là số nguyên dương lớn hơn 0.');
      }
    }
    if (dto.pointToMoneyRate !== undefined && dto.pointToMoneyRate !== '') {
      const val = Number(dto.pointToMoneyRate);
      if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
        throw new BadRequestException('Tỷ lệ đổi điểm sang tiền (1 điểm = ? VNĐ) phải là số nguyên dương lớn hơn 0, không được là số âm.');
      }
    }
    if (dto.pointRedeem !== undefined && dto.pointRedeem !== '') {
      const val = Number(dto.pointRedeem);
      if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
        throw new BadRequestException('Mức điểm tối thiểu để đổi giảm giá phải là số nguyên dương lớn hơn 0.');
      }
    }

    const existing = await prisma.storeSettings.findFirst();
    const dataToSave: any = { ...dto };
    if (dto.hotline && !dto.phone) {
      dataToSave.phone = dto.hotline;
    }
    if (dto.phone && !dto.hotline) {
      dataToSave.hotline = dto.phone;
    }

    if (!existing) {
      return prisma.storeSettings.create({
        data: {
          ...DEFAULT_STORE_SETTINGS,
          ...dataToSave,
          id: 'default',
        },
      });
    }

    return prisma.storeSettings.update({
      where: { id: existing.id },
      data: dataToSave,
    });
  }
}

@Controller('settings')
export class PublicSettingsController {
  @Get()
  async getPublicSettings(): Promise<PublicStoreSettingsDto> {
    const settings = await prisma.storeSettings.findFirst();
    return formatPublicSettings(settings);
  }

  @Get('public')
  async getPublicSettingsAlias(): Promise<PublicStoreSettingsDto> {
    const settings = await prisma.storeSettings.findFirst();
    return formatPublicSettings(settings);
  }

  @Get('loyalty-policy')
  async getPublicLoyaltyPolicy() {
    const settings = await prisma.storeSettings.findFirst();
    return {
      pointRate: settings?.pointRate || DEFAULT_STORE_SETTINGS.pointRate,
      pointRedeem: settings?.pointRedeem || DEFAULT_STORE_SETTINGS.pointRedeem,
      pointToMoneyRate: (settings as any)?.pointToMoneyRate || DEFAULT_STORE_SETTINGS.pointToMoneyRate,
    };
  }
}

