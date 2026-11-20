import { IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';
export class AdminCreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['CUSTOMER', 'STAFF', 'BARISTA', 'INVENTORY', 'MANAGER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'LOCKED', 'Hoạt động', 'Đã khóa'])
  status?: string;

  @IsOptional()
  @IsInt()
  loyaltyPoints?: number;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['CUSTOMER', 'STAFF', 'BARISTA', 'INVENTORY', 'MANAGER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'LOCKED', 'Hoạt động', 'Đã khóa'])
  status?: string;

  @IsOptional()
  @IsInt()
  loyaltyPoints?: number;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['ACTIVE', 'LOCKED', 'Hoạt động', 'Đã khóa'])
  status: string;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['CUSTOMER', 'STAFF', 'BARISTA', 'INVENTORY', 'MANAGER', 'ADMIN'])
  role: string;
}

export class CreatePromotionDto {
  @IsString({ message: 'Mã khuyến mãi phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã khuyến mãi không được vượt quá 50 ký tự' })
  code: string;

  @IsOptional()
  @IsString({ message: 'Mô tả khuyến mãi phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Mô tả không được vượt quá 200 ký tự' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Phần trăm khuyến mãi phải là số nguyên' })
  @Min(0, { message: 'Phần trăm khuyến mãi không được nhỏ hơn 0%' })
  @Max(100, { message: 'Phần trăm khuyến mãi không được vượt quá 100%' })
  percentOff?: number;

  @IsOptional()
  @IsInt({ message: 'Số tiền giảm giá cố định phải là số nguyên' })
  @Min(0, { message: 'Số tiền giảm giá cố định không được âm' })
  discountAmount?: number;

  @IsOptional()
  @IsInt({ message: 'Số tiền giảm giá cố định phải là số nguyên' })
  @Min(0, { message: 'Số tiền giảm giá cố định không được âm' })
  fixedAmount?: number;

  @IsOptional()
  @IsString({ message: 'Hạn sử dụng phải là chuỗi ngày tháng hợp lệ' })
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString({ message: 'Mã khuyến mãi phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã khuyến mãi không được vượt quá 50 ký tự' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả khuyến mãi phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Mô tả không được vượt quá 200 ký tự' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Phần trăm khuyến mãi phải là số nguyên' })
  @Min(0, { message: 'Phần trăm khuyến mãi không được nhỏ hơn 0%' })
  @Max(100, { message: 'Phần trăm khuyến mãi không được vượt quá 100%' })
  percentOff?: number;

  @IsOptional()
  @IsInt({ message: 'Số tiền giảm giá cố định phải là số nguyên' })
  @Min(0, { message: 'Số tiền giảm giá cố định không được âm' })
  discountAmount?: number;

  @IsOptional()
  @IsInt({ message: 'Số tiền giảm giá cố định phải là số nguyên' })
  @Min(0, { message: 'Số tiền giảm giá cố định không được âm' })
  fixedAmount?: number;

  @IsOptional()
  @IsString({ message: 'Hạn sử dụng phải là chuỗi ngày tháng hợp lệ' })
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class TogglePromotionDto extends UpdatePromotionDto {}

export class AdminProductDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsString() @MinLength(1) @MaxLength(80) category: string;
  @IsInt() @Min(0) @Max(100000000) price: number;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) imageUrl?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() originalName?: string;
  @IsOptional() @IsArray() toppingIds?: string[];
}

export class AdminUpdateProductDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) category?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000000) price?: number;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(2048) imageUrl?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsArray() toppingIds?: string[];
}

export class UpdateStoreSettingsDto {
  @IsOptional() @IsString() @MaxLength(150) storeName?: string;
  @IsOptional() @IsString() @MaxLength(100) hotline?: string;
  @IsOptional() @IsString() @MaxLength(100) phone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(150) email?: string;
  @IsOptional() @IsString() @MaxLength(150) openHours?: string;
  @IsOptional() @IsString() @MaxLength(300) website?: string;
  @IsOptional() @IsString() @MaxLength(300) facebook?: string;
  @IsOptional() @IsString() @MaxLength(300) instagram?: string;
  @IsOptional() @IsString() @MaxLength(50) pointRate?: string;
  @IsOptional() @IsString() @MaxLength(50) pointRedeem?: string;
  @IsOptional() @IsString() @MaxLength(50) pointToMoneyRate?: string;
  @IsOptional() @IsBoolean() autoPrintBill?: boolean;
  @IsOptional() @IsBoolean() notificationSound?: boolean;
  @IsOptional() @IsBoolean() allowTakeaway?: boolean;
}

export class PublicStoreSettingsDto {
  storeName: string;
  hotline: string;
  phone?: string;
  address: string;
  email: string;
  openHours: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  pointRate?: string;
  pointRedeem?: string;
  pointToMoneyRate?: string;
}

