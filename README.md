# Cách chạy BrewLite

Cần Docker Desktop đang bật.

```powershell
git clone https://github.com/TranVanMinhTuan26/SOFTWARE-ENGINEERING_T3.git
cd SOFTWARE-ENGINEERING_T3
Copy-Item .env.example .env
```

Điền merchant VNPay Sandbox của bạn vào `.env`:

```dotenv
VNPAY_TMN_CODE=ma_website_cua_ban
VNPAY_HASH_SECRET=khoa_bi_mat_cua_ban
VNPAY_RETURN_URL=http://localhost:4000/payments/vnpay/return
```

Nếu muốn thử quên mật khẩu bằng OTP demo local, đặt thêm:

```dotenv
API_NODE_ENV=development
ALLOW_INSECURE_PASSWORD_RESET=true
NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET=true
```

Khởi động:

```powershell
docker compose up -d --build --wait
```

- Website: http://localhost:3000
- Quản trị: http://localhost:3000/admin
- API: http://localhost:4000
- Tài khoản quản trị local: `admin@brewlite.local` / `Admin123!`.
- Khách hàng tự đăng ký. OTP demo hiển thị trong ứng dụng, không gửi email.

Dừng và chạy lại:

```powershell
docker compose stop
docker compose up -d
```
