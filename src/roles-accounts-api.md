# Roles / User-Roles / Internal Accounts / Permissions API

Tài liệu API quản lý **vai trò (role)**, **gán vai trò cho người dùng (user-roles)**, **tạo tài khoản nội bộ (internal-accounts)** và **phân quyền thật (permissions)**.

> **`is_admin` đã thu hẹp nghĩa.** Từ bản RBAC này, `is_admin = true` chỉ còn
> nghĩa **"super admin duy nhất"** (bỏ qua mọi kiểm tra quyền). Nhân viên nội bộ
> tạo mới qua `POST /internal-accounts` có `is_admin: false` và lấy quyền từ
> `role_permissions`. Nhân viên cũ **vẫn giữ `is_admin = true`** vì không có
> migration hạ cờ — cần chỉnh tay trên DB nếu muốn họ chịu kiểm tra quyền.

## Quy ước chung

- Base path: `/api/v1.0`
- Auth: header `Authorization: Bearer <token>` (xem cột "Auth" mỗi endpoint).
- Tất cả response bọc theo convention dự án (`res.sendOk`/`res.sendError`):
  ```json
  {
    "message": "...",
    "message_en": "...",
    "responseData": <data | null>,
    "status": "success | fail",
    "timeStamp": "2026-06-29 10:00:00",
    "violations": null
  }
  ```
  → Dữ liệu thực nằm trong **`responseData`**.

| Endpoint | Method | Auth |
|---|---|---|
| `/roles` | GET | – |
| `/roles` | POST | Bearer |
| `/roles/{id}` | GET | – |
| `/roles/{id}` | PUT | Bearer |
| `/roles/{id}` | DELETE | Bearer |
| `/user-roles` | GET | – |
| `/user-roles` | POST | Bearer |
| `/user-roles/{id}` | GET | – |
| `/user-roles/{id}` | DELETE | Bearer |
| `/internal-accounts` | POST | Bearer |
| `/permissions` | GET | Bearer (super admin) |
| `/roles/{id}/permissions` | GET | Bearer (super admin) |
| `/roles/{id}/permissions` | PUT | Bearer (super admin) |
| `/users/me/permissions` | GET | Bearer |

---

## 1. Roles

Bảng `roles`: `id (uuid)`, `role_name (unique)`, `description`, `receptionist`, `membership`, `marketing`, `accountant`, `customer_service`, `created_at`, `updated_at`.

### 1.1 GET `/roles` — danh sách (phân trang)

Query params:

| Param | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `page` | int | 1 | trang hiện tại |
| `pageSize` | int | 10 (max 100) | số bản ghi/trang |
| `sortField` | string | `created_at` | trường sắp xếp |
| `sortOrder` | string | `ASC` | `ASC` \| `DESC` |
| `filters` | string | – | ví dụ `receptionist:true` |

```
GET /api/v1.0/roles?page=1&pageSize=10&sortField=created_at&sortOrder=DESC
```

`responseData`:
```json
{
  "count": 5,
  "rows": [
    {
      "id": "uuid",
      "role_name": "RECEPTIONIST",
      "description": "Lễ tân",
      "receptionist": true,
      "membership": false,
      "marketing": false,
      "accountant": false,
      "customer_service": false,
      "created_at": "2026-06-29T03:00:00.000Z",
      "updated_at": "2026-06-29T03:00:00.000Z"
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### 1.2 POST `/roles` — tạo vai trò *(Bearer)*

Body:
```json
{
  "role_name": "RECEPTIONIST",
  "description": "Lễ tân",
  "receptionist": true,
  "membership": false,
  "marketing": false,
  "accountant": false,
  "customer_service": false
}
```

| Field | Bắt buộc | Mặc định |
|---|---|---|
| `role_name` | ✅ | – (unique, chặn trùng) |
| `description` | ❌ | null |
| `receptionist` | ❌ | false |
| `membership` | ❌ | false |
| `marketing` | ❌ | false |
| `accountant` | ❌ | false |
| `customer_service` | ❌ | false |

Lỗi: `400` thiếu `role_name` hoặc tên đã tồn tại.

### 1.3 GET `/roles/{id}` — chi tiết
`404` nếu không tìm thấy.

### 1.4 PUT `/roles/{id}` — cập nhật *(Bearer)*

Body (mọi field tùy chọn, chỉ gửi field cần đổi):
```json
{
  "role_name": "RECEPTIONIST",
  "description": "Lễ tân quầy",
  "receptionist": true,
  "membership": false,
  "marketing": false,
  "accountant": false,
  "customer_service": true
}
```
Lỗi: `404` không tồn tại; `400` `role_name` trùng với role khác.

### 1.5 DELETE `/roles/{id}` — xóa *(Bearer)*
`404` nếu không tồn tại.

---

## 2. User-Roles (gán vai trò cho người dùng)

Bảng `user_roles`: `id`, `user_id (uuid → user)`, `role_id (uuid → roles)`, unique `(user_id, role_id)`.

### 2.1 GET `/user-roles` — danh sách (phân trang)

Query params: `page`, `pageSize`, `sortField`, `sortOrder` (như Roles) + bộ lọc:

| Param | Kiểu | Ghi chú |
|---|---|---|
| `user_id` | uuid | lọc theo người dùng |
| `role_id` | uuid | lọc theo vai trò |

```
GET /api/v1.0/user-roles?user_id=<uuid>&page=1&pageSize=10
```

`responseData`: `{ count, rows, totalPages, currentPage }`, mỗi `row` kèm:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "role_id": "uuid",
  "created_at": "...",
  "updated_at": "...",
  "user": { "id": "uuid", "full_name": "Nguyễn Văn A", "phone": "0900000000", "email": "a@gmail.com", "is_admin": true },
  "role": { "id": "uuid", "role_name": "RECEPTIONIST", "description": "Lễ tân", "receptionist": true, "membership": false, "marketing": false, "accountant": false, "customer_service": false }
}
```

### 2.2 POST `/user-roles` — gán vai trò *(Bearer)*

Body:
```json
{ "user_id": "<uuid-user>", "role_id": "<uuid-role>" }
```
Quy tắc: `404` nếu user/role không tồn tại; `400` nếu đã gán trùng.

### 2.3 GET `/user-roles/{id}` — chi tiết (kèm `user` + `role`)
`404` nếu không tồn tại.

### 2.4 DELETE `/user-roles/{id}` — gỡ gán *(Bearer)*
`404` nếu không tồn tại.

---

## 3. Internal Accounts (tài khoản nội bộ)

### POST `/internal-accounts` — tạo nhân viên + gán role *(Bearer)*

Tạo `user` + mật khẩu băm (bảng `user_auth`, `auth_method='password'`, `is_primary=true`) + `user_roles` trong **1 transaction** (lỗi giữa chừng sẽ rollback).
**`is_admin` được set cứng = `false`** (không nhận từ body). Nhân viên mới lấy
toàn bộ quyền từ permission của `role_id` được gán — xem mục 4.

Body:
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "a.nguyen@gmail.com",
  "phone": "0900000000",
  "password": "MatKhau@123",
  "role_id": "<uuid-role>"
}
```

| Field | Bắt buộc | Quy tắc |
|---|---|---|
| `full_name` | ✅ | |
| `email` | ✅ | đúng định dạng email, unique |
| `phone` | ✅ | unique |
| `password` | ✅ | ≥ 6 ký tự (lưu dạng băm bcrypt) |
| `role_id` | ✅ | UUID, role phải tồn tại |

Lỗi: `400` (thiếu/sai field, email|phone trùng), `404` (role không tồn tại).

`responseData` (không trả mật khẩu):
```json
{
  "id": "uuid",
  "full_name": "Nguyễn Văn A",
  "email": "a.nguyen@gmail.com",
  "phone": "0900000000",
  "is_active": true,
  "is_admin": false,
  "created_at": "...",
  "user_roles": [
    { "id": "uuid", "user_id": "uuid", "role_id": "uuid",
      "role": { "id": "uuid", "role_name": "RECEPTIONIST", "...": "..." } }
  ]
}
```

> Sau khi tạo, tài khoản đăng nhập được qua API login hiện có (email/phone + password).

---

## 4. Permissions (phân quyền thật)

Bảng `permissions` (`id`, `code`, `name`, `module`) + bảng nối `role_permissions`
(`role_id`, `permission_id`). Catalog gồm **27 permission code** khớp 1-1 với
union `Permission` ở `src/types/permissions.ts`; `name` là nhãn tiếng Việt lấy từ
`PERMISSION_LABELS`; `module` là tiền tố của code.

6 module: `admin` (9 code), `accountant` (4), `cskh` (6), `marketing` (3),
`receptionist` (3), `user` (2).

> Ba endpoint đầu yêu cầu **super admin** (`is_active && is_admin`), nếu không sẽ trả `403`.

### 4.1 GET `/permissions` — catalog toàn bộ quyền *(Bearer, super admin)*

```
GET /api/v1.0/permissions
```

`responseData` (mảng phẳng, không phân trang):
```json
[
  { "id": "uuid", "code": "admin.all", "name": "Toàn quyền hệ thống", "module": "admin" },
  { "id": "uuid", "code": "user.assign_role", "name": "Gán vai trò cho user", "module": "user" }
]
```

### 4.2 GET `/roles/{id}/permissions` — quyền của 1 vai trò *(Bearer, super admin)*

`responseData`:
```json
{ "role_id": "uuid", "permission_codes": ["cskh.chat", "cskh.survey"] }
```
`404` nếu role không tồn tại.

### 4.3 PUT `/roles/{id}/permissions` — thay thế toàn bộ quyền *(Bearer, super admin)*

Ghi **atomic replace**: danh sách gửi lên thay thế hoàn toàn danh sách cũ
(gửi mảng rỗng = gỡ hết quyền).

Body:
```json
{ "permission_codes": ["cskh.chat", "cskh.survey", "cskh.report_survey"] }
```

| Field | Bắt buộc | Quy tắc |
|---|---|---|
| `permission_codes` | ✅ | mảng string; mỗi phần tử phải là `code` có trong catalog |

Lỗi: `400` code không hợp lệ / sai định dạng body; `404` role không tồn tại.

### 4.4 GET `/users/me/permissions` — quyền của chính mình *(Bearer, mọi token hợp lệ)*

Endpoint FE dùng để dựng menu và gate UI. Không yêu cầu super admin.

`responseData`:
```json
{
  "is_active": true,
  "is_admin": false,
  "permission_codes": ["cskh.chat", "cskh.survey"]
}
```

- `is_admin: true` → super admin, bỏ qua mọi kiểm tra quyền (FE short-circuit).
- `permission_codes` là hợp của permission từ tất cả role được gán cho user.

---

## 5. curl mẫu

```bash
TOKEN="<token>"; BASE="http://localhost:3000/api/v1.0"

# Roles
curl -s "$BASE/roles?page=1&pageSize=10"
curl -s -X POST "$BASE/roles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"role_name":"ACCOUNTANT","description":"Kế toán","accountant":true}'
curl -s -X PUT "$BASE/roles/<id>" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"description":"Kế toán trưởng","accountant":true}'
curl -s -X DELETE "$BASE/roles/<id>" -H "Authorization: Bearer $TOKEN"

# User-Roles
curl -s "$BASE/user-roles?user_id=<uuid>"
curl -s -X POST "$BASE/user-roles" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","role_id":"<uuid>"}'
curl -s -X DELETE "$BASE/user-roles/<id>" -H "Authorization: Bearer $TOKEN"

# Internal account
curl -s -X POST "$BASE/internal-accounts" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"full_name":"Nguyễn Văn A","email":"a@gmail.com","phone":"0900000000","password":"MatKhau@123","role_id":"<uuid>"}'

# Permissions
curl -s "$BASE/permissions" -H "Authorization: Bearer $TOKEN"
curl -s "$BASE/roles/<role-id>/permissions" -H "Authorization: Bearer $TOKEN"
curl -s -X PUT "$BASE/roles/<role-id>/permissions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"permission_codes":["cskh.chat","cskh.survey"]}'
curl -s "$BASE/users/me/permissions" -H "Authorization: Bearer $TOKEN"
```
