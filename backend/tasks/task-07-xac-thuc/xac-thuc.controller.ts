import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateLoyaltyDto } from './xac-thuc.dto';
import { AuthService } from './xac-thuc.service';
import { TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 1. Đăng ký tài khoản khách hàng mới
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // 2. Đăng nhập hệ thống (Trả về JWT Token)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // 3. Xem thông tin cá nhân dựa trên Token đang đăng nhập
  @UseGuards(TokenGuard)
  @Get('profile')
  getMyProfile(@Req() req: any) {
    return this.auth.getProfile(req.user.sub || req.user.id);
  }

  @UseGuards(TokenGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.auth.getProfile(req.user.sub || req.user.id);
  }

  // 4. Xem thông tin chi tiết người dùng theo ID - Chỉ chính chủ hoặc quản trị viên
  @UseGuards(TokenGuard)
  @Get('profile/:id')
  getProfileById(@Req() req: any, @Param('id') id: string) {
    const requesterId = req.user.sub || req.user.id;
    const requesterRole = (req.user.role || '').toUpperCase();
    const isStaffOrAdmin = ['ADMIN', 'MANAGER', 'STAFF', 'BARISTA', 'INVENTORY', 'KHO', 'NHANVIEN'].includes(requesterRole);
    if (requesterId !== id && !isStaffOrAdmin) {
      throw new ForbiddenException('Bạn chỉ có quyền xem thông tin hồ sơ của chính mình');
    }
    return this.auth.getProfile(id);
  }

  // 5. Cập nhật/cộng điểm thưởng (Loyalty Points) - Chỉ dành cho quản trị viên, khách hàng không được tự cập nhật
  @UseGuards(TokenGuard)
  @Patch('loyalty-points')
  updatePoints(@Req() req: any, @Body() dto: UpdateLoyaltyDto) {
    const requesterRole = (req.user.role || '').toUpperCase();
    const isStaffOrAdmin = ['ADMIN', 'MANAGER'].includes(requesterRole);
    if (!isStaffOrAdmin) {
      throw new ForbiddenException('Khách hàng không được tự điều chỉnh điểm thưởng. Điểm chỉ được tích lũy tự động từ đơn hàng.');
    }
    const targetUserId = dto.userId || req.user.sub || req.user.id;
    return this.auth.addLoyaltyPoints(targetUserId, Number(dto.points), dto.reason);
  }

  // 6. Đổi mật khẩu tài khoản hiện tại
  @UseGuards(TokenGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub || req.user.id, dto);
  }

  // 7. Yêu cầu khôi phục mật khẩu (Quên mật khẩu)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}
