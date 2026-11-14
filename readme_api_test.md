# Hướng dẫn kiểm thử API BrewLite - Assignment 1

Tài liệu này hướng dẫn kiểm thử các phần được giao: tính giá món (Task 4.3), giỏ hàng API (Task 5.1), đăng ký/đăng nhập JWT và bcrypt (Task 7.1, 7.2), khuyến mãi và Loyalty (Task 10.4).

Branch nộp phần việc này chỉ chứa tài liệu kiểm thử và các file TypeScript thuộc phạm vi được giao; đây không phải bản Assignment 1 đầy đủ để tự chạy độc lập. Các lệnh chạy Docker bên dưới dành cho thư mục tích hợp local của nhóm.

## 1. Chạy local: không cần deploy web

Postman gọi trực tiếp backend API, không gọi giao diện web:

| Thành phần | Địa chỉ local | Ghi chú |
|---|---|---|
| Backend API | `http://localhost:4000` | Đây là `baseUrl` cần dùng trong Postman |
| Web (nếu muốn mở giao diện) | `http://localhost:3000` | Không cần chạy để kiểm thử API |
| PostgreSQL | `localhost:5437` | Database do Docker Compose quản lý |

Mở Docker Desktop, sau đó chạy lệnh dưới đây tại thư mục `Assginment_1` nếu các container chưa chạy:

```powershell
docker compose -p brewlite-as1-demo up -d --build
```

Kiểm tra API sẵn sàng bằng cách mở hoặc gửi request:

```http
GET http://localhost:4000/health/ready
```

Kết quả mong đợi là `200 OK`. Khi dùng Postman, nếu `localhost:4000` trả `404` cho một đường dẫn API cụ thể thì backend đã nhận request nhưng không tìm thấy route đó. Việc chưa deploy web không gây ra lỗi này.

## 2. Gửi request thủ công bằng Postman

Tài liệu này chỉ mô tả request và kết quả cần kiểm tra; collection/environment do nhóm quản lý riêng.

1. Tạo một request mới trong Postman, đặt `baseUrl` là `http://localhost:4000`.
2. Với `GET`, nhập URL rồi bấm **Send**; không cần Body.
3. Với `POST` hoặc `PATCH`, chọn **Body → raw → JSON**, dán payload tương ứng ở mục 3 rồi bấm **Send**.
4. Đăng ký tài khoản kiểm thử bằng `POST /auth/register`, sau đó đăng nhập bằng `POST /auth/login`.
5. Sao chép `accessToken` từ response đăng nhập. Với endpoint có ghi “cần JWT”, chọn **Authorization → Bearer Token** và dán token vào ô Token. Không chia sẻ token này.
6. Gửi các request tiếp theo theo thứ tự: lấy sản phẩm/topping → đăng nhập → thêm món vào giỏ → kiểm tra giá/voucher → tạo đơn → thanh toán mô phỏng → xem điểm trong `GET /auth/me`.
7. So sánh status code và nội dung response với bảng kiểm thử ở mục 4. Có thể bỏ header Authorization để kiểm tra các ca thiếu token.

### Postman gửi request như thế nào?

- **Method** là động từ HTTP: `GET` đọc dữ liệu, `POST` tạo/gửi dữ liệu, `PATCH` cập nhật một phần, `DELETE` xóa.
- Với request có dữ liệu, chọn **Body → raw → JSON**. Các request `GET` trong collection không cần Body.
- Request cần đăng nhập phải có header `Authorization: Bearer <JWT>`. Lấy token từ response đăng nhập rồi dán vào **Authorization → Bearer Token**.
- **Send** gửi một request; sau khi nhóm chuẩn bị collection chung, có thể dùng Runner để chạy nhiều request liên tiếp.
- Mã `2xx` thường báo thành công, `400` là dữ liệu/nghiệp vụ không hợp lệ, `401` là chưa đăng nhập hoặc thông tin đăng nhập sai, `403` là không đủ quyền, `404` là không tìm thấy route/tài nguyên.

## 3. API và cấu trúc dữ liệu chính

### Đăng ký, đăng nhập và hồ sơ

`POST /auth/register`

```json
{
  "email": "khach-moi@example.com",
  "password": "MatKhauThuNghiem123!",
  "fullName": "Khách kiểm thử",
  "phone": "0912345678"
}
```

`email` phải đúng định dạng; `password` có tối thiểu 6 ký tự. `fullName` và `phone` là tùy chọn, nhưng nếu gửi `phone` thì phải là số điện thoại hợp lệ theo DTO. Response thành công có `accessToken` và `user`; không được trả mật khẩu rõ hoặc `passwordHash`.

`POST /auth/login`

```json
{
  "email": "khach-moi@example.com",
  "password": "MatKhauThuNghiem123!"
}
```

Response thành công chứa `accessToken`. Dùng token trong header:

```http
Authorization: Bearer <accessToken>
```

`GET /auth/me` cần JWT và trả hồ sơ trong object `user`, bao gồm `user.loyaltyPoints`.

### Tính giá và giỏ hàng

Không có endpoint riêng để gửi yêu cầu tính giá. Thêm món vào giỏ rồi đọc lại giỏ để xem `unitPrice`, `lineTotal`, `subtotal` và `total`.

`POST /cart/items` (cần JWT):

```json
{
  "productId": "<id lấy từ GET /products>",
  "size": "M",
  "toppings": [],
  "qty": 1
}
```

- `size`: chỉ nhận `S`, `M`, `L`.
- `toppings`: mảng tên topping; tối đa 5 topping, không được lặp tên.
- `qty`: số nguyên dương, tối đa 99 cho một dòng.
- `productId`: phải lấy từ `GET /products`; tên topping và giá của topping lấy từ `GET /toppings`.
- Khi thêm món, `qty` phải từ 1 đến 99. Với `PATCH /cart/items/:id`, gửi `{"qty":0}` sẽ xóa dòng món đó theo logic hiện tại.

Các request giỏ hàng:

| Method và đường dẫn | JWT? | Ý nghĩa |
|---|---:|---|
| `POST /cart/validate` | Không | Kiểm tra khả năng đáp ứng các món mà chưa đặt vào giỏ |
| `GET /cart` | Có | Xem giỏ, giá từng dòng và tổng tiền |
| `POST /cart/items` | Có | Thêm món |
| `PATCH /cart/items/:id` | Có | Đổi số lượng; Body ví dụ `{"qty":2}` |
| `DELETE /cart/items/:id` | Có | Xóa một dòng khỏi giỏ |
| `DELETE /cart` | Có | Làm trống giỏ |
| `POST /cart/apply-voucher` | Có | Áp dụng voucher; Body ví dụ `{"code":"BREW20"}` |

Theo thuật toán trong source, giá đơn vị được tính từ giá gốc cộng phụ thu size và giá các topping. Quy tắc size là `S + 0đ`, `M + 5.000đ`, `L + 10.000đ`. Ví dụ dữ liệu local đang có Americano giá gốc `45.000đ` và topping `10.000đ`: size S là `45.000đ`, M là `50.000đ`, L kèm một topping là `65.000đ`.

### Khuyến mãi

Các mã demo trong seed:

| Mã | Mức giảm |
|---|---:|
| `BREW20` | 20% |
| `COMBO15` | 15% |
| `BREW10` | 10% |
| `GIAM15K` | 15.000đ |

`POST /cart/apply-voucher` áp mã lên giỏ hiện tại. Khi tạo đơn trực tiếp qua `POST /orders`, truyền mã ở trường `promotionCode`.

### Tạo đơn, thanh toán mô phỏng và Loyalty

`POST /orders` (cần JWT):

```json
{
  "paymentMethod": "VNPay",
  "items": [
    {
      "productId": "<id lấy từ GET /products>",
      "size": "M",
      "toppings": [],
      "qty": 2
    }
  ]
}
```

Mỗi item cần `productId`, `size`, `toppings` và `qty`. `paymentMethod` nhận `VNPay`, `Ví điện tử` hoặc `Thẻ ngân hàng`; nếu chỉ muốn tạo đơn thử nghiệm, dùng `VNPay` để đơn ở trạng thái `PENDING`.

Thanh toán mô phỏng hoặc thử lại thanh toán:

`POST /orders/:id/retry-payment` (cần JWT)

```json
{
  "method": "Ví điện tử",
  "simulateFailure": true
}
```

`simulateFailure: true` kiểm thử nhánh thanh toán thất bại; đơn chuyển sang `PAYMENT_FAILED` và chưa được cộng điểm. Gửi lại cùng request với `simulateFailure: false` để kiểm thử thanh toán thành công; đơn chuyển sang `PAID`. Đây là thanh toán mô phỏng trong local, không trừ tiền qua ngân hàng hay cổng VNPay thật.

Đổi điểm khi tạo đơn bằng cách thêm `pointsUsed`:

```json
{
  "paymentMethod": "VNPay",
  "pointsUsed": 100,
  "items": [
    {
      "productId": "<id lấy từ GET /products>",
      "size": "M",
      "toppings": [],
      "qty": 1
    }
  ]
}
```

Theo mặc định, hệ thống tích 1 điểm cho mỗi `1.000đ` đủ điều kiện sau thanh toán thành công; 1 điểm giảm `100đ`; mức đổi tối thiểu là 100 điểm. Không thể dùng nhiều điểm hơn số dư hoặc làm tiền giảm vượt quá tiền hàng. Các mức có thể cấu hình qua cài đặt cửa hàng, nên khi chạy trên database khác hãy kiểm tra chính sách hiện hành.

## 4. Các ca kiểm thử và kết quả ghi nhận

Các ca dưới đây đã được gọi trực tiếp đến API local đang chạy. Dữ liệu sản phẩm, topping và mã khuyến mãi được đọc từ database hiện có; tài khoản kiểm thử được tạo mới để không phụ thuộc mật khẩu tài khoản thật.

| Nhóm | Ca kiểm thử | Mong đợi | Kết quả ghi nhận |
|---|---|---:|---|
| Kết nối | `GET /health/ready` | 200 | Đạt |
| Catalog | `GET /products`, `GET /toppings` | 200 | Đạt |
| Khuyến mãi | `GET /promotions` | 200 và danh sách mã | **Chưa đạt tính năng**: API trả `404` |
| Đăng ký | Email sai / mật khẩu quá ngắn | 400 | Đạt |
| Đăng ký | Email hợp lệ mới | 201, có JWT | Đạt |
| Đăng ký | Dùng lại email | 400 | Đạt |
| Đăng nhập | Mật khẩu sai / đúng | 401 / 201 | Đạt |
| Hồ sơ | Thiếu JWT / JWT đúng | 401 / 200 | Đạt |
| Bảo vệ giỏ | `GET /cart` thiếu JWT | 401 | Đạt |
| Giỏ hàng | Size `XL`, số lượng 0 | 400 | Đạt |
| Giá động | Americano S / M / L kèm topping | 45.000 / 50.000 / 65.000đ | Đạt |
| Số lượng giỏ | Cập nhật qty qua `PATCH /cart/items/:id` | 200, tổng dòng đổi theo qty | Đạt |
| Voucher | Mã không tồn tại | 400 | Đạt |
| Voucher | `BREW20` | Giảm đúng 20% | Đạt |
| Voucher | `GIAM15K` | Giảm đúng 15.000đ | Đạt |
| Đặt đơn | Mã khuyến mãi sai | 400 | Đạt |
| Thanh toán | Mô phỏng thất bại | 201, `success=false`, trạng thái `PAYMENT_FAILED` | Đạt |
| Thanh toán | Thử lại thành công | 201, `success=true`, trạng thái `PAID` | Đạt |
| Tích điểm | Đơn 120.000đ thanh toán thành công | Cộng 120 điểm theo mặc định | Đạt |
| Đổi điểm | 99 điểm / vượt số dư | 400 | Đạt |
| Đổi điểm | 100 điểm | Giảm 10.000đ | Đạt |
| Điểm sau giao dịch | Đổi 100 điểm trên đơn 50.000đ rồi thanh toán | Trừ 100, sau đó cộng 40 điểm; số dư cuối 60 nếu bắt đầu từ 0 | Đạt |

Trong lần chạy kiểm tra end-to-end, 40 assertion về response và nghiệp vụ khớp kết quả thực tế. Tuy nhiên, assertion `GET /promotions` cố ý xác nhận route hiện trả 404; đây là một **lỗi chức năng cần sửa**, không nên hiểu là tính năng xem danh sách khuyến mãi đã hoạt động.

## 5. Cách đọc lỗi và kết quả

- `400 Bad Request`: kiểm tra JSON, enum, số lượng, mã khuyến mãi/đổi điểm hoặc các điều kiện nghiệp vụ.
- `401 Unauthorized`: kiểm tra header `Authorization`, JWT, email hoặc mật khẩu.
- `403 Forbidden`: đã xác thực nhưng vai trò không có quyền.
- `404 Not Found`: API nhận được request nhưng không tìm thấy route/tài nguyên. Ví dụ hiện tại là `GET /promotions`.
- `409 Conflict`: thường dùng cho trạng thái xung đột; endpoint đăng ký hiện trả `400` khi email đã tồn tại, vì vậy hãy theo response thực tế của source/API thay vì mặc định mọi duplicate đều là 409.
- `201 Created` trên `POST /auth/login` là bình thường trong dự án này do NestJS mặc định trả `201` cho `POST`; không có nghĩa là đã tạo user mới.

Response của đăng nhập/đăng ký có `accessToken`; response hồ sơ có dữ liệu dưới `user`, ví dụ `user.loyaltyPoints`. Không dán JWT hoặc mật khẩu thật vào tài liệu, ảnh chụp công khai hay GitHub.

## 6. Phạm vi chưa được xác nhận

- Kiểm thử API giỏ hàng xác nhận `CartController`/backend; trong `apps` hiện không có symbol/file `useCartStore`. Vì vậy chưa thể kết luận trạng thái giỏ phía giao diện/client đã được kiểm thử.
- Mã hết hạn không có sẵn trong seed demo hiện tại, nên chưa chạy ca hết hạn qua API bằng dữ liệu seed.
- Bcrypt được xác nhận trong source đăng ký (`bcrypt.hash`); API chỉ kiểm tra được rằng không lộ mật khẩu/hash và đăng nhập bằng mật khẩu đúng/sai, không thể chứng minh thuật toán hash chỉ từ response HTTP.
- Thử thanh toán trong bộ kiểm thử là mock e-wallet; không xác nhận giao dịch ngân hàng thật hoặc cấu hình VNPay bên ngoài.
- Chưa kiểm thử CRUD quản trị khuyến mãi vì các route quản trị cần tài khoản/quyền admin.

## 7. Vì sao `GET /promotions` trả 404?

Đây là request đến **backend local** `http://localhost:4000/promotions`, không phải trang web. Backend hiện đăng ký các route `/admin/promotions`, nhưng chưa đăng ký `PublicPromotionsController` cho route công khai `/promotions` trong module ứng dụng. Vì vậy, 404 này vẫn xảy ra dù API và database đang chạy khỏe, và không liên quan việc chưa deploy web.

Các voucher vẫn có thể được kiểm thử qua `POST /cart/apply-voucher` hoặc `promotionCode` trong `POST /orders`; lỗi hiện tại chỉ chặn API liệt kê khuyến mãi công khai.
