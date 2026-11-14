import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from './xac-thuc.dto';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  // 1. Đăng ký tài khoản khách hàng mới
  async dangKyTaiKhoan(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng!');
    }
    let validPhone = dto.phone ? dto.phone.replace(/[\s.-]/g, '') : null;
    if (validPhone) {
      if (!/^0\d{9}$/.test(validPhone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ! Phải đủ 10 số và bắt đầu bằng số 0.');
      }
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName: dto.fullName || null,
        phone: validPhone,
        role: 'CUSTOMER',
        loyaltyPoints: 0,
      },
    });

    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      message: 'Đăng ký tài khoản thành công!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  async register(dto: RegisterDto) {
    return this.dangKyTaiKhoan(dto);
  }

  // 2. Đăng nhập hệ thống (Trả về JWT Token)
  async dangNhapHeThong(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status === 'LOCKED' || user.status === 'Đã khóa') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!');
    }

    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      message: 'Đăng nhập thành công!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  async login(dto: LoginDto) {
    return this.dangNhapHeThong(dto);
  }

  // 3 & 4. Lấy thông tin người dùng theo Token hoặc theo ID (bỏ qua passwordHash)
  async layThongTinNguoiDung(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      message: 'Lấy thông tin thành công!',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    return this.layThongTinNguoiDung(userId);
  }

  async capNhatThongTinNguoiDung(userId: string, dto: UpdateProfileDto) {
    const data: { fullName?: string | null; phone?: string | null } = {};

    if (dto.fullName !== undefined) {
      const fullName = (dto.fullName ?? '').trim();
      data.fullName = fullName || null;
    }

    if (dto.phone !== undefined) {
      const phone = (dto.phone ?? '').replace(/[\s.-]/g, '');
      if (phone && !/^0\d{9}$/.test(phone)) {
        throw new BadRequestException('Số điện thoại không hợp lệ! Phải đủ 10 số và bắt đầu bằng số 0.');
      }
      data.phone = phone || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Vui lòng nhập ít nhất họ tên hoặc số điện thoại để cập nhật.');
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    return {
      message: 'Cập nhật thông tin tài khoản thành công!',
      user,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.capNhatThongTinNguoiDung(userId, dto);
  }

  // 5. Cập nhật / cộng điểm thưởng (Loyalty Points)
  async dieuChinhDiemThuong(userId: string, points: number, reason?: string) {
    const numericPoints = Number(points);
    if (isNaN(numericPoints) || !Number.isFinite(numericPoints) || !Number.isInteger(numericPoints)) {
      throw new BadRequestException('Số điểm phải là số nguyên hữu hạn');
    }
    if (numericPoints === 0) {
      throw new BadRequestException('Số điểm điều chỉnh phải là số nguyên khác 0');
    }

    const result = await prisma.$transaction(async (tx) => {
      let currentPoints = 0;
      let userFound = false;

      if (typeof tx.$queryRaw === 'function') {
        try {
          const users = await tx.$queryRaw<Array<{ id: string; loyaltyPoints: number }>>`
            SELECT id, "loyaltyPoints" FROM "User" WHERE id = ${userId} FOR UPDATE
          `;
          if (users && users.length > 0) {
            currentPoints = users[0].loyaltyPoints || 0;
            userFound = true;
          }
        } catch {}
      }

      if (!userFound) {
        const u = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, loyaltyPoints: true },
        });
        if (!u) {
          throw new NotFoundException('Không tìm thấy người dùng!');
        }
        currentPoints = u.loyaltyPoints || 0;
      }

      // Xử lý tính số điểm thực tế biến động
      let actualDelta = numericPoints;
      let isPartialDeduct = false;

      if (numericPoints < 0) {
        if (currentPoints <= 0) {
          throw new BadRequestException('Tài khoản hiện có 0 điểm thưởng, không thể khấu trừ');
        }

        const requestedDeduct = Math.abs(numericPoints);
        const actualDeduct = Math.min(currentPoints, requestedDeduct);
        actualDelta = -actualDeduct;

        if (actualDeduct < requestedDeduct) {
          isPartialDeduct = true;
        }
      }

      const newPoints = currentPoints + actualDelta;

      const u = await tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: newPoints },
        select: {
          id: true,
          email: true,
          fullName: true,
          loyaltyPoints: true,
        },
      });

      // Ghi nhận CHÍNH XÁC số điểm thực tế bị trừ vào lịch sử giao dịch
      let defaultReason: string;
      if (actualDelta > 0) {
        defaultReason = `Cộng ${actualDelta} điểm thưởng`;
      } else if (isPartialDeduct) {
        defaultReason = `Khấu trừ ${Math.abs(actualDelta)} điểm thưởng (yêu cầu trừ ${Math.abs(numericPoints)} điểm, số dư chỉ còn ${currentPoints} điểm)`;
      } else {
        defaultReason = `Khấu trừ ${Math.abs(actualDelta)} điểm thưởng`;
      }

      await tx.loyaltyTransaction.create({
        data: {
          userId,
          points: actualDelta,
          reason: reason || defaultReason,
        },
      });

      return {
        user: u,
        actualDelta,
        isPartialDeduct,
      };
    });

    const { user: u, actualDelta, isPartialDeduct } = result;
    let message: string;
    if (numericPoints > 0) {
      message = 'Cộng điểm thành công!';
    } else if (isPartialDeduct) {
      message = `Đã khấu trừ ${Math.abs(actualDelta)} điểm (số dư tối đa hiện có). Số dư không đủ để trừ đủ ${Math.abs(numericPoints)} điểm theo yêu cầu.`;
    } else {
      message = 'Khấu trừ điểm thành công!';
    }

    return {
      message,
      data: u,
      actualPoints: actualDelta,
      requestedPoints: numericPoints,
    };
  }

  async addLoyaltyPoints(userId: string, points: number, reason?: string) {
    return this.dieuChinhDiemThuong(userId, points, reason);
  }

  // 6. Đổi mật khẩu tài khoản hiện tại
  async doiMatKhau(userId: string, dto: ChangePasswordDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.doiMatKhau(userId, dto);
  }

  // 7. Yêu cầu khôi phục mật khẩu (Quên mật khẩu)
  async quenMatKhau(dto: ForgotPasswordDto) {
    this.kiemTraChoPhepResetLocal();

    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return { message: 'Nếu email tồn tại, mã khôi phục đã được tạo cho chế độ demo local.' };
    }

    const resetToken = randomInt(100000, 1000000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: resetToken,
        passwordResetOtpExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return {
      message: 'Mã OTP demo local đã được tạo. Chưa gửi email hoặc SMS.',
      resetToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.quenMatKhau(dto);
  }

  async datLaiMatKhau(dto: ResetPasswordDto) {
    this.kiemTraChoPhepResetLocal();

    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordResetOtp || user.passwordResetOtp !== dto.token.trim()) {
      throw new BadRequestException('Mã khôi phục không hợp lệ');
    }

    const now = new Date();
    if (user.passwordResetOtpExpiry && user.passwordResetOtpExpiry < now) {
      throw new BadRequestException('Mã khôi phục đã hết hạn, vui lòng yêu cầu mã mới');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const result = await prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetOtp: dto.token.trim(),
        passwordResetOtpExpiry: { gte: now },
      },
      data: {
        passwordHash,
        passwordResetOtp: null,
        passwordResetOtpExpiry: null,
      },
    });
    if (result.count !== 1) {
      throw new BadRequestException('Mã khôi phục không hợp lệ hoặc đã được sử dụng');
    }

    return { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.datLaiMatKhau(dto);
  }

  private kiemTraChoPhepResetLocal() {
    if (
      process.env.ALLOW_INSECURE_PASSWORD_RESET !== 'true' ||
      process.env.NODE_ENV === 'production'
    ) {
      throw new ForbiddenException('Luồng OTP demo chỉ được bật trong môi trường kiểm thử local.');
    }
  }

  private assertLocalPasswordResetEnabled() {
    this.kiemTraChoPhepResetLocal();
  }
}
