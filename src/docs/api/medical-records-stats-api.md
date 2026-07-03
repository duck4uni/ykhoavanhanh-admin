# Medical Records Stats API

Thống kê **hồ sơ bệnh án** (= hồ sơ bệnh nhân, bảng `his_patients`) dùng cho admin phân tích: tổng số hồ sơ, số hồ sơ mới tháng này so với tháng trước, tổng chi phí đã thu, lần khám gần nhất.

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1.0/dashboard/medical-records-stats` | Thống kê hồ sơ bệnh án (bệnh nhân) |

- Provider: [`DashboardProvider.getMedicalRecordStats()`](../src/providers/dashboardProvider.ts)
- Controller: [`src/controllers/api/v1.0/dashboard/medical-records-stats.ts`](../src/controllers/api/v1.0/dashboard/medical-records-stats.ts)

---

## 1. Request

| | |
|---|---|
| Method | `GET` |
| URL | `/api/v1.0/dashboard/medical-records-stats` |
| Auth | **Bắt buộc** Bearer token (middleware `verify`) |
| Content-Type | không có body |

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả | Mặc định |
|---|---|---|---|---|
| `facilityId` | `string` (UUID) | Không | Lọc theo cơ sở y tế (`his_facility_configs.id`) | không truyền → tính toàn hệ thống, không lọc cơ sở |

Ví dụ:
```bash
TOKEN="<bearer_token>"
BASE="http://localhost:3000/api/v1.0"

# Toàn hệ thống
curl -s "$BASE/dashboard/medical-records-stats" \
  -H "Authorization: Bearer $TOKEN"

# Lọc theo 1 cơ sở
curl -s "$BASE/dashboard/medical-records-stats?facilityId=11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. Response — thành công (200)

Theo convention chung của project (`res.sendOk` → `apiResponseDTO`), payload nằm trong `responseData`:

```json
{
  "message": "Lấy thống kê hồ sơ bệnh án thành công",
  "message_en": "Get medical record stats successful",
  "responseData": {
    "totalRecords": 320,
    "thisMonthCount": 12,
    "lastMonthCount": 8,
    "monthChangePercent": 50,
    "totalCost": 452000000,
    "lastVisitAt": "2026-07-03T02:10:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**Giải thích từng field trong `responseData`:**

| Field | Kiểu | Ý nghĩa | Cách tính |
|---|---|---|---|
| `totalRecords` | `number` | Tổng số hồ sơ bệnh nhân | `COUNT(*) FROM his_patients` (lọc `facility_id` nếu có `facilityId`) |
| `thisMonthCount` | `number` | Số hồ sơ **mới tạo** trong tháng hiện tại | `COUNT(*) FROM his_patients WHERE created_at >= <đầu tháng này>` |
| `lastMonthCount` | `number` | Số hồ sơ mới tạo trong tháng trước (liền kề) | `COUNT(*) FROM his_patients WHERE created_at BETWEEN <đầu tháng trước> AND <cuối tháng trước>` |
| `monthChangePercent` | `number` | % thay đổi `thisMonthCount` so với `lastMonthCount` | `(thisMonthCount - lastMonthCount) / lastMonthCount * 100`, làm tròn 2 chữ số. Nếu `lastMonthCount = 0`: trả `100` khi `thisMonthCount > 0`, ngược lại trả `0` |
| `totalCost` | `number` | Tổng tiền đã thanh toán thành công (all-time, **không** giới hạn theo tháng) | `SUM(amount) FROM appointment_booking_payments JOIN appointment_bookings ON booking_id WHERE payment_status = 'PAID'` (lọc `facility_id` qua booking nếu có `facilityId`) |
| `lastVisitAt` | `string` (ISO date) hoặc `null` | Thời điểm phiếu khám (booking) gần nhất được tạo | `MAX(created_at) FROM appointment_bookings` (lọc `facility_id` nếu có `facilityId`); `null` nếu chưa có booking nào |

> **Lưu ý quan trọng:**
> - `totalRecords`/`thisMonthCount`/`lastMonthCount` đếm trên bảng **`his_patients`** (hồ sơ bệnh nhân) — KHÔNG phải `appointment_bookings` (phiếu khám).
> - `totalCost` và `lastVisitAt` vẫn tính trên **`appointment_bookings`/`appointment_booking_payments`** (chi phí và lần khám gắn với booking, không gắn với hồ sơ bệnh nhân), nên **không cùng phạm vi thời gian** với 3 field đếm hồ sơ ở trên (không lọc theo tháng này/tháng trước).
> - `facilityId` khi truyền sẽ áp dụng cho tất cả field, nhưng qua 2 đường khác nhau: `his_patients.facility_id` (cho 3 field đếm hồ sơ) và `appointment_bookings.facility_id` (cho `totalCost`, `lastVisitAt`).

---

## 3. Response — lỗi

**400 — `facilityId` không hợp lệ (không phải UUID):**
```json
{
  "message": "facilityId không hợp lệ (phải là UUID)",
  "message_en": "facilityId không hợp lệ (phải là UUID)",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token** (middleware `verify` chặn trước khi vào handler):
```json
{
  "message": "Unauthorized",
  "message_en": "Unauthorized",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-07-03 10:00:00",
  "violations": null
}
```

---

## 4. Checklist test

- [ ] **totalRecords đếm đúng bảng**: khớp `SELECT COUNT(*) FROM his_patients` (không phải đếm `appointment_bookings`).
- [ ] **thisMonthCount/lastMonthCount theo tháng**: khớp `created_at` nằm trong tháng hiện tại / tháng trước (kiểm tra ở ranh giới đầu/cuối tháng).
- [ ] **monthChangePercent**: đúng công thức tăng/giảm %; khi `lastMonthCount = 0` và `thisMonthCount > 0` → trả `100`; cả hai đều `0` → trả `0`.
- [ ] **totalCost**: khớp `SELECT SUM(amount) FROM appointment_booking_payments WHERE payment_status='PAID'` (join qua booking, all-time, không lọc theo tháng).
- [ ] **lastVisitAt**: `null` khi hệ thống/cơ sở chưa có booking nào; đúng bằng `created_at` mới nhất khi có dữ liệu.
- [ ] **Filter facility**: truyền `facilityId` → chỉ trả dữ liệu đúng cơ sở (cả 2 đường `his_patients.facility_id` và `appointment_bookings.facility_id`).
- [ ] **Validate params**: `facilityId` không phải UUID → HTTP 400.
- [ ] **Auth**: không có token → 401.
