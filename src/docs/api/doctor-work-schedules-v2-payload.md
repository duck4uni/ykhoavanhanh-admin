# Doctor Work Schedules API V2 — Payload cho màn Thêm lịch khám mới

## 1. Mục tiêu

Frontend màn **Thêm lịch khám mới** đang tạo lịch khám theo nghiệp vụ mới:

- Một lịch khám có thể có **nhiều phạm vi khám**.
- Mỗi phạm vi khám là một tổ hợp:

```text
Chuyên khoa + Khu vực khám + Phòng khám + Dịch vụ khám + Phí khám + Trạng thái
```

- Một lịch khám có thể có **nhiều khung giờ làm việc**.
- Mỗi khung giờ có **slot riêng**.
- Mỗi khung giờ có thể áp dụng cho:
  - toàn bộ phạm vi khám; hoặc
  - một số phạm vi khám cụ thể.
- Mỗi khung giờ có thêm **thứ áp dụng** từ **Thứ 2 đến Chủ nhật**.

Backend cần cập nhật endpoint tạo lịch khám để nhận payload mới từ frontend.

---

## 2. Endpoint cần cập nhật

```http
POST /api/v1.0/doctor-work-schedules
```

Endpoint hiện tại đang nhận payload dạng 1 lịch = 1 phạm vi:

```json
{
  "doctor_id": "...",
  "exam_area_id": "...",
  "specialty_id": "...",
  "room_id": "...",
  "schedule_date": "2026-07-03",
  "shift_code": "MORNING",
  "max_appointments": 20,
  "exam_fee": 150000,
  "time_slots": []
}
```

Payload mới cần nhận dạng 1 lịch = nhiều phạm vi + nhiều khung giờ + thứ áp dụng.

---

## 3. Quy ước thứ trong tuần

Frontend dùng quy ước số như JavaScript `Date.getDay()`:

| Giá trị | Thứ |
|---:|---|
| `0` | Chủ nhật |
| `1` | Thứ 2 |
| `2` | Thứ 3 |
| `3` | Thứ 4 |
| `4` | Thứ 5 |
| `5` | Thứ 6 |
| `6` | Thứ 7 |

Trên UI, người dùng chọn theo thứ tự **Thứ 2 → Chủ nhật**, nhưng payload vẫn dùng giá trị `1,2,3,4,5,6,0`.

---

## 4. Request body mới

```ts
type CreateDoctorWorkScheduleV2Payload = {
  doctor_id: string;
  date: string; // YYYY-MM-DD, ngày bắt đầu / ngày đại diện để backend neo lịch nếu cần
  weekdays: number[]; // Tổng hợp các thứ được dùng trong time_slots, ví dụ [1,2,3,4,5,6,0]
  status: "ACTIVE" | "INACTIVE";
  note?: string;
  scopes: WorkScheduleScope[];
  time_slots: WorkScheduleTimeSlot[];
};

type WorkScheduleScope = {
  client_id: string; // ID tạm do frontend tạo, dùng để map time_slots.scope_ids
  specialty_id: string;
  area_id: string; // exam_area_id
  room_id?: string;
  service_id: string;
  fee: number;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
};

type WorkScheduleTimeSlot = {
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  slot_limit: number;
  weekday: number; // 0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7
  scope_ids: "all" | string[]; // string[] tham chiếu WorkScheduleScope.client_id
};
```

### Ghi chú quan trọng

- `scopes[].client_id` là ID tạm frontend tạo trước khi backend lưu DB.
- Nếu `time_slots[].scope_ids` là mảng string, các phần tử trong mảng chính là `client_id` của scope tương ứng.
- Nếu `time_slots[].scope_ids = "all"`, khung giờ đó áp dụng cho toàn bộ `scopes`.
- Frontend hiện gửi `weekdays` ở root để backend dễ biết lịch có những thứ nào.
- Frontend cũng gửi `weekday` trong từng `time_slots[]` để backend biết khung giờ cụ thể thuộc thứ nào.

---

## 5. Ví dụ request hoàn chỉnh

Ví dụ dưới đây tạo lịch cho bác sĩ, áp dụng từ **Thứ 2 đến Chủ nhật**. Khung 08:00-08:30 áp dụng cho tất cả phạm vi trong Thứ 2 và Thứ 3; khung 09:00-09:30 chỉ áp dụng cho 1 phạm vi trong Thứ 2.

```json
{
  "doctor_id": "doctor_001",
  "date": "2026-07-13",
  "weekdays": [1, 2, 3, 4, 5, 6, 0],
  "status": "ACTIVE",
  "note": "Lịch khám từ Thứ 2 đến Chủ nhật",
  "scopes": [
    {
      "client_id": "scope_1752200000000_a1b2c3",
      "specialty_id": "specialty_pediatrics",
      "area_id": "area_specialized",
      "room_id": "room_201",
      "service_id": "service_general_checkup",
      "fee": 150000,
      "status": "ACTIVE",
      "note": ""
    },
    {
      "client_id": "scope_1752200000000_d4e5f6",
      "specialty_id": "specialty_ent",
      "area_id": "area_specialized",
      "room_id": "room_303",
      "service_id": "service_ent_endoscopy",
      "fee": 200000,
      "status": "ACTIVE",
      "note": ""
    }
  ],
  "time_slots": [
    {
      "start_time": "08:00",
      "end_time": "08:30",
      "slot_limit": 20,
      "weekday": 1,
      "scope_ids": "all"
    },
    {
      "start_time": "08:00",
      "end_time": "08:30",
      "slot_limit": 20,
      "weekday": 2,
      "scope_ids": "all"
    },
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "slot_limit": 10,
      "weekday": 1,
      "scope_ids": ["scope_1752200000000_a1b2c3"]
    },
    {
      "start_time": "09:30",
      "end_time": "10:00",
      "slot_limit": 15,
      "weekday": 0,
      "scope_ids": ["scope_1752200000000_a1b2c3", "scope_1752200000000_d4e5f6"]
    }
  ]
}
```

---

## 6. Cách frontend sinh `time_slots` theo thứ

Trên UI, một dòng khung giờ có thể chọn nhiều thứ. Ví dụ:

```text
08:00 - 08:30, slot 20, chọn Thứ 2 + Thứ 3 + Chủ nhật
```

Frontend sẽ tách thành nhiều phần tử trong `time_slots`:

```json
[
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 1,
    "scope_ids": "all"
  },
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 2,
    "scope_ids": "all"
  },
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 0,
    "scope_ids": "all"
  }
]
```

Backend không cần tự nhân bản theo `weekdays`; chỉ cần lưu/validate từng phần tử `time_slots[]` đã có `weekday`.

---

## 7. Mapping `scope_ids`

Frontend gửi `scopes[].client_id` để backend map rõ ràng, không cần đoán theo thứ tự mảng.

Ví dụ:

```json
{
  "scopes": [
    {
      "client_id": "scope_1752200000000_a1b2c3",
      "specialty_id": "specialty_pediatrics",
      "area_id": "area_specialized",
      "room_id": "room_201",
      "service_id": "service_general_checkup",
      "fee": 150000,
      "status": "ACTIVE"
    }
  ],
  "time_slots": [
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "slot_limit": 10,
      "weekday": 1,
      "scope_ids": ["scope_1752200000000_a1b2c3"]
    }
  ]
}
```

Backend nên xử lý như sau:

1. Lưu từng phần tử trong `scopes[]` vào DB.
2. Tạo map tạm:

```ts
const scopeIdMap = new Map<string, string>();
// key = scopes[].client_id
// value = id thật sau khi lưu DB
```

3. Khi lưu `time_slots[]`:
   - Nếu `scope_ids = "all"`: áp dụng cho toàn bộ scope đã lưu.
   - Nếu `scope_ids` là mảng: map từng `client_id` sang ID thật bằng `scopeIdMap`.

---

## 8. Ý nghĩa các field

### 8.1. Root payload

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `doctor_id` | string | Có | ID bác sĩ |
| `date` | string | Có | Ngày bắt đầu / ngày đại diện, format `YYYY-MM-DD` |
| `weekdays` | number[] | Có | Danh sách thứ có lịch, dùng quy ước `0..6` |
| `status` | `ACTIVE` / `INACTIVE` | Có | Trạng thái lịch |
| `note` | string | Không | Ghi chú chung của lịch |
| `scopes` | array | Có | Danh sách phạm vi khám |
| `time_slots` | array | Có | Danh sách khung giờ đã tách theo từng thứ |

### 8.2. `scopes[]`

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `client_id` | string | Có | ID tạm do frontend tạo để `time_slots.scope_ids` tham chiếu |
| `specialty_id` | string | Có | ID chuyên khoa |
| `area_id` | string | Có | ID khu vực khám, tương đương `exam_area_id` |
| `room_id` | string | Không / Có nếu BE yêu cầu | ID phòng khám |
| `service_id` | string | Có | ID dịch vụ khám |
| `price_level_code` | string | Có với dịch vụ có nhiều mức giá | Mã mức giá ổn định, ví dụ `VIP`, `DV`, `BHYT`; dùng trong khóa chống trùng scope |
| `fee` | number | Có | Phí khám áp dụng cho phạm vi này |
| `status` | `ACTIVE` / `INACTIVE` | Có | Trạng thái phạm vi |
| `note` | string | Không | Ghi chú riêng cho phạm vi |

### 8.3. `time_slots[]`

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `start_time` | string | Có | Giờ bắt đầu, format `HH:mm` |
| `end_time` | string | Có | Giờ kết thúc, format `HH:mm` |
| `slot_limit` | number | Có | Số slot của khung giờ |
| `weekday` | number | Có | Thứ áp dụng, `0 = Chủ nhật`, `1 = Thứ 2`, ..., `6 = Thứ 7` |
| `dates` | string[] | Có | Các ngày cụ thể áp dụng, format `YYYY-MM-DD`; mỗi ngày phải thuộc `weekday` và nằm trong khoảng root `start_date` → `end_date` |
| `date_overrides` | array | Không | Chỉ gửi ngày có số phiếu khác `slot_limit`, dạng `{ date: YYYY-MM-DD, slot_limit: number }` |
| `scope_ids` | `"all"` hoặc `string[]` | Có | Áp dụng cho tất cả phạm vi hoặc một số scope theo `client_id` |

---

## 9. Validation backend đề xuất

### 9.1. Root

- `doctor_id` bắt buộc.
- `date` bắt buộc, đúng format `YYYY-MM-DD`.
- `weekdays` bắt buộc, là mảng number.
- Mỗi phần tử trong `weekdays` phải thuộc `0,1,2,3,4,5,6`.
- `weekdays` không được rỗng.
- `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`.
- `scopes` phải có ít nhất 1 phần tử.
- `time_slots` phải có ít nhất 1 phần tử.
- Nên kiểm tra `weekdays` khớp với các `time_slots[].weekday`:
  - mọi `time_slots[].weekday` phải nằm trong `weekdays`.
  - mọi phần tử trong `weekdays` nên có ít nhất một `time_slots[]` tương ứng.

### 9.2. Scopes

- Mỗi scope bắt buộc có:
  - `client_id`
  - `specialty_id`
  - `area_id`
  - `service_id`
  - `fee`
  - `status`
- `client_id` không được trùng trong cùng payload.
- `fee >= 0`.
- Không cho trùng hoàn toàn tổ hợp:

```text
specialty_id + area_id + room_id + service_id + price_level_code
```

Hai scope cùng dịch vụ nhưng khác `price_level_code` được phép tồn tại. Không dùng `fee` để phân biệt vì hai mức giá có thể cùng số tiền.

- Nếu có kiểm tra quan hệ dữ liệu:
  - `service_id` nên thuộc `specialty_id` nếu service có `specialty_id`.
  - `room_id` nên thuộc `area_id` nếu room có `exam_area_id`.

### 9.3. Time slots

- `start_time < end_time`.
- `slot_limit` là số nguyên dương, `slot_limit > 0`.
- `weekday` bắt buộc và phải thuộc `0,1,2,3,4,5,6`.
- `dates` bắt buộc, là mảng `YYYY-MM-DD` không rỗng.
- Mỗi phần tử `dates[]` phải nằm trong khoảng `start_date` → `end_date` và có thứ trùng với `weekday` của time slot.
- Detail GET cần trả lại nguyên `dates[]`; với dữ liệu legacy chưa có field này, FE sẽ fallback sang toàn bộ ngày khớp `weekday`.
- `date_overrides` nếu có phải là mảng không trùng `date`; mỗi `date` phải nằm trong `dates[]` và mỗi `slot_limit` phải là số nguyên dương.
- Detail GET cần trả lại `date_overrides`; thiếu field này được hiểu là mọi ngày dùng `slot_limit` chung.
- `scope_ids` phải là:
  - chuỗi `"all"`; hoặc
  - mảng string chứa các `scopes[].client_id` hợp lệ.
- Nếu `scope_ids = "all"`: khung giờ áp dụng cho toàn bộ phần tử trong `scopes`.
- Nếu `scope_ids` là mảng: tất cả phần tử trong mảng phải map được tới `scopes[].client_id` trong payload.
- Không cho khung giờ trùng/chồng lấn trong cùng **doctor + weekday + phạm vi áp dụng**.

Ví dụ chồng lấn cần chặn:

```json
[
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 1,
    "scope_ids": "all"
  },
  {
    "start_time": "08:15",
    "end_time": "08:45",
    "slot_limit": 20,
    "weekday": 1,
    "scope_ids": "all"
  }
]
```

Ví dụ KHÔNG chồng lấn vì khác thứ:

```json
[
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 1,
    "scope_ids": "all"
  },
  {
    "start_time": "08:00",
    "end_time": "08:30",
    "slot_limit": 20,
    "weekday": 2,
    "scope_ids": "all"
  }
]
```

---

## 10. Response đề xuất

### 10.1. Success

```json
{
  "status": "success",
  "message": "Tạo lịch khám thành công",
  "responseData": {
    "id": "schedule_001",
    "doctor_id": "doctor_001",
    "date": "2026-07-13",
    "weekdays": [1, 2, 3, 4, 5, 6, 0],
    "status": "ACTIVE",
    "note": "Lịch khám từ Thứ 2 đến Chủ nhật",
    "scopes": [
      {
        "id": "scope_db_001",
        "client_id": "scope_1752200000000_a1b2c3",
        "specialty_id": "specialty_pediatrics",
        "area_id": "area_specialized",
        "room_id": "room_201",
        "service_id": "service_general_checkup",
        "fee": 150000,
        "status": "ACTIVE",
        "note": ""
      }
    ],
    "time_slots": [
      {
        "id": "slot_db_001",
        "start_time": "08:00",
        "end_time": "08:30",
        "slot_limit": 20,
        "weekday": 1,
        "scope_ids": "all"
      }
    ],
    "created_at": "2026-07-13T01:00:00.000Z",
    "updated_at": "2026-07-13T01:00:00.000Z"
  }
}
```

Nếu backend vẫn dùng envelope cũ `{ success, data }`, frontend có thể điều chỉnh sau, nhưng khuyến nghị đồng bộ theo envelope chuẩn của hệ thống:

```json
{
  "status": "success",
  "responseData": {}
}
```

### 10.2. Validation error

```json
{
  "status": "fail",
  "message": "Dữ liệu lịch khám không hợp lệ",
  "violations": [
    {
      "field": "weekdays[0]",
      "message": "Thứ áp dụng không hợp lệ"
    },
    {
      "field": "scopes[0].client_id",
      "message": "client_id là bắt buộc"
    },
    {
      "field": "time_slots[0].weekday",
      "message": "Thứ áp dụng là bắt buộc"
    },
    {
      "field": "time_slots[0].scope_ids[0]",
      "message": "Không tìm thấy phạm vi khám tương ứng"
    }
  ],
  "responseData": null
}
```

---

## 11. Gợi ý lưu DB

Backend có thể triển khai theo 1 trong 2 hướng.

### Hướng A — Tách bảng scope và time slot

Bổ sung các bảng mới:

```text
doctor_work_schedule_scopes
- id
- schedule_id
- client_id              // optional, lưu để audit/debug nếu cần
- specialty_id
- area_id
- room_id
- service_id
- fee
- status
- note
- created_at
- updated_at

doctor_work_schedule_time_slots
- id
- schedule_id
- weekday                // 0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7
- start_time
- end_time
- slot_limit
- scope_mode             // all | custom
- scope_ids              // jsonb array id thật hoặc mapping table
- created_at
- updated_at
```

Ưu điểm:

- Query rõ ràng.
- Dễ thống kê theo phạm vi/dịch vụ/phòng/thứ.
- Dễ validate trùng/chồng lấn theo `weekday`.

### Hướng B — Giữ bảng chính, lưu `scopes` và `time_slots` dạng JSONB

Bổ sung JSONB column:

```text
weekdays jsonb
scopes jsonb
time_slots jsonb
```

Ưu điểm:

- Ít thay đổi DB.
- Phù hợp nếu lịch khám chỉ dùng để hiển thị/đặt lịch theo JSON.

Nhược điểm:

- Khó query/thống kê hơn.
- Cần validate JSON kỹ ở application layer.

---

## 12. Backward compatibility

Trong giai đoạn chuyển tiếp, backend có thể hỗ trợ đồng thời:

### Payload cũ

```json
{
  "doctor_id": "...",
  "exam_area_id": "...",
  "schedule_date": "...",
  "time_slots": []
}
```

### Payload mới

```json
{
  "doctor_id": "...",
  "date": "...",
  "weekdays": [1, 2, 3, 4, 5, 6, 0],
  "scopes": [],
  "time_slots": []
}
```

Cách nhận diện payload mới:

```ts
const isV2 = Array.isArray(body.scopes) && Array.isArray(body.time_slots);
```

Nếu `isV2 = true`, backend xử lý theo logic nhiều phạm vi + thứ áp dụng.
Nếu `isV2 = false`, backend xử lý theo logic cũ để không ảnh hưởng màn hình/luồng khác.

---

## 13. Mapping từ frontend hiện tại

Frontend hiện đang gửi từ file:

```text
src/app/(dashboard)/appointments/new/page.tsx
```

Hook gọi API:

```text
doctorWorkSchedulesHooks.useCreateV2
```

Type payload nằm ở:

```text
src/api/doctorWorkSchedulesApi.ts
```

Tên type frontend:

```ts
CreateDoctorWorkScheduleV2Payload
WorkScheduleScope
WorkScheduleTimeSlotV2
```

Frontend hiện gửi:

- `scopes[].client_id`: ID tạm để backend map scope.
- `time_slots[].weekday`: thứ áp dụng cho từng khung giờ.
- `time_slots[].scope_ids`: `"all"` hoặc mảng `client_id` của scope.
- `weekdays`: danh sách thứ tổng hợp từ toàn bộ time slot.

---

## 14. Checklist cho backend

- [ ] Endpoint `POST /doctor-work-schedules` nhận được `scopes[]`.
- [ ] Endpoint nhận được `scopes[].client_id`.
- [ ] Endpoint nhận được `weekdays[]` ở root payload.
- [ ] Endpoint nhận được `time_slots[]` với `weekday` và `slot_limit` riêng từng khung.
- [ ] Hỗ trợ `scope_ids = "all"`.
- [ ] Hỗ trợ `scope_ids = string[]` trỏ tới `scopes[].client_id`.
- [ ] Map `scopes[].client_id` sang ID thật sau khi lưu DB.
- [ ] Validate không trùng `client_id` trong scopes.
- [ ] Validate không trùng scope theo tổ hợp `specialty_id + area_id + room_id + service_id`.
- [ ] Validate `weekday` chỉ nhận `0..6`.
- [ ] Validate `weekdays[]` khớp với `time_slots[].weekday`.
- [ ] Validate không chồng lấn khung giờ trong cùng doctor + weekday + phạm vi.
- [ ] Validate `slot_limit > 0`.
- [ ] Trả response success theo envelope chuẩn.
- [ ] Trả validation errors có field rõ ràng để frontend hiển thị nếu cần.

---

## 15. Ghi chú quan trọng cho frontend/backend

Payload mới hiện đã ưu tiên hướng rõ ràng nhất:

```text
scopes[].client_id  <── time_slots[].scope_ids[]
```

Backend không cần map scope theo thứ tự mảng nữa. Chỉ cần dùng `client_id` để tạo bảng map tạm khi lưu lịch khám.
