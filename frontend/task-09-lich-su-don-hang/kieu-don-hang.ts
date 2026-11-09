export interface OrderItemDetail {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string;
  size?: 'S' | 'M' | 'L';
  toppings?: string[];
  unitPrice: number;
  qty?: number;
  quantity?: number;
  lineTotal: number;
}

export type OrderBadgeClass = 'done' | 'processing' | 'ready' | 'cancelled' | 'pending';

export interface HistoryOrder {
  id: string;
  code: string;
  date: string;
  total: number;
  status: string;
  statusText: string;
  badgeClass: OrderBadgeClass;
  paymentMethod: string;
  items?: OrderItemDetail[];
  customerEmail?: string;
}

export interface ActiveTrackingOrder {
  id?: string;
  code: string;
  total: number;
  paymentMethod: string;
  step: number;
  status: string;
  statusText: string;
  badgeClass?: OrderBadgeClass;
  date?: string;
  items?: OrderItemDetail[];
}

