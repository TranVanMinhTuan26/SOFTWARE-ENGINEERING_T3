export type AdminRole = 'Admin' | 'Manager' | 'Nhân viên' | 'Kho' | 'Pha chế';
export type ManagedUserRole = AdminRole | 'Khách hàng';
export type CreatableUserRole = Exclude<AdminRole, 'Admin'> | 'Khách hàng';

export type CustomerItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'Kim cương' | 'Vàng' | 'Bạc' | 'Đồng' | 'Mới';
  totalSpend: number;
  orderCount: number;
  points: number;
  status: 'Hoạt động' | 'Đã khóa';
  lastOrder: string;
};

export type ProductItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl: string;
  active?: boolean;
  available?: boolean;
  hasRecipe?: boolean;
  stockStatus?: 'Còn hàng' | 'Hết hàng' | 'Chưa có công thức';
  status: 'Còn hàng' | 'Hết hàng' | 'Chưa có công thức';
};

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

export type UserAccount = {
  id: string;
  index: number;
  username: string;
  email: string;
  role: string;
  status: 'Đang hoạt động' | 'Đã khóa';
};

export type OrderItem = {
  id: string;
  code: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  payment?: any;
  items?: any[];
};

export type StoreSettings = {
  storeName: string;
  hotline: string;
  phone?: string;
  address: string;
  email: string;
  openHours: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  pointRate: string;
  pointRedeem: string;
  pointToMoneyRate?: string;
  autoPrintBill: boolean;
  notificationSound: boolean;
  allowTakeaway: boolean;
};
