# Specialties API — Chuyên khoa

Tài liệu mô tả toàn bộ endpoint `specialties`. **Cập nhật mới (2026-07-11):**
model `specialty` được thêm 4 cột `room_visit_instruction`, `booking_note`,
`booking_group`, `display_priority` (đồng bộ ý nghĩa với các cột cùng tên đã
có sẵn trên `hisDoctor`/`hisService`), và `POST`/`PUT /specialties` nhận thêm
4 field này trong body.

## Base URL
```
/api/v1.0/specialties
```

## Model `specialties` — cột hiện có

| Cột | Type | Ghi chú |
|---|---|---|
| `id` | uuid, PK | |
| `name` | string, required | |
| `description` | text | |
| `is_active` | boolean, default `true` | |
| `created_at` / `updated_at` | date | |
| `created_by` / `updated_by` | uuid, nullable | |
| `room_visit_instruction` | text | **Mới** — hướng dẫn đến phòng khám |
| `booking_note` | text | **Mới** — ghi chú khi đặt lịch |
| `booking_group` | text | **Mới** — nhóm đặt lịch |
| `display_priority` | integer | **Mới** — thứ tự ưu tiên hiển thị |

Không có cột `is_delete` — khác với `hisRoom`/`hisService`/`hisDoctor`.
`DELETE /specialties/{id}` là **xoá cứng**, không phải xoá mềm (xem mục
`DELETE` bên dưới).

---

## GET /specialties
Danh sách chuyên khoa, phân trang qua `middle` (`sequelize-api-paginate`).
Không middleware auth.

### Query Parameters
| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `currentPage` | number | No | `1` | Trang hiện tại |
| `pageSize` | number | No | `10` | Số bản ghi mỗi trang |
| `filters` | string | No | — | `field<toán tử>value`, nhiều điều kiện nối dấu phẩy — `==` bằng, `@=` chứa, `_=` bắt đầu. VD: `name@=Tim` hoặc `is_active==true` |
| `sortField` | string | No | `created_at` | |
| `sortOrder` | string | No | `DESC` | `ASC` hoặc `DESC` |

### Request mẫu
```
GET /specialties?filters=name@=Tim&currentPage=1&pageSize=20&sortField=display_priority&sortOrder=ASC
```

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Lấy danh sách chuyên khoa thành công",
  "message_en": "Get specialties successful",
  "responseData": {
    "count": 1,
    "currentPage": 1,
    "totalPages": 1,
    "rows": [
      {
        "id": "123eaea3-1330-4261-9be0-81b5ea563335",
        "name": "Tim mạch",
        "description": "Chuyên khoa tim mạch",
        "is_active": true,
        "created_at": "2026-07-11T02:00:00.000Z",
        "updated_at": "2026-07-11T02:00:00.000Z",
        "created_by": null,
        "updated_by": null,
        "room_visit_instruction": "Tầng 2, khu A",
        "booking_note": "Vui lòng nhịn ăn trước khi khám",
        "booking_group": "NHOM_1",
        "display_priority": 1
      }
    ]
  }
}
```

> ⚠️ `filters` trong `GET` **không lọc `is_active`/soft-delete gì cả** — trả cả
> chuyên khoa `is_active = false` nếu không tự thêm `filters=is_active==true`.

---

## POST /specialties
Tạo mới chuyên khoa. Middleware: `verify` (yêu cầu Bearer token).

### Body
| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `name` | string | ✓ | |
| `description` | string | | |
| `is_active` | boolean | | Mặc định `true` nếu không truyền |
| `room_visit_instruction` | string | | **Mới** |
| `booking_note` | string | | **Mới** |
| `booking_group` | string | | **Mới** |
| `display_priority` | integer | | **Mới** |

### Request mẫu (tối thiểu)
```json
{ "name": "Tim mạch" }
```

### Request mẫu (đầy đủ)
```json
{
  "name": "Tim mạch",
  "description": "Chuyên khoa tim mạch",
  "is_active": true,
  "room_visit_instruction": "Tầng 2, khu A",
  "booking_note": "Vui lòng nhịn ăn trước khi khám",
  "booking_group": "NHOM_1",
  "display_priority": 1
}
```

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Tạo chuyên khoa thành công",
  "message_en": "Create specialty successful",
  "responseData": {
    "id": "123eaea3-1330-4261-9be0-81b5ea563335",
    "name": "Tim mạch",
    "description": "Chuyên khoa tim mạch",
    "is_active": true,
    "room_visit_instruction": "Tầng 2, khu A",
    "booking_note": "Vui lòng nhịn ăn trước khi khám",
    "booking_group": "NHOM_1",
    "display_priority": 1,
    "created_by": "9d8c7b6a-...",
    "created_at": "2026-07-11T02:00:00.000Z",
    "updated_at": "2026-07-11T02:00:00.000Z"
  }
}
```

`created_by` lấy từ `req.user?.id` (user trong token Bearer).

---

## GET /specialties/{id}
Chi tiết chuyên khoa theo `id`, kèm `his_doctors[]` và `his_services[]` thuộc
chuyên khoa đó (join qua `specialty_id`, dùng `separate: true` cho cả 2
include để tránh cartesian product). `required: false` → LEFT JOIN, không có
bác sĩ/dịch vụ vẫn trả mảng rỗng. Không middleware auth.

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Lấy chi tiết chuyên khoa thành công",
  "message_en": "Get specialty detail successful",
  "responseData": {
    "id": "123eaea3-1330-4261-9be0-81b5ea563335",
    "name": "Tim mạch",
    "description": "Chuyên khoa tim mạch",
    "is_active": true,
    "room_visit_instruction": "Tầng 2, khu A",
    "booking_note": "Vui lòng nhịn ăn trước khi khám",
    "booking_group": "NHOM_1",
    "display_priority": 1,
    "created_at": "2026-07-11T02:00:00.000Z",
    "updated_at": "2026-07-11T02:00:00.000Z",
    "his_doctors": [
      { "id": "...", "doctor_id": "BS001", "doctor_name": "Nguyễn Văn A", "specialty_id": "123eaea3-1330-4261-9be0-81b5ea563335" }
    ],
    "his_services": [
      { "id": "456fbea3-2440-5372-8ce1-92c6fb674446", "service_id": "SV001", "service_name": "Khám Tim mạch", "price": 200000, "specialty_id": "123eaea3-1330-4261-9be0-81b5ea563335" }
    ]
  }
}
```

**404** nếu không tồn tại:
```json
{ "status": "fail", "message": "Không tìm thấy chuyên khoa", "message_en": "Specialty not found" }
```

---

## PUT /specialties/{id}
Cập nhật chuyên khoa. Middleware: `verify` (yêu cầu Bearer token).

> ⚠️ Không check tồn tại trước (khác `GET`/`POST /rooms/.../services`) —
> dùng `BaseProvider.put()` trần, `id` sai sẽ lỗi 500 chung thay vì 404 rõ ràng.

### Body
Mọi field optional — cùng bộ field với `POST`, không có field nào bắt buộc.

| Field | Type | Ghi chú |
|---|---|---|
| `name` | string | |
| `description` | string | |
| `is_active` | boolean | |
| `room_visit_instruction` | string | **Mới** |
| `booking_note` | string | **Mới** |
| `booking_group` | string | **Mới** |
| `display_priority` | integer | **Mới** |

### Request mẫu
```json
{ "display_priority": 2, "booking_group": "NHOM_2" }
```

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Cập nhật chuyên khoa thành công",
  "message_en": "Update specialty successful",
  "responseData": {
    "id": "123eaea3-1330-4261-9be0-81b5ea563335",
    "name": "Tim mạch",
    "description": "Chuyên khoa tim mạch",
    "is_active": true,
    "room_visit_instruction": "Tầng 2, khu A",
    "booking_note": "Vui lòng nhịn ăn trước khi khám",
    "booking_group": "NHOM_2",
    "display_priority": 2,
    "updated_by": "9d8c7b6a-...",
    "updated_at": "2026-07-11T02:20:00.000Z"
  }
}
```

> ⚠️ Field nào không truyền trong body sẽ được gán `undefined` rồi update —
> với Sequelize `update()`, field `undefined` bị bỏ qua (giữ nguyên giá trị cũ),
> **không** ghi đè thành `NULL`. Muốn xoá giá trị 1 field text (vd bỏ
> `booking_note`) phải truyền tường minh `"booking_note": null`.

---

## DELETE /specialties/{id}
**Xoá cứng** (`destroy()`), không phải xoá mềm — khác hẳn `DELETE /rooms/{id}`.
Middleware: `verify`. Không check FK với `his_doctors`/`his_services` đang
tham chiếu `specialty_id`, không check tồn tại trước khi xoá.

### Response mẫu (200)
```json
{
  "status": "success",
  "message": "Xóa chuyên khoa thành công",
  "message_en": "Delete specialty successful",
  "responseData": null
}
```

> ⚠️ `id` không tồn tại → lỗi 500 chung (không phải 404 rõ ràng), vì
> `specialtyProvider.deleteSpecialty()` gọi thẳng `findByPk(id).destroy()`
> không check `null` trước.
> ⚠️ Xoá 1 chuyên khoa đang được `hisDoctor`/`hisService`/`hisRoomSpecialty`
> tham chiếu (`specialty_id`) không bị chặn ở tầng ứng dụng — phụ thuộc hoàn
> toàn vào constraint FK ở DB (nếu có) để không tạo dữ liệu mồ côi.

---

## Tổng hợp điểm cần lưu ý

1. **4 field mới** (`room_visit_instruction`, `booking_note`, `booking_group`,
   `display_priority`) đều optional, không có ở `GET` cũ trước khi có cập nhật
   này — client cũ không gửi vẫn hoạt động bình thường (giá trị `NULL`).
2. **Không có xoá mềm** — `DELETE` xoá cứng thật sự, khác `rooms`/`his-services`.
3. **`PUT`/`DELETE` không check tồn tại trước** — `id` sai trả lỗi 500 chung,
   không phải 404.
4. Xem thêm quan hệ `specialty` ↔ `his_room_specialties` (phòng nào thuộc
   chuyên khoa nào) tại [`docs/rooms-api.md`](./rooms-api.md#bảng-nối-his_room_specialties-1-phòng--nhiều-chuyên-khoa).
