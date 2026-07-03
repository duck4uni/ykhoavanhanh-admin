# Admin Patients API

API cho phép admin tạo và quản lý hồ sơ bệnh nhân trong hệ thống.

## Base URL
```
/api/v1.0/users/admin/patient
```

## Endpoints

### Create Patient Record
**POST** `/users/admin/patient`

Admin tạo hồ sơ bệnh nhân mới với thông tin cơ bản và địa chỉ.

#### Authentication
Requires Bearer token in Authorization header:
```
Authorization: Bearer <admin_token>
```

#### Request Body
| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| facility_id | string (UUID) | ✓ | ID cơ sở y tế | Phải tồn tại |
| his_patient_id | string | ✓ | Mã bệnh nhân từ HIS | Unique per facility |
| patient_full_name | string | ✓ | Họ tên đầy đủ | Max 500 ký tự |
| patient_first_name | string | No | Tên đầu | Max 255 ký tự |
| patient_last_name | string | No | Họ | Max 255 ký tự |
| national_code | string | No | Mã quốc gia | Max 30 ký tự |
| birthday | string (YYYY-MM-DD) | No | Ngày sinh | ISO 8601 format |
| birth_year | string | No | Năm sinh | Max 10 ký tự |
| sex | string | No | Giới tính | MALE / FEMALE |
| ethnic_code | string | No | Mã dân tộc | Max 30 ký tự |
| ethnic_name | string | No | Tên dân tộc | Max 255 ký tự |
| phone_number | string | No | Số điện thoại | Max 30 ký tự |
| identity_number | string | No | Số CMND/Hộ chiếu | Max 50 ký tự |
| insurance_number | string | No | Số bảo hiểm | Max 50 ký tự |
| insurance_expired_date_text | string | No | Hạn bảo hiểm | Max 100 ký tự |
| id_card_code | string | No | Mã thẻ ID | Max 100 ký tự |
| profession_id | string | No | ID nghề nghiệp | Max 30 ký tự |
| profession_name | string | No | Tên nghề nghiệp | Max 255 ký tự |
| address_street | string | No | Tên đường | TEXT |
| address_detail | string | No | Chi tiết địa chỉ | TEXT |
| ward_code | string | No | Mã phường/xã | Max 30 ký tự |
| ward_name | string | No | Tên phường/xã | Max 255 ký tự |
| district_code | string | No | Mã quận/huyện | Max 30 ký tự |
| district_name | string | No | Tên quận/huyện | Max 255 ký tự |
| province_code | string | No | Mã tỉnh/thành phố | Max 30 ký tự |
| province_name | string | No | Tên tỉnh/thành phố | Max 255 ký tự |
| country_code | string | No | Mã quốc gia | Max 30 ký tự |
| country_name | string | No | Tên quốc gia | Max 255 ký tự |
| address_full | string | No | Địa chỉ đầy đủ | TEXT |
| his_updated_at | string (ISO 8601) | No | Thời gian cập nhật từ HIS | - |
| raw_data | object | No | Dữ liệu gốc từ HIS | JSONB |

#### Example Request

```json
{
  "facility_id": "550e8400-e29b-41d4-a716-446655440000",
  "his_patient_id": "BN-2025-001",
  "patient_first_name": "Nguyễn",
  "patient_last_name": "Văn A",
  "patient_full_name": "Nguyễn Văn A",
  "national_code": "001234567890",
  "birthday": "1990-01-15",
  "birth_year": "1990",
  "sex": "MALE",
  "phone_number": "0123456789",
  "identity_number": "123456789012",
  "insurance_number": "BH123456789",
  "insurance_expired_date_text": "2026-12-31",
  "ethnic_code": "01",
  "ethnic_name": "Kinh",
  "profession_id": "PROF-001",
  "profession_name": "Kỹ sư",
  "address_street": "123 Đường ABC",
  "address_detail": "Tòa nhà 5, Tầng 3",
  "ward_code": "01",
  "ward_name": "Phường 1",
  "district_code": "001",
  "district_name": "Quận 1",
  "province_code": "79",
  "province_name": "Thành phố Hồ Chí Minh",
  "country_code": "VN",
  "country_name": "Việt Nam",
  "address_full": "123 Đường ABC, Phường 1, Quận 1, TP HCM"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Tạo hồ sơ bệnh nhân thành công",
  "message_en": "Create patient record successful",
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440099",
    "facility_id": "550e8400-e29b-41d4-a716-446655440000",
    "his_patient_id": "BN-2025-001",
    "patient_first_name": "Nguyễn",
    "patient_last_name": "Văn A",
    "patient_full_name": "Nguyễn Văn A",
    "national_code": "001234567890",
    "birthday": "1990-01-15",
    "birth_year": "1990",
    "sex": "MALE",
    "ethnic_code": "01",
    "ethnic_name": "Kinh",
    "phone_number": "0123456789",
    "address_detail": "Tòa nhà 5, Tầng 3",
    "address_street": "123 Đường ABC",
    "ward_code": "01",
    "ward_name": "Phường 1",
    "district_code": "001",
    "district_name": "Quận 1",
    "province_code": "79",
    "province_name": "Thành phố Hồ Chí Minh",
    "country_code": "VN",
    "country_name": "Việt Nam",
    "profession_id": "PROF-001",
    "profession_name": "Kỹ sư",
    "identity_number": "123456789012",
    "insurance_number": "BH123456789",
    "insurance_expired_date_text": "2026-12-31",
    "id_card_code": null,
    "address_full": "123 Đường ABC, Phường 1, Quận 1, TP HCM",
    "his_updated_at": null,
    "raw_data": null,
    "synced_at": "2025-01-15T10:30:00Z",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    "facility": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "idbv": "BV001",
      "facility_name": "Bệnh viện Đại học Y Dược TP HCM"
    }
  }
}
```

#### Error Response - Missing Required Fields (400)
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: facility_id, his_patient_id, patient_full_name",
  "message_en": "Missing required fields: facility_id, his_patient_id, patient_full_name",
  "error": "Missing required fields"
}
```

#### Error Response - Facility Not Found (404)
```json
{
  "success": false,
  "message": "Cơ sở y tế không tồn tại",
  "message_en": "Facility not found",
  "error": "Facility not found"
}
```

#### Error Response - Patient Already Exists (409)
```json
{
  "success": false,
  "message": "Hồ sơ bệnh nhân đã tồn tại trong cơ sở y tế này",
  "message_en": "Patient already exists in this facility",
  "error": "Patient already exists"
}
```

#### Curl Example

**Create patient with full information:**
```bash
curl -X POST "http://localhost:3000/api/v1.0/users/admin/patient" \
  -H "Authorization: Bearer your_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "550e8400-e29b-41d4-a716-446655440000",
    "his_patient_id": "BN-2025-001",
    "patient_first_name": "Nguyễn",
    "patient_last_name": "Văn A",
    "patient_full_name": "Nguyễn Văn A",
    "birthday": "1990-01-15",
    "sex": "MALE",
    "phone_number": "0123456789",
    "identity_number": "123456789012",
    "insurance_number": "BH123456789",
    "ethnic_code": "01",
    "ethnic_name": "Kinh",
    "address_street": "123 Đường ABC",
    "district_name": "Quận 1",
    "province_name": "Thành phố Hồ Chí Minh",
    "country_code": "VN",
    "country_name": "Việt Nam"
  }'
```

**Create patient with minimal information:**
```bash
curl -X POST "http://localhost:3000/api/v1.0/users/admin/patient" \
  -H "Authorization: Bearer your_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "550e8400-e29b-41d4-a716-446655440000",
    "his_patient_id": "BN-2025-002",
    "patient_full_name": "Nguyễn Thị B"
  }'
```

---

## Data Model

### HIS Patient Fields

| Field | Type | Database Type | Notes |
|-------|------|---------------|-------|
| id | UUID | UUID | Primary key, auto-generated |
| facility_id | UUID | UUID | Foreign key to `his_facility_configs` |
| his_patient_id | string | VARCHAR(50) | Unique per facility |
| patient_first_name | string | VARCHAR(255) | Tên đầu |
| patient_last_name | string | VARCHAR(255) | Họ |
| patient_full_name | string | VARCHAR(500) | Họ tên đầy đủ |
| national_code | string | VARCHAR(30) | Mã quốc gia |
| birthday | date | DATEONLY | Ngày sinh |
| birth_year | string | VARCHAR(10) | Năm sinh |
| sex | string | VARCHAR(20) | MALE / FEMALE / OTHER |
| ethnic_code | string | VARCHAR(30) | Mã dân tộc |
| ethnic_name | string | VARCHAR(255) | Tên dân tộc |
| phone_number | string | VARCHAR(30) | Điện thoại |
| address_detail | text | TEXT | Chi tiết địa chỉ |
| address_street | text | TEXT | Tên đường |
| ward_code | string | VARCHAR(30) | Mã phường/xã |
| ward_name | string | VARCHAR(255) | Tên phường/xã |
| district_code | string | VARCHAR(30) | Mã quận/huyện |
| district_name | string | VARCHAR(255) | Tên quận/huyện |
| province_code | string | VARCHAR(30) | Mã tỉnh/thành phố |
| province_name | string | VARCHAR(255) | Tên tỉnh/thành phố |
| country_code | string | VARCHAR(30) | Mã quốc gia |
| country_name | string | VARCHAR(255) | Tên quốc gia |
| profession_id | string | VARCHAR(30) | ID nghề nghiệp |
| profession_name | string | VARCHAR(255) | Tên nghề nghiệp |
| identity_number | string | VARCHAR(50) | CMND / Hộ chiếu |
| insurance_number | string | VARCHAR(50) | Số bảo hiểm |
| insurance_expired_date_text | string | VARCHAR(100) | Hạn BH (text) |
| id_card_code | string | VARCHAR(100) | Mã thẻ ID |
| address_full | text | TEXT | Địa chỉ đầy đủ |
| his_updated_at | timestamp | DATE | Cập nhật từ HIS |
| raw_data | object | JSONB | Dữ liệu gốc từ HIS |
| synced_at | timestamp | TIMESTAMP | Lần sync cuối (auto: now) |
| created_at | timestamp | TIMESTAMP | Ngày tạo (auto: now) |
| updated_at | timestamp | TIMESTAMP | Ngày cập nhật (auto: now) |

### Unique Constraints
- `facility_id` + `his_patient_id` (unique combination)

### Indexes
- `idx_his_patients_full_name` on `patient_full_name`
- `idx_his_patients_identity_number` on (`facility_id`, `identity_number`)
- `idx_his_patients_insurance_number` on (`facility_id`, `insurance_number`)
- `idx_his_patients_phone` on (`facility_id`, `phone_number`)

---

## Related Models

### HIS Facility Config
Cơ sở y tế được tham chiếu từ `facility_id`:
```
{
  id: UUID (primary key)
  idbv: VARCHAR (mã cơ sở y tế)
  facility_name: VARCHAR (tên cơ sở y tế)
  is_active: BOOLEAN
  ...
}
```

### Relationships
Patient có các liên kết:
- `hasMany appointmentBooking` - Các lịch đặt khám
- `hasMany appointmentReview` - Các lần khám
- `hasMany medicalRecord` - Các hồ sơ bệnh án
- `belongsTo facility` - Cơ sở y tế

---

## Test Checklist

- [ ] POST tạo patient với tất cả trường bắt buộc
- [ ] POST tạo patient với tất cả trường tùy chọn
- [ ] POST tạo patient với tối thiểu thông tin
- [ ] POST kiểm tra validation facility_id bắt buộc
- [ ] POST kiểm tra validation his_patient_id bắt buộc
- [ ] POST kiểm tra validation patient_full_name bắt buộc
- [ ] POST kiểm tra facility không tồn tại (404)
- [ ] POST kiểm tra patient đã tồn tại (409)
- [ ] POST kiểm tra unique constraint: facility_id + his_patient_id
- [ ] POST kiểm tra authentication (Bearer token required)
- [ ] POST kiểm tra response bao gồm facility info
- [ ] POST kiểm tra synced_at được set tự động
- [ ] POST kiểm tra created_at/updated_at được set tự động
- [ ] POST kiểm tra raw_data lưu là JSONB (nếu được cung cấp)
- [ ] POST với birthday format ISO 8601
- [ ] POST với his_updated_at format ISO 8601
- [ ] Xác nhận patient có thể search sau khi tạo (index by full_name, phone, insurance)
- [ ] Xác nhận patient có thể link với appointment/medical record

---

## Notes

### Data Validation
- `patient_full_name` là bắt buộc, không thể để trống
- `facility_id` phải là UUID hợp lệ và cơ sở y tế phải tồn tại
- `his_patient_id` phải unique trong một cơ sở y tế

### Unique Constraint
- Combine `facility_id` + `his_patient_id` được đánh index unique
- Không thể tạo 2 patient với cùng `his_patient_id` trong cùng `facility_id`

### Timestamps
- `synced_at`, `created_at`, `updated_at` được tự động set khi tạo
- `synced_at` được set bằng `now()` để theo dõi lần sync cuối

### Data Fields
- Tất cả trường địa chỉ (ward, district, province, country) được lưu dạng code và name
- `raw_data` lưu dữ liệu gốc từ HIS (JSONB), hữu ích để audit hoặc debug
- `his_updated_at` là timestamp khi dữ liệu được cập nhật trên HIS

### Future Integration
- Patient có thể kết nối với `appointmentBooking` để đặt lịch
- Patient có thể kết nối với `medicalRecord` để lưu hồ sơ bệnh án
- Patient có thể kết nối với `appointmentReview` để theo dõi các lần khám
