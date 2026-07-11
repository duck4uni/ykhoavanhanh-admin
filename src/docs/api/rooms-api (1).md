# Rooms API — Phòng khám + gán dịch vụ/chuyên khoa

Tài liệu này mô tả toàn bộ endpoint `rooms` sau khi được viết lại: bỏ hẳn kiểu
"proxy live sang HIS", chuyển hẳn sang đọc/ghi DB nội bộ (`his_rooms`), có xoá
mềm, và tách quan hệ phòng ↔ dịch vụ ra bảng nối `his_room_services` (1 phòng –
nhiều dịch vụ) thay vì cột `service_id` scalar cũ.

**Cập nhật mới (2026-07-11):** thêm bảng nối `his_room_specialties` (1 phòng –
nhiều chuyên khoa), API `POST/DELETE /rooms/{id}/specialties` để gán/bỏ gán,
và `GET /rooms`, `GET /rooms/{id}` giờ include kèm `his_room_specialties[].specialty`
— y hệt pattern `his_room_services[].service` đã có. Xem mục
["Bảng nối `his_room_specialties`"](#bảng-nối-his_room_specialties-1-phòng--nhiều-chuyên-khoa)
bên dưới.

Đồng bộ từ HIS (`GET /api/room/`) đang **tạm tắt** — xem comment trong
`src/controllers/api/v1.0/rooms/index.ts`. Mọi endpoint dưới đây chỉ đọc/ghi DB
nội bộ, không gọi HIS.

## Base URL
```
/api/v1.0/rooms
```

## Model `his_rooms` — những gì đã đổi

| Trước | Sau |
|---|---|
| có cột `facility_id` | **đã drop khỏi DB**, không còn |
| có cột `service_id` (scalar, 1 phòng - 1 dịch vụ) | **đã bỏ**, thay bằng bảng nối `his_room_services` (1 phòng - nhiều dịch vụ) |
| — | thêm `is_delete` (xoá mềm) |
| — | thêm `exam_area_id` (FK → `exam_areas`), `exam_area_description`, `visit_instruction`, `clinic_type` |

Cột hiện có: `id, room_id, room_name, description, his_updated_at, raw_data, synced_at, created_at, updated_at, is_delete, exam_area_description, visit_instruction, clinic_type, exam_area_id`.

---

## GET /rooms
Danh sách phòng khám từ DB, loại phòng đã xoá mềm (`is_delete = false`), kèm
`exam_area` (tên khu khám), `his_room_services[].service` (dịch vụ của phòng)
và `his_room_specialties[].specialty` (chuyên khoa của phòng).

Middleware: `middle` (`sequelize-api-paginate`, pattern có `filters` hoạt động thật).

### Query Parameters
| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `currentPage` | number | No | `1` | Trang hiện tại |
| `pageSize` | number | No | `10` | Số bản ghi mỗi trang |
| `filters` | string | No | — | `field<toán tử>value`, nhiều điều kiện nối bằng dấu phẩy — `==` bằng, `@=` chứa, `_=` bắt đầu, `>` `<` `>=` `<=` |
| `sortField` | string | No | `room_name` | Sort theo `facility_id`/`service_id` bị chặn về mặc định vì 2 cột này không còn tồn tại |
| `sortOrder` | string | No | `ASC` | `ASC` hoặc `DESC` |
| `idbv` | string | — | — | **Không dùng** — đồng bộ HIS đang tắt |

### Request mẫu
```
GET /rooms?filters=room_name@=Nội&currentPage=1&pageSize=20&sortField=room_name&sortOrder=ASC
```

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Lấy danh sách phòng khám thành công",
  "responseData": {
    "count": 1,
    "currentPage": 1,
    "totalPages": 1,
    "rows": [
      {
        "id": "3f2a1c4e-9b7d-4e21-8f6a-1c2d3e4f5a6b",
        "room_id": "PK01",
        "room_name": "Phòng khám Nội tổng quát",
        "description": "Phòng khám nội tổng quát tầng 2",
        "his_updated_at": "2025-01-15T10:30:00.000Z",
        "raw_data": null,
        "synced_at": "2026-07-09T02:00:00.000Z",
        "created_at": "2026-07-09T02:00:00.000Z",
        "updated_at": "2026-07-09T02:00:00.000Z",
        "is_delete": false,
        "exam_area_description": "Khu khám tầng 2",
        "visit_instruction": "Người bệnh đến trước giờ hẹn 15 phút",
        "clinic_type": "OUTPATIENT",
        "exam_area_id": "123eaea3-1330-4261-9be0-81b5ea563335",
        "exam_area": {
          "id": "123eaea3-1330-4261-9be0-81b5ea563335",
          "code": "KVK01",
          "name": "Khu vực khám tổng quát",
          "short_name": "KVTQ"
        },
        "his_room_services": [
          {
            "id": "8a1b2c3d-4e5f-6789-abcd-ef0123456789",
            "service_id": "456fbea3-2440-5372-8ce1-92c6fb674446",
            "service": {
              "id": "456fbea3-2440-5372-8ce1-92c6fb674446",
              "service_id": "SV001",
              "service_name": "Khám Nội tổng quát",
              "price": 150000,
              "specialty_id": "..."
            }
          }
        ],
        "his_room_specialties": [
          {
            "id": "b2c3d4e5-6f78-4901-bcde-f23456789012",
            "specialty_id": "123eaea3-1330-4261-9be0-81b5ea563335",
            "specialty": {
              "id": "123eaea3-1330-4261-9be0-81b5ea563335",
              "name": "Nội tổng quát",
              "description": "Chuyên khoa nội tổng quát"
            }
          }
        ]
      }
    ]
  }
}
```

---

## POST /rooms
Tạo phòng khám thẳng vào DB local, không gọi HIS. Không validate thêm ở
handler ngoài swagger khai — dựa constraint DB (`NOT NULL` trên `room_id`/`room_name`).

`facility_id`/`service_id` gửi lên sẽ bị tự lọc bỏ (không lỗi, không tác dụng)
— 2 field này không còn tồn tại trên `his_rooms`.

### Body
| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `room_id` | string | ✓ | Mã phòng khám từ HIS, vd `"PK01"` |
| `room_name` | string | ✓ | |
| `description` | string | | |
| `his_updated_at` | string (date-time) | | |
| `exam_area_description` | string | | |
| `visit_instruction` | string | | |
| `clinic_type` | string | | vd `"OUTPATIENT"` |
| `exam_area_id` | string (uuid) | | FK → `exam_areas.id` |

### Request mẫu (tối thiểu)
```json
{ "room_id": "PK01", "room_name": "Phòng khám Nội tổng quát" }
```

### Request mẫu (đầy đủ)
```json
{
  "room_id": "PK01",
  "room_name": "Phòng khám Nội tổng quát",
  "description": "Phòng khám nội tổng quát tầng 2",
  "his_updated_at": "2025-01-15T10:30:00Z",
  "exam_area_description": "Khu khám tầng 2",
  "visit_instruction": "Người bệnh đến trước giờ hẹn 15 phút",
  "clinic_type": "OUTPATIENT",
  "exam_area_id": "123eaea3-1330-4261-9be0-81b5ea563335"
}
```

### Response (data)
Row `his_rooms` vừa tạo — **không kèm** `exam_area`/`his_room_services`/`his_room_specialties`
(chỉ `create()` trần, không include; phòng mới tạo cũng chưa gán dịch vụ/chuyên khoa nào).
```json
{
  "status": "success",
  "message": "Tạo phòng khám thành công",
  "responseData": {
    "id": "3f2a1c4e-9b7d-4e21-8f6a-1c2d3e4f5a6b",
    "room_id": "PK01",
    "room_name": "Phòng khám Nội tổng quát",
    "is_delete": false
  }
}
```

---

## GET /rooms/{id}
`id` = UUID PK trong `his_rooms`. Đọc qua `getActiveById` (loại phòng đã xoá
mềm), kèm `exam_area` + `his_room_services[].service` + `his_room_specialties[].specialty`
giống `GET /rooms`.

**Response (data):** giống 1 phần tử `rows[]` của `GET /rooms` ở trên.

**404** nếu không tồn tại hoặc đã xoá mềm:
```json
{ "status": "fail", "message": "Không tìm thấy phòng khám", "message_en": "Room not found" }
```

---

## PUT /rooms/{id}
Cập nhật phòng theo `id`.

> ⚠️ Check tồn tại bằng `getById` **KHÔNG lọc `is_delete`** (khác `GET`) — có
> thể sửa một phòng đã bị xoá mềm mà không báo lỗi gì.

Body mọi field optional, cùng bộ field với `POST /rooms` (trừ bắt buộc).
`facility_id`/`service_id` cũng bị lọc bỏ như POST.

### Request mẫu
```json
{ "room_name": "Phòng khám Nội tổng quát (đổi tên)", "clinic_type": "INPATIENT" }
```

### Response (data)
Row đã update — **không kèm** `exam_area`/`his_room_services`/`his_room_specialties`
(dùng `BaseProvider.put()` trần, không include).

**404** nếu `id` không tồn tại: `"Không tìm thấy phòng khám"`.

---

## DELETE /rooms/{id}
**Xoá mềm** (`is_delete = true`), không xoá row khỏi DB.

> ⚠️ Check tồn tại bằng `getById` không lọc `is_delete` — gọi xoá mềm 1 phòng
> đã xoá mềm từ trước vẫn trả `200`, không phải `404`, không có lỗi gì (không
> idempotent-safe theo nghĩa báo lỗi, nhưng an toàn theo nghĩa không phá dữ liệu).

### Response
```json
{ "status": "success", "message": "Xóa phòng khám thành công", "responseData": null }
```

**404** nếu `id` không tồn tại.

---

## Bảng nối `his_room_services` (1 phòng – nhiều dịch vụ)

| Cột | Type | Ghi chú |
|---|---|---|
| `id` | uuid, PK | |
| `room_id` | uuid, FK → `his_rooms.id` | |
| `service_id` | uuid, FK → `his_services.id` | ⚠️ xem cảnh báo bên dưới |
| `created_at` | date | |

Unique `(room_id, service_id)` — 1 phòng không gán trùng 1 dịch vụ 2 lần.

> ⚠️ **Dễ nhầm nhất trong toàn bộ tài liệu này:** `service_id` ở bảng nối này
> là **UUID nội bộ `his_services.id`**, KHÁC với `his_services.service_id` (mã
> dịch vụ HIS dạng chuỗi, vd `"SV001"`). Hai field trùng tên, khác bảng, khác
> kiểu dữ liệu. Lấy đúng UUID cần gọi `GET /his-services` trước và dùng field
> `id` của row trả về — không dùng `service_id` (string) của nó.

### POST /rooms/{id}/services
Gán **nhiều** dịch vụ cùng lúc cho 1 phòng bằng `bulkCreate` (1 câu `INSERT`
duy nhất, không lặp N lần). Dịch vụ nào phòng đã gán từ trước thì tự động bỏ
qua (không lỗi, không tạo trùng) — chỉ tạo phần chưa có.

**Path:** `id` = UUID phòng khám (`his_rooms.id`).

**Body:**
```json
{
  "service_ids": [
    "456fbea3-2440-5372-8ce1-92c6fb674446",
    "789acbd4-3551-6483-9df2-a3d7fc785557"
  ]
}
```

**Response mẫu (200)** — ví dụ 1 dịch vụ mới, 1 dịch vụ đã gán từ trước:
```json
{
  "status": "success",
  "message": "Đã gán 1 dịch vụ cho phòng khám, bỏ qua 1 dịch vụ đã gán trước đó",
  "responseData": {
    "created": [
      {
        "id": "8a1b2c3d-4e5f-6789-abcd-ef0123456789",
        "room_id": "3f2a1c4e-9b7d-4e21-8f6a-1c2d3e4f5a6b",
        "service_id": "789acbd4-3551-6483-9df2-a3d7fc785557",
        "created_at": "2026-07-09T02:10:00.000Z"
      }
    ],
    "skipped": ["456fbea3-2440-5372-8ce1-92c6fb674446"]
  }
}
```

| Status | Khi nào |
|---|---|
| 400 | Thiếu / rỗng `service_ids` |
| 404 | Phòng không tồn tại — `"Không tìm thấy phòng khám"` |
| 404 | Có `service_id` không tồn tại/đã xoá mềm — `"Không tìm thấy dịch vụ: <ids>"`, liệt kê đúng id sai |

### DELETE /rooms/{id}/services/{serviceId}
Bỏ gán **1** dịch vụ khỏi phòng — tra theo cặp `(room_id, service_id)` rồi xoá
theo `id` thật của row nối (không xoá theo cặp trực tiếp).

**Path:** `id` = UUID phòng khám, `serviceId` = UUID dịch vụ (`his_services.id`,
**không phải** mã HIS dạng chuỗi).

### Response
```json
{ "status": "success", "message": "Bỏ gán dịch vụ khỏi phòng khám thành công", "responseData": null }
```

**404** nếu phòng chưa từng được gán dịch vụ đó:
```json
{ "status": "fail", "message": "Phòng khám chưa được gán dịch vụ này" }
```

> Không có endpoint bulk-unassign hay `GET /rooms/{id}/services` riêng — danh
> sách dịch vụ của 1 phòng đọc qua `his_room_services` lồng sẵn trong
> `GET /rooms` và `GET /rooms/{id}`.

---

## Bảng nối `his_room_specialties` (1 phòng – nhiều chuyên khoa)

| Cột | Type | Ghi chú |
|---|---|---|
| `id` | uuid, PK | |
| `his_room_id` | uuid, FK → `his_rooms.id` | |
| `specialty_id` | uuid, FK → `specialties.id` | |
| `is_active` | boolean, default `true` | |
| `created_at` | date | |
| `updated_at` | date | |
| `created_by` | uuid, nullable | |
| `updated_by` | uuid, nullable | |

Unique `(his_room_id, specialty_id)` — 1 phòng không gán trùng 1 chuyên khoa 2 lần.
Model: `src/models/hisRoomSpecialty.ts`. Provider: `src/providers/hisRoomSpecialtyProvider.ts`.

Không có middleware `verify` trên 2 endpoint dưới đây — giống hệt
`POST/DELETE /rooms/{id}/services`, không yêu cầu Bearer token.

### POST /rooms/{id}/specialties
Gán **nhiều** chuyên khoa cùng lúc cho 1 phòng bằng `bulkCreate` (1 câu `INSERT`
duy nhất, không lặp N lần). Chuyên khoa nào phòng đã gán từ trước thì tự động
bỏ qua (không lỗi, không tạo trùng) — chỉ tạo phần chưa có.

**Path:** `id` = UUID phòng khám (`his_rooms.id`).

**Kiểm tra chuyên khoa tồn tại** dùng `specialtyProvider.getSpecialties({ isActive: true })`
(model `specialty` không có cột `is_delete`, chỉ có `is_active` — khác `hisService`).
Nghĩa là chuyên khoa `is_active = false` sẽ bị coi như "không tồn tại" (404), dù
row vẫn còn trong DB.

**Request body:**
```json
{
  "specialty_ids": [
    "123eaea3-1330-4261-9be0-81b5ea563335",
    "456fbea3-2440-5372-8ce1-92c6fb674446"
  ]
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `specialty_ids` | string[] (uuid) | ✓ | Mảng UUID `specialty.id`. Trùng lặp trong mảng tự dedupe (`Set`), phần tử rỗng/falsy bị lọc bỏ |

**Response mẫu (200)** — ví dụ 1 chuyên khoa mới, 1 chuyên khoa đã gán từ trước:
```json
{
  "status": "success",
  "message": "Đã gán 1 chuyên khoa cho phòng khám, bỏ qua 1 chuyên khoa đã gán trước đó",
  "message_en": "Assigned 1 specialty(ies) to room, skipped 1 already assigned",
  "responseData": {
    "created": [
      {
        "id": "b2c3d4e5-6f78-4901-bcde-f23456789012",
        "his_room_id": "3f2a1c4e-9b7d-4e21-8f6a-1c2d3e4f5a6b",
        "specialty_id": "456fbea3-2440-5372-8ce1-92c6fb674446",
        "is_active": true,
        "created_at": "2026-07-11T02:10:00.000Z",
        "updated_at": "2026-07-11T02:10:00.000Z",
        "created_by": null,
        "updated_by": null
      }
    ],
    "skipped": ["123eaea3-1330-4261-9be0-81b5ea563335"]
  }
}
```

| Status | Khi nào | Response mẫu |
|---|---|---|
| 400 | Thiếu / rỗng `specialty_ids` | `{ "message": "Thiếu specialty_ids (mảng UUID chuyên khoa)" }` |
| 404 | Phòng không tồn tại | `{ "message": "Không tìm thấy phòng khám" }` |
| 404 | Có `specialty_id` không tồn tại/không active | `{ "message": "Không tìm thấy chuyên khoa: <ids>" }`, liệt kê đúng id sai |

### DELETE /rooms/{id}/specialties/{specialtyId}
Bỏ gán **1** chuyên khoa khỏi phòng — tra theo cặp `(his_room_id, specialty_id)`
rồi xoá theo `id` thật của row nối (không xoá theo cặp trực tiếp). Xoá cứng
(`destroy()`), không phải xoá mềm.

**Path:** `id` = UUID phòng khám, `specialtyId` = UUID chuyên khoa (`specialty.id`).

**Request:** không có body.

**Response mẫu (200):**
```json
{
  "status": "success",
  "message": "Bỏ gán chuyên khoa khỏi phòng khám thành công",
  "message_en": "Unassign specialty from room successful",
  "responseData": null
}
```

**404** nếu phòng chưa từng được gán chuyên khoa đó:
```json
{ "status": "fail", "message": "Phòng khám chưa được gán chuyên khoa này", "message_en": "Room does not have this specialty assigned" }
```

> Không có endpoint bulk-unassign hay `GET /rooms/{id}/specialties` riêng —
> danh sách chuyên khoa của 1 phòng đọc qua `his_room_specialties` lồng sẵn
> trong `GET /rooms` và `GET /rooms/{id}`.

---

## Tổng hợp điểm cần lưu ý

1. **`facility_id` đã biến mất hoàn toàn** khỏi `his_rooms` — mọi nơi (query,
   body, sort, filter) gửi field này đều vô nghĩa, bị lọc bỏ hoặc bỏ qua.
2. **`service_id` có 2 nghĩa khác nhau tuỳ bảng** — xem cảnh báo ở mục bảng nối.
3. **`PUT`/`DELETE /rooms/{id}` không loại trừ phòng đã xoá mềm** khi check tồn
   tại (khác `GET`) — có thể sửa/xoá-mềm-lại 1 phòng đã `is_delete = true`.
4. **`POST`/`PUT /rooms/{id}` không trả kèm `exam_area`/`his_room_services`/`his_room_specialties`**
   trong response — chỉ `GET` (list và detail) mới include đầy đủ.
5. Đồng bộ từ HIS đang tắt hoàn toàn ở `GET /rooms` — không có cơ chế tự động
   cập nhật phòng mới từ HIS cho tới khi bật lại (xem comment trong code).
6. **`specialty_id` cũng có 2 "chuẩn tồn tại" khác nhau tuỳ bảng** — kiểm tra
   dịch vụ dùng `is_delete` (`hisService`), kiểm tra chuyên khoa dùng `is_active`
   (`specialty`, không có cột `is_delete`). Gán chuyên khoa `is_active = false`
   sẽ bị từ chối với 404 dù row chưa bị xoá.
