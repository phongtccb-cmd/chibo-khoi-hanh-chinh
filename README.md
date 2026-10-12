# Trang lấy ý kiến Chi bộ khối Hành chính

Đây là dự án Cloudflare Pages độc lập, phục vụ lấy ý kiến xét kết nạp Đảng đối với quần chúng ưu tú Phạm Cao Cường, nhân viên Phòng Công tác xã hội.

## Triển khai

1. Tạo GitHub repository riêng cho nội dung thư mục này; không đặt trong repository `tccb-bvdktd-portal`.
2. Trong Cloudflare, tạo Pages project mới và kết nối repository riêng.
3. Chọn framework preset `None`, đặt build command `exit 0` và build output directory `.`. Để trống root directory nếu `index.html` nằm ở gốc repository.
4. Gắn custom domain/subdomain riêng cho trang Chi bộ; không dùng hostname của cổng TCCB.
5. Làm theo [SETUP.md](./SETUP.md) để tạo D1, Access và các biến cho Pages Function trước khi gửi đường dẫn cho thành viên.

## Lưu trữ và truy cập

- Mã nguồn trang, Function, migration và hướng dẫn được lưu trong GitHub repository riêng.
- Phiếu (email, nhận xét, biểu quyết) được lưu trong Cloudflare D1; đây không phải phiếu ẩn danh.
- Cloudflare Access giới hạn đăng nhập theo email cá nhân được cho phép.
- Không lưu CCCD hoặc số điện thoại của thành viên trong dự án.
