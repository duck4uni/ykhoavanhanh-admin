# Appointment Reviews API

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

## 1. Model — bảng `appointment_reviews`

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

## 2. GET `/appointment-reviews` — Danh sách

Không yêu cầu auth. Có middleware `queryModifier` (phân trang/sort).

### 2.1. Request

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

### 2.2. Response — thành công (200)

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

### 2.3. Field include (join)

| Association | Attributes trả về | Nguồn |
|---|---|---|
| `doctor` | `id`, `doctor_id`, `doctor_name` | `his_doctors` |
| `exam_area` | `id`, `code`, `name`, `short_name` | `exam_areas` |
| `facility` | `id`, `facility_name`, `idbv` | `his_facility_configs` (**không có cột `name`**, phải dùng `facility_name`) |
| `patient` | `id`, `patient_full_name`, `phone_number` | `his_patients` |

> Đã fix bug: trước đây `facility` include yêu cầu cột `name` (không tồn tại) → lỗi `column facility.name does not exist`; và thiếu hẳn include `patient` nên response chỉ trả `patient_id` (UUID) chứ không có tên bệnh nhân. Cả `index.ts` và `{id}.ts` đã được sửa.

### 2.4. ⚠️ Lưu ý: `filters` chưa hoạt động

Swagger mô tả `filters` dạng `status:APPROVED`, nhưng middleware `queryModifier` ([`src/middlewares/query-modifier.ts`](../src/middlewares/query-modifier.ts)) chỉ lưu chuỗi thô vào `payload.rawFilter`, **không parse** thành `payload.filters` (luôn là `{}`). Controller dùng `req.payload.filters` nên **query param `filters` hiện không lọc được gì** — chỉ các query param rời (`status`, `source`, `min_rating`,...) mới có tác dụng. Cần sửa riêng nếu muốn dùng `filters`.

---

## 3. POST `/appointment-reviews` — Tạo mới

**Yêu cầu Bearer token** (middleware `verify`).

### 3.1. Request body

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

### 3.2. Response — thành công (200)

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

### 3.3. Response — lỗi

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

## 4. GET `/appointment-reviews/{id}` — Chi tiết

Không yêu cầu auth.

### 4.1. Request

| Param | Vị trí | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | path | **Có** | ID đánh giá |

```bash
curl -s "http://localhost:3000/api/v1.0/appointment-reviews/2f1b0d0a-0000-0000-0000-000000000000"
```

### 4.2. Response — thành công (200)

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

### 4.3. Response — lỗi

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

## 5. PUT `/appointment-reviews/{id}` — Cập nhật

**Yêu cầu Bearer token.**

### 5.1. Request

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

### 5.2. Response — thành công (200)

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

### 5.3. Response — lỗi

- **404** — không tìm thấy đánh giá (message giống mục 4.3).
- **400** — `overall_rating` truyền nhưng ngoài khoảng 1–5 (message giống mục 3.3).
- **401** — thiếu/sai Bearer token.

---

## 6. DELETE `/appointment-reviews/{id}` — Xóa

**Yêu cầu Bearer token.** Xóa cứng (hard delete), không có `deleted_at`.

```bash
curl -s -X DELETE "http://localhost:3000/api/v1.0/appointment-reviews/2f1b0d0a-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN"
```

### 6.1. Response — thành công (200)

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

### 6.2. Response — lỗi

**404 — không tìm thấy** (message giống mục 4.3). **401** — thiếu/sai Bearer token.

---

## 7. Checklist test

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
