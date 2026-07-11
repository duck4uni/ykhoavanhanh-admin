# Rooms API — Bổ sung nhiều chuyên khoa cho màn Thêm phòng khám

## 1. Mục tiêu

Frontend màn **Thêm phòng khám** đã bổ sung chọn **nhiều chuyên khoa** cho một phòng khám.

Backend cần cập nhật API tạo/cập nhật phòng khám để nhận thêm danh sách chuyên khoa liên kết với phòng.

---

## 2. Endpoint cần cập nhật

```http
POST /api/v1.0/rooms
PUT /api/v1.0/rooms/:id
```

Hiện frontend đang tạo phòng khám qua:

```text
src/app/(dashboard)/clinics/new/page.tsx
```

Hook/API đang dùng:

```text
roomsHooks.useCreate
roomsService.create
```

Type payload frontend:

```text
src/api/roomsApi.ts
CreateRoomPayload
UpdateRoomPayload
```

---

## 3. Request body mới

```ts
type CreateRoomPayload = {
  room_id: string;
  room_name: string;
  description?: string | null;
  his_updated_at?: string | null;
  exam_area_description?: string | null;
  visit_instruction?: string | null;
  clinic_type?: string | null;
  exam_area_id?: string | null;
  specialty_ids?: string[];
};

type UpdateRoomPayload = Partial<CreateRoomPayload>;
```

Field mới:

```ts
specialty_ids?: string[];
```

Ý nghĩa:

- Danh sách ID chuyên khoa được gán cho phòng khám.
- Một phòng khám có thể thuộc nhiều chuyên khoa.
- Nếu không chọn chuyên khoa, frontend gửi `specialty_ids: []`.

---

## 4. Ví dụ request tạo phòng khám

```json
{
  "room_id": "PK-TM-01",
  "room_name": "Phòng khám Tim mạch 01",
  "description": "Phòng khám chuyên khoa tim mạch",
  "exam_area_description": "Khu khám tầng 2",
  "visit_instruction": "<p>Đi thang máy lên tầng 2, rẽ phải.</p>",
  "clinic_type": "OUTPATIENT",
  "exam_area_id": "exam_area_001",
  "specialty_ids": [
    "specialty_cardiology",
    "specialty_internal_medicine"
  ]
}
```

---

## 5. Ví dụ request không chọn chuyên khoa

```json
{
  "room_id": "PK-GEN-01",
  "room_name": "Phòng khám tổng quát 01",
  "description": null,
  "exam_area_description": null,
  "visit_instruction": null,
  "clinic_type": null,
  "exam_area_id": "exam_area_001",
  "specialty_ids": []
}
```

Backend nên chấp nhận `specialty_ids: []` để tạo phòng khám chưa gán chuyên khoa.

---

## 6. Ý nghĩa các field

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `room_id` | string | Có | Mã phòng khám |
| `room_name` | string | Có | Tên phòng khám |
| `description` | string/null | Không | Mô tả phòng khám |
| `exam_area_description` | string/null | Không | Mô tả khu khám |
| `visit_instruction` | string/null | Không | Hướng dẫn vào khám, có thể là HTML từ TextEditor |
| `clinic_type` | string/null | Không | Loại phòng khám |
| `exam_area_id` | string/null | Không | ID khu khám bệnh |
| `specialty_ids` | string[] | Không | Danh sách ID chuyên khoa gán cho phòng khám |

---

## 7. Validation backend đề xuất

- `room_id` bắt buộc.
- `room_name` bắt buộc.
- Nếu có `exam_area_id`, kiểm tra khu khám tồn tại.
- Nếu có `specialty_ids`:
  - phải là mảng string.
  - loại bỏ ID rỗng/null nếu có.
  - không cho trùng ID trong cùng payload.
  - tất cả ID phải tồn tại trong bảng chuyên khoa.
- Cho phép `specialty_ids: []`.

---

## 8. Gợi ý lưu DB

### Hướng khuyến nghị — bảng mapping nhiều-nhiều

Tạo bảng mapping giữa phòng khám và chuyên khoa:

```text
room_specialties
- id
- room_id          // FK tới rooms.id
- specialty_id     // FK tới specialties.id
- created_at
- updated_at
```

Unique constraint đề xuất:

```text
UNIQUE(room_id, specialty_id)
```

Khi tạo phòng khám:

1. Lưu record phòng khám vào `rooms`.
2. Nếu `specialty_ids.length > 0`, insert mapping vào `room_specialties`.
3. Bỏ qua hoặc báo lỗi nếu `specialty_id` không tồn tại tùy rule backend chọn, khuyến nghị báo validation error rõ field.

Khi cập nhật phòng khám:

- Nếu payload có field `specialty_ids`:
  - replace toàn bộ mapping hiện tại bằng danh sách mới.
- Nếu payload không có field `specialty_ids`:
  - giữ nguyên mapping hiện tại.

---

## 9. Response đề xuất

### 9.1. Success

```json
{
  "status": "success",
  "message": "Tạo phòng khám thành công",
  "responseData": {
    "id": "room_db_001",
    "room_id": "PK-TM-01",
    "room_name": "Phòng khám Tim mạch 01",
    "description": "Phòng khám chuyên khoa tim mạch",
    "exam_area_description": "Khu khám tầng 2",
    "visit_instruction": "<p>Đi thang máy lên tầng 2, rẽ phải.</p>",
    "clinic_type": "OUTPATIENT",
    "exam_area_id": "exam_area_001",
    "specialty_ids": [
      "specialty_cardiology",
      "specialty_internal_medicine"
    ],
    "specialties": [
      {
        "id": "specialty_cardiology",
        "name": "Tim mạch"
      },
      {
        "id": "specialty_internal_medicine",
        "name": "Nội tổng quát"
      }
    ],
    "created_at": "2026-07-11T08:00:00.000Z",
    "updated_at": "2026-07-11T08:00:00.000Z"
  }
}
```

### 9.2. Validation error

```json
{
  "status": "fail",
  "message": "Dữ liệu phòng khám không hợp lệ",
  "violations": [
    {
      "field": "specialty_ids[0]",
      "message": "Chuyên khoa không tồn tại"
    },
    {
      "field": "specialty_ids",
      "message": "Danh sách chuyên khoa không được trùng"
    }
  ],
  "responseData": null
}
```

---

## 10. Checklist cho backend

- [ ] `POST /rooms` nhận field `specialty_ids`.
- [ ] `PUT /rooms/:id` nhận field `specialty_ids`.
- [ ] Validate `specialty_ids` là mảng string.
- [ ] Validate không trùng chuyên khoa trong cùng payload.
- [ ] Validate chuyên khoa tồn tại.
- [ ] Tạo bảng/quan hệ mapping phòng khám - chuyên khoa.
- [ ] Khi tạo phòng khám, lưu mapping chuyên khoa sau khi có room id thật.
- [ ] Khi update phòng khám, nếu có `specialty_ids` thì replace mapping.
- [ ] Response trả lại `specialty_ids` và/hoặc `specialties` để frontend hiển thị.
