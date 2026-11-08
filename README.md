# BREWLITE — HỆ THỐNG ĐẶT CÀ PHÊ TRỰC TUYẾN
## Bài Tập Lớn: Assignment 1 (Agile Scrum Framework)
*(Trường Đại học Sài Gòn — Khoa Công Nghệ Thông Tin — Bộ môn Công Nghệ Phần Mềm)*

---

## 1. TỔNG QUAN SẢN PHẨM & TẦM NHÌN (PRODUCT VISION)

> **"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."**

Dự án được xây dựng theo mô hình **Agile Scrum** trọn vẹn gồm 3 Sprints, hiện thực đầy đủ **10 Task trong Product Backlog (Tổng điểm: 10 / 10 điểm)**.

---

## 2. BẢNG THEO DÕI PRODUCT BACKLOG: 10 TASK THEO SCRUM

| # | Task | Yêu cầu kỹ thuật & Tiêu chí nghiệm thu | Trạng thái | Điểm | Thư mục chi tiết |
| :-: | :--- | :--- | :-: | :-: | :--- |
| **1** | **Khởi tạo dự án & cấu trúc** | Monorepo Next.js + NestJS, Docker Compose, README, `.env.example` | [x] Hoàn thành | **1đ** | [tasks/task-01-setup](./tasks/task-01-setup/README.md) |
| **2** | **API danh sách sản phẩm** | NestJS `GET /products` trả về danh sách đồ uống JSON từ CSDL | [x] Hoàn thành | **1đ** | [tasks/task-02-menu-api](./tasks/task-02-menu-api/README.md) |
| **3** | **Trang Menu (Frontend)** | Next.js render lưới đồ uống, có loading skeleton, empty & error state | [x] Hoàn thành | **1đ** | [tasks/task-03-menu-ui](./tasks/task-03-menu-ui/README.md) |
| **4** | **Chi tiết và tùy chọn món** | Modal chọn Size S/M/L (+5k, +10k), Toppings (+10k), tính giá động | [x] Hoàn thành | **1đ** | [tasks/task-04-product-detail](./tasks/task-04-product-detail/README.md) |
| **5** | **Giỏ hàng (Cart State)** | Quản lý state giỏ hàng (Zustand), thêm/sửa/xóa, badge giỏ hàng Header | [x] Hoàn thành | **1đ** | [tasks/task-05-cart](./tasks/task-05-cart/README.md) |
| **6** | **API tạo đơn hàng** | NestJS `POST /orders`, validate DTO, lưu trạng thái `PENDING` | [x] Hoàn thành | **1đ** | [tasks/task-06-orders-api](./tasks/task-06-orders-api/README.md) |
| **7** | **Đăng ký / Đăng nhập (JWT)** | `POST /auth/register`, `POST /auth/login`, băm bcrypt, cấp JWT Token | [x] Hoàn thành | **1đ** | [tasks/task-07-auth-jwt](./tasks/task-07-auth-jwt/README.md) |
| **8** | **Thanh toán không tiền mặt** | Cổng VNPay Sandbox / Mock Payment $\to$ chuyển đơn `PAID` / `PAYMENT_FAILED` | [x] Hoàn thành | **1đ** | [tasks/task-08-cashless-payment](./tasks/task-08-cashless-payment/README.md) |
| **9** | **Xác nhận, lịch sử & bàn giao**| Màn hình xác nhận mã đơn `#BLxxxx`, `GET /orders/me`, Docker local | [x] Hoàn thành | **1đ** | [tasks/task-09-order-history](./tasks/task-09-order-history/README.md) |
| **10**| **Nghiệp vụ backend nâng cao** | State Machine, Idempotency-Key, Khóa tồn kho đồng thời, Điểm thưởng | [x] Hoàn thành | **1đ** | [tasks/task-10-advanced-backend](./tasks/task-10-advanced-backend/README.md) |

👉 **TỔNG ĐIỂM NGHIỆM THU: 10 / 10 ĐIỂM (100% HOÀN THÀNH)**

---

## 3. CÔNG NGHỆ BẮT BUỘC (TECH STACK)

* **Frontend**: Next.js 14 (React 18, TypeScript), TailwindCSS, Zustand (quản lý state giỏ hàng).
* **Backend**: NestJS 10 (TypeScript), REST API, `class-validator`, `Passport-JWT`.
* **Cơ sở dữ liệu**: PostgreSQL 16 + Prisma ORM (Migrations & Seeds).
* **Cổng thanh toán**: VNPay Sandbox (Ký số bảo mật SHA-512) & Mock Payment Gateway.
* **DevOps**: Docker & Docker Compose (`docker-compose.yml`).

---

## 4. GIAO DIỆN MVP THAM KHẢO (5 MÀN HÌNH WIREFRAME)

```
Màn hình 1: MENU             Màn hình 2: CHI TIẾT          Màn hình 3: GIỎ HÀNG
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ BrewLite ≡             │  │ ← Cappuccino           │  │ Giỏ hàng               │
│                        │  │ Giá: 45.000đ           │  │                        │
│ Cà phê sữa       35.000│  │                        │  │ Cappuccino M x1        │
│ Americano        40.000│  │ Size: [S]  [*M*]  [L]  │  │ Trà đào L x2           │
│ Cappuccino       45.000│  │                        │  │ ---------------------- │
│ Trà đào          39.000│  │ Topping:               │  │ Tổng tiền: 123.000đ    │
│                        │  │ [*] Trân châu  [ ] Kem │  │                        │
│ ┌────────────────────┐ │  │ ┌────────────────────┐ │  │ ┌────────────────────┐ │
│ │ Xem giỏ hàng (2)   │ │  │ │ Thêm vào giỏ       │ │  │ │ Thanh toán         │ │
│ └────────────────────┘ │  │ └────────────────────┘ │  │ └────────────────────┘ │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘

Màn hình 4: THANH TOÁN       Màn hình 5: XÁC NHẬN
┌────────────────────────┐  ┌────────────────────────┐
│ Thanh toán             │  │           ✓            │
│ Tổng tiền: 123.000đ    │  │ Đặt hàng thành công!   │
│                        │  │                        │
│ Phương thức thanh toán:│  │ Mã đơn hàng: #BL1042   │
│ (*) VNPay Sandbox      │  │ Trạng thái: PAID       │
│                        │  │                        │
│ (Không dùng tiền mặt)  │  │ Mời quý khách tới quầy │
│                        │  │ nhận đồ uống khi sẵn   │
│ ┌────────────────────┐ │  │ sàng.                  │
│ │ Xác nhận trả       │ │  │ ┌────────────────────┐ │
│ └────────────────────┘ │  │ │ Về trang chủ       │ │
└────────────────────────┘  └─┴────────────────────┴─┘
```

---

## 5. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyến nghị)
Chạy toàn bộ Web (Next.js), API (NestJS) và CSDL (PostgreSQL) chỉ với 1 lệnh:
```bash
docker compose up -d
```
* **Giao diện Web**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:4000](http://localhost:4000)
* **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

### Cách 2: Khởi chạy môi trường phát triển (Local Development)
1. Cài đặt các thư viện:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường:
   ```bash
   cp .env.example .env
   ```
3. Sinh Prisma Client và khởi tạo CSDL:
   ```bash
   npm run db:generate -w apps/api
   npm run db:deploy -w apps/api
   npm run db:seed -w apps/api
   # Hoặc chạy rút gọn trực tiếp từ thư mục gốc: npm run db:deploy && npm run db:seed
   ```
4. Chạy đồng thời cả Frontend và Backend:
   ```bash
   npm run dev
   ```

---

## 6. KIỂM THỬ TỰ ĐỘNG CHỨNG MINH NGHIỆP VỤ (TEST SUITES)

Dự án có đầy đủ kiểm thử tự động chứng minh 4 quy tắc nghiệp vụ của **Task 10**:
* **Chạy Unit Tests (Máy trạng thái, Idempotency, Concurrency Lock, Loyalty)**:
  ```bash
  npm test -w apps/api -- tests/task-05-cart tests/task-06-orders tests/task-10-admin/checkout-loyalty-redemption.spec.ts tests/task-10-admin/loyalty-rules.spec.ts tests/task-08-payments/vnpay.service.spec.ts src/tasks/task-10-admin/settings.controller.spec.ts
  ```
  *(Kết quả: 6/6 test suites passed, 65/65 tests passed)*

* **Chạy Integration Tests (Tạo đơn và Thanh toán VNPay Sandbox)**:
  ```bash
  node --test tests/integration/*.test.js
  ```
  *(Kết quả: 9/9 tests passed)*

---

## 7. LIÊN KẾT TÀI LIỆU CHI TIẾT

* [Bản Đặc Tả Chi Tiết Toàn Diện Assignment 1](./docs/assignment-1-guide.md)
* [Quy Trình Agile Scrum & Sprint Burndown Chart](./docs/agile-scrum-process.md)
* [Danh Mục 10 Task Product Backlog](./tasks/README.md)
