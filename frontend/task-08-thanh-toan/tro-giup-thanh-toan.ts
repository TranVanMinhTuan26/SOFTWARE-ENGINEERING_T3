import type { CartItemSync, DemoOrder } from './kieu-thanh-toan';

export function dinhDangTienTe(soTien: number): string {
  // Dữ liệu đầu vào không hợp lệ được quy về 0 để giao diện không hiển thị NaN;
  // sau đó định dạng thành tiền Việt Nam, không có chữ số thập phân.
  const giaTri = typeof soTien === 'number' && !isNaN(soTien) ? soTien : 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(giaTri);
}
export const formatMoney = dinhDangTienTe;

export function taoDonHangMau(): DemoOrder {
  // Tạo dữ liệu đơn hàng minh họa độc lập với API, dùng để xem/kiểm tra giao diện
  // thanh toán. Giá từng dòng đã bao gồm các lựa chọn size/topping tương ứng.
  const danhSachMonMau: CartItemSync[] = [
    {
      name: 'Cà phê đen',
      size: 'M',
      toppings: ['Trân châu đen'],
      unitPrice: 60000,
      quantity: 2,
      lineTotal: 114000,
      imageUrl:
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Matcha latte',
      size: 'L',
      toppings: ['Thạch nha đam'],
      unitPrice: 80000,
      quantity: 3,
      lineTotal: 231000,
      imageUrl:
        'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Cappuccino',
      size: 'M',
      toppings: [],
      unitPrice: 60000,
      quantity: 5,
      lineTotal: 300000,
      imageUrl:
        'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    },
  ];
  // Cộng tổng các dòng hàng, áp dụng giảm giá mẫu 10%, rồi tính số tiền phải trả.
  const tamTinh = danhSachMonMau.reduce((tong, it) => tong + it.lineTotal, 0);
  const giamGia = Math.round(tamTinh * 0.1);
  const tongTien = tamTinh - giamGia;

  // Trả về một đơn mới với mã ngẫu nhiên sáu chữ số và thời điểm tạo dạng ISO.
  return {
    id: `BL-${Math.floor(100000 + Math.random() * 900000)}`,
    items: danhSachMonMau,
    subtotal: tamTinh,
    discount: giamGia,
    totalAmount: tongTien,
    voucher: 'BREW10',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}
export const createSampleOrder = taoDonHangMau;

