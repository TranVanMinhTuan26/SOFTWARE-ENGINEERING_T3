import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from './ket-noi-prisma';

async function validateAndAttachUser(jwt: JwtService, req: any, requiredMessage: string) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) throw new UnauthorizedException(requiredMessage);
  let decoded: any;
  try {
    decoded = jwt.verify(token);
  } catch {
    throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
  }

  const userId = decoded.sub || decoded.id;
  let user: any = null;
  const withTimeout = <T>(p: Promise<T>, ms = 60): Promise<T | null> =>
    Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  try {
    if (userId) {
      user = await withTimeout(prisma.user.findUnique({ where: { id: userId } }));
    }
    if (!user && decoded.email) {
      user = await withTimeout(
        prisma.user.findUnique({ where: { email: decoded.email.toLowerCase().trim() } }),
      );
    }
  } catch {
    user = null;
  }

  if (user) {
    if (user.status === 'LOCKED' || user.status === 'Đã khóa') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!');
    }
    req.user = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      fullName: user.fullName,
      phone: user.phone,
      loyaltyPoints: user.loyaltyPoints,
    };
  } else {
    if (decoded.status === 'LOCKED' || decoded.status === 'Đã khóa') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!');
    }
    req.user = decoded;
  }
  return req.user;
}

@Injectable()
export class TokenGuard {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: any) {
    const req = ctx.switchToHttp().getRequest();
    await validateAndAttachUser(this.jwt, req, 'Vui lòng đăng nhập');
    return true;
  }
}

@Injectable()
export class AdminGuard {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: any) {
    const req = ctx.switchToHttp().getRequest();
    const staffKey = req.headers['x-staff-key'];
    const configuredStaffKey = process.env.STAFF_KEY;
    if (configuredStaffKey && configuredStaffKey !== 'local-staff-key-change-me' && staffKey === configuredStaffKey) {
      return true;
    }

    await validateAndAttachUser(this.jwt, req, 'Vui lòng đăng nhập bằng tài khoản nhân viên / quản trị');

    const role = (req.user?.role || '').toUpperCase();
    if (!['ADMIN', 'MANAGER', 'BARISTA', 'STAFF', 'INVENTORY', 'KHO', 'NHANVIEN'].includes(role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập chức năng quản trị');
    }
    return true;
  }
}

@Injectable()
export class SuperAdminGuard {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: any) {
    const req = ctx.switchToHttp().getRequest();
    // SuperAdminGuard strictly rejects STAFF_KEY bypass - only true ADMIN JWT
    await validateAndAttachUser(this.jwt, req, 'Vui lòng đăng nhập bằng tài khoản quản trị');

    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin được phép thực hiện chức năng này');
    }
    return true;
  }
}

async function authenticateRequest(
  jwt: JwtService,
  ctx: any,
  allowedRoles: string[],
  actionName: string
): Promise<boolean> {
  const req = ctx.switchToHttp().getRequest();
  const staffKey = req.headers['x-staff-key'];
  const configuredStaffKey = process.env.STAFF_KEY;
  if (configuredStaffKey && configuredStaffKey !== 'local-staff-key-change-me' && staffKey === configuredStaffKey) {
    return true;
  }

  await validateAndAttachUser(jwt, req, `Vui lòng đăng nhập bằng tài khoản có quyền ${actionName}`);

  const userRole = (req.user?.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  if (!normalizedAllowed.includes(userRole)) {
    throw new ForbiddenException(`Tài khoản vai trò "${userRole}" không có quyền ${actionName}`);
  }

  return true;
}

@Injectable()
export class ProductManagementGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER'], 'quản lý sản phẩm và thực đơn');
  }
}

@Injectable()
export class OrderProcessingGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER', 'BARISTA', 'STAFF', 'NHANVIEN'], 'xử lý và cập nhật đơn hàng');
  }
}

@Injectable()
export class InventoryGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER', 'INVENTORY', 'KHO'], 'quản lý kho và điều chỉnh tồn kho');
  }
}

@Injectable()
export class UserManagementGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER'], 'quản lý người dùng');
  }
}

@Injectable()
export class PromotionGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER'], 'quản lý chương trình khuyến mãi');
  }
}

@Injectable()
export class DashboardGuard {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: any) {
    return authenticateRequest(this.jwt, ctx, ['ADMIN', 'MANAGER'], 'xem báo cáo tổng quan');
  }
}

/**
 * Tương thích chuẩn Passport-JWT / JwtAuthGuard theo tài liệu và đồ án:
 * JwtAuthGuard kế thừa TokenGuard, sử dụng @nestjs/jwt xác thực chữ ký HS256,
 * gắn req.user và bảo vệ toàn bộ route yêu cầu đăng nhập.
 */
@Injectable()
export class JwtAuthGuard extends TokenGuard {}

export const JwtStrategy = {
  name: 'jwt',
  validate: (payload: any) => payload,
};
