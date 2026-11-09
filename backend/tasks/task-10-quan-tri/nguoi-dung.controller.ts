import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
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
export class AdminUsersController {
@Get('users') @UseGuards(UserManagementGuard) users(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }
    if (role && role.trim() && role !== 'ALL') {
      where.role = role.trim().toUpperCase();
    }
    if (status && status.trim() && status !== 'ALL') {
      const s = status.trim().toUpperCase();
      where.status = s === 'LOCKED' || s === 'ĐÃ KHÓA' ? 'LOCKED' : 'ACTIVE';
    }

    const take = limit ? Math.min(Math.max(1, parseInt(limit, 10) || 50), 500) : 500;
    const skip = page ? (Math.max(1, parseInt(page, 10) || 1) - 1) * take : undefined;

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        createdAt: true,
        orders: { select: { id: true, total: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

@Post('users') @UseGuards(UserManagementGuard) async createUser(@Req() req: any, @Body() dto: AdminCreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const validPhone = dto.phone ? String(dto.phone).replace(/[\s.-]/g, '') : '0901234567';
    if (dto.phone && !/^0\d{9}$/.test(validPhone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ! Vui lòng nhập đủ 10 chữ số và bắt đầu bằng số 0.');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`Email "${email}" đã tồn tại trong hệ thống. Vui lòng sử dụng tính năng cập nhật thay vì tạo mới.`);
    }

    const role = (dto.role || 'CUSTOMER').toUpperCase();
    if (role === 'ADMIN' && (req.user?.role || '').toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin mới được tạo tài khoản Admin');
    }

    let passwordHash: string;
    let activationToken: string | null = null;
    let resetTokenExpiry: Date | null = null;
    let requiresPasswordSetup = false;

    if (dto.password !== undefined) {
      if (dto.password.trim().length < 6) {
        throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
      }
      passwordHash = await bcrypt.hash(dto.password, 10);
    } else {
      // Không dùng mật khẩu mặc định dễ đoán như '123456'.
      // Sinh mật khẩu ngẫu nhiên độ an toàn cao và tạo mã kích hoạt/thiết lập mật khẩu 1 lần.
      const secureRandomPassword = crypto.randomBytes(32).toString('hex');
      passwordHash = await bcrypt.hash(secureRandomPassword, 10);
      activationToken = crypto.randomBytes(24).toString('hex');
      resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Hết hạn sau 24h
      requiresPasswordSetup = true;
    }

    const status = (dto.status || 'ACTIVE').toUpperCase() === 'LOCKED' || dto.status === 'Đã khóa' ? 'LOCKED' : 'ACTIVE';
    const points = Number(dto.loyaltyPoints) || 0;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName || email.split('@')[0],
        phone: validPhone,
        role,
        status,
        loyaltyPoints: points,
        resetToken: activationToken,
        resetTokenExpiry,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    // TUYỆT ĐỐI không trả mật khẩu dạng rõ trong response
    return {
      ...user,
      requiresPasswordSetup,
      ...(activationToken ? { activationToken } : {}),
      message: requiresPasswordSetup
        ? 'Tạo tài khoản thành công! Mã kích hoạt và thiết lập mật khẩu đã được khởi tạo.'
        : 'Tạo tài khoản thành công!',
    };
  }

@Patch('users/:id') @UseGuards(UserManagementGuard) async updateUser(@Req() req: any, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const rawId = id.trim();
    const decodedId = decodeURIComponent(rawId).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: decodedId },
          { email: rawId.toLowerCase() },
          { email: decodedId.toLowerCase() },
        ],
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const requesterRole = (req.user?.role || '').toUpperCase();
    if (requesterRole !== 'ADMIN' && user.role === 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin mới được chỉnh sửa tài khoản Admin');
    }
    if (user.role === 'ADMIN' && dto.role && dto.role.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Không thể hạ quyền tài khoản Admin hiện hữu');
    }
    if (requesterRole !== 'ADMIN' && dto.role?.toUpperCase() === 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin mới được cấp quyền Admin');
    }

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.phone !== undefined) {
      const validPhone = String(dto.phone).replace(/[\s.-]/g, '');
      if (validPhone && !/^0\d{9}$/.test(validPhone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ! Vui lòng nhập đủ 10 chữ số và bắt đầu bằng số 0.');
      }
      updateData.phone = validPhone;
    }
    if (dto.role !== undefined) updateData.role = dto.role.toUpperCase();
    if (dto.status !== undefined) {
      updateData.status = dto.status === 'LOCKED' || dto.status === 'Đã khóa' ? 'LOCKED' : 'ACTIVE';
    }
    if (dto.loyaltyPoints !== undefined) updateData.loyaltyPoints = dto.loyaltyPoints;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });
  }

@Patch('users/:id/status') @UseGuards(UserManagementGuard) async updateUserStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    const rawId = id.trim();
    const decodedId = decodeURIComponent(rawId).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: decodedId },
          { email: rawId.toLowerCase() },
          { email: decodedId.toLowerCase() },
        ],
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if ((req.user?.role || '').toUpperCase() !== 'ADMIN' && user.role === 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin mới được chỉnh sửa tài khoản Admin');
    }
    const statusStr = String(body.status || '').toUpperCase();
    const newStatus = statusStr === 'LOCKED' || body.status === 'Đã khóa' ? 'LOCKED' : 'ACTIVE';
    return prisma.user.update({
      where: { id: user.id },
      data: { status: newStatus },
      select: { id: true, email: true, status: true, role: true },
    });
  }

@Delete('users/:id') @UseGuards(SuperAdminGuard) async deleteUser(@Param('id') id: string) {
    const rawId = id.trim();
    const decodedId = decodeURIComponent(rawId).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: decodedId },
          { email: rawId.toLowerCase() },
          { email: decodedId.toLowerCase() },
        ],
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    
    // Bảo toàn dữ liệu kế toán và doanh thu: nếu người dùng đã có đơn hàng, không xóa cứng làm mất doanh thu
    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    if (orderCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'LOCKED',
          fullName: `${user.fullName} (Đã hủy)`,
        },
      });
      return { message: 'Tài khoản đã có lịch sử đơn hàng, đã được vô hiệu hóa để bảo toàn dữ liệu doanh thu', id: user.id, email: user.email };
    }

    await prisma.loyaltyTransaction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    return { message: 'Đã xóa tài khoản thành công', id: user.id, email: user.email };
  }

@Patch('users/:id/role') @UseGuards(SuperAdminGuard) async setRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw new NotFoundException('Không tìm thấy tài khoản');
    if (existingUser.role === 'ADMIN' && body.role !== 'ADMIN') {
      throw new ForbiddenException('Không thể hạ quyền tài khoản Admin hiện hữu');
    }
    return prisma.user.update({ where: { id }, data: { role: body.role }, select: { id: true, email: true, role: true, loyaltyPoints: true } });
  }
}
