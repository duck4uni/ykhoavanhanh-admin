# API Reference đầy đủ — vanhanh-hospital-backend

Base URL: `/api/v1.0`

Tài liệu này liệt kê **toàn bộ** API hiện có trong `src/controllers/api/v1.0/**`, được sinh bằng cách đọc trực tiếp từng file controller + đối chiếu model/provider thật (không suy đoán từ swagger comment, vì một số swagger đã lỗi thời).

## Quy ước chung

- Response thành công: `res.sendOk({ data, message?, message_en? })` → HTTP 200 (trừ khi có `statusCode` khác) với body `{ data, message, message_en, ... }`.
- Response lỗi chung: `res.sendError({ err })` → HTTP 500, message mặc định (không lộ chi tiết lỗi thật).
- Response lỗi có kiểm soát: `res.sendErrorStatus({ status, message, message_en, err? })` → HTTP status tùy chỉnh (400/401/403/404...).
- **Pagination pattern A** — middleware `#middlewares/query-modifier` (`queryModifier`): đọc `page`/`pageSize`/`sortField`/`sortOrder`/`filters` từ query, gán vào `req.payload`. **Lưu ý quan trọng: `req.payload.filters` luôn là object rỗng `{}`** — middleware này KHÔNG tự parse chuỗi `filters` thành điều kiện where thật, dù nhiều endpoint vẫn khai báo tham số `filters` trong swagger. Muốn lọc thật phải dùng query param riêng (vd `facility_id`, `status`...) được handler tự đọc từ `req.query`.
- **Pagination pattern B** — middleware `middle` (từ package npm `sequelize-api-paginate`, KHÁC với pattern A): đọc `currentPage`/`pageSize`/`filters`/`sortField`/`sortOrder`, và **CÓ** parse chuỗi `filters` thành where thật, cú pháp `field==value|field2==value2`. Dùng ở `notifications`, `page-config`, `users`.
- `middleware: verify` (từ `#middlewares/auth`) = yêu cầu Bearer JWT hợp lệ.
- Nhiều `BaseProvider.put()`/`.delete()` KHÔNG kiểm tra bản ghi tồn tại trước khi update/destroy — nếu `id` sai sẽ ném lỗi runtime (rơi vào catch chung → HTTP 500 chung chung) thay vì trả 404 rõ ràng. Đã ghi chú riêng ở từng endpoint bị ảnh hưởng.

---

## Mục lục

1. [Auth](#auth)
2. [Users](#users) / [Internal Accounts](#internal-accounts)
3. [Roles](#roles) / [User Roles](#user-roles)
4. [Patient](#patient)
5. [Doctors](#doctors) / [Doctor Work Schedules](#doctor-work-schedules)
6. [Rooms](#rooms)
7. [HIS Services](#his-services)
8. [Specialties](#specialties)
9. [Danh mục HIS: Countries/District/Nation/Profession/Provinces/Ward](#danh-mục-his)
10. [Exam Areas](#exam-areas)
11. [Appointments](#appointments) / [Appointment Bookings](#appointment-bookings) / [Appointment Reviews](#appointment-reviews)
12. [Notifications](#notifications) / [Page Config](#page-config)
13. [Dashboard](#dashboard)
14. [Posts](#posts) / [Post Categories](#post-categories)
15. [Payment — MoMo](#payment-momo) / [Payment — VCB](#payment-vcb)
16. [Files](#files) / [ChatData](#chatdata) / [Ask](#ask)
17. [Tài liệu API chi tiết đã gộp](#tài-liệu-api-chi-tiết-đã-gộp)
18. [Tổng hợp lỗi/điểm cần lưu ý phát hiện được](#tổng-hợp-lỗi-đã-phát-hiện)

---

# Auth

### POST /auth/admin-login
Mô tả: Đăng nhập cho admin bằng email + mật khẩu.
Middleware: `validateAdminLogin` (email bắt buộc + hợp lệ, password ≥ 8 ký tự)
Nguồn dữ liệu: Đọc `user` (join `user_auth` where `auth_method='password'`), tạo/đọc `user_session`

**Body:** `email` (string, có), `password` (string ≥8 ký tự, có)

**Response (data):**
```json
{ "accessToken": "JWT", "expiresIn": "number (giây)", "refreshToken": "session_token" }
```
Ghi chú: 403 nếu sai email/password (message gộp chung, không phân biệt lý do). 403 nếu `is_active=false`. Session dùng `findOrCreate` theo `user_id` — đăng nhập nhiều lần trả cùng 1 `refreshToken` tới khi session hết hạn/bị xóa.

### POST /auth/login
Mô tả: Đăng nhập bằng số điện thoại + mật khẩu.
Middleware: `validateLogin` (phone bắt buộc + đúng định dạng VN)
Nguồn dữ liệu: Giống admin-login nhưng tra theo `phone`.

**Body:** `phone` (có), `password` (có)
**Response (data):** giống admin-login (`accessToken`, `expiresIn`, `refreshToken`)

### POST /auth/register
Mô tả: Đăng ký tài khoản mới bằng số điện thoại, gửi OTP kích hoạt qua SMS.
Middleware: `validateRegister` (phone bắt buộc + đúng định dạng VN)
Nguồn dữ liệu: Đọc/ghi `user`, `user_auth`; gửi SMS.

**Body:** `phone` (có) + các field khác của `user` (`full_name`, `email`, `address`, `birthday`, `cccd`, `avatar`...) được spread thẳng vào `create`.
**Response (data):** `{ "user_id": "uuid" }`

Ghi chú: **Mật khẩu luôn bị hard-code `"123456789"`** — field `password` trong body (nếu có) bị bỏ qua hoàn toàn. Nếu phone đã tồn tại và active → 403. Nếu tồn tại nhưng chưa active → không tạo mới, chỉ regenerate OTP (`register-otp`) và gửi lại SMS. Lỗi gửi SMS chỉ log, không fail request. Còn nhiều `console.log` debug sót lại trong code.

### POST /auth/verifyOTP
Mô tả: Xác minh OTP đăng ký để kích hoạt tài khoản, tự động đăng nhập luôn sau khi xác thực.
**Body:** `phone` (có), `otp` (có)
**Response (data):** `{ accessToken, expiresIn, refreshToken }`
Ghi chú: 404 nếu không tìm thấy user theo phone. 400 nếu không khớp bản ghi `user_auth` (`auth_method='register-otp'` AND `auth_key=otp`). Khi khớp: set `is_active=true`, xóa bản ghi OTP, tạo session.

### POST /auth/resendOTP
Mô tả: Gửi lại OTP đăng ký qua SMS.
**Body:** `phone` (có)
**Response (data):** `null`
Ghi chú: Không tìm thấy user → throw lỗi nội bộ, rơi vào catch chung → trả **500** (không phải 404 rõ ràng). Lỗi gửi SMS làm fail luôn request (khác `forgotPassword`).

### POST /auth/forgotPassword
Mô tả: Gửi email OTP để đặt lại mật khẩu (tài khoản có email).
**Body:** `email` (có)
**Response (data):** `{}`
Ghi chú: 401 nếu không tìm thấy tài khoản. **Bug:** gọi `resendOTP(user)` thiếu tham số `authMethod` thứ 2 → OTP bị ghi với `auth_method='register-otp'` (giá trị mặc định của hàm), KHÔNG PHẢI `'forgot-otp'` như luồng "quên mật khẩu" cần — có thể đụng độ với OTP đăng ký đang treo. Gửi mail bất đồng bộ, lỗi chỉ log, không phá response.

### POST /auth/forgotPasswordOTP
Mô tả: Gửi OTP quên mật khẩu qua SMS (tài khoản có số điện thoại).
**Body:** `phone` (có)
**Response (data):** `null`
Ghi chú: 404 nếu không tìm thấy user; 403 nếu chưa active. OTP ghi đúng `auth_method='forgot-otp'` (khác bug ở trên). Lỗi gửi SMS làm fail request.

### POST /auth/verifyForgotOTP
Mô tả: Xác minh OTP quên mật khẩu (SMS), trả session để đổi mật khẩu mới.
**Body:** `phone` (có), `otp` (có)
**Response (data):** `{ accessToken, expiresIn, refreshToken }`
Ghi chú: 404 nếu không tìm thấy user. 400 nếu không khớp `auth_method='forgot-otp'` + `auth_key=otp`. Khớp → xóa bản ghi OTP, tạo/lấy session. Client dùng `accessToken` này gọi tiếp `PUT /auth/updatePassword`.

### PUT /auth/updatePassword
Mô tả: Đổi mật khẩu cho user đang đăng nhập.
Middleware: `verify` — Yêu cầu đăng nhập
**Body:** `password` (có, không validate độ dài/định dạng)
**Response (data):** `{}`
Ghi chú: Không kiểm tra mật khẩu cũ trước khi đổi. Dùng `findOrCreate` theo `{user_id, auth_method:'password'}`.

### POST /auth/genNewAccessToken
Mô tả: Cấp access token mới từ refresh token (session_token).
**Body:** `refreshToken` (có, = session_token)
**Response (data):** `{ accessToken, expiresIn }`
Ghi chú: **Không kiểm tra session đã hết hạn (`expire`) hay chưa** — chỉ cần `session_token` tồn tại trong DB là cấp token mới vô thời hạn.

### DELETE /auth/logout
Mô tả: Đăng xuất, hủy phiên đăng nhập.
Middleware: `verify` — Yêu cầu đăng nhập
Ghi chú: **BUG — endpoint luôn lỗi 500.** Handler gọi `userProvider.logoutSession(req.user.id)` nhưng method này **không tồn tại** trong `UserProvider`/`BaseProvider`. Cần bổ sung method (vd xóa `user_session` theo `user_id`) thì mới hoạt động được.

### POST /auth/zalo
Mô tả: Đăng nhập/đăng ký qua Zalo Mini App theo `zalo_id`, tự tạo user nếu chưa có.
**Body:** `phone` (không, fallback = `zalo_id`), `full_name`, `zalo_id`, `zalo_avatar`, `zalo_id_by_oa`
**Response (data) — user đã tồn tại:**
```json
{ "user": { "...toàn bộ field bảng user..." }, "accessToken": "...", "expiresIn": 0, "refreshToken": "..." }
```
**Response (data) — tạo user mới:**
```json
{ "accessToken": "...", "expiresIn": 0, "refreshToken": "..." }
```
Ghi chú: **2 nhánh trả cấu trúc `data` khác nhau** (nhánh cũ có thêm field `user`, nhánh mới thì không). Tra cứu tồn tại chỉ dựa vào `zalo_id`, không check `phone`.

---

# Users

### GET /users/getMyInfo
Mô tả: Lấy thông tin user hiện tại (theo token) kèm `user_roles.role`.
Middleware: `verify` — Yêu cầu đăng nhập
**Response (data):** toàn bộ field bảng `user` (`id, full_name, phone, is_admin, avatar, is_active, zalo_id, zalo_avatar, zalo_id_by_oa, address, birthday, email, cccd, created_at, updated_at,...`) + `user_roles: [{ id, user_id, role_id, role: { id, role_name, description, receptionist, membership, marketing, accountant, customer_service } }]`.
Ghi chú: Nếu user không tồn tại (token hỏng), code throw khi destructure `null` → rơi catch → 500 chung, không phải 404.

### GET /users
Mô tả: Danh sách user, phân trang/lọc/sắp xếp.
Middleware: `middle` (pattern B) — public, không cần đăng nhập.
**Query:** `currentPage, pageSize, filters, sortField, sortOrder`
**Response (data):** `{ count, rows: [ /* toàn bộ field user */ ], totalPages, currentPage }`

### GET /users/{id}
Mô tả: Chi tiết 1 user.
Middleware: `[middle, verify]` — Yêu cầu đăng nhập
**Response (data):** toàn bộ field `user`, không include gì thêm. Nếu không tìm thấy → vẫn 200 với `data: null` (không có check 404).

### PUT /users/{id}
Mô tả: Cập nhật user.
Middleware: `[verify, middle]` — Yêu cầu đăng nhập
**Body:** bất kỳ field nào của `user` — **không whitelist**, kể cả `is_admin` có thể bị đổi nếu client gửi lên.
**Response (data):** user sau update. Nếu `id` sai → 500 chung (không 404).

### DELETE /users/{id}
Mô tả: Xóa cứng user.
Middleware: `[verify, middle]` — Yêu cầu đăng nhập
**Response (data):** `["Successfully delete item"]` — **mảng chứa 1 chuỗi cố định**, không phải object user bị xóa.

---

# Internal Accounts

### POST /internal-accounts
Mô tả: Tạo tài khoản nhân viên nội bộ (user + user_auth password + gán role) trong 1 transaction.
Middleware: `verify` — Yêu cầu đăng nhập
**Body:** `full_name*` , `email*` (regex đơn giản, chuẩn hóa lowercase+trim, phải chưa tồn tại), `phone*` (chưa tồn tại), `password*` (≥6 ký tự), `role_id*` (UUID, phải tồn tại trong `roles`)
**Response 201 (data):**
```json
{
  "id": "uuid", "full_name": "...", "email": "...", "phone": "...",
  "is_active": true, "is_admin": true, "created_at": "...",
  "user_roles": [{ "role": { "id": "uuid", "role_name": "...", "description": "...", "receptionist": false, "membership": false, "marketing": false, "accountant": false, "customer_service": false } }]
}
```
Ghi chú: 400 nếu thiếu/sai field, hoặc email/phone trùng. 404 nếu `role_id` không tồn tại. User mới **luôn** `is_active:true, is_admin:true` (hard-code). Không trả mật khẩu.

---

# Roles

### GET /roles
Mô tả: Danh sách vai trò.
Middleware: `queryModifier` — **KHÔNG có `verify`, endpoint public** (dù POST/PUT/DELETE cùng resource yêu cầu đăng nhập).
**Response (data):** `{ count, rows: [{ id, role_name, description, receptionist, membership, marketing, accountant, customer_service, created_at, updated_at }], totalPages, currentPage }`

### POST /roles
Mô tả: Tạo vai trò mới, check trùng tên trước khi tạo.
Middleware: `verify` — Yêu cầu đăng nhập
**Body:** `role_name*`, `description`, `receptionist/membership/marketing/accountant/customer_service` (boolean, mặc định false)
Ghi chú: 400 nếu thiếu/rỗng `role_name` hoặc đã tồn tại (case-sensitive).

### GET /roles/{id}
Mô tả: Chi tiết vai trò. Middleware: Không (public). 404 nếu không tồn tại.

### PUT /roles/{id}
Mô tả: Cập nhật vai trò, check trùng tên nếu đổi `role_name`.
Middleware: `verify` — Yêu cầu đăng nhập. 404 nếu `id` sai, 400 nếu tên mới trùng role khác.

### DELETE /roles/{id}
Mô tả: Xóa cứng vai trò.
Middleware: `verify` — Yêu cầu đăng nhập. 404 nếu không tồn tại. **Không kiểm tra ràng buộc với `user_roles`** trước khi xóa.

---

# User Roles

### GET /user-roles
Mô tả: Danh sách gán vai trò, lọc theo `user_id`/`role_id`, kèm `user` + `role`.
Middleware: `queryModifier` — public
**Query:** `page, pageSize, sortField, sortOrder, user_id, role_id`
**Response (data):** `{ count, rows: [{ id, user_id, role_id, created_at, updated_at, user: {id, full_name, phone, email, is_admin}, role: {id, role_name, description, receptionist, membership, marketing, accountant, customer_service} }], totalPages, currentPage }`

### POST /user-roles
Mô tả: Gán 1 role cho 1 user.
Middleware: `verify` — Yêu cầu đăng nhập
**Body:** `user_id*`, `role_id*`
Ghi chú: Validate tuần tự — thiếu field (400) → `user_id` không tồn tại (404) → `role_id` không tồn tại (404) → đã gán trùng (400, check `findAssignment`). DB còn có unique constraint `(user_id, role_id)` làm lớp bảo vệ thứ 2.

### GET /user-roles/{id}
Mô tả: Chi tiết 1 bản ghi gán vai trò (id = id bản ghi, không phải user_id/role_id), kèm `user`+`role`.
Middleware: Không (public). 404 rõ ràng nếu không tìm thấy.

### DELETE /user-roles/{id}
Mô tả: Gỡ gán vai trò.
Middleware: `verify` — Yêu cầu đăng nhập. Có check tồn tại trước → 404 rõ ràng nếu sai id (khác hành vi chung của BaseProvider).

---

# Patient

### GET /patient
Mô tả: Tìm kiếm bệnh nhân trong DB nội bộ (`his_patients`) — **không gọi HIS**.
Middleware: `queryModifier`
**Query:** `page` (mặc định 1), `pageSize` (mặc định 20, tối đa 100), `idbv` (lọc facility), `patientcode` (tìm chính xác `his_patient_id`), `patientphonenumber` (ILIKE trên `phone_number` HOẶC `identity_number`), `patientname` (ILIKE trên `patient_full_name`)
**Response (data):** `{ count, rows: [ /* toàn bộ field his_patients, xem model bên dưới */ ], totalPages, currentPage }`, sort `updated_at DESC`.
Ghi chú: Dữ liệu có thể cũ nếu bệnh nhân đó chưa từng được GET/POST đồng bộ.

### POST /patient
Mô tả: Tạo bệnh nhân mới **trên HIS trước**, rồi best-effort lưu (INSERT, không upsert) vào DB nội bộ.
**Query:** `ip`, `idbv`
**Body:** `patientid` (rỗng `""` để HIS tự tạo), `patientfirstname*`, `patientlastname*`, `patientnational`, `patientbirthday`, `patientbirthyear`, `patientsex`, `patientethnic`, `patientphonenumber`, `addressdetail`, `addressstreet`, `addressward`, `addresscity`, `addressprovince`, `addresscountry`, `professionid`
**Response (data):** **nguyên văn response từ HIS** (không phải DB row — khác pattern của GET/PUT `/patient/{id}`).
Ghi chú: 400 nếu thiếu `patientfirstname`/`patientlastname`. Lưu DB best-effort — lỗi (vd trùng `facility_id+his_patient_id`) chỉ log console, response vẫn trả 200 thành công.

### POST /patient/merge
Mô tả: Gộp 2 mã bệnh nhân trùng trên HIS (giữ `patientid_keep`, hủy `patientid_merge`), rồi best-effort xóa bản trùng khỏi DB.
**Body:** `patientid_keep*`, `patientid_merge*` (phải khác nhau)
**Response (data):** nguyên văn response từ HIS.
Ghi chú: Xóa DB chỉ theo `his_patient_id` (**không lọc theo `facility_id`**) — nếu trùng mã ở nhiều cơ sở sẽ xóa hết.

### GET /patient/{id}
Mô tả: Chi tiết bệnh nhân — `id` là **UUID bản ghi DB** (`hisPatient.id`), KHÔNG phải mã HIS. Tra UUID → lấy `his_patient_id`+`idbv` thật → gọi HIS → upsert lại DB → trả DB row.
**Path params:** `id` (uuid, PK trong DB)
**Query:** `ip`, `idbv` (override nếu truyền, mặc định lấy từ facility của bản ghi local)
**Response (data):** DB row `his_patients` mới nhất.
Ghi chú: 404 nếu UUID không tồn tại trong DB, hoặc nếu HIS trả rỗng.

### PUT /patient/{id}
Mô tả: Cập nhật bệnh nhân — `id` cũng là UUID DB. Tra UUID → gọi HIS PUT → update DB → đọc lại DB row mới nhất và trả về (KHÔNG trả raw HIS response).
**Path params:** `id` (uuid)
**Body:** các field kiểu HIS (`patientfirstname, patientlastname, patientnational, patientbirthday, patientbirthyear, patientsex, patientethnic, patientphonenumber, addressdetail, addressstreet, addressward, addresscity, addressprovince, addresscountry, professionid`) — tất cả optional.
**Response (data):** DB row `his_patients` sau update.
Ghi chú: 404 nếu UUID không tồn tại. `patientid` gửi lên HIS luôn bị ép về mã HIS thật (client không tự đổi được).

**Field đầy đủ của `his_patients` row:** `id, facility_id, his_patient_id, patient_first_name, patient_last_name, patient_full_name, national_code, birthday, birth_year, sex, ethnic_code, phone_number, address_detail, address_street, ward_code, district_code, province_code, country_code, profession_id, identity_number, insurance_number, insurance_expired_date_text, id_card_code, ethnic_name, ward_name, district_name, province_name, country_name, profession_name, address_full, his_updated_at, raw_data, synced_at, created_at, updated_at`.

---

# Doctors

### GET /doctors
Mô tả: Gọi HIS lấy danh sách bác sĩ mới nhất → upsert vào `his_doctors` → trả phân trang **từ DB**.
Middleware: `queryModifier`
**Query:** `page, pageSize, idbv`
**Response (data):** `{ count, rows: [{ id, facility_id, doctor_id, doctor_name, description, his_updated_at, raw_data, synced_at, created_at, updated_at, specialty_id, avatar_url }], totalPages, currentPage }`
Ghi chú: Upsert theo khóa `(facility_id, doctor_id)`. Sort `doctor_name ASC`. Nếu không resolve được `facility_id` → lỗi.

### POST /doctors
Mô tả: Tạo bác sĩ **thẳng vào DB local**, KHÔNG gọi HIS (khác hẳn GET/{id}/PUT/{id}/DELETE/{id} cùng resource).
**Body:** `facility_id*`, `doctor_id*`, `doctor_name*`, `description`, (+ `specialty_id`, `avatar_url`, `raw_data`... nhận thẳng không validate)
**Response (data):** row `his_doctors` vừa tạo.
Ghi chú: KHÔNG validate field bắt buộc ở handler — dựa vào constraint DB (NOT NULL, UNIQUE `facility_id+doctor_id`).

### GET /doctors/{id}
Mô tả: `id` = mã bác sĩ HIS. Gọi HIS `/api/doctor/{id}/` → upsert 1 row vào DB → trả DB row.
**Query:** `idbv`
**Response (data):** row `his_doctors`.

### PUT /doctors/{id}
Mô tả: Proxy thuần túy sang HIS (`PUT /api/doctor/{id}/`), **KHÔNG đụng DB**. Trả nguyên response HIS.

### DELETE /doctors/{id}
Mô tả: Proxy thuần túy sang HIS (`DELETE /api/doctor/{id}/`), **KHÔNG xóa bản ghi tương ứng trong DB local**. Trả nguyên response HIS.

### GET /doctors/export
Mô tả: Gọi HIS → upsert DB → xuất Excel từ **kết quả upsert** (không phân trang, toàn bộ 1 lần gọi HIS trả về).
**Response:** file `.xlsx` (`bac-si-<timestamp>.xlsx`) — cột: Mã bác sĩ, Tên bác sĩ, Mô tả.

### POST /doctors/import
Mô tả: Parse Excel (multipart `file`) → gọi HIS `POST /api/doctor/` cho từng dòng (song song `Promise.all`) — **KHÔNG ghi DB local**.
**Response (data):** `{ total, success, error, results: [{ row, doctor_id, doctor_name, status: 'success'|'error', error? }] }`
Ghi chú: Validate nhiều bước trước khi gọi HIS (thiếu file/sai định dạng/không có dữ liệu/thiếu doctor_id-doctor_name → 400). Từng dòng lỗi độc lập, không rollback dòng đã thành công.

### GET /doctors/template
Mô tả: Trả file Excel mẫu tĩnh (kèm sheet hướng dẫn), không đụng DB/HIS.

---

# Doctor Work Schedules

### GET /doctor-work-schedules
Mô tả: Danh sách lịch làm việc bác sĩ, kèm `doctor`+`exam_area`.
Middleware: `queryModifier`
**Query:** `page, pageSize, sortField, sortOrder, filters (không hoạt động), doctor_id, exam_area_id, schedule_date, date_from, date_to` (nếu vừa có `schedule_date` vừa có `date_from/date_to` thì `date_from/date_to` ghi đè).
**Response (data):** `{ count, rows: [{ id, doctor_id, exam_area_id, specialty_id, room_id, schedule_date, start_time, end_time, shift_code, max_appointments, booked_count, exam_fee, allow_booking, status, note, his_schedule_id, his_updated_at, raw_data, synced_at, created_at, updated_at, doctor: {id, doctor_id, doctor_name}, exam_area: {id, code, name, short_name} }], totalPages, currentPage }`

### POST /doctor-work-schedules
Middleware: `verify` — Yêu cầu đăng nhập
**Body:** `doctor_id*, exam_area_id*, schedule_date*, start_time*, end_time*` + optional (`specialty_id, room_id, shift_code, max_appointments, exam_fee, allow_booking (mặc định true), status (mặc định ACTIVE), note, his_schedule_id, his_updated_at, raw_data, synced_at`)
Ghi chú: Thiếu 1 trong 5 field bắt buộc → 400. Không validate FK ở tầng app.

### GET /doctor-work-schedules/{id}
Chi tiết + `doctor`/`exam_area` (attributes mở rộng hơn list). 404 nếu không tồn tại.

### PUT /doctor-work-schedules/{id}
Middleware: `verify`. Có check tồn tại trước → 404 rõ ràng. Body: mọi field optional.

### DELETE /doctor-work-schedules/{id}
Middleware: `verify`. Có check tồn tại trước → 404 rõ ràng.

---

# Rooms

### GET /rooms
Mô tả: Proxy live sang HIS (`GET /api/room/?ip=&idbv=`), **KHÔNG đụng DB local** — trả nguyên response HIS. (Chưa được đổi sang pattern DB, khác các resource khác.)

### POST /rooms
Mô tả: Tạo phòng khám **thẳng vào DB local** (`his_rooms`), KHÔNG gọi HIS.
**Body:** `facility_id*, room_id*, room_name*` + optional (`description, service_id, his_updated_at, raw_data`)
**Response (data):** row `his_rooms` vừa tạo.
Ghi chú: Không validate ở handler, dựa constraint DB (unique `facility_id+room_id`).

### GET /rooms/{id}
Mô tả: `id` = UUID PK trong DB (không phải `room_id` HIS). Đọc thẳng từ DB local, KHÔNG gọi HIS. 404 nếu không tồn tại.

### PUT /rooms/{id}
Mô tả: Proxy live sang HIS (`PUT /api/room/{id}/`), **KHÔNG đụng DB local**. `id` ở đây lại là mã HIS (khác ý nghĩa `id` ở GET cùng resource!). Trả nguyên response HIS.

### DELETE /rooms/{id}
Mô tả: Proxy live sang HIS (`DELETE /api/room/{id}/`), KHÔNG đụng DB local. Trả nguyên response HIS.

> ⚠️ Lưu ý UX: `GET /rooms/{id}` dùng `id` = UUID DB, còn `PUT`/`DELETE /rooms/{id}` dùng `id` = mã HIS — 2 ý nghĩa khác nhau trên cùng 1 path param của cùng 1 resource.

---

# HIS Services

### GET /his-services
Mô tả: Gọi HIS (`GET /api/service/?ip=&idbv=`) → upsert vào `his_services` → trả phân trang từ DB.
Middleware: `queryModifier`
**Response (data):** `{ count, rows: [{ id, facility_id, service_id, service_name, price, raw_data, synced_at, created_at, updated_at, specialty_id }], totalPages, currentPage }`, sort `service_name ASC`.

### POST /his-services
Mô tả: Proxy thẳng sang HIS (`POST /api/service/`), **KHÔNG lưu DB** (khác GET list/`{id}`/export).

### GET /his-services/{id}
Mô tả: `id` = mã dịch vụ HIS. Gọi HIS → upsert 1 row → trả DB row.

### PUT /his-services/{id}
Mô tả: Proxy thẳng sang HIS, KHÔNG đồng bộ lại DB.

### DELETE /his-services/{id}
Mô tả: Proxy thẳng sang HIS, KHÔNG xóa bản ghi DB tương ứng.

### GET /his-services/export
Mô tả: Gọi HIS → upsert DB → xuất Excel từ kết quả upsert (không phân trang).
**Response:** file `.xlsx` (`dich-vu-his-<timestamp>.xlsx`) — cột: Mã dịch vụ, Tên dịch vụ, Loại dịch vụ (từ `raw_data`), Đơn giá, Mô tả (từ `raw_data`).

---

# Specialties

### GET /specialties
Mô tả: Danh sách chuyên khoa.
Middleware: `queryModifier`
**Response (data):** `{ count, rows: [{ id, name, description, is_active, created_at, updated_at, created_by, updated_by }], totalPages, currentPage }`

### POST /specialties
Middleware: `verify`. **Body:** `name*`, `description`, `is_active` (mặc định true). Không validate `name` ở handler (dựa DB NOT NULL).

### GET /specialties/{id}
Mô tả: Chi tiết chuyên khoa, **kèm `his_doctors[]` và `his_services[]`** thuộc chuyên khoa đó (join qua `specialty_id`, dùng `separate: true` cho cả 2 include để tránh cartesian product khi số bác sĩ × số dịch vụ lớn). `required: false` → LEFT JOIN, không có bác sĩ/dịch vụ vẫn trả mảng rỗng. 404 nếu không tồn tại.

### PUT /specialties/{id}
Middleware: `verify`. **Không check tồn tại trước** → nếu `id` sai sẽ lỗi 500 chung (không phải 404).

### DELETE /specialties/{id}
Middleware: `verify`. Xóa cứng, không check FK với `his_doctors`/`his_services` đang tham chiếu `specialty_id`. Không check tồn tại trước → lỗi 500 chung nếu `id` sai.

---

# Danh mục HIS

Tất cả các endpoint dưới đây đều theo cùng 1 pattern: **gọi HIS → upsert (bulkUpsert, INSERT...ON CONFLICT DO UPDATE) vào bảng DB tương ứng → trả kết quả phân trang từ DB** (không phải raw response HIS). Middleware: `queryModifier`.

### GET /countries
HIS: `GET /api/countries/?ip=&idbv=` → bảng `his_countries`. Row: `{ id, facility_id, country_code, country_name, raw_data, synced_at, created_at, updated_at }`. Sort `country_name ASC`.

### GET /district
HIS: `GET /api/district/?ip=&idbv=&city=` → bảng `his_districts`. Query thêm `city` (lọc `province_code`, có fallback nếu HIS không trả). Row: `{ id, facility_id, province_code, district_code, district_name, district_type, raw_data, synced_at, created_at, updated_at }`. Sort `district_name ASC`.

### GET /nation
HIS: `GET /api/nation/?ip=&idbv=` → bảng `his_nations`. Row: `{ id, facility_id, nation_id, nation_name, raw_data, synced_at, created_at, updated_at }`. Sort `nation_name ASC`.

### GET /profession
HIS: `GET /api/profession/?ip=&idbv=` → bảng `his_professions`. Row: `{ id, facility_id, profession_id, profession_name, raw_data, synced_at, created_at, updated_at }`. Sort `profession_name ASC`.

### GET /provinces
HIS: `GET /api/provinces/?ip=&idbv=` → bảng `his_provinces`. Row: `{ id, facility_id, province_code, province_name, raw_data, synced_at, created_at, updated_at }`. Sort `province_name ASC`.

### GET /ward
HIS: `GET /api/ward/?ip=&idbv=` → bảng `his_wards`. Query thêm `districtcode` (lọc `district_code`). Row: `{ id, facility_id, district_code, ward_code, ward_name, ward_type, raw_data, synced_at, created_at, updated_at }`. Sort `ward_name ASC`.

Tất cả: nếu không resolve được `facility_id` (từ `idbv`, fallback facility `is_active=true`) → lỗi (throw, rơi vào `sendError`).

---

# Exam Areas

### GET /exam-areas
Middleware: `queryModifier`. **Response (data):** `{ count, rows: [{ id, code, name, short_name, address, phone, description, status, created_at, updated_at }], totalPages, currentPage }`. Sort mặc định `created_at DESC`.

### POST /exam-areas
Middleware: `verify`. **Body:** `code*, name*` (không validate ở handler, dựa DB) + `short_name, address, phone, description, status (mặc định ACTIVE)`.

### GET /exam-areas/{id}
404 nếu không tồn tại.

### PUT /exam-areas/{id}
Middleware: `verify`. **Không check tồn tại trước** → lỗi 500 chung nếu `id` sai.

### PATCH /exam-areas/{id}
Middleware: `verify`. Đảo trạng thái `ACTIVE`↔`INACTIVE`. 404 nếu không tồn tại.

### DELETE /exam-areas/{id}
Middleware: `verify`. Không check tồn tại trước → lỗi 500 chung nếu sai id. Có thể lỗi do FK nếu còn `doctor_work_schedules` tham chiếu.

### GET /exam-areas/export
Xuất toàn bộ (không phân trang) ra Excel, sort `created_at DESC`. Cột: Mã, Tên, Tên viết tắt, Địa chỉ, SĐT, Mô tả, Trạng thái.

---

# Appointments

> Toàn bộ endpoint dưới đây **proxy trực tiếp tới HIS**, trả nguyên `response.data` từ HIS (không transform). Việc lưu lịch sử vào DB nội bộ là **best-effort** (không `await` đầy đủ hoặc lỗi bị nuốt bằng `.catch(()=>{})`), không ảnh hưởng response trả về client.

### GET /appointments
Mô tả: Kiểm tra lịch hẹn hiện có của bệnh nhân — HIS `GET /api/checkbooking`.
**Query:** `patientcode*`, `ngay` (DD/MM/YYYY), `idbv`
Ghi chú: Best-effort lưu `appointment_check_requests` + N dòng `appointment_check_results`.

### POST /appointments
Mô tả: Tạo lịch hẹn mới — HIS `POST /api/createbooking`.
**Body:** `bookingId, patientId, scheduleId, date, roomId, doctorId, doituongkham, serviceId, mavaovien, stt, payment{}, insuranceDetail{}, relative_name, relative_type_id, relative_mobile, relative_email, relative_identitycard`
Ghi chú: Best-effort lưu `appointment_bookings` (local_status=`HIS_SYNCED`) + `appointment_booking_insurances`/`payments`/`relatives` (nếu có data tương ứng) + `appointment_status_histories` (CONFIRMED) trong 1 transaction.

### GET /appointments/cancel
Mô tả: Hủy lịch hẹn — HIS `GET /api/createbooking?bookingid=` (dùng chung endpoint GET để hủy).
**Query:** `bookingid*`, `reason`
Ghi chú: Best-effort — chỉ ghi nhận nếu tìm thấy `appointment_bookings` có `his_booking_id` trùng `bookingid` trong DB nội bộ (nếu không có, bỏ qua, không lỗi). Có thì: tạo `appointment_booking_cancellations` (SUCCESS), update `local_status='CANCELED'`, ghi `appointment_status_histories`.

---

# Appointment Bookings

### GET /appointment-bookings
Mô tả: Danh sách lịch đặt khám đọc **thẳng từ DB nội bộ** (`appointment_bookings`), **không gọi HIS**. API mới (khác `/appointments` ở trên).
Middleware: `queryModifier`
**Query:** `page, pageSize, sortField, sortOrder, facility_id, patient_id, his_patient_id, doctor_id, room_id, service_id, status (→local_status), source, from_date, to_date` (khoảng `appointment_time`)
**Response (data):**
```json
{
  "count": 0, "totalPages": 0, "currentPage": 1,
  "rows": [{
    "id":"uuid","facility_id":"uuid","idempotency_key":"...","patient_id":"uuid","his_patient_id":"...",
    "his_booking_id":"...","his_mavaovien":"...","request_booking_id":"...","schedule_id":"...",
    "appointment_time":"date","room_id":"...","doctor_id":"...","exam_object_code":"...","service_id":"...",
    "request_mavaovien":"...","request_stt":"...","confirmed_stt":"...","booking_type":"...","source":"...",
    "local_status":"...","his_action":"...","his_status":"...","his_error_code":"...","his_error_message":"...",
    "retry_count":0,"last_sync_at":"date","raw_his_create_request":{},"raw_his_create_response":{},
    "note":"...","created_by":"uuid","created_at":"date","updated_at":"date",
    "patient": { "id":"uuid","his_patient_id":"...","patient_full_name":"...","phone_number":"..." },
    "facility": { "id":"uuid","facility_name":"...","idbv":"..." }
  }]
}
```
Sort mặc định `appointment_time DESC`. Đã tận dụng index sẵn có (`facility_id+his_patient_id+appointment_time`, `facility_id+local_status+appointment_time`) nên filter nhanh cả khi data lớn.

---

# Appointment Reviews

### GET /appointment-reviews
Middleware: `queryModifier`
**Query:** `page, pageSize, sortField, sortOrder, filters (không hoạt động), facility_id, doctor_id, exam_area_id, patient_id, appointment_id, status, source, min_rating, max_rating`
**Response (data):** `{ count, rows: [{ id, facility_id, appointment_id, patient_id, doctor_id, exam_area_id, specialty_id, room_id, overall_rating, doctor_rating, service_rating, facility_rating, waiting_time_rating, comment, admin_reply, admin_replied_at, is_anonymous, status, source, raw_data, created_at, updated_at, doctor: {id,doctor_id,doctor_name}, exam_area: {id,code,name,short_name}, facility: {id,facility_name,idbv}, patient: {id,patient_full_name,phone_number} }], totalPages, currentPage }`

Ghi chú: include `facility` dùng `facility_name` (không dùng cột `name`) và danh sách có thêm include `patient`. Xem mục chi tiết đã gộp bên dưới để biết đầy đủ field join.

### POST /appointment-reviews
Middleware: `verify`. **Body:** `facility_id*, overall_rating* (1-5)` + optional (`appointment_id, patient_id, doctor_id, exam_area_id, specialty_id, room_id, doctor_rating, service_rating, facility_rating, waiting_time_rating, comment, is_anonymous (mặc định false), status (mặc định PENDING), source (mặc định APP), raw_data`).
Ghi chú: 400 nếu thiếu `facility_id`/`overall_rating`, hoặc rating ngoài 1–5.

### GET /appointment-reviews/{id}
Chi tiết + `doctor`/`exam_area`/`facility`/`patient`. 404 nếu không tồn tại.

### PUT /appointment-reviews/{id}
Middleware: `verify`. Có check tồn tại → 404 rõ ràng. Chỉ field có trong body mới được update. Nếu truyền `admin_reply` mà chưa có `admin_replied_at` → tự set `now()`.

### DELETE /appointment-reviews/{id}
Middleware: `verify`. Có check tồn tại → 404 rõ ràng.

---

# Notifications

### GET /notifications
Middleware: `middle` (pattern B — filter thật hoạt động, cú pháp `field==value|field2==value2`)
**Query:** `currentPage, pageSize, filters, sortField, sortOrder`
**Response (data):** `{ count, rows: [{ id, title, content, category, sub_category, belongs_to_user_id, has_user_read, sent_time, has_noti_sent, expired_at, created_at, updated_at }], totalPages, currentPage }`

### POST /notifications
Mô tả: Tạo hàng loạt thông báo (body = mảng object). Item có `belongs_to_user_id` hợp lệ → tạo riêng cho user đó (`bulkCreate`). Item có `belongs_to_user_id` là `null`/**thiếu hẳn field**/`undefined` → **broadcast cho TOÀN BỘ user** bằng 1 câu raw SQL (`INSERT INTO "notification" ... SELECT gen_random_uuid(), "u"."id", ... FROM "public"."user" AS "u" RETURNING *`), không loop JS.
**Body (mảng):** mỗi phần tử `{ belongs_to_user_id?, title?, content?, category?, sub_category?, has_user_read?, has_noti_sent?, sent_time?, expired_at? }`
**Response (data):** mảng toàn bộ notification đã tạo (gồm cả row broadcast).
Ghi chú: Sau khi tạo, gửi push OneSignal cho từng bản ghi qua `Promise.allSettled` — lỗi gửi chỉ log, không rollback DB, không fail request.

### PUT /notifications/markAsRead
Mô tả: Đánh dấu đã đọc hàng loạt theo `filters`. **Nếu không truyền `filters` → update TOÀN BỘ bảng `notification`** — cẩn trọng.
Middleware: `middle`
**Response (data):** `[affectedCount]`

### PUT /notifications/markAsRead/{id}
Mô tả: Đánh dấu đã đọc 1 thông báo theo ID.
Ghi chú: Không check tồn tại trước → lỗi 500 chung nếu `id` sai (không phải 404).

---

# Page Config

### GET /page-config
Middleware: `middle` (pattern B). **Response (data):** `{ count, rows: [{ id, name, code, content, created_at, updated_by, updated_at, deleted_at }], totalPages, currentPage }`. Sort `created_at DESC`.

### POST /page-config
**Body:** `name, code, content` — không validate bắt buộc ở handler.

### GET /page-config/{id}
Không check 404 — nếu `id` sai vẫn trả 200 với `data: null`.

### PUT /page-config/{id}
Không check tồn tại trước → lỗi 500 chung nếu `id` sai.

### DELETE /page-config/{id}
Mô tả: **Xóa cứng** (dù model có cột `deleted_at`, cột này không được dùng cho soft-delete ở đây). **Response (data):** chuỗi cố định `"Successfully delete item"`. Lỗi 500 chung nếu `id` sai.

---

# Dashboard

Tất cả yêu cầu `verify` — Bearer token. Đọc dữ liệu qua SQL function raw (`public.fn_dashboard_*`) chứ không qua model Sequelize thông thường.

### GET /dashboard/stats
**Query:** `fromDate` (YYYY-MM-DD, mặc định đầu ngày hôm nay), `toDate` (mặc định hiện tại), `facilityId` (UUID)
**Response (data):** `{ totalRevenue, totalRefund, netRevenue, totalTickets, paidTickets, cancelledTickets, totalDoctors, totalContents, totalReviews, avgRating }`
Ghi chú: 400 nếu sai định dạng ngày, `fromDate > toDate`, hoặc `facilityId` sai UUID.

### GET /dashboard/recent-tickets
**Query:** `limit` (mặc định 10, tối đa 100), `facilityId` (UUID)
**Response (data):** mảng `{ bookingId, facilityId, facilityName, hisBookingId, hisMavaovien, requestStt, confirmedStt, appointmentTime, localStatus, hisStatus, patientId, hisPatientId, patientName, patientPhone, doctorCode, doctorName, roomCode, roomName, serviceCode, serviceName, servicePrice, paymentAmount, paymentStatus, paidAmount, refundedAmount, netRevenue, createdAt }`

### GET /dashboard/ticket-ratios
**Query:** `fromDate, toDate, facilityId`
**Response (data):** mảng `{ ticketStatus, totalCount, ratioPercent }`

### GET /dashboard/upcoming-schedules
**Query:** `scheduleDate` (YYYY-MM-DD, mặc định do SQL function tự quyết định nếu bỏ trống), `facilityId`
**Response (data):** mảng `{ scheduleId, facilityId, facilityName, doctorId, doctorCode, doctorName, examAreaId, examAreaCode, examAreaName, examAreaShortName, specialtyId, specialtyName, roomId, roomCode, roomName, scheduleDate, startTime, endTime, shiftCode, maxAppointments, bookedCount, availableCount, examFee, allowBooking, status, note, hisScheduleId, syncedAt }`

---

# Posts

### GET /posts
Middleware: Không (**public, không có auth nào**). Tự parse query, không dùng `queryModifier`.
**Query:** `currentPage (mặc định 1), pageSize (mặc định 10), category_id, status, is_featured, search (ILIKE trên name/description), sort_by (whitelist: published_at/created_at/view_count, mặc định created_at), sort_order (mặc định DESC)`
**Response (data):** `{ count, rows: [{ id, name, description, content, img_path, created_at, created_by, updated_at, updated_by, category_id, slug, thumbnail_path, status, is_featured, view_count, published_at, deleted_at, category: {id,name,slug} }], totalPages, currentPage }`
Ghi chú: mặc định lọc `deleted_at IS NULL`.

### POST /posts
Middleware: Không (public). **Body:** `name*` (theo model NOT NULL, không validate ở handler) + `description, content, img_path (mặc định []), category_id, slug, thumbnail_path, status (mặc định DRAFT), is_featured (mặc định false), created_by`.

### GET /posts/{id}
Middleware: Không. Kèm `category` + `post_media[]` (`{id, post_id, file_path, file_name, file_type, file_size, media_type, alt_text, sort_order, created_at, created_by}`). 404 nếu không tồn tại/đã xóa mềm.

### PATCH /posts/{id}
Middleware: Không. Không check tồn tại trước → lỗi 500 chung nếu `id` sai.

### DELETE /posts/{id}
Middleware: Không. Xóa mềm (`deleted_at`). 404 nếu không tồn tại/đã xóa. Không xóa kèm media liên quan.

### POST /posts/{id}/media
Mô tả: Upload 1 file (multipart, field `file`) đính kèm bài viết.
Middleware: Không. **Body:** `file*` (multipart), `media_type` (THUMBNAIL/CONTENT/GALLERY, mặc định CONTENT), `alt_text`, `sort_order` (mặc định 0)
**Response (data):** `{ id, post_id, file_path, file_name, file_type, file_size, media_type, alt_text, sort_order, created_at, created_by, url }`
Ghi chú: 404 nếu bài viết không tồn tại trước khi xử lý upload. File lưu vào `storage/<images|videos|files>/posts/`. 400 nếu không có file.

### DELETE /posts/{id}/media/{mediaId}
Mô tả: Xóa cứng 1 media (chỉ xóa record DB, **không xóa file vật lý**). 404 nếu không khớp cả `id`+`mediaId`.

---

# Post Categories

### GET /post-categories
Middleware: Không (public). **Query:** `currentPage (mặc định 1), pageSize (mặc định 50), is_active`
**Response (data):** `{ count, rows: [{ id, name, slug, description, parent_id, sort_order, is_active, created_at, created_by, updated_at, updated_by, deleted_at }], totalPages, currentPage }`. Mặc định lọc `deleted_at IS NULL`. Sort `sort_order ASC, created_at DESC`.

### POST /post-categories
Middleware: Không. **Body:** `name*` (NOT NULL, không validate ở handler) + `slug, description, parent_id, sort_order (mặc định 0), is_active (mặc định true), created_by`.

### GET /post-categories/{id}
404 nếu không tồn tại/đã xóa.

### PATCH /post-categories/{id}
Không check tồn tại trước → lỗi 500 chung nếu `id` sai.

### DELETE /post-categories/{id}
Xóa mềm. 404 nếu không tồn tại. **400 nếu còn bài viết (`posts.category_id=id AND deleted_at IS NULL`) đang thuộc danh mục** — chặn xóa.

---

# Payment — MoMo

### POST /payment/momo/createOrder
Mô tả: Tạo đơn thanh toán MoMo (captureWallet), trả `payUrl`/`deeplink`/QR. API cho **frontend** gọi (không phải webhook).
**Body:** `bookingId*, amount* (≥1000), orderInfo, redirectUrl, lang (vi/en, mặc định vi)`
**Response (data):** `{ requestId, orderId, amount, payUrl, deeplink, qrCodeUrl, deeplinkMiniApp }`
Ghi chú: 400 nếu thiếu `bookingId`/`amount` không hợp lệ. 502 nếu MoMo trả `resultCode !== 0`.

### POST /payment/momo/ipn
Mô tả: **Webhook** MoMo gọi server-to-server báo kết quả thanh toán.
Ghi chú: **Luôn trả HTTP 200** `{message:'ok'}` dù thành công hay lỗi (yêu cầu của MoMo) — mọi lỗi (sai chữ ký, resultCode≠0, giao dịch trùng, không tìm thấy booking) chỉ log, không trả lỗi HTTP khác. Nếu hợp lệ + `resultCode=0`: check trùng `transaction_id` (idempotent) trong `appointment_booking_payments`, tạo payment (PAID, gateway=MOMO) + update `appointment_bookings.local_status='PAID'` trong 1 transaction.

### GET /payment/momo/redirect
Mô tả: Trang trình duyệt MoMo redirect về sau thanh toán — chỉ hiển thị kết quả, **KHÔNG cập nhật DB** (DB do `ipn` đảm nhiệm).
**Query:** `orderId*, transId*, resultCode*, amount*, payType, message, signature*`
**Response (data):** `{ success, resultCode, message, orderId, transId, amount, payType }`
Ghi chú: 400 nếu chữ ký sai.

---

# Payment — VCB

### POST /payment/vcb/genQR
Mô tả: Tạo VietQR động qua VCB. API cho frontend gọi.
**Body:** `billNumber* (=booking id), amount, description, expiryMinutes (mặc định 15)`
**Response (data):** `{ qrData }`
Ghi chú: 400 nếu thiếu `billNumber`. Gọi `getVCBToken` (OAuth) trước khi genQR. 502 nếu VCB lỗi.

### POST /payment/vcb/inquiry
Mô tả: **Webhook** VCB gọi vào tra cứu hóa đơn trước khi cho thanh toán. Đọc `appointment_bookings` + `appointment_booking_payments` (alias `payment`), không ghi DB.
**Response (data):** format chuẩn VCB `{ context, payload: { responseCode, bills: [{billNumber, billAmount, issueDate}] }, signature }`
Ghi chú: Luôn 200. Sai chữ ký → `FAILURE/INVALID_SIGNATURE_PARTNER`. Không tìm thấy booking → `FAILURE/INVALID_USER`. Đã `PAID` → `responseCode:'1', bills:[]`. ⚠️ **Bug:** đọc `booking.dataValues.amount` nhưng model `appointmentBooking` **không có cột `amount`** → `billAmount` luôn `undefined` → fallback `0`.

### POST /payment/vcb/callback
Mô tả: **Webhook** VCB báo giao dịch QR thành công. Ghi `appointment_booking_payments` + update `appointment_bookings.local_status`.
**Body:** `context{channelId, channelRefNumber, requestDateTime}, payload{totalPaymentAmount, bills[{billNumber, billAmount,...}]}, signature`
Ghi chú: Luôn 200 theo format VCB. Xử lý từng bill độc lập: trùng `transaction_id` → resultCode `'1'` (idempotent); không tìm thấy booking → resultCode `'1'`; hợp lệ → tạo payment (PAID, gateway=VCB) + update `local_status='PAID'`, resultCode `'0'`.

---

# Files

### GET /files
Mô tả: Liệt kê file đã upload trong 3 thư mục (`images/videos/files`) — đọc filesystem, không dùng DB.
Middleware: Không (dòng `verify` bị comment out trong code).
**Response (data):** `{ images: [...paths], videos: [...paths], files: [...paths] }`

### POST /files
Mô tả: Upload 1 file, nén thành nhiều phiên bản (desktop/tablet/mobile, + preload/preview nếu ảnh) **chạy nền** (không chờ nén xong).
Middleware: Không. **Body (multipart):** `file*`
**Response (data):** `{ fileName, contentType, original }`
Ghi chú: Lỗi nén chỉ log, không ảnh hưởng response.

### DELETE /files
Mô tả: Xóa 1 file + toàn bộ biến thể nén liên quan.
**Body:** `filePath*` (dạng `/images|videos|files/<tên-file>`)
Ghi chú: 400 nếu thiếu/sai format `filePath`. 404 nếu không tìm thấy file nào để xóa.

---

# ChatData

### GET /chatData
Mô tả: Toàn bộ dữ liệu chat (ngữ cảnh cho chatbot AI), Mongo, sort `createdAt DESC`, **không phân trang**.
**Response (data):** mảng `{ id, title, content, fileType (text/word), htmlContent, imageCount, date }`

### POST /chatData
**Body:** `title*, content*` + `fileType (mặc định text), htmlContent, imageCount (mặc định 0)`. 400 nếu thiếu title/content.

### DELETE /chatData/{id}
Mô tả: Xóa 1 mục (Mongo `findByIdAndDelete` — nếu `id` không tồn tại vẫn báo thành công, Mongoose không throw).

---

# Ask

### POST /ask
Mô tả: Hỏi AI (Gemini), dùng `ChatData` (Mongo) làm ngữ cảnh (RAG đơn giản qua regex match, fallback lấy 6 bản ghi mới nhất nếu không khớp).
**Body:** `question*`
**Response (data):** `{ answer, references: [{ id, title, content, fileType, htmlContent, imageCount, date }] }`
Ghi chú: 500 nếu thiếu cấu hình Gemini API key.

---


---

<!-- MERGED_API_DOCS_START -->
# Tài liệu API chi tiết đã gộp

Phần này gộp nội dung chi tiết từ các file tài liệu rời để `api-full-reference.md` là điểm tham chiếu duy nhất.

## Revenue By Day API

_Nguồn đã gộp: `revenue-by-day-api.md`_

API cung cấp dữ liệu **doanh thu theo ngày** dùng cho biểu đồ chart (như ảnh "Doanh thu theo ngày" 7 cột).

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1.0/dashboard/revenue-by-day` | Bearer | Doanh thu theo ngày (dữ liệu chart) |

- Controller: [`revenue-by-day.ts`](../src/controllers/api/v1.0/dashboard/revenue-by-day.ts)
- Provider: [`DashboardProvider.getRevenueByDay()`](../src/providers/dashboardProvider.ts)

Response format theo convention chung của project (`res.sendOk` → `apiResponseDTO`), payload nằm trong `responseData`.

---

### 1. Request

| | |
|---|---|
| Method | `GET` |
| URL | `/api/v1.0/dashboard/revenue-by-day` |
| Auth | **Bắt buộc** Bearer token (middleware `verify`) |
| Content-Type | không có body |

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả | Mặc định |
|---|---|---|---|---|
| `fromDate` | `string` (YYYY-MM-DD) | Không | Từ ngày | 7 ngày trước hiện tại |
| `toDate` | `string` (YYYY-MM-DD) | Không | Đến ngày | hiện tại (hôm nay) |
| `facilityId` | `string` (UUID) | Không | Lọc theo cơ sở y tế | không lọc (toàn hệ thống) |

**Ví dụ:**

```bash
TOKEN="<bearer_token>"
BASE="http://localhost:3000/api/v1.0"

# Mặc định 7 ngày gần đây
curl -s "$BASE/dashboard/revenue-by-day" \
  -H "Authorization: Bearer $TOKEN"

# Custom range
curl -s "$BASE/dashboard/revenue-by-day?fromDate=2026-05-01&toDate=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"

# Custom range + lọc facility
curl -s "$BASE/dashboard/revenue-by-day?fromDate=2026-05-12&toDate=2026-05-18&facilityId=11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Response — thành công (200)

Mảng object, mỗi object là doanh thu của 1 ngày, sắp xếp tăng dần theo date:

```json
{
  "message": "Lấy doanh thu theo ngày thành công",
  "message_en": "Get revenue by day successful",
  "responseData": [
    { "date": "2026-05-12", "revenue": 65000000 },
    { "date": "2026-05-13", "revenue": 80000000 },
    { "date": "2026-05-14", "revenue": 120000000 },
    { "date": "2026-05-15", "revenue": 90000000 },
    { "date": "2026-05-16", "revenue": 110000000 },
    { "date": "2026-05-17", "revenue": 100000000 },
    { "date": "2026-05-18", "revenue": 135000000 }
  ],
  "status": "success",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**Giải thích:**

| Field | Kiểu | Ý nghĩa | Cách tính |
|---|---|---|---|
| `date` | `string` (YYYY-MM-DD) | Ngày | DATE(payment_time hoặc created_at nếu payment_time null) |
| `revenue` | `number` | Doanh thu ngày đó (VNĐ) | `SUM(appointment_booking_payments.amount)` WHERE `payment_status = 'PAID'` AND ngày trong `fromDate`–`toDate` |

---

### 3. Data source

```sql
SELECT
  DATE(COALESCE(pay.payment_time, pay.created_at)) AS date,
  COALESCE(SUM(pay.amount), 0) AS revenue
FROM appointment_booking_payments pay
JOIN appointment_bookings ab ON ab.id = pay.booking_id
WHERE pay.payment_status = 'PAID'
  AND COALESCE(pay.payment_time, pay.created_at) >= fromDate
  AND COALESCE(pay.payment_time, pay.created_at) <= toDate
  AND (facilityId IS NULL OR ab.facility_id = facilityId)
GROUP BY DATE(COALESCE(pay.payment_time, pay.created_at))
ORDER BY date ASC
```

**Lưu ý:**
- Chỉ tính payment có `payment_status = 'PAID'` (đã thanh toán thành công).
- Ngày được tính dựa trên `payment_time` (nếu có), nếu null thì dùng `created_at`.
- Nếu ngày nào không có payment PAID, **không xuất hiện** trong kết quả (khác với chart có thể muốn fill 0 cho ngày trống — nếu cần, phải xử lý ở frontend).
- Kết quả sắp xếp tăng dần theo date (12/05, 13/05, ..., 18/05).

---

### 4. Response — lỗi

**400 — `fromDate`/`toDate` không hợp lệ định dạng:**
```json
{
  "message": "Ngày không hợp lệ, định dạng YYYY-MM-DD",
  "message_en": "Ngày không hợp lệ, định dạng YYYY-MM-DD",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**400 — `fromDate > toDate`:**
```json
{
  "message": "fromDate không được lớn hơn toDate",
  "message_en": "fromDate không được lớn hơn toDate",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**400 — `facilityId` không phải UUID:**
```json
{
  "message": "facilityId không hợp lệ (phải là UUID)",
  "message_en": "facilityId không hợp lệ (phải là UUID)",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token** (middleware `verify` chặn):
```json
{
  "message": "Unauthorized",
  "message_en": "Unauthorized",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

---

### 5. Trường hợp đặc biệt

#### 5.1. Không truyền `fromDate`

API **tự động** mặc định `fromDate = toDate - 7 ngày` (7 ngày gần đây).

```bash
# Tương đương với fromDate=2026-05-11&toDate=2026-05-18 (khi hôm nay là 18/05)
curl -s "$BASE/dashboard/revenue-by-day" \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.2. Ngày nào không có doanh thu

**Không** có record cho ngày đó trong response (không fill 0 tự động ở backend). Nếu frontend cần hiện full grid 7 ngày (kể cả ngày 0 doanh thu), frontend phải fill thêm.

**Ví dụ:** từ 12/05 đến 18/05, nhưng chỉ có 6 ngày có payment, thì response chỉ trả 6 object, không có object cho ngày không có payment.

#### 5.3. Lọc theo facility

Nếu `facilityId` không có payment nào, response là `[]` (mảng rỗng, HTTP 200, không lỗi).

---

### 6. Checklist test

- [ ] **Mặc định 7 ngày**: gọi không truyền `fromDate` → kết quả từ 7 ngày trước hiện tại đến hôm nay.
- [ ] **Custom range**: truyền `fromDate=2026-05-01&toDate=2026-05-31` → kết quả đúng khoảng.
- [ ] **Validate date format**: truyền `fromDate=invalid` → 400.
- [ ] **Validate fromDate <= toDate**: `fromDate=2026-05-31&toDate=2026-05-01` → 400 "fromDate không được lớn hơn toDate".
- [ ] **Filter facility**: truyền `facilityId=...` → chỉ tính payment của booking thuộc facility đó; facility khác → 0 doanh thu cho ngày đó.
- [ ] **Validate facilityId UUID**: truyền không phải UUID → 400.
- [ ] **Sort tăng dần**: `date` trong response từ nhỏ đến lớn (12/05 trước, 18/05 sau).
- [ ] **Chỉ PAID**: tạo payment với `payment_status = PENDING` → không xuất hiện ở doanh thu.
- [ ] **Ngày không có payment**: không có object cho ngày đó (response không fill 0 tự động).
- [ ] **Auth**: không có token → 401; có token không hợp lệ → 401.
- [ ] **Số liệu**: so kết quả với `SELECT DATE(...), SUM(amount) ... WHERE status='PAID'` trong DB để verify.

---

## Hướng Dẫn Sử Dụng Province Open API Việt Nam v2

_Nguồn đã gộp: `province_open_api_v2_cach_dung.md`_

Tài liệu này tổng hợp cách sử dụng API dữ liệu hành chính Việt Nam từ **Province Open API v2**.

Base URL:

```txt
https://provinces.open-api.vn/api/v2
```

> Lưu ý: API v2 dùng cho dữ liệu hành chính Việt Nam sau sáp nhập tỉnh/thành từ 07/2025. Nếu hệ thống cần dữ liệu mới, nên dùng `/api/v2` thay vì `/api` hoặc `/api/v1`.

---

### 1. Danh sách API chính

| Chức năng | Method | Endpoint | Mô tả |
|---|---:|---|---|
| Lấy danh sách tỉnh/thành | GET | `/p/` | Trả về danh sách tỉnh/thành |
| Lấy chi tiết tỉnh/thành | GET | `/p/{code}` | Trả về chi tiết một tỉnh/thành theo mã code |
| Lấy danh sách phường/xã | GET | `/w/` | Trả về danh sách phường/xã |
| Lấy chi tiết phường/xã | GET | `/w/{code}` | Trả về chi tiết một phường/xã theo mã code |

---

### 2. Lấy danh sách tỉnh/thành

#### Endpoint

```http
GET /p/
```

#### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/p/
```

#### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `search` | string | Không | Tìm kiếm tỉnh/thành theo tên |

#### Ví dụ request

Lấy toàn bộ tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/
```

Tìm kiếm tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/?search=Hà Nội
```

#### Response mẫu

```json
[
  {
    "name": "Thành phố Hà Nội",
    "code": 1,
    "division_type": "thành phố trung ương",
    "codename": "ha_noi",
    "phone_code": 24,
    "wards": []
  }
]
```

---

### 3. Lấy chi tiết tỉnh/thành theo code

#### Endpoint

```http
GET /p/{code}
```

#### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/p/1
```

#### Path params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `code` | number | Có | Mã tỉnh/thành |

#### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `depth` | number | Không | Mức độ dữ liệu trả về. Nhận giá trị `1` hoặc `2` |

#### Ý nghĩa `depth`

| Giá trị | Mô tả |
|---:|---|
| `1` | Chỉ lấy thông tin tỉnh/thành |
| `2` | Lấy thông tin tỉnh/thành kèm danh sách phường/xã |

#### Ví dụ request

Lấy chi tiết tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/1
```

Lấy chi tiết tỉnh/thành kèm danh sách phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/p/1?depth=2
```

#### Response mẫu với `depth=1`

```json
{
  "name": "Thành phố Hà Nội",
  "code": 1,
  "division_type": "thành phố trung ương",
  "codename": "ha_noi",
  "phone_code": 24,
  "wards": []
}
```

#### Response mẫu với `depth=2`

```json
{
  "name": "Thành phố Hà Nội",
  "code": 1,
  "division_type": "thành phố trung ương",
  "codename": "ha_noi",
  "phone_code": 24,
  "wards": [
    {
      "name": "Phường Hoàn Kiếm",
      "code": 4,
      "division_type": "phường",
      "codename": "phuong_hoan_kiem",
      "province_code": 1
    }
  ]
}
```

---

### 4. Lấy danh sách phường/xã

#### Endpoint

```http
GET /w/
```

#### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/w/
```

#### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `province` | number | Không | Lọc phường/xã theo mã tỉnh/thành |
| `search` | string | Không | Tìm kiếm phường/xã theo tên |

#### Ví dụ request

Lấy toàn bộ phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/w/
```

Lấy phường/xã theo tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/w/?province=1
```

Tìm kiếm phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/w/?search=Bà Rịa
```

Kết hợp lọc theo tỉnh/thành và tìm kiếm:

```http
GET https://provinces.open-api.vn/api/v2/w/?province=79&search=Bà Rịa
```

#### Response mẫu

```json
[
  {
    "name": "Phường Bà Rịa",
    "code": 26560,
    "division_type": "phường",
    "codename": "phuong_ba_ria",
    "province_code": 79
  }
]
```

---

### 5. Lấy chi tiết phường/xã theo code

#### Endpoint

```http
GET /w/{code}
```

#### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/w/26560
```

#### Path params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `code` | number | Có | Mã phường/xã |

#### Ví dụ request

```http
GET https://provinces.open-api.vn/api/v2/w/26560
```

#### Response mẫu

```json
{
  "name": "Phường Bà Rịa",
  "code": 26560,
  "division_type": "phường",
  "codename": "phuong_ba_ria",
  "province_code": 79
}
```

---

### 6. Flow sử dụng trong form địa chỉ

Khi làm form chọn địa chỉ, nên triển khai theo flow sau:

```txt
Bước 1: Load danh sách tỉnh/thành
GET /p/

Bước 2: Người dùng chọn tỉnh/thành
Lưu province.code và province.name

Bước 3: Load danh sách phường/xã theo province_code
GET /w/?province={province_code}

Bước 4: Người dùng chọn phường/xã
Lưu ward.code, ward.name và ward.province_code

Bước 5: Người dùng nhập địa chỉ chi tiết
Ví dụ: số nhà, tên đường

Bước 6: Ghép thành địa chỉ đầy đủ
address_detail + ward_name + province_name
```

Ví dụ địa chỉ đầy đủ:

```txt
123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh
```

---

### 7. Cấu trúc lưu database khuyến nghị

Nên lưu cả `code` và `name` để tránh trường hợp API thay đổi hoặc cần hiển thị lại dữ liệu cũ.

```sql
province_code INTEGER,
province_name VARCHAR(255),
ward_code INTEGER,
ward_name VARCHAR(255),
address_detail TEXT,
full_address TEXT
```

Ví dụ:

```json
{
  "province_code": 79,
  "province_name": "Thành phố Hồ Chí Minh",
  "ward_code": 26560,
  "ward_name": "Phường Bà Rịa",
  "address_detail": "123 Nguyễn Văn Linh",
  "full_address": "123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh"
}
```

---

### 8. Ví dụ gọi API bằng JavaScript

```js
const BASE_URL = 'https://provinces.open-api.vn/api/v2';

export async function getProvinces(search = '') {
  const url = new URL(`${BASE_URL}/p/`);

  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách tỉnh/thành');
  }

  return response.json();
}

export async function getProvinceDetail(code, depth = 1) {
  const url = new URL(`${BASE_URL}/p/${code}`);
  url.searchParams.set('depth', String(depth));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy chi tiết tỉnh/thành');
  }

  return response.json();
}

export async function getWards({ provinceCode, search } = {}) {
  const url = new URL(`${BASE_URL}/w/`);

  if (provinceCode) {
    url.searchParams.set('province', String(provinceCode));
  }

  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách phường/xã');
  }

  return response.json();
}

export async function getWardDetail(code) {
  const response = await fetch(`${BASE_URL}/w/${code}`);

  if (!response.ok) {
    throw new Error('Không thể lấy chi tiết phường/xã');
  }

  return response.json();
}
```

---

### 9. Ví dụ gọi API bằng Axios

```js
import axios from 'axios';

const provinceApi = axios.create({
  baseURL: 'https://provinces.open-api.vn/api/v2',
  timeout: 10000,
});

export async function getProvinces(search) {
  const response = await provinceApi.get('/p/', {
    params: {
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getProvinceDetail(code, depth = 1) {
  const response = await provinceApi.get(`/p/${code}`, {
    params: {
      depth,
    },
  });

  return response.data;
}

export async function getWards(provinceCode, search) {
  const response = await provinceApi.get('/w/', {
    params: {
      province: provinceCode || undefined,
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getWardDetail(code) {
  const response = await provinceApi.get(`/w/${code}`);
  return response.data;
}
```

---

### 10. Ví dụ dùng trong React form

```jsx
import { useEffect, useState } from 'react';
import { getProvinces, getWards } from './provinceApi';

export default function AddressForm() {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      setWardCode('');
      return;
    }

    getWards({ provinceCode }).then(setWards);
  }, [provinceCode]);

  return (
    <form>
      <select
        value={provinceCode}
        onChange={(event) => setProvinceCode(event.target.value)}
      >
        <option value="">Chọn tỉnh/thành</option>
        {provinces.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>

      <select
        value={wardCode}
        onChange={(event) => setWardCode(event.target.value)}
        disabled={!provinceCode}
      >
        <option value="">Chọn phường/xã</option>
        {wards.map((ward) => (
          <option key={ward.code} value={ward.code}>
            {ward.name}
          </option>
        ))}
      </select>

      <input
        value={addressDetail}
        onChange={(event) => setAddressDetail(event.target.value)}
        placeholder="Số nhà, tên đường"
      />
    </form>
  );
}
```

---

### 11. Khuyến nghị khi dùng production

Không nên để frontend phụ thuộc trực tiếp quá nhiều vào API public trong các hệ thống production lớn.

Nên dùng một trong hai hướng:

#### Cách 1: Frontend gọi trực tiếp API public

Phù hợp với dự án nhỏ, MVP hoặc demo.

Ưu điểm:

- Nhanh triển khai.
- Không cần tạo bảng địa chỉ trong database.
- Không cần backend xử lý đồng bộ dữ liệu.

Nhược điểm:

- Phụ thuộc vào API bên thứ ba.
- Nếu API public lỗi, form địa chỉ của hệ thống cũng bị ảnh hưởng.
- Khó kiểm soát version dữ liệu.

#### Cách 2: Backend đồng bộ dữ liệu về database nội bộ

Phù hợp với dự án production.

Ưu điểm:

- Chủ động dữ liệu.
- Tốc độ truy vấn nhanh hơn.
- Không phụ thuộc trực tiếp vào API public khi người dùng thao tác.
- Dễ kiểm soát dữ liệu theo version của hệ thống.

Nhược điểm:

- Cần tạo bảng lưu tỉnh/thành, phường/xã.
- Cần viết job đồng bộ dữ liệu.

---

### 12. Bảng database nội bộ khuyến nghị

#### Bảng `provinces`

```sql
CREATE TABLE provinces (
  code INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  division_type VARCHAR(100),
  codename VARCHAR(255),
  phone_code INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Bảng `wards`

```sql
CREATE TABLE wards (
  code INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  division_type VARCHAR(100),
  codename VARCHAR(255),
  province_code INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_wards_province
    FOREIGN KEY (province_code)
    REFERENCES provinces(code)
);
```

---

### 13. Mapping dữ liệu khi lưu địa chỉ user

Khi user chọn địa chỉ, request gửi lên backend nên có dạng:

```json
{
  "province_code": 79,
  "ward_code": 26560,
  "address_detail": "123 Nguyễn Văn Linh"
}
```

Backend xử lý:

```txt
1. Kiểm tra province_code có tồn tại không
2. Kiểm tra ward_code có tồn tại không
3. Kiểm tra ward.province_code có khớp với province_code không
4. Ghép full_address
5. Lưu vào database
```

Response trả về:

```json
{
  "province_code": 79,
  "province_name": "Thành phố Hồ Chí Minh",
  "ward_code": 26560,
  "ward_name": "Phường Bà Rịa",
  "address_detail": "123 Nguyễn Văn Linh",
  "full_address": "123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh"
}
```

---

### 14. Validation khuyến nghị

Khi lưu địa chỉ, backend nên kiểm tra:

- `province_code` bắt buộc.
- `ward_code` bắt buộc.
- `address_detail` bắt buộc nếu hệ thống cần địa chỉ cụ thể.
- `province_code` phải tồn tại trong danh sách tỉnh/thành.
- `ward_code` phải tồn tại trong danh sách phường/xã.
- `ward.province_code` phải trùng với `province_code` user gửi lên.
- Không tin hoàn toàn `province_name` và `ward_name` gửi từ frontend, backend nên lấy lại từ database hoặc API.

---

### 15. Gợi ý API nội bộ cho backend

Nếu hệ thống đồng bộ dữ liệu về database nội bộ, backend có thể expose các API sau:

```http
GET /api/v1/provinces
GET /api/v1/provinces/:code
GET /api/v1/provinces/:code/wards
GET /api/v1/wards/:code
```

Ví dụ response:

```json
{
  "success": true,
  "data": [
    {
      "code": 79,
      "name": "Thành phố Hồ Chí Minh",
      "division_type": "thành phố trung ương",
      "codename": "ho_chi_minh",
      "phone_code": 28
    }
  ]
}
```

---

### 16. Gợi ý service sync dữ liệu

Flow sync dữ liệu:

```txt
1. Gọi API GET /p/
2. Lưu danh sách tỉnh/thành vào bảng provinces
3. Với từng province, gọi GET /w/?province={province_code}
4. Lưu danh sách phường/xã vào bảng wards
5. Nếu dữ liệu đã tồn tại thì update
6. Nếu dữ liệu chưa tồn tại thì insert
```

Pseudo code:

```js
async function syncProvinceData() {
  const provinces = await getProvinces();

  for (const province of provinces) {
    await upsertProvince(province);

    const wards = await getWards(province.code);

    for (const ward of wards) {
      await upsertWard(ward);
    }
  }
}
```

---

### 17. Tổng kết endpoint thường dùng

```txt
GET /p/
Lấy danh sách tỉnh/thành

GET /p/?search={keyword}
Tìm kiếm tỉnh/thành

GET /p/{code}
Lấy chi tiết tỉnh/thành

GET /p/{code}?depth=2
Lấy chi tiết tỉnh/thành kèm danh sách phường/xã

GET /w/
Lấy danh sách phường/xã

GET /w/?province={province_code}
Lấy danh sách phường/xã theo tỉnh/thành

GET /w/?province={province_code}&search={keyword}
Tìm kiếm phường/xã trong một tỉnh/thành

GET /w/{code}
Lấy chi tiết phường/xã
```

---

## Medical Records Stats API

_Nguồn đã gộp: `medical-records-stats-api.md`_

Thống kê **hồ sơ bệnh án** (= hồ sơ bệnh nhân, bảng `his_patients`) dùng cho admin phân tích: tổng số hồ sơ, số hồ sơ mới tháng này so với tháng trước, tổng chi phí đã thu, lần khám gần nhất.

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1.0/dashboard/medical-records-stats` | Thống kê hồ sơ bệnh án (bệnh nhân) |

- Provider: [`DashboardProvider.getMedicalRecordStats()`](../src/providers/dashboardProvider.ts)
- Controller: [`src/controllers/api/v1.0/dashboard/medical-records-stats.ts`](../src/controllers/api/v1.0/dashboard/medical-records-stats.ts)

---

### 1. Request

| | |
|---|---|
| Method | `GET` |
| URL | `/api/v1.0/dashboard/medical-records-stats` |
| Auth | **Bắt buộc** Bearer token (middleware `verify`) |
| Content-Type | không có body |

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả | Mặc định |
|---|---|---|---|---|
| `facilityId` | `string` (UUID) | Không | Lọc theo cơ sở y tế (`his_facility_configs.id`) | không truyền → tính toàn hệ thống, không lọc cơ sở |

Ví dụ:
```bash
TOKEN="<bearer_token>"
BASE="http://localhost:3000/api/v1.0"

# Toàn hệ thống
curl -s "$BASE/dashboard/medical-records-stats" \
  -H "Authorization: Bearer $TOKEN"

# Lọc theo 1 cơ sở
curl -s "$BASE/dashboard/medical-records-stats?facilityId=11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Response — thành công (200)

Theo convention chung của project (`res.sendOk` → `apiResponseDTO`), payload nằm trong `responseData`:

```json
{
  "message": "Lấy thống kê hồ sơ bệnh án thành công",
  "message_en": "Get medical record stats successful",
  "responseData": {
    "totalRecords": 320,
    "thisMonthCount": 12,
    "lastMonthCount": 8,
    "monthChangePercent": 50,
    "totalCost": 452000000,
    "lastVisitAt": "2026-07-03T02:10:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**Giải thích từng field trong `responseData`:**

| Field | Kiểu | Ý nghĩa | Cách tính |
|---|---|---|---|
| `totalRecords` | `number` | Tổng số hồ sơ bệnh nhân | `COUNT(*) FROM his_patients` (lọc `facility_id` nếu có `facilityId`) |
| `thisMonthCount` | `number` | Số hồ sơ **mới tạo** trong tháng hiện tại | `COUNT(*) FROM his_patients WHERE created_at >= <đầu tháng này>` |
| `lastMonthCount` | `number` | Số hồ sơ mới tạo trong tháng trước (liền kề) | `COUNT(*) FROM his_patients WHERE created_at BETWEEN <đầu tháng trước> AND <cuối tháng trước>` |
| `monthChangePercent` | `number` | % thay đổi `thisMonthCount` so với `lastMonthCount` | `(thisMonthCount - lastMonthCount) / lastMonthCount * 100`, làm tròn 2 chữ số. Nếu `lastMonthCount = 0`: trả `100` khi `thisMonthCount > 0`, ngược lại trả `0` |
| `totalCost` | `number` | Tổng tiền đã thanh toán thành công (all-time, **không** giới hạn theo tháng) | `SUM(amount) FROM appointment_booking_payments JOIN appointment_bookings ON booking_id WHERE payment_status = 'PAID'` (lọc `facility_id` qua booking nếu có `facilityId`) |
| `lastVisitAt` | `string` (ISO date) hoặc `null` | Thời điểm phiếu khám (booking) gần nhất được tạo | `MAX(created_at) FROM appointment_bookings` (lọc `facility_id` nếu có `facilityId`); `null` nếu chưa có booking nào |

> **Lưu ý quan trọng:**
> - `totalRecords`/`thisMonthCount`/`lastMonthCount` đếm trên bảng **`his_patients`** (hồ sơ bệnh nhân) — KHÔNG phải `appointment_bookings` (phiếu khám).
> - `totalCost` và `lastVisitAt` vẫn tính trên **`appointment_bookings`/`appointment_booking_payments`** (chi phí và lần khám gắn với booking, không gắn với hồ sơ bệnh nhân), nên **không cùng phạm vi thời gian** với 3 field đếm hồ sơ ở trên (không lọc theo tháng này/tháng trước).
> - `facilityId` khi truyền sẽ áp dụng cho tất cả field, nhưng qua 2 đường khác nhau: `his_patients.facility_id` (cho 3 field đếm hồ sơ) và `appointment_bookings.facility_id` (cho `totalCost`, `lastVisitAt`).

---

### 3. Response — lỗi

**400 — `facilityId` không hợp lệ (không phải UUID):**
```json
{
  "message": "facilityId không hợp lệ (phải là UUID)",
  "message_en": "facilityId không hợp lệ (phải là UUID)",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token** (middleware `verify` chặn trước khi vào handler):
```json
{
  "message": "Unauthorized",
  "message_en": "Unauthorized",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

---

### 4. Checklist test

- [ ] **totalRecords đếm đúng bảng**: khớp `SELECT COUNT(*) FROM his_patients` (không phải đếm `appointment_bookings`).
- [ ] **thisMonthCount/lastMonthCount theo tháng**: khớp `created_at` nằm trong tháng hiện tại / tháng trước (kiểm tra ở ranh giới đầu/cuối tháng).
- [ ] **monthChangePercent**: đúng công thức tăng/giảm %; khi `lastMonthCount = 0` và `thisMonthCount > 0` → trả `100`; cả hai đều `0` → trả `0`.
- [ ] **totalCost**: khớp `SELECT SUM(amount) FROM appointment_booking_payments WHERE payment_status='PAID'` (join qua booking, all-time, không lọc theo tháng).
- [ ] **lastVisitAt**: `null` khi hệ thống/cơ sở chưa có booking nào; đúng bằng `created_at` mới nhất khi có dữ liệu.
- [ ] **Filter facility**: truyền `facilityId` → chỉ trả dữ liệu đúng cơ sở (cả 2 đường `his_patients.facility_id` và `appointment_bookings.facility_id`).
- [ ] **Validate params**: `facilityId` không phải UUID → HTTP 400.
- [ ] **Auth**: không có token → 401.

---

## Medical Records API — CRUD

_Nguồn đã gộp: `medical-records-crud-api.md`_

API quản lý **hồ sơ bệnh án** (EMR - Electronic Medical Record) — lưu trữ đầy đủ thông tin khám bệnh: chẩn đoán, điều trị, thanh toán, v.v.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1.0/medical-records` | Không | Danh sách hồ sơ (phân trang, lọc) |
| POST | `/api/v1.0/medical-records` | Bearer | Tạo mới hồ sơ |
| GET | `/api/v1.0/medical-records/{id}` | Không | Chi tiết 1 hồ sơ |
| PUT | `/api/v1.0/medical-records/{id}` | Bearer | Cập nhật hồ sơ |
| DELETE | `/api/v1.0/medical-records/{id}` | Bearer | Xóa hồ sơ |

- Controller: [`medical-records/index.ts`](../src/controllers/api/v1.0/medical-records/index.ts), [`medical-records/{id}.ts`](../src/controllers/api/v1.0/medical-records/{id}.ts)
- Provider: [`MedicalRecordProvider`](../src/providers/medicalRecordProvider.ts)
- Model: [`medicalRecord`](../src/models/medicalRecord.ts) — bảng `medical_records`

Response format theo convention chung của project (`res.sendOk`/`res.sendError` → `apiResponseDTO`), payload nằm trong `responseData`.

---

### 1. Model — bảng `medical_records`

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | tự sinh | PK |
| `record_code` | `varchar(50)` | **Có** | Mã hồ sơ (unique), tự sinh dạng "(HS" + suffix nếu không truyền |
| `facility_id` | `uuid` | **Có** | FK → `his_facility_configs.id` (cơ sở khám) |
| `patient_id` | `uuid` | **Có** | FK → `his_patients.id` (bệnh nhân) |
| `appointment_id` | `uuid` | Không | FK → `appointment_bookings.id` (lịch hẹn gắn với hồ sơ); unique |
| `examined_at` | `timestamp` | **Có** | Thời điểm khám |
| `doctor_id` | `uuid` | Không | FK → `his_doctors.id` (bác sĩ khám) |
| `specialty_id` | `uuid` | Không | FK → `specialties.id` (chuyên khoa) |
| `room_id` | `uuid` | Không | FK → `his_rooms.id` (phòng khám) |
| `service_id` | `uuid` | Không | FK → `his_services.id` (dịch vụ) |
| `chief_complaint` | `text` | Không | Triệu chứng chính |
| `diagnosis` | `text` | Không | Chẩn đoán |
| `conclusion` | `text` | Không | Kết luận |
| `treatment_plan` | `text` | Không | Kế hoạch điều trị |
| `doctor_note` | `text` | Không | Ghi chú của bác sĩ |
| `patient_note` | `text` | Không | Ghi chú của bệnh nhân |
| `total_amount` | `decimal` | Không | Tổng chi phí, mặc định `0` |
| `paid_amount` | `decimal` | Không | Số tiền đã thanh toán, mặc định `0` |
| `payment_status` | `varchar(30)` | Không | Mặc định `"UNPAID"` (gợi ý: `UNPAID`/`PAID`/`PARTIAL`) |
| `record_status` | `varchar(30)` | Không | Mặc định `"COMPLETED"` (gợi ý: `DRAFT`/`COMPLETED`/`CANCELLED`) |
| `source` | `varchar(50)` | Không | Mặc định `"APP"` (gợi ý: `APP`/`WEB`/`PORTAL`) |
| `raw_data` | `jsonb` | Không | Dữ liệu thô kèm theo |
| `user_id` | `uuid` | Không | FK → `user.id` (người tạo) |
| `created_by` / `updated_by` | `uuid` | Không | ID người tạo/cập nhật |
| `created_at` / `updated_at` | `timestamp` | tự sinh | |

---

### 2. GET `/medical-records` — Danh sách

Không yêu cầu auth. Có middleware `queryModifier` (phân trang/sort).

#### 2.1. Request

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | `integer` | Không | Trang hiện tại, mặc định `1` |
| `pageSize` | `integer` | Không | Số bản ghi/trang, mặc định `10`, tối đa `100` |
| `sortField` | `string` | Không | Trường sắp xếp, mặc định `examined_at` |
| `sortOrder` | `string` | Không | `ASC`/`DESC`, mặc định `DESC` |
| `facility_id` | `uuid` | Không | Lọc theo cơ sở |
| `patient_id` | `uuid` | Không | Lọc theo bệnh nhân |
| `doctor_id` | `uuid` | Không | Lọc theo bác sĩ |
| `payment_status` | `string` | Không | Lọc theo trạng thái thanh toán |
| `record_status` | `string` | Không | Lọc theo trạng thái hồ sơ |

```bash
curl -s "http://localhost:3000/api/v1.0/medical-records?page=1&pageSize=10&facility_id=11111111-1111-1111-1111-111111111111&payment_status=UNPAID"
```

#### 2.2. Response — thành công (200)

```json
{
  "message": "Lấy danh sách hồ sơ bệnh án thành công",
  "message_en": "Get medical records successful",
  "responseData": {
    "count": 156,
    "rows": [
      {
        "id": "a1b2c3d4-....",
        "record_code": "(HS-20260703-001",
        "facility_id": "11111111-1111-1111-1111-111111111111",
        "patient_id": "9c8d0000-0000-0000-0000-000000000000",
        "appointment_id": "3a2b0000-0000-0000-0000-000000000000",
        "examined_at": "2026-07-03T09:00:00.000Z",
        "doctor_id": "d1e20000-0000-0000-0000-000000000000",
        "specialty_id": "s1s20000-0000-0000-0000-000000000000",
        "room_id": "r1r20000-0000-0000-0000-000000000000",
        "service_id": "sv10000-0000-0000-0000-000000000000",
        "chief_complaint": "Đau đầu, sốt cao",
        "diagnosis": "Cảm lạnh",
        "conclusion": "Cảm lạnh thường (không biến chứng)",
        "treatment_plan": "Nghỉ ngơi, uống thuốc hạ sốt",
        "doctor_note": "Bệnh nhân tỉnh táo, huyết áp bình thường",
        "patient_note": "Đã uống sáng 2 liều",
        "total_amount": 500000,
        "paid_amount": 0,
        "payment_status": "UNPAID",
        "record_status": "COMPLETED",
        "source": "APP",
        "created_at": "2026-07-03T09:00:00.000Z",
        "updated_at": "2026-07-03T09:00:00.000Z",
        "facility": { "id": "11111111-...", "facility_name": "Bệnh viện Vạn Hạnh", "idbv": "VH01" },
        "patient": { "id": "9c8d...", "patient_full_name": "Trần Thị B", "phone_number": "0901234567" },
        "doctor": { "id": "d1e2...", "doctor_id": "BS001", "doctor_name": "Nguyễn Văn A" },
        "specialty": { "id": "s1s2...", "name": "Nội tiết" },
        "room": { "id": "r1r2...", "room_name": "Phòng khám 101" },
        "service": { "id": "sv10...", "service_name": "Khám tổng quát", "price": 300000 }
      }
    ],
    "totalPages": 16,
    "currentPage": 1
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

---

### 3. POST `/medical-records` — Tạo mới

**Yêu cầu Bearer token.**

#### 3.1. Request body

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `facility_id` | `uuid` | **Có** | |
| `patient_id` | `uuid` | **Có** | |
| `examined_at` | `string` (ISO date) | **Có** | |
| `record_code` | `string` | Không | tự sinh nếu không truyền |
| `appointment_id` | `uuid` | Không | |
| `doctor_id` | `uuid` | Không | |
| `specialty_id` | `uuid` | Không | |
| `room_id` | `uuid` | Không | |
| `service_id` | `uuid` | Không | |
| `chief_complaint` | `string` | Không | |
| `diagnosis` | `string` | Không | |
| `conclusion` | `string` | Không | |
| `treatment_plan` | `string` | Không | |
| `doctor_note` | `string` | Không | |
| `patient_note` | `string` | Không | |
| `total_amount` | `number` | Không | mặc định `0` |
| `paid_amount` | `number` | Không | mặc định `0` |
| `payment_status` | `string` | Không | mặc định `"UNPAID"` |
| `record_status` | `string` | Không | mặc định `"COMPLETED"` |
| `source` | `string` | Không | mặc định `"APP"` |
| `user_id` | `uuid` | Không | |
| `raw_data` | `object` | Không | |

```bash
curl -s -X POST "http://localhost:3000/api/v1.0/medical-records" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "patient_id": "9c8d0000-0000-0000-0000-000000000000",
    "examined_at": "2026-07-03T09:00:00Z",
    "doctor_id": "d1e20000-0000-0000-0000-000000000000",
    "chief_complaint": "Đau đầu, sốt cao",
    "diagnosis": "Cảm lạnh",
    "total_amount": 500000,
    "payment_status": "UNPAID"
  }'
```

#### 3.2. Response — thành công (200)

```json
{
  "message": "Tạo hồ sơ bệnh án thành công",
  "message_en": "Create medical record successful",
  "responseData": {
    "id": "a1b2c3d4-....",
    "record_code": "(HS-20260703-001",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "patient_id": "9c8d0000-0000-0000-0000-000000000000",
    "chief_complaint": "Đau đầu, sốt cao",
    "diagnosis": "Cảm lạnh",
    "total_amount": 500000,
    "paid_amount": 0,
    "payment_status": "UNPAID",
    "record_status": "COMPLETED",
    "source": "APP",
    "created_at": "2026-07-03T10:00:00.000Z",
    "updated_at": "2026-07-03T10:00:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 3.3. Response — lỗi

**400 — thiếu `facility_id`/`patient_id`/`examined_at`:**
```json
{
  "message": "Thiếu thông tin bắt buộc: facility_id, patient_id, examined_at",
  "message_en": "Missing required fields: facility_id, patient_id, examined_at",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token.**

---

### 4. GET `/medical-records/{id}` — Chi tiết

Không yêu cầu auth.

#### 4.1. Request

```bash
curl -s "http://localhost:3000/api/v1.0/medical-records/a1b2c3d4-0000-0000-0000-000000000000"
```

#### 4.2. Response — thành công (200)

Trả toàn bộ attributes + 7 include (`facility`, `patient`, `doctor`, `specialty`, `room`, `service`, `appointment`):

```json
{
  "message": "Lấy chi tiết hồ sơ bệnh án thành công",
  "message_en": "Get medical record detail successful",
  "responseData": {
    "id": "a1b2c3d4-....",
    "record_code": "(HS-20260703-001",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "patient_id": "9c8d0000-0000-0000-0000-000000000000",
    "appointment_id": "3a2b0000-0000-0000-0000-000000000000",
    "examined_at": "2026-07-03T09:00:00.000Z",
    "doctor_id": "d1e20000-0000-0000-0000-000000000000",
    "specialty_id": "s1s20000-0000-0000-0000-000000000000",
    "room_id": "r1r20000-0000-0000-0000-000000000000",
    "service_id": "sv10000-0000-0000-0000-000000000000",
    "chief_complaint": "Đau đầu, sốt cao",
    "diagnosis": "Cảm lạnh",
    "conclusion": "Cảm lạnh thường (không biến chứng)",
    "treatment_plan": "Nghỉ ngơi, uống thuốc hạ sốt",
    "doctor_note": "Bệnh nhân tỉnh táo, huyết áp bình thường",
    "patient_note": "Đã uống sáng 2 liều",
    "total_amount": 500000,
    "paid_amount": 0,
    "payment_status": "UNPAID",
    "record_status": "COMPLETED",
    "source": "APP",
    "created_at": "2026-07-03T09:00:00.000Z",
    "updated_at": "2026-07-03T09:00:00.000Z",
    "facility": { "id": "11111111-...", "facility_name": "Bệnh viện Vạn Hạnh", "idbv": "VH01", "base_url": "https://..." },
    "patient": { "id": "9c8d...", "patient_full_name": "Trần Thị B", "phone_number": "0901234567", "identity_number": "012345678901" },
    "doctor": { "id": "d1e2...", "doctor_id": "BS001", "doctor_name": "Nguyễn Văn A", "description": null },
    "specialty": { "id": "s1s2...", "name": "Nội tiết", "code": "NT" },
    "room": { "id": "r1r2...", "room_id": "ROOM01", "room_name": "Phòng khám 101" },
    "service": { "id": "sv10...", "service_id": "SV001", "service_name": "Khám tổng quát", "price": 300000 },
    "appointment": { "id": "3a2b...", "appointment_time": "2026-07-03T09:00:00.000Z", "booking_type": "ONLINE" }
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 4.3. Response — lỗi

**404 — không tìm thấy:**
```json
{
  "message": "Không tìm thấy hồ sơ bệnh án",
  "message_en": "Medical record not found",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

---

### 5. PUT `/medical-records/{id}` — Cập nhật

**Yêu cầu Bearer token.** Tất cả field đều optional (partial update).

#### 5.1. Request body

```json
{
  "diagnosis": "Cảm lạnh nặng",
  "treatment_plan": "Nghỉ ngơi 3 ngày, uống kháng sinh",
  "doctor_note": "Cập nhật: huyết áp cao hơn",
  "paid_amount": 300000,
  "payment_status": "PARTIAL",
  "updated_by": "user-uuid-here"
}
```

#### 5.2. Response — thành công (200)

```json
{
  "message": "Cập nhật hồ sơ bệnh án thành công",
  "message_en": "Update medical record successful",
  "responseData": {
    "id": "a1b2c3d4-....",
    "diagnosis": "Cảm lạnh nặng",
    "treatment_plan": "Nghỉ ngơi 3 ngày, uống kháng sinh",
    "doctor_note": "Cập nhật: huyết áp cao hơn",
    "paid_amount": 300000,
    "payment_status": "PARTIAL",
    "updated_by": "user-uuid-here",
    "updated_at": "2026-07-03T10:30:00.000Z"
    /* ...các field còn lại */
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:30:00",
  "violations": null
}
```

#### 5.3. Response — lỗi

**404** khi không tìm thấy. **401** khi thiếu token.

---

### 6. DELETE `/medical-records/{id}` — Xóa

**Yêu cầu Bearer token.** Xóa cứng (hard delete).

```bash
curl -s -X DELETE "http://localhost:3000/api/v1.0/medical-records/a1b2c3d4-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

#### 6.1. Response — thành công (200)

```json
{
  "message": "Xóa hồ sơ bệnh án thành công",
  "message_en": "Delete medical record successful",
  "responseData": null,
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 6.2. Response — lỗi

**404** khi không tìm thấy. **401** khi thiếu token.

---

### 7. Checklist test

- [ ] **GET list không lỗi facility.name**: sắp xếp đúng theo `examined_at` DESC, include đầy đủ.
- [ ] **Filter hoạt động**: `facility_id`, `patient_id`, `doctor_id`, `payment_status`, `record_status` lọc chính xác.
- [ ] **POST validate**: thiếu `facility_id`/`patient_id`/`examined_at` → 400; có token → 200.
- [ ] **POST mặc định**: không truyền `record_code` → tự sinh; `total_amount`/`paid_amount` → 0; `payment_status` → "UNPAID"; `record_status` → "COMPLETED"; `source` → "APP".
- [ ] **GET detail 404** khi id không tồn tại.
- [ ] **GET detail include đầy đủ** 7 bảng liên quan.
- [ ] **PUT partial update** chỉ update field đã truyền, các field khác giữ nguyên.
- [ ] **DELETE xóa cứng**: sau xóa, GET detail trả 404.
- [ ] **Auth**: POST/PUT/DELETE không token → 401; GET (list + detail) không cần token.
- [ ] **unique constraint**: `record_code` duy nhất; `appointment_id` duy nhất nếu có truyền.

---

## Appointment Reviews API

_Nguồn đã gộp: `appointment-reviews-api.md`_

API quản lý đánh giá lịch khám (đánh giá bác sĩ/dịch vụ/cơ sở sau khi khám).

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1.0/appointment-reviews` | Không | Danh sách đánh giá (phân trang, lọc) |
| POST | `/api/v1.0/appointment-reviews` | Bearer | Tạo mới đánh giá |
| GET | `/api/v1.0/appointment-reviews/{id}` | Không | Chi tiết 1 đánh giá |
| PUT | `/api/v1.0/appointment-reviews/{id}` | Bearer | Cập nhật đánh giá |
| DELETE | `/api/v1.0/appointment-reviews/{id}` | Bearer | Xóa đánh giá |

- Controller: [`appointment-reviews/index.ts`](../src/controllers/api/v1.0/appointment-reviews/index.ts), [`appointment-reviews/{id}.ts`](../src/controllers/api/v1.0/appointment-reviews/{id}.ts)
- Provider: [`AppointmentReviewProvider`](../src/providers/appointmentReviewProvider.ts)
- Model: [`appointmentReview`](../src/models/appointmentReview.ts) — bảng `appointment_reviews`

Response format theo convention chung của project (`res.sendOk`/`res.sendError` → `apiResponseDTO`), payload nằm trong `responseData`, KHÔNG phải `{ success, data }`.

---

### 1. Model — bảng `appointment_reviews`

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | tự sinh | PK |
| `facility_id` | `uuid` | **Có** | FK → `his_facility_configs.id` |
| `appointment_id` | `uuid` | Không | FK → `appointment_bookings.id` |
| `patient_id` | `uuid` | Không | FK → `his_patients.id` |
| `doctor_id` | `uuid` | Không | FK → `his_doctors.id` |
| `exam_area_id` | `uuid` | Không | FK → `exam_areas.id` |
| `specialty_id` | `uuid` | Không | FK → `specialties.id` |
| `room_id` | `uuid` | Không | FK → `his_rooms.id` |
| `overall_rating` | `integer` | **Có** | 1–5 |
| `doctor_rating` | `integer` | Không | 1–5 |
| `service_rating` | `integer` | Không | 1–5 |
| `facility_rating` | `integer` | Không | 1–5 |
| `waiting_time_rating` | `integer` | Không | 1–5 |
| `comment` | `text` | Không | Nội dung đánh giá |
| `admin_reply` | `text` | Không | Phản hồi của admin |
| `admin_replied_at` | `timestamp` | Không | Tự set = `now()` khi PUT có `admin_reply` mà không truyền field này |
| `is_anonymous` | `boolean` | Không | Mặc định `false` |
| `status` | `varchar(20)` | Không | Mặc định `"PENDING"` (gợi ý: `PENDING`/`APPROVED`/`REJECTED`) |
| `source` | `varchar(50)` | Không | Mặc định `"APP"` (gợi ý: `APP`/`WEB`) |
| `raw_data` | `jsonb` | Không | Dữ liệu thô kèm theo |
| `created_at` / `updated_at` | `timestamp` | tự sinh | |

---

### 2. GET `/appointment-reviews` — Danh sách

Không yêu cầu auth. Có middleware `queryModifier` (phân trang/sort).

#### 2.1. Request

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | `integer` | Không | Trang hiện tại, mặc định `1` |
| `pageSize` | `integer` | Không | Số bản ghi/trang, mặc định `10`, tối đa `100` |
| `sortField` | `string` | Không | Trường sắp xếp, mặc định `created_at` |
| `sortOrder` | `string` | Không | `ASC`/`DESC`, mặc định `DESC` |
| `filters` | `string` | Không | ⚠️ Xem lưu ý ở mục 2.4 — hiện **không có tác dụng** |
| `facility_id` | `uuid` | Không | Lọc theo cơ sở |
| `doctor_id` | `uuid` | Không | Lọc theo bác sĩ |
| `exam_area_id` | `uuid` | Không | Lọc theo khu khám |
| `patient_id` | `uuid` | Không | Lọc theo bệnh nhân |
| `appointment_id` | `uuid` | Không | Lọc theo lịch hẹn |
| `status` | `string` | Không | Lọc theo trạng thái |
| `source` | `string` | Không | Lọc theo nguồn |
| `min_rating` | `integer` | Không | `overall_rating >= min_rating` |
| `max_rating` | `integer` | Không | `overall_rating <= max_rating` |

```bash
curl -s "http://localhost:3000/api/v1.0/appointment-reviews?page=1&pageSize=10&status=APPROVED&min_rating=4"
```

#### 2.2. Response — thành công (200)

```json
{
  "message": "Lấy danh sách đánh giá lịch khám thành công",
  "message_en": "Get appointment reviews successful",
  "responseData": {
    "count": 42,
    "rows": [
      {
        "id": "2f1b0d0a-....",
        "facility_id": "11111111-1111-1111-1111-111111111111",
        "appointment_id": "3a2b....",
        "patient_id": "9c8d....",
        "doctor_id": "d1e2....",
        "exam_area_id": "e4f5....",
        "specialty_id": null,
        "room_id": null,
        "overall_rating": 5,
        "doctor_rating": 5,
        "service_rating": 4,
        "facility_rating": 4,
        "waiting_time_rating": 3,
        "comment": "Bác sĩ tận tâm, dịch vụ tốt",
        "admin_reply": null,
        "admin_replied_at": null,
        "is_anonymous": false,
        "status": "APPROVED",
        "source": "APP",
        "raw_data": null,
        "created_at": "2026-07-01T02:00:00.000Z",
        "updated_at": "2026-07-01T02:00:00.000Z",
        "doctor": { "id": "d1e2....", "doctor_id": "BS001", "doctor_name": "Nguyễn Văn A" },
        "exam_area": { "id": "e4f5....", "code": "KA1", "name": "Khu khám A", "short_name": "KA" },
        "facility": { "id": "11111111-1111-1111-1111-111111111111", "facility_name": "Bệnh viện Vạn Hạnh", "idbv": "VH01" },
        "patient": { "id": "9c8d....", "patient_full_name": "Trần Thị B", "phone_number": "0901234567" }
      }
    ],
    "totalPages": 5,
    "currentPage": 1
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 2.3. Field include (join)

| Association | Attributes trả về | Nguồn |
|---|---|---|
| `doctor` | `id`, `doctor_id`, `doctor_name` | `his_doctors` |
| `exam_area` | `id`, `code`, `name`, `short_name` | `exam_areas` |
| `facility` | `id`, `facility_name`, `idbv` | `his_facility_configs` (**không có cột `name`**, phải dùng `facility_name`) |
| `patient` | `id`, `patient_full_name`, `phone_number` | `his_patients` |

> Đã fix bug: trước đây `facility` include yêu cầu cột `name` (không tồn tại) → lỗi `column facility.name does not exist`; và thiếu hẳn include `patient` nên response chỉ trả `patient_id` (UUID) chứ không có tên bệnh nhân. Cả `index.ts` và `{id}.ts` đã được sửa.

#### 2.4. ⚠️ Lưu ý: `filters` chưa hoạt động

Swagger mô tả `filters` dạng `status:APPROVED`, nhưng middleware `queryModifier` ([`src/middlewares/query-modifier.ts`](../src/middlewares/query-modifier.ts)) chỉ lưu chuỗi thô vào `payload.rawFilter`, **không parse** thành `payload.filters` (luôn là `{}`). Controller dùng `req.payload.filters` nên **query param `filters` hiện không lọc được gì** — chỉ các query param rời (`status`, `source`, `min_rating`,...) mới có tác dụng. Cần sửa riêng nếu muốn dùng `filters`.

---

### 3. POST `/appointment-reviews` — Tạo mới

**Yêu cầu Bearer token** (middleware `verify`).

#### 3.1. Request body

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `facility_id` | `uuid` | **Có** | |
| `overall_rating` | `integer` | **Có** | 1–5, validate ở controller |
| `appointment_id` | `uuid` | Không | |
| `patient_id` | `uuid` | Không | |
| `doctor_id` | `uuid` | Không | |
| `exam_area_id` | `uuid` | Không | |
| `specialty_id` | `uuid` | Không | |
| `room_id` | `uuid` | Không | |
| `doctor_rating` | `integer` | Không | |
| `service_rating` | `integer` | Không | |
| `facility_rating` | `integer` | Không | |
| `waiting_time_rating` | `integer` | Không | |
| `comment` | `string` | Không | |
| `is_anonymous` | `boolean` | Không | mặc định `false` |
| `status` | `string` | Không | mặc định `"PENDING"` |
| `source` | `string` | Không | mặc định `"APP"` |
| `raw_data` | `object` | Không | |

```bash
curl -s -X POST "http://localhost:3000/api/v1.0/appointment-reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "appointment_id": "3a2b0000-0000-0000-0000-000000000000",
    "patient_id": "9c8d0000-0000-0000-0000-000000000000",
    "doctor_id": "d1e20000-0000-0000-0000-000000000000",
    "overall_rating": 5,
    "doctor_rating": 5,
    "service_rating": 4,
    "facility_rating": 4,
    "waiting_time_rating": 3,
    "comment": "Bác sĩ tận tâm, dịch vụ tốt",
    "is_anonymous": false,
    "source": "APP"
  }'
```

#### 3.2. Response — thành công (200)

```json
{
  "message": "Tạo đánh giá lịch khám thành công",
  "message_en": "Create appointment review successful",
  "responseData": {
    "id": "2f1b0d0a-....",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "overall_rating": 5,
    "is_anonymous": false,
    "status": "PENDING",
    "source": "APP",
    "created_at": "2026-07-03T10:00:00.000Z",
    "updated_at": "2026-07-03T10:00:00.000Z"
    /* ...các field khác đã truyền */
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

Lưu ý: response POST **không include** `doctor`/`exam_area`/`facility`/`patient` (chỉ trả bản ghi vừa tạo, không join).

#### 3.3. Response — lỗi

**400 — thiếu `facility_id`/`overall_rating`:**
```json
{
  "message": "Thiếu thông tin bắt buộc: facility_id, overall_rating",
  "message_en": "Missing required fields: facility_id, overall_rating",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**400 — `overall_rating` ngoài khoảng 1–5:**
```json
{
  "message": "overall_rating phải nằm trong khoảng từ 1 đến 5",
  "message_en": "overall_rating must be between 1 and 5",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token.**

---

### 4. GET `/appointment-reviews/{id}` — Chi tiết

Không yêu cầu auth.

#### 4.1. Request

| Param | Vị trí | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | path | **Có** | ID đánh giá |

```bash
curl -s "http://localhost:3000/api/v1.0/appointment-reviews/2f1b0d0a-0000-0000-0000-000000000000"
```

#### 4.2. Response — thành công (200)

Trả **toàn bộ attributes** của model (mặc định `includeAttributes = Object.keys(model.getAttributes())`) kèm 4 include:

```json
{
  "message": "Lấy chi tiết đánh giá lịch khám thành công",
  "message_en": "Get appointment review detail successful",
  "responseData": {
    "id": "2f1b0d0a-....",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "appointment_id": "3a2b....",
    "patient_id": "9c8d....",
    "doctor_id": "d1e2....",
    "exam_area_id": "e4f5....",
    "specialty_id": null,
    "room_id": null,
    "overall_rating": 5,
    "doctor_rating": 5,
    "service_rating": 4,
    "facility_rating": 4,
    "waiting_time_rating": 3,
    "comment": "Bác sĩ tận tâm, dịch vụ tốt",
    "admin_reply": null,
    "admin_replied_at": null,
    "is_anonymous": false,
    "status": "APPROVED",
    "source": "APP",
    "raw_data": null,
    "created_at": "2026-07-01T02:00:00.000Z",
    "updated_at": "2026-07-01T02:00:00.000Z",
    "doctor": { "id": "d1e2....", "doctor_id": "BS001", "doctor_name": "Nguyễn Văn A", "description": null },
    "exam_area": { "id": "e4f5....", "code": "KA1", "name": "Khu khám A", "short_name": "KA", "address": "...", "phone": "..." },
    "facility": { "id": "11111111-1111-1111-1111-111111111111", "facility_name": "Bệnh viện Vạn Hạnh", "idbv": "VH01" },
    "patient": { "id": "9c8d....", "patient_full_name": "Trần Thị B", "phone_number": "0901234567" }
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 4.3. Response — lỗi

**404 — không tìm thấy:**
```json
{
  "message": "Không tìm thấy đánh giá lịch khám",
  "message_en": "Appointment review not found",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

---

### 5. PUT `/appointment-reviews/{id}` — Cập nhật

**Yêu cầu Bearer token.**

#### 5.1. Request

| Param | Vị trí | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | path | **Có** | ID đánh giá |

**Body** — tất cả field đều **optional** (partial update, chỉ field nào có trong body mới được cập nhật):

```json
{
  "overall_rating": 4,
  "doctor_rating": 4,
  "service_rating": 4,
  "facility_rating": 4,
  "waiting_time_rating": 3,
  "comment": "Cập nhật lại đánh giá",
  "admin_reply": "Cảm ơn bạn đã đánh giá",
  "status": "APPROVED"
}
```

Toàn bộ field có thể sửa: `facility_id`, `appointment_id`, `patient_id`, `doctor_id`, `exam_area_id`, `specialty_id`, `room_id`, `overall_rating`, `doctor_rating`, `service_rating`, `facility_rating`, `waiting_time_rating`, `comment`, `admin_reply`, `admin_replied_at`, `is_anonymous`, `status`, `source`, `raw_data`.

> **Hành vi đặc biệt:** nếu truyền `admin_reply` mà **không** truyền `admin_replied_at`, server tự set `admin_replied_at = new Date()`. Nếu truyền cả 2, dùng đúng giá trị `admin_replied_at` đã truyền.

```bash
curl -s -X PUT "http://localhost:3000/api/v1.0/appointment-reviews/2f1b0d0a-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "APPROVED", "admin_reply": "Cảm ơn bạn đã đánh giá" }'
```

#### 5.2. Response — thành công (200)

```json
{
  "message": "Cập nhật đánh giá lịch khám thành công",
  "message_en": "Update appointment review successful",
  "responseData": {
    "id": "2f1b0d0a-....",
    "status": "APPROVED",
    "admin_reply": "Cảm ơn bạn đã đánh giá",
    "admin_replied_at": "2026-07-03T10:00:00.000Z",
    "updated_at": "2026-07-03T10:00:00.000Z"
    /* ...các field còn lại giữ nguyên/đã update */
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

Response **không include** `doctor`/`exam_area`/`facility`/`patient`.

#### 5.3. Response — lỗi

- **404** — không tìm thấy đánh giá (message giống mục 4.3).
- **400** — `overall_rating` truyền nhưng ngoài khoảng 1–5 (message giống mục 3.3).
- **401** — thiếu/sai Bearer token.

---

### 6. DELETE `/appointment-reviews/{id}` — Xóa

**Yêu cầu Bearer token.** Xóa cứng (hard delete), không có `deleted_at`.

```bash
curl -s -X DELETE "http://localhost:3000/api/v1.0/appointment-reviews/2f1b0d0a-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

#### 6.1. Response — thành công (200)

```json
{
  "message": "Xóa đánh giá lịch khám thành công",
  "message_en": "Delete appointment review successful",
  "responseData": null,
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

#### 6.2. Response — lỗi

**404 — không tìm thấy** (message giống mục 4.3). **401** — thiếu/sai Bearer token.

---

### 7. Checklist test

- [ ] **List không lỗi facility.name**: gọi GET list, đảm bảo không còn lỗi `column facility.name does not exist` (đã đổi sang `facility_name`).
- [ ] **List trả tên bệnh nhân**: mỗi row có `patient.patient_full_name`, không chỉ `patient_id`.
- [ ] **Filter rời hoạt động**: `facility_id`, `doctor_id`, `exam_area_id`, `patient_id`, `appointment_id`, `status`, `source`, `min_rating`, `max_rating` lọc đúng.
- [ ] **`filters` param không có tác dụng** (biết trước, xem mục 2.4) — không coi là bug khi test.
- [ ] **POST validate**: thiếu `facility_id`/`overall_rating` → 400; `overall_rating` ngoài 1–5 → 400; thiếu token → 401.
- [ ] **GET detail 404** khi id không tồn tại.
- [ ] **PUT admin_reply tự set admin_replied_at** khi không truyền `admin_replied_at`.
- [ ] **PUT validate overall_rating** khi có truyền.
- [ ] **DELETE xóa cứng**: sau khi xóa, GET detail trả 404.
- [ ] **Auth**: POST/PUT/DELETE không có token → 401; GET (list + detail) không cần token.
<!-- MERGED_API_DOCS_END -->

---

# Tổng hợp lỗi đã phát hiện

Trong quá trình đọc toàn bộ 75 file controller (không phải chỉ những API vừa sửa trong session này), phát hiện thêm các vấn đề sau — **chưa sửa gì**, chỉ liệt kê để bạn quyết định có cần xử lý không:

| # | Vị trí | Vấn đề | Mức độ |
|---|---|---|---|
| 1 | `DELETE /auth/logout` | Gọi `userProvider.logoutSession()` — method không tồn tại → **luôn lỗi 500**, đăng xuất không hoạt động | 🔴 Cao |
| 2 | `appointment-reviews/index.ts` (list) + `{id}.ts` (detail) | Đã từng có lỗi include `facility.name` trong khi model chỉ có `facility_name`; theo tài liệu chi tiết hiện tại đã đổi sang `facility_name` và thêm include `patient`. | Đã xử lý |
| 3 | `payment/vcb/inquiry.ts` | Đọc `booking.dataValues.amount` — cột `amount` không tồn tại trên model `appointmentBooking` → `billAmount` luôn trả `0` | 🟡 Trung bình |
| 4 | `POST /auth/forgotPassword` | Gọi `resendOTP(user)` thiếu tham số `authMethod` → OTP bị ghi nhầm `auth_method='register-otp'` thay vì `'forgot-otp'` | 🟡 Trung bình |
| 5 | `POST /auth/register` | Bỏ qua field `password` trong body, luôn hard-code mật khẩu `"123456789"` | 🟡 Trung bình (có thể là chủ đích) |
| 6 | `POST /auth/genNewAccessToken` | Không kiểm tra `user_session.expire` — session hết hạn vẫn cấp token mới được | 🟡 Trung bình |
| 7 | `posts/*`, `post-categories/*` (toàn bộ CRUD) | Không có middleware `verify` nào — public hoàn toàn kể cả tạo/sửa/xóa | 🟡 Trung bình (có thể là chủ đích cho CMS nội bộ) |
| 8 | `GET /roles` | Không yêu cầu đăng nhập trong khi POST/PUT/DELETE cùng resource đều yêu cầu | 🟢 Thấp |
| 9 | Nhiều `PUT`/`DELETE` dùng `BaseProvider.put/delete` trực tiếp (`page-config/{id}`, `post-categories/{id}` PATCH, `posts/{id}` PATCH, `exam-areas/{id}` PUT/DELETE, `specialties/{id}` PUT/DELETE, `notifications/markAsRead/{id}`, `users/{id}` PUT/DELETE, `doctors` POST...) | Không check tồn tại trước khi update/destroy → `id` sai sẽ lỗi 500 chung thay vì 404 rõ ràng | 🟢 Thấp (UX) |
| 10 | `queryModifier` (pattern A) | `req.payload.filters` luôn là `{}` — tham số `filters` khai trong swagger của rất nhiều endpoint (doctor-work-schedules, exam-areas, roles, specialties, appointment-reviews...) **không thực sự lọc được gì** | 🟢 Thấp (doc sai lệch hành vi thật) |
| 11 | `GET /rooms/{id}` vs `PUT`/`DELETE /rooms/{id}` | `id` mang 2 ý nghĩa khác nhau trên cùng 1 resource (UUID DB vs mã HIS) | 🟢 Thấp (dễ gây nhầm lẫn khi tích hợp) |
