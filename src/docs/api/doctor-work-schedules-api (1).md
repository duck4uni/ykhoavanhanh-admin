# Doctor Work Schedules API

API quản lý lịch làm việc của bác sĩ tại các phòng khám.

## Base URL
```
/api/v1.0/doctor-work-schedules
```

## Endpoints

### 1. Get Doctor Work Schedules List
**GET** `/doctor-work-schedules`

Lấy danh sách lịch làm việc bác sĩ với hỗ trợ phân trang, sắp xếp và lọc.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Trang hiện tại (mặc định: 1) |
| pageSize | integer | No | Số lượng mỗi trang (mặc định: 10) |
| sortField | string | No | Trường sắp xếp |
| sortOrder | string | No | Thứ tự sắp xếp (ASC/DESC, mặc định: ASC) |
| filters | string | No | Bộ lọc, ví dụ: `status:ACTIVE` |
| doctor_id | string | No | Lọc theo ID bác sĩ |
| exam_area_id | string | No | Lọc theo ID khu khám |
| schedule_date | string | No | Lọc theo ngày cụ thể (YYYY-MM-DD) |
| date_from | string | No | Từ ngày (YYYY-MM-DD) |
| date_to | string | No | Đến ngày (YYYY-MM-DD) |

#### Response
```json
{
  "success": true,
  "message": "Lấy danh sách lịch làm việc bác sĩ thành công",
  "message_en": "Get doctor work schedules successful",
  "data": {
    "count": 50,
    "rows": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "doctor_id": "550e8400-e29b-41d4-a716-446655440001",
        "exam_area_id": "550e8400-e29b-41d4-a716-446655440002",
        "specialty_id": "550e8400-e29b-41d4-a716-446655440003",
        "room_id": "550e8400-e29b-41d4-a716-446655440004",
        "schedule_date": "2025-01-20",
        "shift_code": "MORNING",
        "max_appointments": 20,
        "booked_count": 12,
        "exam_fee": 150000,
        "allow_booking": true,
        "status": "ACTIVE",
        "note": "Khám sàng 20/1",
        "time_slots": [
          {
            "start": "08:00:00",
            "end": "09:00:00"
          },
          {
            "start": "09:00:00",
            "end": "10:00:00"
          }
        ],
        "his_schedule_id": "HIS-2025-001",
        "his_updated_at": "2025-01-15T10:30:00Z",
        "raw_data": {},
        "synced_at": "2025-01-15T10:30:00Z",
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z",
        "doctor": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "doctor_id": "DOC-001",
          "doctor_name": "Nguyễn Văn A"
        },
        "exam_area": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "code": "EA001",
          "name": "Phòng khám Nội",
          "short_name": "Nội"
        }
      }
    ],
    "totalPages": 5,
    "currentPage": 1
  }
}
```

#### Example Requests

**Get all schedules with pagination:**
```bash
curl -X GET "http://localhost:3000/api/v1.0/doctor-work-schedules?page=1&pageSize=10"
```

**Filter by doctor and date range:**
```bash
curl -X GET "http://localhost:3000/api/v1.0/doctor-work-schedules?doctor_id=550e8400-e29b-41d4-a716-446655440001&date_from=2025-01-15&date_to=2025-01-31"
```

**Filter by exam area and status:**
```bash
curl -X GET "http://localhost:3000/api/v1.0/doctor-work-schedules?exam_area_id=550e8400-e29b-41d4-a716-446655440002&filters=status:ACTIVE"
```

**Sort by schedule_date descending:**
```bash
curl -X GET "http://localhost:3000/api/v1.0/doctor-work-schedules?sortField=schedule_date&sortOrder=DESC"
```

---

### 2. Create Doctor Work Schedule
**POST** `/doctor-work-schedules`

Tạo lịch làm việc mới cho bác sĩ.

#### Authentication
Requires Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

#### Request Body
| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| doctor_id | string (UUID) | ✓ | ID bác sĩ | - |
| exam_area_id | string (UUID) | ✓ | ID khu khám | - |
| schedule_date | string (YYYY-MM-DD) | ✓ | Ngày làm việc | - |
| specialty_id | string (UUID) | No | ID chuyên khoa | null |
| room_id | string (UUID) | No | ID phòng khám | null |
| shift_code | string | No | Mã ca làm việc (MORNING/AFTERNOON/EVENING) | null |
| max_appointments | integer | No | Số lượng lịch tối đa | null |
| booked_count | integer | No | Số lượng đã đặt | 0 |
| exam_fee | number | No | Phí khám | null |
| allow_booking | boolean | No | Cho phép đặt lịch | true |
| status | string | No | Trạng thái (ACTIVE/INACTIVE) | "ACTIVE" |
| note | string | No | Ghi chú | null |
| time_slots | array | No | Các khe thời gian (JSONB array) | [] |
| his_schedule_id | string | No | ID lịch từ HIS | null |
| his_updated_at | string (ISO 8601) | No | Thời gian cập nhật từ HIS | null |
| raw_data | object | No | Dữ liệu gốc từ HIS | null |
| synced_at | string (ISO 8601) | No | Thời gian đồng bộ | null |

#### Example Request

```json
{
  "doctor_id": "550e8400-e29b-41d4-a716-446655440001",
  "exam_area_id": "550e8400-e29b-41d4-a716-446655440002",
  "specialty_id": "550e8400-e29b-41d4-a716-446655440003",
  "room_id": "550e8400-e29b-41d4-a716-446655440004",
  "schedule_date": "2025-01-20",
  "shift_code": "MORNING",
  "max_appointments": 20,
  "booked_count": 0,
  "exam_fee": 150000,
  "allow_booking": true,
  "status": "ACTIVE",
  "note": "Khám sàng ngày 20/1",
  "time_slots": [
    {
      "start": "08:00:00",
      "end": "09:00:00"
    },
    {
      "start": "09:00:00",
      "end": "10:00:00"
    },
    {
      "start": "10:00:00",
      "end": "11:00:00"
    },
    {
      "start": "11:00:00",
      "end": "12:00:00"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Tạo lịch làm việc bác sĩ thành công",
  "message_en": "Create doctor work schedule successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "doctor_id": "550e8400-e29b-41d4-a716-446655440001",
    "exam_area_id": "550e8400-e29b-41d4-a716-446655440002",
    "specialty_id": "550e8400-e29b-41d4-a716-446655440003",
    "room_id": "550e8400-e29b-41d4-a716-446655440004",
    "schedule_date": "2025-01-20",
    "shift_code": "MORNING",
    "max_appointments": 20,
    "booked_count": 0,
    "exam_fee": 150000,
    "allow_booking": true,
    "status": "ACTIVE",
    "note": "Khám sàng ngày 20/1",
    "time_slots": [
      {
        "start": "08:00:00",
        "end": "09:00:00"
      },
      {
        "start": "09:00:00",
        "end": "10:00:00"
      },
      {
        "start": "10:00:00",
        "end": "11:00:00"
      },
      {
        "start": "11:00:00",
        "end": "12:00:00"
      }
    ],
    "his_schedule_id": null,
    "his_updated_at": null,
    "raw_data": null,
    "synced_at": null,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: doctor_id, exam_area_id, schedule_date",
  "message_en": "Missing required fields: doctor_id, exam_area_id, schedule_date",
  "error": "Missing required fields"
}
```

#### Curl Example
```bash
curl -X POST "http://localhost:3000/api/v1.0/doctor-work-schedules" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "550e8400-e29b-41d4-a716-446655440001",
    "exam_area_id": "550e8400-e29b-41d4-a716-446655440002",
    "specialty_id": "550e8400-e29b-41d4-a716-446655440003",
    "room_id": "550e8400-e29b-41d4-a716-446655440004",
    "schedule_date": "2025-01-20",
    "shift_code": "MORNING",
    "max_appointments": 20,
    "exam_fee": 150000,
    "allow_booking": true,
    "status": "ACTIVE",
    "note": "Khám sàng ngày 20/1",
    "time_slots": [
      {"start": "08:00:00", "end": "09:00:00"},
      {"start": "09:00:00", "end": "10:00:00"},
      {"start": "10:00:00", "end": "11:00:00"},
      {"start": "11:00:00", "end": "12:00:00"}
    ]
  }'
```

---

## Data Model

### Doctor Work Schedule Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | No | UUIDV4 | Định danh duy nhất |
| doctor_id | UUID | No | - | Tham chiếu đến bác sĩ |
| exam_area_id | UUID | No | - | Tham chiếu đến khu khám |
| specialty_id | UUID | Yes | - | Tham chiếu đến chuyên khoa |
| room_id | UUID | Yes | - | Tham chiếu đến phòng khám |
| schedule_date | DATE | No | - | Ngày làm việc |
| shift_code | VARCHAR(20) | Yes | - | Mã ca (MORNING/AFTERNOON/EVENING) |
| max_appointments | INTEGER | Yes | - | Số lượng lịch tối đa |
| booked_count | INTEGER | No | 0 | Số lượng đã đặt |
| exam_fee | DECIMAL | Yes | - | Phí khám |
| allow_booking | BOOLEAN | No | true | Cho phép đặt lịch |
| status | VARCHAR(20) | No | "ACTIVE" | Trạng thái (ACTIVE/INACTIVE) |
| note | TEXT | Yes | - | Ghi chú |
| time_slots | JSONB | No | [] | Các khe thời gian |
| his_schedule_id | VARCHAR(50) | Yes | - | ID từ HIS |
| his_updated_at | TIMESTAMP | Yes | - | Thời gian cập nhật từ HIS |
| raw_data | JSONB | Yes | - | Dữ liệu gốc từ HIS |
| synced_at | TIMESTAMP | Yes | - | Thời gian đồng bộ cuối cùng |
| created_at | TIMESTAMP | No | now() | Thời gian tạo |
| updated_at | TIMESTAMP | No | now() | Thời gian cập nhật |

### Time Slots Structure (JSONB)
Mảng các đối tượng mô tả khe thời gian khám:
```json
[
  {
    "start": "08:00:00",
    "end": "09:00:00"
  },
  {
    "start": "09:00:00",
    "end": "10:00:00"
  }
]
```

---

## Relationships

- **doctor**: Liên kết tới bảng `his_doctors` (belongsTo)
  - Trả về các trường: `id`, `doctor_id`, `doctor_name`

- **exam_area**: Liên kết tới bảng `exam_areas` (belongsTo)
  - Trả về các trường: `id`, `code`, `name`, `short_name`

---

## Test Checklist

- [ ] GET danh sách tất cả lịch làm việc (mặc định phân trang)
- [ ] GET lịch làm việc theo bác sĩ cụ thể (filter by doctor_id)
- [ ] GET lịch làm việc theo khu khám (filter by exam_area_id)
- [ ] GET lịch làm việc theo ngày cụ thể (filter by schedule_date)
- [ ] GET lịch làm việc trong khoảng thời gian (date_from + date_to)
- [ ] GET lịch làm việc theo trạng thái (filters=status:ACTIVE)
- [ ] GET sắp xếp theo schedule_date ASC
- [ ] GET sắp xếp theo schedule_date DESC
- [ ] POST tạo lịch làm việc với tất cả trường bắt buộc
- [ ] POST tạo lịch làm việc với time_slots đầy đủ
- [ ] POST kiểm tra validation thiếu doctor_id
- [ ] POST kiểm tra validation thiếu exam_area_id
- [ ] POST kiểm tra validation thiếu schedule_date
- [ ] POST kiểm tra default values (booked_count=0, status=ACTIVE, allow_booking=true, time_slots=[])
- [ ] POST kiểm tra authentication (Bearer token required)
- [ ] GET phân trang đúng (page, pageSize, totalPages, currentPage)
