# Admin Users API

API cho phép admin tạo tài khoản người dùng mới trong hệ thống.

## Base URL
```
/api/v1.0/users/admin
```

## Endpoints

### Create User Account
**POST** `/users/admin`

Admin tạo tài khoản người dùng mới với email, số điện thoại, mật khẩu và các thông tin khác.

#### Authentication
Requires Bearer token in Authorization header:
```
Authorization: Bearer <admin_token>
```

#### Request Body
| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| email | string | ✓ | Email người dùng | Unique, định dạng email |
| phone | string | ✓ | Số điện thoại | Unique |
| password | string | ✓ | Mật khẩu | Min 6 ký tự, không hash |
| full_name | string | No | Họ tên đầy đủ | Max 50 ký tự |
| address | string | No | Địa chỉ | Max 255 ký tự |
| birthday | string (YYYY-MM-DD) | No | Ngày sinh | ISO 8601 format |
| cccd | string | No | Số CCCD/ID | Unique, max 20 ký tự |
| avatar | string | No | Ảnh đại diện | Tên file hoặc URL |
| is_admin | boolean | No | Admin flag | Mặc định: false |
| is_active | boolean | No | Trạng thái hoạt động | Mặc định: true |
| role_id | string (UUID) | No | UUID vai trò | Tùy chọn, nếu không thì không gán vai trò |

#### Example Request

```json
{
  "email": "nguyenvana@example.com",
  "phone": "0123456789",
  "password": "SecurePass123!",
  "full_name": "Nguyễn Văn A",
  "address": "123 Đường ABC, TP HCM",
  "birthday": "1990-01-15",
  "cccd": "123456789012",
  "avatar": "avatar.jpg",
  "is_admin": false,
  "is_active": true,
  "role_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Tạo tài khoản người dùng thành công",
  "message_en": "Create user account successful",
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "full_name": "Nguyễn Văn A",
    "address": "123 Đường ABC, TP HCM",
    "birthday": "1990-01-15T00:00:00Z",
    "cccd": "123456789012",
    "avatar": "avatar.jpg",
    "is_admin": false,
    "is_active": true,
    "zalo_id": null,
    "zalo_avatar": null,
    "zalo_id_by_oa": null,
    "created_at": "2025-01-15T10:30:00Z",
    "created_by": "550e8400-e29b-41d4-a716-446655440099",
    "updated_at": "2025-01-15T10:30:00Z",
    "updated_by": null,
    "user_roles": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "role_id": "550e8400-e29b-41d4-a716-446655440000",
        "role": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "role_name": "Staff"
        }
      }
    ]
  }
}
```

#### Error Response - Missing Required Fields (400)
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: email, phone, password",
  "message_en": "Missing required fields: email, phone, password",
  "error": "Missing required fields"
}
```

#### Error Response - Invalid Password (400)
```json
{
  "success": false,
  "message": "Mật khẩu phải có ít nhất 6 ký tự",
  "message_en": "Password must be at least 6 characters",
  "error": "Invalid password"
}
```

#### Error Response - Email Already Exists (409)
```json
{
  "success": false,
  "message": "Email đã được sử dụng",
  "message_en": "Email already in use",
  "error": "Email already exists"
}
```

#### Error Response - CCCD Already Exists (409)
```json
{
  "success": false,
  "message": "CCCD đã được sử dụng",
  "message_en": "CCCD already in use",
  "error": "CCCD already exists"
}
```

#### Curl Example

**Create user with role:**
```bash
curl -X POST "http://localhost:3000/api/v1.0/users/admin" \
  -H "Authorization: Bearer your_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "password": "SecurePass123!",
    "full_name": "Nguyễn Văn A",
    "address": "123 Đường ABC, TP HCM",
    "birthday": "1990-01-15",
    "cccd": "123456789012",
    "avatar": "avatar.jpg",
    "is_admin": false,
    "is_active": true,
    "role_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Create user without role:**
```bash
curl -X POST "http://localhost:3000/api/v1.0/users/admin" \
  -H "Authorization: Bearer your_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "0987654321",
    "password": "Password123",
    "full_name": "Người dùng mới"
  }'
```

---

## Data Flow

### User Creation Process
1. **Validate Input**: Kiểm tra các trường bắt buộc và định dạng
2. **Check Uniqueness**: Kiểm tra email và CCCD có bị trùng hay không
3. **Create User**: Tạo record mới trong bảng `user`
4. **Hash Password**: Mã hóa mật khẩu bằng bcryptjs (salt rounds: 10)
5. **Create Auth**: Tạo record `user_auth` với auth_method='password'
6. **Assign Role**: Nếu `role_id` được cung cấp, tạo record `user_roles`
7. **Return User**: Trả về user info kèm theo role information

### Password Security
- Mật khẩu được yêu cầu tối thiểu 6 ký tự
- Mật khẩu được hash sử dụng bcryptjs với salt rounds = 10
- Mật khẩu gốc KHÔNG được lưu trong database
- Mật khẩu được gửi qua request body (client có trách nhiệm sử dụng HTTPS)

---

## User Fields Details

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Tự động tạo |
| email | VARCHAR(255) | Unique, bắt buộc |
| phone | VARCHAR(50) | Unique |
| full_name | VARCHAR(50) | Tên người dùng |
| address | VARCHAR(255) | Địa chỉ |
| birthday | DATE | Ngày sinh |
| cccd | VARCHAR(20) | Unique, số CCCD/ID |
| avatar | VARCHAR(50) | Ảnh đại diện |
| is_admin | BOOLEAN | Admin flag, mặc định false |
| is_active | BOOLEAN | Status, mặc định true |
| zalo_id | VARCHAR(255) | Zalo user ID (social login) |
| zalo_avatar | VARCHAR(255) | Zalo avatar URL |
| zalo_id_by_oa | VARCHAR | Zalo ID from OA |
| created_at | TIMESTAMP | Thời gian tạo |
| created_by | UUID | ID người tạo (admin) |
| updated_at | TIMESTAMP | Thời gian cập nhật |
| updated_by | UUID | ID người cập nhật cuối cùng |

---

## Related Data Models

### userAuth
Lưu thông tin xác thực của user:
```
{
  id: UUID (primary key)
  user_id: UUID (foreign key)
  auth_key: TEXT (hashed password)
  auth_method: VARCHAR(255) (ví dụ: 'password', 'zalo', 'google')
  is_primary: BOOLEAN
  created_at: TIMESTAMP
  created_by: UUID
  updated_at: TIMESTAMP
  updated_by: UUID
}
```

### userRole
Gán vai trò cho user:
```
{
  id: UUID (primary key)
  user_id: UUID (foreign key)
  role_id: UUID (foreign key)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

---

## Test Checklist

- [ ] POST tạo user với tất cả trường bắt buộc
- [ ] POST tạo user và gán role
- [ ] POST tạo user mà không gán role
- [ ] POST kiểm tra validation email bắt buộc
- [ ] POST kiểm tra validation phone bắt buộc
- [ ] POST kiểm tra validation password bắt buộc
- [ ] POST kiểm tra password tối thiểu 6 ký tự
- [ ] POST kiểm tra email đã tồn tại (409)
- [ ] POST kiểm tra CCCD đã tồn tại (409)
- [ ] POST kiểm tra default values (is_admin=false, is_active=true)
- [ ] POST kiểm tra authentication (Bearer token required)
- [ ] POST kiểm tra response bao gồm user_roles với role info
- [ ] POST kiểm tra password được hash (không trả về mật khẩu gốc)
- [ ] POST kiểm tra created_by được set thành ID của admin
- [ ] POST kiểm tra email unique constraint
- [ ] POST kiểm tra cccd unique constraint
- [ ] Xác nhận user có thể login với email/phone và password vừa tạo

---

## Notes

- **Password Hashing**: Sử dụng bcryptjs v2a với salt rounds 10, tương thích với `UserProvider.comparePassword()`
- **Unique Constraints**: Email và CCCD được đánh index unique, nên check trước khi tạo
- **Role Assignment**: Là tùy chọn, user có thể tạo không gán role
- **Admin Audit**: `created_by` được set tự động từ token của admin hiện tại
- **No Password Return**: API không trả về password hash trong response
- **Social Login**: userAuth có thể có auth_method khác như 'zalo', 'google', 'facebook' trong tương lai
