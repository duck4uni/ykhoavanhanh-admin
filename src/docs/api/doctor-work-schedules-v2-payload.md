# Đặc tả kỹ thuật Backend: API Lịch khám bác sĩ V2 (Doctor Work Schedules)

Tài liệu này mô tả chi tiết yêu cầu nghiệp vụ, cấu trúc dữ liệu (Data Contract), payload API và các quy tắc nghiệp vụ cho đội ngũ Backend (BE) để nâng cấp và đồng bộ với Web Admin Vạn Hạnh Hospital.

---

## 1. Mục tiêu và Nghiệp vụ mới

Mô hình quản lý lịch khám mới (V2) thay thế mô hình 1 lịch = 1 phạm vi cố định trước đây:

1. **Khoảng ngày & Các thứ áp dụng**:
   - Một lịch làm việc áp dụng cho một khoảng ngày từ `start_date` đến `end_date`.
   - Chứa danh sách các thứ áp dụng trong tuần (`weekdays`: `[1, 2, 3, 4, 5, 6, 0]`).

2. **Nhiều phạm vi khám (`scopes[]`)**:
   - Một lịch khám có thể cấu hình **nhiều phạm vi khám** khác nhau cho cùng một bác sĩ.
   - Mỗi phạm vi (`scope`) là một tổ hợp gồm:
     - `specialty_id`: Chuyên khoa
     - `area_id`: Khu vực khám (`exam_area_id`)
     - `room_id`: Phòng khám (tuỳ chọn)
     - `service_id`: Dịch vụ khám
     - `price_level_code`: Mã mức giá/loại bảo hiểm (BHYT, DV, VIP...) từ cấu hình bảng giá dịch vụ
     - `fee`: Phí khám thực tế
     - `status`: `"ACTIVE" | "INACTIVE"`

3. **Nhiều khung giờ (`time_slots[]`) & Danh sách ngày cụ thể (`dates[]`)**:
   - Một lịch có thể có nhiều khung giờ (`start_time` - `end_time`).
   - Mỗi khung giờ gắn với một thứ trong tuần (`weekday`) và một danh sách ngày cụ thể (`dates[]` định dạng `YYYY-MM-DD`).
   - Có số lượng phiếu khám mặc định (`slot_limit`).
   - Có phạm vi khám mặc định của khung giờ (`scope_ids`: `"all"` hoặc mảng `client_id[]`).

4. **Ghi đè theo từng ngày cụ thể (`date_overrides[]`)**:
   - Trong cùng một khung giờ, cho phép tuỳ biến riêng theo từng ngày:
     - `slot_limit`: Điều chỉnh số phiếu khám riêng cho ngày đó.
     - `scope_ids`: **Gán phạm vi khám riêng cho từng ngày cụ thể** (Ví dụ: Cùng khung 08:00 - 08:30 nhưng ngày `2026-08-21` chỉ khám phạm vi *Khám MeU · Dịch vụ*, ngày `2026-08-22` đổi sang khám *Khám MeU · Khám VIP*).

---

## 2. Danh sách Endpoints cần cập nhật

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1.0/doctor-work-schedules` | Tạo mới lịch khám V2 (nhiều scope, nhiều time slot, date overrides) |
| `PUT` | `/api/v1.0/doctor-work-schedules/:id` | Cập nhật toàn bộ lịch khám V2 theo ID |
| `GET` | `/api/v1.0/doctor-work-schedules/:id` | Lấy chi tiết lịch khám V2 đầy đủ quan hệ (`scopes`, `time_slots`, `doctor`, `specialty`, `area`, `room`, `service`) |
| `GET` | `/api/v1.0/doctor-work-schedules` | Lấy danh sách lịch khám phân trang (danh sách quản trị) |

---

## 3. Quy ước chuẩn hóa

### 3.1. Quy ước Thứ trong tuần (`weekday`)
Sử dụng giá trị số tương thích chuẩn Javascript `Date.getDay()`:
- `0`: Chủ nhật (CN)
- `1`: Thứ 2 (T2)
- `2`: Thứ 3 (T3)
- `3`: Thứ 4 (T4)
- `4`: Thứ 5 (T5)
- `5`: Thứ 6 (T6)
- `6`: Thứ 7 (T7)

### 3.2. Mapping Phạm vi khám (`client_id` -> `scope_ids`)
- Khi tạo mới/cập nhật, Frontend gửi kèm `client_id` (string duy nhất do client sinh, ví dụ `scope_1752200000000_a1b2c3`) trong từng phần tử của `scopes[]`.
- Trong `time_slots[].scope_ids` hoặc `date_overrides[].scope_ids`:
  - Giá trị `"all"`: Áp dụng cho tất cả các scopes trong lịch.
  - Giá trị `string[]`: Chứa danh sách các `client_id` (hoặc `scope_id` khi trả về GET detail).

---

## 4. Đặc tả Cấu trúc Payload (Request Body)

### 4.1. TypeScript Interfaces

```typescript
export type CreateDoctorWorkScheduleV2Payload = {
  doctor_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  weekdays: number[]; // Mảng các thứ có lịch, ví dụ [1, 2, 3, 4, 5, 6, 0]
  status: "ACTIVE" | "INACTIVE";
  note?: string;
  scopes: WorkScheduleScopePayload[];
  time_slots: WorkScheduleTimeSlotPayload[];
};

export type WorkScheduleScopePayload = {
  client_id?: string;       // ID định danh tạm từ frontend để liên kết với time_slots
  specialty_id: string;     // ID Chuyên khoa
  area_id: string;          // ID Khu vực khám (exam_area_id)
  room_id?: string;         // ID Phòng khám (nếu có)
  service_id: string;       // ID Dịch vụ khám
  price_level_code?: string;// Mã mức giá (BHYT, DV, VIP...) từ his_services.price_levels
  fee: number;              // Phí khám
  status: "ACTIVE" | "INACTIVE";
  note?: string;
};

export type DateSlotOverridePayload = {
  date: string;             // YYYY-MM-DD (ngày ghi đè)
  slot_limit?: number;      // Số phiếu ghi đè riêng cho ngày này (nếu khác mặc định của slot)
  scope_ids?: "all" | string[]; // Danh sách client_id scope áp dụng riêng cho ngày này
};

export type WorkScheduleTimeSlotPayload = {
  start_time: string;       // HH:mm (ví dụ "08:00")
  end_time: string;         // HH:mm (ví dụ "08:30")
  slot_limit: number;       // Số phiếu mặc định của khung giờ
  weekday: number;          // Thứ trong tuần (0..6)
  dates: string[];          // Danh sách các ngày cụ thể áp dụng khung giờ này (YYYY-MM-DD)
  date_overrides?: DateSlotOverridePayload[]; // Cấu hình riêng theo từng ngày
  scope_ids: "all" | string[]; // "all" hoặc mảng client_id các scopes mặc định
};
```

---

## 5. Ví dụ Request JSON Hoàn Chỉnh

### Kịch bản thực tế:
- Bác sĩ **Nguyễn Văn A** (`doctor_001`).
- Lịch từ ngày `2026-08-21` đến `2026-08-22`.
- Có 2 phạm vi khám:
  1. `scope_service_01`: Khám MeU Chuyên khoa Nhi · Dịch vụ thường (Phí: 150.000đ).
  2. `scope_vip_02`: Khám MeU Chuyên khoa Nhi · Khám VIP (Phí: 300.000đ).
- Khung giờ `08:00 - 08:30`:
  - Ngày `2026-08-21`: Ghi đè áp dụng riêng cho `scope_service_01` (Dịch vụ) và số phiếu là 15.
  - Ngày `2026-08-22`: Ghi đè áp dụng riêng cho `scope_vip_02` (VIP) và số phiếu là 10.

```json
{
  "doctor_id": "doctor_001",
  "start_date": "2026-08-21",
  "end_date": "2026-08-22",
  "weekdays": [5, 6],
  "status": "ACTIVE",
  "note": "Lịch phân ca khám Dịch vụ ngày 21 và VIP ngày 22",
  "scopes": [
    {
      "client_id": "scope_service_01",
      "specialty_id": "specialty_pediatrics",
      "area_id": "area_meu",
      "room_id": "room_201",
      "service_id": "srv_kham_meu",
      "price_level_code": "DV",
      "fee": 150000,
      "status": "ACTIVE",
      "note": "Khám MeU Dịch vụ thường"
    },
    {
      "client_id": "scope_vip_02",
      "specialty_id": "specialty_pediatrics",
      "area_id": "area_meu_vip",
      "room_id": "room_301",
      "service_id": "srv_kham_meu",
      "price_level_code": "VIP",
      "fee": 300000,
      "status": "ACTIVE",
      "note": "Khám MeU VIP"
    }
  ],
  "time_slots": [
    {
      "start_time": "08:00",
      "end_time": "08:30",
      "slot_limit": 20,
      "weekday": 5,
      "dates": ["2026-08-21"],
      "scope_ids": "all",
      "date_overrides": [
        {
          "date": "2026-08-21",
          "slot_limit": 15,
          "scope_ids": ["scope_service_01"]
        }
      ]
    },
    {
      "start_time": "08:00",
      "end_time": "08:30",
      "slot_limit": 20,
      "weekday": 6,
      "dates": ["2026-08-22"],
      "scope_ids": "all",
      "date_overrides": [
        {
          "date": "2026-08-22",
          "slot_limit": 10,
          "scope_ids": ["scope_vip_02"]
        }
      ]
    }
  ]
}
```

---

## 6. Cấu trúc Response Chi tiết (GET Detail V2)

Endpoint: `GET /api/v1.0/doctor-work-schedules/:id`

Backend trả về chi tiết lịch cùng thông tin các quan hệ (`specialty`, `area`, `room`, `service`, `doctor`):

```json
{
  "status": "success",
  "responseData": {
    "id": "sch_uuid_12345",
    "doctor_id": "doctor_001",
    "start_date": "2026-08-21",
    "end_date": "2026-08-22",
    "weekdays": [5, 6],
    "status": "ACTIVE",
    "note": "Lịch phân ca khám Dịch vụ ngày 21 và VIP ngày 22",
    "created_at": "2026-08-21T08:00:00Z",
    "updated_at": "2026-08-21T08:00:00Z",
    "doctor": {
      "id": "doc_pk_01",
      "doctor_id": "doctor_001",
      "doctor_name": "BS. Nguyễn Văn A"
    },
    "scopes": [
      {
        "id": "scope_db_id_01",
        "client_id": "scope_service_01",
        "specialty_id": "specialty_pediatrics",
        "area_id": "area_meu",
        "room_id": "room_201",
        "service_id": "srv_kham_meu",
        "price_level_code": "DV",
        "fee": 150000,
        "status": "ACTIVE",
        "note": "Khám MeU Dịch vụ thường",
        "specialty": { "id": "specialty_pediatrics", "name": "Nhi khoa" },
        "area": { "id": "area_meu", "name": "Khu MeU" },
        "room": { "id": "room_201", "roomname": "Phòng 201" },
        "service": { "id": "srv_kham_meu", "servicename": "Khám tổng quát MeU" }
      },
      {
        "id": "scope_db_id_02",
        "client_id": "scope_vip_02",
        "specialty_id": "specialty_pediatrics",
        "area_id": "area_meu_vip",
        "room_id": "room_301",
        "service_id": "srv_kham_meu",
        "price_level_code": "VIP",
        "fee": 300000,
        "status": "ACTIVE",
        "note": "Khám MeU VIP",
        "specialty": { "id": "specialty_pediatrics", "name": "Nhi khoa" },
        "area": { "id": "area_meu_vip", "name": "Khu VIP MeU" },
        "room": { "id": "room_301", "roomname": "Phòng 301 - VIP" },
        "service": { "id": "srv_kham_meu", "servicename": "Khám tổng quát MeU" }
      }
    ],
    "time_slots": [
      {
        "id": "slot_db_id_01",
        "start_time": "08:00",
        "end_time": "08:30",
        "slot_limit": 20,
        "weekday": 5,
        "dates": ["2026-08-21"],
        "scope_ids": ["scope_db_id_01", "scope_db_id_02"],
        "date_overrides": [
          {
            "date": "2026-08-21",
            "slot_limit": 15,
            "scope_ids": ["scope_db_id_01"]
          }
        ]
      },
      {
        "id": "slot_db_id_02",
        "start_time": "08:00",
        "end_time": "08:30",
        "slot_limit": 20,
        "weekday": 6,
        "dates": ["2026-08-22"],
        "scope_ids": ["scope_db_id_01", "scope_db_id_02"],
        "date_overrides": [
          {
            "date": "2026-08-22",
            "slot_limit": 10,
            "scope_ids": ["scope_db_id_02"]
          }
        ]
      }
    ]
  }
}
```

---

## 7. Các quy tắc Validate và Xử lý Backend cần lưu ý

1. **Khóa chống trùng lịch của Bác sĩ (Doctor Overlap Validation)**:
   - Một bác sĩ không thể có 2 khung giờ trùng/giao nhau trong cùng một ngày cụ thể (`start_time` - `end_time` giao nhau trên cùng `date`).
2. **Khóa chống trùng phòng khám (Room Overlap Validation)**:
   - Một phòng khám (`room_id`) trong cùng một ngày và khung giờ không thể được phân cho 2 bác sĩ khác nhau.
3. **Ưu tiên cấu hình khi Bệnh nhân đặt lịch (Booking Resolution Logic)**:
   - Khi bệnh nhân tìm kiếm lịch khám theo ngày $D$, khung giờ $T$:
     1. Tìm `time_slots` có $D \in \text{dates}$ và thời gian $T$.
     2. **Kiểm tra `date_overrides` cho ngày $D$**:
        - Nếu có `date_overrides` cho ngày $D$:
          - Lấy `slot_limit = override.slot_limit ?? slot.slot_limit`.
          - Lấy `scope_ids = override.scope_ids ?? slot.scope_ids`.
        - Nếu không có: Dùng `slot.slot_limit` và `slot.scope_ids`.
     3. Lọc danh sách dịch vụ / khu vực / mức giá mà bác sĩ nhận khám trong ngày $D$ dựa trên tập `scope_ids` đã xác định ở Bước 2.
     4. Kiểm tra số lượng phiếu đã được đặt thực tế so với `slot_limit` tính được.
