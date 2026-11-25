// Mô tả một dòng hàng đồng bộ sang luồng thanh toán; lineTotal là tổng tiền
// của quantity sản phẩm, còn unitPrice là giá của một sản phẩm.
export interface CartItemSync {
  id?: string;
  name: string;
  category?: string;
  imageUrl?: string;
  size?: string;
  toppings?: string[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

// Cấu trúc đơn hàng mẫu trên frontend, bao gồm các trạng thái thanh toán cơ bản.
export interface DemoOrder {
  id: string;
  code?: string;
  items: CartItemSync[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  voucher?: string;
  status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED';
  createdAt: string;
}

// Bản ghi giao dịch mô phỏng/VNPay dùng khi hiển thị thông tin thanh toán.
export interface DemoPayment {
  id: string;
  orderId: string;
  provider: 'MOCK' | 'VNPAY';
  method: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  transactionRef: string;
  bankCode?: string;
  createdAt: string;
}

// Các trường quan trọng VNPay trả về sau khi khách hoàn tất hoặc hủy giao dịch.
export interface VNPayReturnData {
  isSuccess: boolean;
  orderId: string;
  amount: number;
  transactionNo: string;
  bankCode: string;
  responseCode: string;
  payDate: string;
}

// Nội dung thông báo giao diện cùng loại trạng thái để chọn cách trình bày.
export interface PaymentNotice {
  message: string;
  type: 'neutral' | 'success' | 'error' | 'info';
}

