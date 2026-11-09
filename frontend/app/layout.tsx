import './globals.css';
import { CartProvider } from '../features/task-05-gio-hang/NguCanhGioHang';

export const metadata = {
  title: 'BrewLite — Coffee, made easy',
  description: 'Đặt đồ uống yêu thích cùng BrewLite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
