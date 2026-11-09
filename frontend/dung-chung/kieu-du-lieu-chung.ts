export type PromotionItem = {
  id: string;
  code: string;
  name: string;
  discount: string;
  percentOff?: number;
  discountAmount?: number;
  expiresAt?: string | null;
  timeRange: string;
  status: 'Đang hoạt động' | 'Chưa bắt đầu' | 'Đã kết thúc';
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  imageUrl: string;
  toppings?: Topping[];
};

export type CartItem = {
  id?: string;
  product: Product;
  size?: 'S' | 'M' | 'L';
  toppings?: string[];
  unitPrice?: number;
  qty: number;
};

export type HistoryOrder = {
  id: string;
  code: string;
  date: string;
  total: number;
  status: string;
  statusText: string;
  badgeClass: 'done' | 'delivering' | 'cancelled' | 'pending';
  paymentMethod: string;
};

export type AccountProfile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  loyaltyPoints: number;
  createdAt: string;
};

export type Topping = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};
