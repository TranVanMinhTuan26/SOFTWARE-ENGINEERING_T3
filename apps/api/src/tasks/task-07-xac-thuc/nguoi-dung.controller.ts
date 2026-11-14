import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ChangePasswordDto, UpdateLoyaltyDto, UpdateProfileDto } from './xac-thuc.dto';
import { AuthService } from './xac-thuc.service';
import { TokenGuard, UserManagementGuard } from '../task-01-khoi-tao/bao-ve.guard';

@Controller('users')
export class UsersController {
  constructor(private auth: AuthService) {}

  // 3. Xem thông tin cá nhân dựa trên Token đang đăng nhập
  @UseGuards(TokenGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.auth.getProfile(req.user.sub || req.user.id);
  }

  @UseGuards(TokenGuard)
  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.sub || req.user.id, dto);
  }

  // 4. Xem thông tin chi tiết người dùng theo ID - Chỉ chính chủ hoặc quản trị viên
  @UseGuards(TokenGuard)
  @Get(':id')
  getUserById(@Req() req: any, @Param('id') id: string) {
    const requesterId = req.user.sub || req.user.id;
    const requesterRole = (req.user.role || '').toUpperCase();
    const isStaffOrAdmin = ['ADMIN', 'MANAGER', 'STAFF', 'BARISTA', 'INVENTORY', 'KHO', 'NHANVIEN'].includes(requesterRole);
    if (requesterId !== id && !isStaffOrAdmin) {
      throw new ForbiddenException('Bạn chỉ có quyền xem thông tin của chính mình');
    }
    return this.auth.getProfile(id);
  }

  // 5. Cập nhật/cộng điểm thưởng (Loyalty Points) theo ID - Chỉ quản trị viên
  @UseGuards(UserManagementGuard)
  @Patch(':id/points')
  addPoints(@Param('id') id: string, @Body() dto: UpdateLoyaltyDto) {
    return this.auth.addLoyaltyPoints(id, Number(dto.points), dto.reason);
  }

  // 6. Đổi mật khẩu
  @UseGuards(TokenGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub || req.user.id, dto);
  }
}
