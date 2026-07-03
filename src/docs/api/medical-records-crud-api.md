# Medical Records API — CRUD

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

## 1. Model — bảng `medical_records`

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

## 2. GET `/medical-records` — Danh sách

Không yêu cầu auth. Có middleware `queryModifier` (phân trang/sort).

### 2.1. Request

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

### 2.2. Response — thành công (200)

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

## 3. POST `/medical-records` — Tạo mới

**Yêu cầu Bearer token.**

### 3.1. Request body

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

### 3.2. Response — thành công (200)

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

### 3.3. Response — lỗi

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

## 4. GET `/medical-records/{id}` — Chi tiết

Không yêu cầu auth.

### 4.1. Request

```bash
curl -s "http://localhost:3000/api/v1.0/medical-records/a1b2c3d4-0000-0000-0000-000000000000"
```

### 4.2. Response — thành công (200)

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

### 4.3. Response — lỗi

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

## 5. PUT `/medical-records/{id}` — Cập nhật

**Yêu cầu Bearer token.** Tất cả field đều optional (partial update).

### 5.1. Request body

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

### 5.2. Response — thành công (200)

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

### 5.3. Response — lỗi

**404** khi không tìm thấy. **401** khi thiếu token.

---

## 6. DELETE `/medical-records/{id}` — Xóa

**Yêu cầu Bearer token.** Xóa cứng (hard delete).

```bash
curl -s -X DELETE "http://localhost:3000/api/v1.0/medical-records/a1b2c3d4-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

### 6.1. Response — thành công (200)

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

### 6.2. Response — lỗi

**404** khi không tìm thấy. **401** khi thiếu token.

---

## 7. Checklist test

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
