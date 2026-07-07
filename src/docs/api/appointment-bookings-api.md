# Appointment Bookings API — Danh sách lịch đặt khám

Tài liệu cho endpoint lấy danh sách lịch đặt khám (dữ liệu **nội bộ**, không gọi
HIS), có bổ sung mapping chi tiết Bác sĩ / Phòng / Dịch vụ theo mã HIS.

## Base URL
```
/api/v1.0/appointment-bookings
```

## Get Appointment Bookings
**GET** `/appointment-bookings`

Luồng xử lý:
1. Query bảng `appointment_bookings` (phân trang / lọc / sắp xếp qua
   `sequelize-api-paginate`, middleware `queryModifier`).
2. Include sẵn 2 quan hệ thật: `patient` (`his_patients`) và `facility`
   (`his_facility_configs`).
3. Với mỗi booking, map thêm 3 field **`doctor` / `room` / `service`** bằng
   cách tra `doctor_id` / `room_id` / `service_id` (mã HIS dạng string) sang
   bảng `his_doctors` / `his_rooms` / `his_services` tương ứng — 3 field này
   **không phải include theo association** (booking lưu mã HIS, không phải
   UUID khóa ngoại) mà được backend tự tra và gắn thêm vào từng row.

### Query Parameters
| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `currentPage` | number | No | `1` | Trang hiện tại (bắt đầu từ 1). **Tên là `currentPage`, không phải `page`.** |
| `pageSize` | number | No | `10` | Số bản ghi mỗi trang (tối đa 100). |
| `filters` | string | No | — | Điều kiện lọc theo cú pháp Sieve (xem bảng bên dưới). **Không phải JSON.** |
| `sortField` | string | No | `appointment_time` | Tên cột sắp xếp. |
| `sortOrder` | string | No | `DESC` | `asc` / `desc`. |

> Không truyền `sortField` → mặc định sắp theo `appointment_time` giảm dần
> (lịch mới nhất lên trước).

### Cột dùng được cho `filters` / `sortField`
Theo model `appointment_bookings`:

`id`, `facility_id`, `patient_id`, `his_patient_id`, `his_booking_id`,
`his_mavaovien`, `request_booking_id`, `schedule_id`, `appointment_time`,
`room_id`, `doctor_id`, `exam_object_code`, `service_id`, `booking_type`,
`source`, `local_status`, `his_status`, `retry_count`, `last_sync_at`,
`created_at`, `updated_at`

### Cú pháp `filters`
`filters` là danh sách các điều kiện cách nhau bởi **dấu phẩy** `,`, mỗi điều
kiện có dạng `{Tên cột}{Toán tử}{Giá trị}`.

| Toán tử | Ý nghĩa | Ví dụ |
|---------|---------|-------|
| `==` | Bằng | `local_status==CREATED` |
| `!=` | Khác | `local_status!=CANCELED` |
| `>` | Lớn hơn | `appointment_time>2026-07-01` |
| `<` | Nhỏ hơn | `appointment_time<2026-12-31` |
| `>=` | Lớn hơn hoặc bằng | `appointment_time>=2026-07-01` |
| `<=` | Nhỏ hơn hoặc bằng | `appointment_time<=2026-12-31` |
| `@=` | Chứa (LIKE %...%) | `his_patient_id@=99999` |
| `_=` | Bắt đầu bằng | `request_booking_id_=REQ2026` |
| `!@=` | Không chứa | `note!@=test` |
| `!_=` | Không bắt đầu bằng | `doctor_id!_=00` |
| `[]` | Ngày nằm giữa 2 mốc | `appointment_time[](2026/07/01-2026/07/31)` |

Nâng cao:
- **OR theo giá trị:** dùng `|` giữa các giá trị — `local_status==CREATED|HIS_SYNCED`.
- **OR theo cột:** bọc các cột trong ngoặc và ngăn bởi `|` — `(doctor_id|room_id)==024`.
- **Nhiều điều kiện (AND):** ngăn bởi dấu phẩy — `facility_id==<uuid>,local_status==CREATED`.

### Ví dụ Request
Trang 1, 10 bản ghi, lọc theo facility và trạng thái, sắp theo thời gian khám mới nhất:
```
GET /api/v1.0/appointment-bookings?currentPage=1&pageSize=10&filters=facility_id==6b7caa40-1a83-4449-8b69-e8d19567c0f7,local_status==CREATED&sortField=appointment_time&sortOrder=desc
```

### Response (200 OK)
```json
{
  "message": "Lấy danh sách lịch đặt khám thành công",
  "message_en": "Get appointment bookings successful",
  "responseData": {
    "count": 34,
    "rows": [
      {
        "id": "3db25e29-324a-4da1-b7a8-5379e442255b",
        "facility_id": "6b7caa40-1a83-4449-8b69-e8d19567c0f7",
        "patient_id": "e9e545e6-5f53-4595-9a06-d4091d8ea488",
        "his_patient_id": "123123123123",
        "his_booking_id": "HISBK20260703051523833010",
        "appointment_time": "2026-07-12T22:15:23.819Z",
        "room_id": "024",
        "doctor_id": "0593",
        "service_id": "51499",
        "booking_type": "NORMAL",
        "source": "LOCAL_APP",
        "local_status": "CANCELED",
        "created_at": "2026-06-22T22:15:23.819Z",
        "updated_at": "2026-06-22T22:15:23.819Z",

        "patient": {
          "id": "e9e545e6-5f53-4595-9a06-d4091d8ea488",
          "his_patient_id": "123123123123",
          "patient_full_name": "TRẦN VĂN TÈO",
          "phone_number": "0918123456"
        },
        "facility": {
          "id": "6b7caa40-1a83-4449-8b69-e8d19567c0f7",
          "facility_name": "Bệnh viện Vạn Hạnh",
          "idbv": "79462"
        },

        "doctor": {
          "id": "9867b141-6363-4ce0-a9ff-2bdca004a92e",
          "facility_id": "6b7caa40-1a83-4449-8b69-e8d19567c0f7",
          "doctor_id": "0593",
          "doctor_name": "Lê Văn Tiêu",
          "specialty_id": null,
          "avatar_url": null,
          "description": "bs mắt hợp tác"
        },
        "room": {
          "id": "…",
          "facility_id": "6b7caa40-1a83-4449-8b69-e8d19567c0f7",
          "room_id": "024",
          "room_name": "BV -P402 KHU B NỘI TIÊU HÓA",
          "service_id": null,
          "description": null
        },
        "service": {
          "id": "…",
          "facility_id": "6b7caa40-1a83-4449-8b69-e8d19567c0f7",
          "service_id": "51499",
          "service_name": ".Khám YHCT bhyt",
          "price": 0,
          "specialty_id": null
        }
      }
    ],
    "totalPages": 4,
    "currentPage": 1
  },
  "status": "success"
}
```

| Field | Mô tả |
|-------|-------|
| `responseData.count` | Tổng số bản ghi khớp điều kiện (trước phân trang). |
| `responseData.rows` | Mảng booking của trang hiện tại (mỗi row có thêm `patient`, `facility`, `doctor`, `room`, `service`). |
| `responseData.totalPages` | Tổng số trang = `ceil(count / pageSize)`. |
| `responseData.currentPage` | Trang hiện tại. |
| `rows[].patient` | Thông tin bệnh nhân (include theo association `patient_id`). `null` nếu booking không gắn `patient_id`. |
| `rows[].facility` | Thông tin cơ sở y tế (include theo association `facility_id`). `null` nếu booking không gắn `facility_id`. |
| `rows[].doctor` | Thông tin bác sĩ, map theo `doctor_id` (mã HIS) sang bảng `his_doctors`. `null` nếu mã chưa tồn tại trong `his_doctors` (chưa sync từ HIS) hoặc booking không có `doctor_id`. |
| `rows[].room` | Thông tin phòng khám, map theo `room_id` sang bảng `his_rooms`. `null` nếu mã chưa sync hoặc booking không có `room_id`. |
| `rows[].service` | Thông tin dịch vụ, map theo `service_id` sang bảng `his_services`. `null` nếu mã chưa sync hoặc booking không có `service_id`. |

## Ghi chú
- `doctor` / `room` / `service` được map **trực tiếp theo mã** (`doctor_id` /
  `room_id` / `service_id`), **không lọc thêm theo `facility_id`**. Nếu 2 cơ
  sở khác nhau dùng trùng mã HIS (hiếm khi xảy ra vì mã do HIS mỗi bệnh viện
  tự sinh), có thể map nhầm chéo cơ sở — hiện tại chấp nhận đánh đổi này để
  tránh sót dữ liệu khi facility_id không khớp.
- Nếu `doctor` / `room` / `service` trả về `null`, nghĩa là mã HIS trên
  booking **chưa tồn tại** trong bảng `his_doctors` / `his_rooms` /
  `his_services` — thường do dữ liệu test/seed dùng mã tự đặt (`12345`, `0`,
  ...) chưa từng được đồng bộ từ HIS, không phải lỗi API.
- `patient` / `facility` là include theo association thật (`required: false`
  — booking không có patient/facility hợp lệ vẫn được trả về, chỉ 2 field đó
  là `null`).
