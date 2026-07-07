# HIS Services API — Create & Update (không còn proxy sang HIS)

`POST /his-services` và `PUT /his-services/{id}` trước đây proxy thẳng request sang hệ thống HIS bên ngoài (`externalAPIService`). Nay 2 API này thao tác **thẳng trên DB** (`his_services`), không gọi HIS nữa.

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1.0/his-services` | Không | Tạo mới dịch vụ, ghi thẳng vào DB |
| PUT | `/api/v1.0/his-services/{id}` | Không | Cập nhật dịch vụ theo `id` (UUID), ghi thẳng vào DB |

- Controller: [`his-services/index.ts`](../src/controllers/api/v1.0/his-services/index.ts) (POST), [`his-services/{id}.ts`](../src/controllers/api/v1.0/his-services/{id}.ts) (PUT)
- Provider: [`HisServiceProvider`](../src/providers/hisServiceProvider.ts) → [`BaseProvider`](../src/providers/baseProvider.ts) (`post`, `put`)
- Model: [`hisService`](../src/models/hisService.ts) — bảng `his_services`

Response format theo convention chung của project (`res.sendOk`/`res.sendError` → `apiResponseDTO`), payload nằm trong `responseData`.

---

## 1. Model — bảng `his_services`

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | tự sinh | PK |
| `facility_id` | `uuid` | **Có** | FK → `his_facility_configs.id`; unique cùng `service_id` |
| `service_id` | `varchar(50)` | **Có** | Mã dịch vụ; unique cùng `facility_id` |
| `service_name` | `varchar(255)` | **Có** | Tên dịch vụ |
| `price` | `decimal` | Không | Đơn giá |
| `raw_data` | `jsonb` | Không | Dữ liệu thô/field mở rộng (vd `service_type`, `description`) |
| `synced_at` | `timestamp` | Không | Mặc định `now()` |
| `specialty_id` | `uuid` | Không | FK → `specialties.id` |
| `created_at` / `updated_at` | `timestamp` | tự sinh | |

---

## 2. POST `/his-services` — Tạo mới dịch vụ

### 2.1. Request body

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `facility_id` | `uuid` | Có (nếu không truyền `idbv`) | Ưu tiên dùng trực tiếp nếu có |
| `idbv` | `string` | Có (nếu không truyền `facility_id`) | Mã cơ sở HIS — dùng để resolve `facility_id` qua `resolveFacilityId()`; nếu bỏ trống cả hai, fallback về facility `is_active=true` mặc định |
| `service_id` | `string` | **Có** | Mã dịch vụ, unique theo `facility_id` |
| `service_name` | `string` | **Có** | Tên dịch vụ |
| `price` | `number` | Không | |
| `specialty_id` | `uuid` | Không | |
| `raw_data` | `object` | Không | |

```bash
curl -s -X POST "http://localhost:3000/api/v1.0/his-services" \
  -H "Content-Type: application/json" \
  -d '{
    "idbv": "VH01",
    "service_id": "SV001",
    "service_name": "Khám Nội tổng quát",
    "price": 150000,
    "specialty_id": "s1s20000-0000-0000-0000-000000000000"
  }'
```

### 2.2. Response — thành công (200)

```json
{
  "message": "Tạo dịch vụ thành công",
  "message_en": "Create service successful",
  "responseData": {
    "id": "a1b2c3d4-....",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "service_id": "SV001",
    "service_name": "Khám Nội tổng quát",
    "price": 150000,
    "raw_data": null,
    "synced_at": "2026-07-06T10:00:00.000Z",
    "specialty_id": "s1s20000-0000-0000-0000-000000000000",
    "created_at": "2026-07-06T10:00:00.000Z",
    "updated_at": "2026-07-06T10:00:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-06 10:00:00",
  "violations": null
}
```

### 2.3. Response — lỗi

**500 — không xác định được facility** (không có `facility_id`/`idbv` hợp lệ, và không có facility `is_active` mặc định):
```json
{
  "message": null,
  "message_en": null,
  "responseData": null,
  "status": "fail",
  "timeStamp": "2026-07-06 10:00:00",
  "violations": null
}
```

**500 — trùng `(facility_id, service_id)`**: vi phạm unique constraint `uq_his_services_code`, rơi vào catch chung (không phải lỗi 400 riêng).

---

## 3. PUT `/his-services/{id}` — Cập nhật dịch vụ

`id` = UUID (PK) trong DB. Trả 404 nếu không tồn tại — **có check tồn tại trước khi update** (khác một số endpoint khác trong project).

### 3.1. Request body

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `service_id` | `string` | Không | Ghi thẳng cột `service_id` |
| `service_name` | `string` | Không | Ghi thẳng cột `service_name` |
| `price` | `number` | Không | Ghi thẳng cột `price` |
| `specialty_id` | `uuid` | Không | Ghi thẳng cột `specialty_id` |
| *(field khác)* | `any` | Không | **Không phải cột thật của bảng** (vd `service_type`, `description`) → được **merge vào `raw_data`** (giữ lại key cũ trong `raw_data`, đè key trùng tên) thay vì bị Sequelize âm thầm bỏ qua |

```bash
curl -s -X PUT "http://localhost:3000/api/v1.0/his-services/a1b2c3d4-0000-0000-0000-000000000000" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "Khám Nội tổng quát (cập nhật)",
    "price": 180000,
    "service_type": "Khám bệnh",
    "description": "Khám tổng quát toàn thân"
  }'
```

### 3.2. Response — thành công (200)

```json
{
  "message": "Cập nhật dịch vụ thành công",
  "message_en": "Update service successful",
  "responseData": {
    "id": "a1b2c3d4-....",
    "facility_id": "11111111-1111-1111-1111-111111111111",
    "service_id": "SV001",
    "service_name": "Khám Nội tổng quát (cập nhật)",
    "price": 180000,
    "raw_data": {
      "service_type": "Khám bệnh",
      "description": "Khám tổng quát toàn thân"
    },
    "synced_at": "2026-07-06T10:00:00.000Z",
    "specialty_id": "s1s20000-0000-0000-0000-000000000000",
    "created_at": "2026-07-06T10:00:00.000Z",
    "updated_at": "2026-07-06T10:30:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-06 10:30:00",
  "violations": null
}
```

### 3.3. Response — lỗi

**404 — không tìm thấy:**
```json
{
  "message": "Không tìm thấy dịch vụ",
  "message_en": "Service not found",
  "responseData": null,
  "status": "fail",
  "timeStamp": "2026-07-06 10:30:00",
  "violations": null
}
```

---

## 4. Checklist test

- [ ] **POST tạo mới**: truyền `idbv` hợp lệ → resolve đúng `facility_id`; truyền thẳng `facility_id` → ưu tiên dùng, không cần `idbv`.
- [ ] **POST thiếu facility**: không truyền `facility_id`/`idbv` và không có facility mặc định `is_active` → lỗi 500.
- [ ] **POST trùng mã dịch vụ**: trùng `(facility_id, service_id)` → lỗi (unique constraint).
- [ ] **POST không còn gọi HIS**: xác nhận `externalAPIService.post` không được gọi trong flow tạo mới.
- [ ] **PUT full update**: truyền đủ `service_id`, `service_name`, `price`, `specialty_id` → cả 4 cột đều được cập nhật.
- [ ] **PUT field lạ merge vào raw_data**: truyền thêm field không phải cột thật (vd `service_type`, `description`) → xuất hiện đúng trong `raw_data`, không bị mất; `raw_data` cũ vẫn giữ các key không bị đè.
- [ ] **PUT 404** khi `id` không tồn tại.
- [ ] **PUT không còn gọi HIS**: xác nhận `externalAPIService.put` không được gọi trong flow update.
