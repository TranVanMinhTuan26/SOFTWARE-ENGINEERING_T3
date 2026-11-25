import type { CartItem, HistoryOrder, Product } from '../dung-chung/kieu-du-lieu-chung';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Cà phê đen',
    description: 'Cà phê nguyên chất đậm đà, hương thơm truyền thống đánh thức mọi giác quan.',
    category: 'Cà phê',
    price: 45000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p2',
    name: 'Americano',
    description: 'Espresso hảo hạng pha loãng thanh dịu, phong vị sảng khoái và thanh sạch.',
    category: 'Cà phê',
    price: 45000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p3',
    name: 'Americano đá',
    description: 'Espresso và nước đá mát lạnh, hậu vị sạch, dễ uống suốt ngày.',
    category: 'Cà phê',
    price: 39000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p4',
    name: 'Cappuccino',
    description: 'Espresso đậm vị hòa cùng sữa béo ngậy và lớp bọt sữa bồng bềnh.',
    category: 'Cà phê',
    price: 55000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p5',
    name: 'Latte',
    description: 'Espresso cân bằng cùng sữa tươi thanh dịu, hậu vị êm ái.',
    category: 'Cà phê',
    price: 55000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p6',
    name: 'Latte kem mịn',
    description: 'Espresso cân bằng cùng sữa tươi đánh nóng, lớp bọt sữa sánh mịn.',
    category: 'Cà phê',
    price: 49000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p7',
    name: 'Mo',
    description: 'Sự kết hợp hoàn hảo giữa espresso nồng nàn và sốt socola béo ngậy.',
    category: 'Cà phê',
    price: 60000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p8',
    name: 'Trà đào cam sả',
    description: 'Vị trà thanh mát hòa quyện đào giòn ngọt và tinh dầu cam sả thơm lừng.',
    category: 'Trà',
    price: 50000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p9',
    name: 'Matcha latte',
    description: 'Bột matcha Uji thượng hạng kết hợp cùng sữa tươi béo thơm dịu nhẹ.',
    category: 'Matcha',
    price: 60000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p10',
    name: 'Chocolate',
    description: 'Sô cô la nguyên chất đậm đà, vị ngọt bùi hòa quyện kem tươi mát lạnh.',
    category: 'Đá xay',
    price: 55000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p11',
    name: 'Chocolate đá',
    description: 'Sô cô la Bỉ đậm đà đánh cùng sữa đá thơm béo sảng khoái.',
    category: 'Đá xay',
    price: 50000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'p12',
    name: 'hello',
    description: 'Thức uống mới hello',
    category: 'Cà phê',
    price: 45000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
];

export const INITIAL_CART: CartItem[] = [];

export const DEMO_HISTORY: HistoryOrder[] = [];

export const CATEGORIES = [
  { id: 'Tất cả', label: 'Tất cả', icon: '✨' },
  { id: 'Cà phê', label: 'Cà phê', icon: '☕' },
  { id: 'Trà', label: 'Trà', icon: '🍵' },
  { id: 'Matcha', label: 'Matcha', icon: '🍃' },
  { id: 'Đá xay', label: 'Đá xay', icon: '🥤' },
];

export type Category = (typeof CATEGORIES)[number];

/**
 * Định dạng số tiền theo quy ước Việt Nam: phân tách hàng nghìn và hiển thị
 * đơn vị đồng, không có phần thập phân vì giá sản phẩm là số nguyên.
 */
export const dinhDangTienTe = (soTien: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(soTien);
export const money = dinhDangTienTe;

/**
 * Chuẩn hóa chuỗi trước khi so sánh: chuẩn Unicode NFC, bỏ khoảng trắng đầu/cuối
 * và chuyển về chữ thường để giảm khác biệt do cách nhập liệu.
 */
export const chuanHoaChuoi = (chuoi: string) => (chuoi || '').normalize('NFC').trim().toLowerCase();
export const normalizeText = chuanHoaChuoi;
