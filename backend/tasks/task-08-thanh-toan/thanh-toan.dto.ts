import { IsBooleanString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// DTO xác thực orderId nhận từ client trước khi tạo đường dẫn thanh toán VNPay.
export class CreateVnpayUrlDto {
  @IsString()
  orderId: string;
}

// DTO tương thích với payload thanh toán cũ; decorator giới hạn phương thức,
// độ dài khóa idempotency và kiểu chuỗi của cờ mô phỏng nếu client gửi lên.
export class PaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsIn(['Ví điện tử', 'Thẻ ngân hàng'])
  method: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @IsOptional()
  @IsBooleanString()
  simulateFailure?: string;
}
