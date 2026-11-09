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

export interface VNPayReturnData {
  isSuccess: boolean;
  orderId: string;
  amount: number;
  transactionNo: string;
  bankCode: string;
  responseCode: string;
  payDate: string;
}

export interface PaymentNotice {
  message: string;
  type: 'neutral' | 'success' | 'error' | 'info';
}

