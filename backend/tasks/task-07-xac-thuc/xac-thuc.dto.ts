import { IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

export class UpdateLoyaltyDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsInt({ message: 'Số điểm phải là số nguyên' })
  points: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Họ tên không được vượt quá 120 ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại không được vượt quá 20 ký tự' })
  phone?: string;
}
