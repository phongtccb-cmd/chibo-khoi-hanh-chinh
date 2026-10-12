# Trien khai trang lay y kien Chi bo doc lap

Day la du an Cloudflare Pages doc lap, khong dung chung repository trien khai hay hostname voi cong thong tin TCCB. Trang lay y kien danh rieng cho quan chung uu tu Pham Cao Cuong, nhan vien Phong Cong tac xa hoi. Ten va dot lay y kien duoc co dinh o API, khong nhan gia tri tu trinh duyet. Moi email Access chi gui mot phieu cho dot nay.

## 0. Tao repository va Pages project rieng

1. Tao mot GitHub repository moi, vi du `chibo-khoi-hanh-chinh`.
2. Dua cac file trong thu muc du an nay vao thu muc goc cua repository moi. Khong dua chung vao repository `tccb-bvdktd-portal`. Kiem tra `index.html`, `functions/` va `migrations/` nam truc tiep o goc repository.
3. Trong Cloudflare Dashboard, mo Workers & Pages > Create application > Pages > Connect to Git va chon repository Chi bo vua tao.
4. Dat Framework preset la `None`, Build command la `exit 0`, Build output directory la `.`; mo Root directory (advanced) va de trong neu cac file nam o goc repository.
5. Deploy lan dau, sau do mo project vua tao. Tat ca cac buoc tiep theo chi thay doi Pages project Chi bo nay.
6. Ket noi mot custom domain/subdomain rieng duoi zone Cloudflare cua don vi. Khong dung hostname TCCB; Access can hostname ma Cloudflare co the bao ve. Khong chia se URL `*.pages.dev` neu hostname do chua duoc Access bao ve.

Neu repository chua nguyen mot thu muc con `chibo-khoi-hanh-chinh/` thay vi dat cac file du an truc tiep o goc, hay dat Root directory (advanced) thanh `chibo-khoi-hanh-chinh`, con Build output directory van la `.`.

## 1. Tao D1 va schema

1. Trong Cloudflare Dashboard, mo Workers & Pages > D1 SQL Database > Create Database; dat ten `party-opinions-production`.
2. Mo database vua tao > Console/Query.
3. Mo `migrations/0001_create_party_opinions.sql` trong repository nay, sao chep toan bo SQL vao Console va chon Execute/Run.
4. Kiem tra bang duoc tao:

   ```sql
   SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'party_opinions';
   ```

5. Mo Pages project Chi bo > Settings > Bindings > Add > D1 database.
6. Dat Variable name chinh xac la `OPINIONS_DB`, chon database `party-opinions-production`, luu va redeploy project.

Neu giao dien hien thi Bindings trong tab Functions, dung muc Settings > Functions > Bindings. Binding phai duoc dat tren Production; neu dung Preview, hay tao database thu rieng de tranh tron phieu.

## 2. Bat buoc bao ve Cloudflare Access

1. Mo Zero Trust > Integrations > Identity providers, them One-time PIN.
2. Mo Zero Trust > Access controls > Applications > Create new application > Self-hosted va chon custom hostname rieng vua gan.
3. Tao policy Allow, chon Include > Emails, va nhap cac dia chi email ca nhan duoc duyet tu danh sach Chi bo. Chi su dung email cho Access; khong dua CCCD, so dien thoai hay roster ca nhan vao repository, HTML, log hoac ma nguon. Khong chi dinh domain email (vi du gmail.com) vi se mo quyen cho moi tai khoan trong domain; khong tao policy Bypass/Everyone.
4. Bao ve toan bo hostname rieng bang Access. Chi nguoi co email nam trong policy moi dang nhap va gui phieu duoc. Khong chia se hay de mo hostname `*.pages.dev` chua duoc Access bao ve.
5. Sao chep Audience (AUD) Tag cua Access application.
6. Trong Pages project Chi bo > Settings > Variables and Secrets, khai bao cho Production:
   - `CF_ACCESS_TEAM_DOMAIN`: issuer URL dang `https://<team-name>.cloudflareaccess.com`.
   - `CF_ACCESS_AUD`: Audience (AUD) Tag cua Access application.
7. Luu va redeploy Pages.

Function tu xac minh chu ky RS256, issuer, audience va thoi han JWT Cloudflare Access truoc khi chap nhan danh tinh/email. Header email don le khong duoc tin cay.

## 3. Deploy va kiem thu

Sau moi thay doi, deploy repository Chi bo len Pages. Truoc khi gui link cho thanh vien:

- Mo trang khong dang nhap va xac nhan Access chan truy cap.
- Dang nhap bang email ca nhan co trong policy Allow; nhan One-time PIN, gui mot phieu thu va kiem tra email duoc ghi nhan trong D1.
- Gui lai phieu cung tai khoan; API phai tra 409 va khong them dong.
- Dang nhap bang email khong nam trong policy Allow va xac nhan Access tu choi.
- Kiem tra request khi thieu D1 binding hoac Access variables hien loi cau hinh thay vi xac nhan da gui.

Sau khi trien khai, chia se URL goc cua hostname rieng cho thanh vien. Trang lay y kien la trang chu cua Pages project. Trang hien tai chi danh cho Pham Cao Cuong; khong tao lien ket rieng theo tung nguoi tham gia.

## Luu y ve du lieu

Email ca nhan, nhan xet va phuong an bieu quyet duoc luu lien ket, khong phai la bieu quyet an danh. Chia se duong dan trong nhom khong tu no gioi han nguoi truy cap; danh sach email Access Allow la lop kiem soat bat buoc. Gioi han danh sach email va quyen truy cap D1 toi nhom can thiet, xac dinh thoi han luu tru va quy trinh xoa du lieu theo quy dinh noi bo truoc khi dua vao su dung. Khong nhap bi mat nha nuoc/tai lieu mat.
