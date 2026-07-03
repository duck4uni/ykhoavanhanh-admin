# Revenue By Day API

API cung cấp dữ liệu **doanh thu theo ngày** dùng cho biểu đồ chart (như ảnh "Doanh thu theo ngày" 7 cột).

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1.0/dashboard/revenue-by-day` | Bearer | Doanh thu theo ngày (dữ liệu chart) |

- Controller: [`revenue-by-day.ts`](../src/controllers/api/v1.0/dashboard/revenue-by-day.ts)
- Provider: [`DashboardProvider.getRevenueByDay()`](../src/providers/dashboardProvider.ts)

Response format theo convention chung của project (`res.sendOk` → `apiResponseDTO`), payload nằm trong `responseData`.

---

## 1. Request

| | |
|---|---|
| Method | `GET` |
| URL | `/api/v1.0/dashboard/revenue-by-day` |
| Auth | **Bắt buộc** Bearer token (middleware `verify`) |
| Content-Type | không có body |

**Query params:**

| Tên | Kiểu | Bắt buộc | Mô tả | Mặc định |
|---|---|---|---|---|
| `fromDate` | `string` (YYYY-MM-DD) | Không | Từ ngày | 7 ngày trước hiện tại |
| `toDate` | `string` (YYYY-MM-DD) | Không | Đến ngày | hiện tại (hôm nay) |
| `facilityId` | `string` (UUID) | Không | Lọc theo cơ sở y tế | không lọc (toàn hệ thống) |

**Ví dụ:**

```bash
TOKEN="<bearer_token>"
BASE="http://localhost:3000/api/v1.0"

# Mặc định 7 ngày gần đây
curl -s "$BASE/dashboard/revenue-by-day" \
  -H "Authorization: Bearer $TOKEN"

# Custom range
curl -s "$BASE/dashboard/revenue-by-day?fromDate=2026-05-01&toDate=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"

# Custom range + lọc facility
curl -s "$BASE/dashboard/revenue-by-day?fromDate=2026-05-12&toDate=2026-05-18&facilityId=11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. Response — thành công (200)

Mảng object, mỗi object là doanh thu của 1 ngày, sắp xếp tăng dần theo date:

```json
{
  "message": "Lấy doanh thu theo ngày thành công",
  "message_en": "Get revenue by day successful",
  "responseData": [
    { "date": "2026-05-12", "revenue": 65000000 },
    { "date": "2026-05-13", "revenue": 80000000 },
    { "date": "2026-05-14", "revenue": 120000000 },
    { "date": "2026-05-15", "revenue": 90000000 },
    { "date": "2026-05-16", "revenue": 110000000 },
    { "date": "2026-05-17", "revenue": 100000000 },
    { "date": "2026-05-18", "revenue": 135000000 }
  ],
  "status": "success",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**Giải thích:**

| Field | Kiểu | Ý nghĩa | Cách tính |
|---|---|---|---|
| `date` | `string` (YYYY-MM-DD) | Ngày | DATE(payment_time hoặc created_at nếu payment_time null) |
| `revenue` | `number` | Doanh thu ngày đó (VNĐ) | `SUM(appointment_booking_payments.amount)` WHERE `payment_status = 'PAID'` AND ngày trong `fromDate`–`toDate` |

---

## 3. Data source

```sql
SELECT
  DATE(COALESCE(pay.payment_time, pay.created_at)) AS date,
  COALESCE(SUM(pay.amount), 0) AS revenue
FROM appointment_booking_payments pay
JOIN appointment_bookings ab ON ab.id = pay.booking_id
WHERE pay.payment_status = 'PAID'
  AND COALESCE(pay.payment_time, pay.created_at) >= fromDate
  AND COALESCE(pay.payment_time, pay.created_at) <= toDate
  AND (facilityId IS NULL OR ab.facility_id = facilityId)
GROUP BY DATE(COALESCE(pay.payment_time, pay.created_at))
ORDER BY date ASC
```

**Lưu ý:**
- Chỉ tính payment có `payment_status = 'PAID'` (đã thanh toán thành công).
- Ngày được tính dựa trên `payment_time` (nếu có), nếu null thì dùng `created_at`.
- Nếu ngày nào không có payment PAID, **không xuất hiện** trong kết quả (khác với chart có thể muốn fill 0 cho ngày trống — nếu cần, phải xử lý ở frontend).
- Kết quả sắp xếp tăng dần theo date (12/05, 13/05, ..., 18/05).

---

## 4. Response — lỗi

**400 — `fromDate`/`toDate` không hợp lệ định dạng:**
```json
{
  "message": "Ngày không hợp lệ, định dạng YYYY-MM-DD",
  "message_en": "Ngày không hợp lệ, định dạng YYYY-MM-DD",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**400 — `fromDate > toDate`:**
```json
{
  "message": "fromDate không được lớn hơn toDate",
  "message_en": "fromDate không được lớn hơn toDate",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**400 — `facilityId` không phải UUID:**
```json
{
  "message": "facilityId không hợp lệ (phải là UUID)",
  "message_en": "facilityId không hợp lệ (phải là UUID)",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

**401 — thiếu/sai Bearer token** (middleware `verify` chặn):
```json
{
  "message": "Unauthorized",
  "message_en": "Unauthorized",
  "responseData": null,
  "status": "error",
  "timeStamp": "2026-05-18 10:00:00",
  "violations": null
}
```

---

## 5. Trường hợp đặc biệt

### 5.1. Không truyền `fromDate`

API **tự động** mặc định `fromDate = toDate - 7 ngày` (7 ngày gần đây).

```bash
# Tương đương với fromDate=2026-05-11&toDate=2026-05-18 (khi hôm nay là 18/05)
curl -s "$BASE/dashboard/revenue-by-day" \
  -H "Authorization: Bearer $TOKEN"
```

### 5.2. Ngày nào không có doanh thu

**Không** có record cho ngày đó trong response (không fill 0 tự động ở backend). Nếu frontend cần hiện full grid 7 ngày (kể cả ngày 0 doanh thu), frontend phải fill thêm.

**Ví dụ:** từ 12/05 đến 18/05, nhưng chỉ có 6 ngày có payment, thì response chỉ trả 6 object, không có object cho ngày không có payment.

### 5.3. Lọc theo facility

Nếu `facilityId` không có payment nào, response là `[]` (mảng rỗng, HTTP 200, không lỗi).

---

## 6. Checklist test

- [ ] **Mặc định 7 ngày**: gọi không truyền `fromDate` → kết quả từ 7 ngày trước hiện tại đến hôm nay.
- [ ] **Custom range**: truyền `fromDate=2026-05-01&toDate=2026-05-31` → kết quả đúng khoảng.
- [ ] **Validate date format**: truyền `fromDate=invalid` → 400.
- [ ] **Validate fromDate <= toDate**: `fromDate=2026-05-31&toDate=2026-05-01` → 400 "fromDate không được lớn hơn toDate".
- [ ] **Filter facility**: truyền `facilityId=...` → chỉ tính payment của booking thuộc facility đó; facility khác → 0 doanh thu cho ngày đó.
- [ ] **Validate facilityId UUID**: truyền không phải UUID → 400.
- [ ] **Sort tăng dần**: `date` trong response từ nhỏ đến lớn (12/05 trước, 18/05 sau).
- [ ] **Chỉ PAID**: tạo payment với `payment_status = PENDING` → không xuất hiện ở doanh thu.
- [ ] **Ngày không có payment**: không có object cho ngày đó (response không fill 0 tự động).
- [ ] **Auth**: không có token → 401; có token không hợp lệ → 401.
- [ ] **Số liệu**: so kết quả với `SELECT DATE(...), SUM(amount) ... WHERE status='PAID'` trong DB để verify.
