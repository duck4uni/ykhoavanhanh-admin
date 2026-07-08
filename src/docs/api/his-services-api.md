# HIS Services API — List (filter), Get by ID & Update

Tài liệu cho danh mục dịch vụ HIS (`his_services`), phản ánh code **hiện tại**:
`exam_area_id` (không còn `facility_id`), GET list có **filter + phân trang linh hoạt**, GET by id / PUT đọc-ghi **thẳng trên DB** theo `id` (UUID).

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/v1.0/his-services` | Không | Đồng bộ từ HIS về DB rồi trả danh sách (filter, sort, full/phân trang) |
| GET | `/api/v1.0/his-services/{id}` | Không | Chi tiết 1 dịch vụ theo `id` (UUID), đọc từ DB |
| PUT | `/api/v1.0/his-services/{id}` | Không | Cập nhật dịch vụ theo `id` (UUID), ghi thẳng DB |

- Controller: [`his-services/index.ts`](../src/controllers/api/v1.0/his-services/index.ts) (GET list), [`his-services/{id}.ts`](../src/controllers/api/v1.0/his-services/{id}.ts) (GET by id, PUT)
- Provider: [`HisServiceProvider`](../src/providers/hisServiceProvider.ts) → [`BaseProvider`](../src/providers/baseProvider.ts)
- Model: [`hisService`](../src/models/hisService.ts) — bảng `his_services`
- Middleware filter/phân trang: `middle` của `sequelize-api-paginate` (giống GET `/users`)

Response theo convention chung (`res.sendOk`/`res.sendError` → `apiResponseDTO`): payload nằm trong `responseData`, kèm `message`/`message_en`/`status`/`timeStamp`/`violations`.

---

## 1. Model — bảng `his_services`

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | tự sinh | PK |
| `exam_area_id` | `uuid` | Không (nullable) | FK → `exam_areas.id` (`ON DELETE SET NULL`) |
| `service_id` | `varchar(50)` | **Có** | Mã dịch vụ từ HIS |
| `service_name` | `varchar(255)` | **Có** | Tên dịch vụ |
| `price` | `decimal` | Không | Đơn giá |
| `raw_data` | `jsonb` | Không | Dữ liệu thô từ HIS / field mở rộng |
| `synced_at` | `timestamp` | Không | Mặc định `now()` |
| `specialty_id` | `uuid` | Không | FK → `specialties.id` (`ON DELETE SET NULL`) |
| `created_at` / `updated_at` | `timestamp` | tự sinh | |

> **Lưu ý dedup:** bảng hiện **không có** unique constraint `(exam_area_id, service_id)`. Việc chống trùng khi sync được xử lý ở tầng ứng dụng bằng `findOrCreate` (xem `HisServiceProvider.syncFromHis`), nên upsert không phụ thuộc constraint DB.

---

## 2. GET `/his-services` — Danh sách (sync HIS + filter + phân trang)

Không yêu cầu auth. Middleware: `middle` (parse `filters`/`sortField`/`sortOrder`/`currentPage`/`pageSize`).

**Luồng xử lý:**
1. Gọi HIS `GET /api/service/?ip=&idbv=` (truyền kèm toàn bộ query) để lấy danh mục dịch vụ.
2. `resolveExamAreaId(idbv)` — resolve khu vực khám: tìm `exam_areas.code == idbv`, không có thì fallback về exam_area đầu tiên `status = 'ACTIVE'`.
3. Upsert các dịch vụ vào DB (`syncFromHis`, `findOrCreate` theo `exam_area_id + service_id`).
4. Truy vấn lại **từ DB** theo `filters`/`sort`/phân trang rồi trả về.

### 2.1. Query params

| Tên | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `idbv` | `string` | Không | Mã cơ sở y tế, dùng để đồng bộ từ HIS & xác định khu vực khám |
| `currentPage` | `integer` | Không | Trang hiện tại. **Không truyền** → trả full data |
| `pageSize` | `integer` | Không | Số bản ghi/trang. **Không truyền** → trả full data |
| `filters` | `string` | Không | Bộ lọc (xem cú pháp mục 2.2) |
| `sortField` | `string` | Không | Trường sắp xếp; mặc định `service_name` |
| `sortOrder` | `string` | Không | `ASC`/`DESC`; mặc định `ASC` |

**Quy tắc full vs phân trang:**
- Không truyền `currentPage` **và** `pageSize` → trả **toàn bộ** bản ghi (`totalPages = 1`, `currentPage = 1`).
- Truyền `pageSize` (và/hoặc `currentPage`) → phân trang chuẩn (`limit`/`offset`), `totalPages = ceil(count / pageSize)`.

### 2.2. Cú pháp `filters`

Dạng `field<toán tử>value`, nhiều điều kiện ngăn nhau bằng dấu **phẩy** `,` (nối AND).

| Toán tử | Ý nghĩa | Ví dụ |
|---|---|---|
| `==` | Bằng | `service_id==070899` |
| `!=` | Khác | `service_name!=Test` |
| `@=` | Chứa (LIKE %value%) | `service_name@=Khám` |
| `_=` | Bắt đầu bằng | `service_name_=Khám` |
| `!@=` | Không chứa | `service_name!@=Test` |
| `!_=` | Không bắt đầu bằng | `service_name!_=Khám` |
| `>` `<` `>=` `<=` | So sánh | `price>=100000` |
| `[]` | Trong khoảng ngày (date between) | `created_at[](2026-01-01\|2026-12-31)` |

- Nhiều điều kiện: `service_name@=Khám,price>=100000` → tên chứa "Khám" **và** giá ≥ 100000.
- Lọc theo khu vực khám: `exam_area_id==<uuid>`.
- OR trong 1 điều kiện dùng `|` (ví dụ nhiều giá trị) — theo chuẩn `sequelize-api-paginate`.

### 2.3. Ví dụ request

```bash
# Full data, không phân trang, lọc tên chứa "Khám" và giá >= 100k
curl -s "http://localhost:3000/api/v1.0/his-services?idbv=VH01&filters=service_name@=Khám,price>=100000"

# Phân trang 20/trang, trang 2, sắp theo giá giảm dần
curl -s "http://localhost:3000/api/v1.0/his-services?idbv=VH01&currentPage=2&pageSize=20&sortField=price&sortOrder=DESC"
```

### 2.4. Response — thành công (200)

```json
{
  "message": "Lấy danh sách dịch vụ thành công",
  "message_en": "Get services successful",
  "responseData": {
    "count": 135,
    "rows": [
      {
        "id": "6dcffcd1-e463-4aea-8eb8-6cebf45815ad",
        "exam_area_id": "f3b65a52-8d71-4932-b156-d4ad814e04d5",
        "service_id": "070899",
        "service_name": "Khám Test",
        "price": 500000,
        "raw_data": { "servicetype": "Khám Test", "insurancetype": "BHYT/BHXH/BHT/DV" },
        "synced_at": "2026-07-07T09:50:00.000Z",
        "specialty_id": null,
        "created_at": "2026-07-07T09:50:00.000Z",
        "updated_at": "2026-07-07T09:50:00.000Z"
      }
    ],
    "totalPages": 1,
    "currentPage": 1
  },
  "status": "success",
  "timeStamp": "2026-07-07 09:50:02",
  "violations": null
}
```

### 2.5. Response — lỗi

- **500 — không xác định được khu vực khám**: không resolve được `exam_area_id` (không khớp `idbv`, và không có exam_area nào `status=ACTIVE`).
- **500 — HIS lỗi**: bước gọi HIS thất bại (timeout/HIS down) sẽ rơi vào catch chung.

---

## 3. GET `/his-services/{id}` — Chi tiết theo ID

Không yêu cầu auth. `id` = **UUID (PK)** trong DB — chính là `id` trong `rows` của API list.

> Endpoint này đọc **thẳng từ DB** theo `id`. (Trước đây từng gọi ra HIS theo mã dịch vụ — đã bỏ để nhất quán với PUT/DELETE, vì FE luôn thao tác trên `id` UUID.)

**Guard (`loadServiceOr404`):**
- `id` không đúng định dạng UUID → **404** (chặn trước, tránh Postgres ném `invalid input syntax for type uuid`).
- Không tìm thấy bản ghi → **404**.

### 3.1. Ví dụ request

```bash
curl -s "http://localhost:3000/api/v1.0/his-services/6dcffcd1-e463-4aea-8eb8-6cebf45815ad"
```

### 3.2. Response — thành công (200)

```json
{
  "message": "Lấy thông tin dịch vụ thành công",
  "message_en": "Get service successful",
  "responseData": {
    "id": "6dcffcd1-e463-4aea-8eb8-6cebf45815ad",
    "exam_area_id": "f3b65a52-8d71-4932-b156-d4ad814e04d5",
    "service_id": "070899",
    "service_name": "Khám Test",
    "price": 500000,
    "raw_data": { "servicetype": "Khám Test" },
    "synced_at": "2026-07-07T09:50:00.000Z",
    "specialty_id": null,
    "created_at": "2026-07-07T09:50:00.000Z",
    "updated_at": "2026-07-07T09:50:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-07 09:50:02",
  "violations": null
}
```

### 3.3. Response — lỗi (404)

```json
{
  "message": "Không tìm thấy dịch vụ",
  "message_en": "Service not found",
  "responseData": null,
  "status": "fail",
  "timeStamp": "2026-07-07 09:50:02",
  "violations": null
}
```

---

## 4. PUT `/his-services/{id}` — Cập nhật

Không yêu cầu auth. `id` = UUID (PK). Dùng chung guard `loadServiceOr404` (404 nếu id sai định dạng hoặc không tồn tại).

### 4.1. Request body

Các **cột thật** (ghi thẳng vào bảng) — `knownColumns`:

| Field | Kiểu | Ghi chú |
|---|---|---|
| `exam_area_id` | `uuid` | Đổi khu vực khám |
| `service_id` | `string` | Mã dịch vụ |
| `service_name` | `string` | Tên dịch vụ |
| `price` | `number` | Đơn giá |
| `specialty_id` | `uuid` | Chuyên khoa |
| `raw_data` | `object` | Ghi thẳng cột `raw_data` |

> **Field lạ (không phải cột thật)** như `service_type`, `description`… sẽ được **merge vào `raw_data`** (giữ key cũ, đè key trùng tên) thay vì bị Sequelize âm thầm bỏ. ⚠️ Nếu gửi `raw_data` **cùng lúc** với field lạ thì bản merge (`raw_data` cũ + field lạ) sẽ **đè** `raw_data` bạn gửi — nên chỉ gửi một trong hai kiểu.

### 4.2. Ví dụ request

```bash
curl -s -X PUT "http://localhost:3000/api/v1.0/his-services/6dcffcd1-e463-4aea-8eb8-6cebf45815ad" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "Khám Test (cập nhật)",
    "price": 550000,
    "exam_area_id": "f3b65a52-8d71-4932-b156-d4ad814e04d5",
    "service_type": "Khám bệnh",
    "description": "Ghi chú mở rộng"
  }'
```

### 4.3. Response — thành công (200)

```json
{
  "message": "Cập nhật dịch vụ thành công",
  "message_en": "Update service successful",
  "responseData": {
    "id": "6dcffcd1-e463-4aea-8eb8-6cebf45815ad",
    "exam_area_id": "f3b65a52-8d71-4932-b156-d4ad814e04d5",
    "service_id": "070899",
    "service_name": "Khám Test (cập nhật)",
    "price": 550000,
    "raw_data": {
      "servicetype": "Khám Test",
      "service_type": "Khám bệnh",
      "description": "Ghi chú mở rộng"
    },
    "synced_at": "2026-07-07T09:50:00.000Z",
    "specialty_id": null,
    "created_at": "2026-07-07T09:50:00.000Z",
    "updated_at": "2026-07-07T10:30:00.000Z"
  },
  "status": "success",
  "timeStamp": "2026-07-07 10:30:00",
  "violations": null
}
```

### 4.4. Response — lỗi (404)

Giống mục 3.3 (`id` sai định dạng UUID hoặc không tồn tại).

---

## 5. Checklist test

- [ ] **GET full**: không truyền `currentPage`/`pageSize` → `rows.length == count`, `totalPages = 1`.
- [ ] **GET phân trang**: `pageSize=5` → `rows.length ≤ 5`, `totalPages` đúng.
- [ ] **GET filter chứa**: `filters=service_name@=Khám` → chỉ trả dịch vụ có tên chứa "Khám".
- [ ] **GET filter bằng**: `filters=service_id==070899` → đúng bản ghi.
- [ ] **GET filter kết hợp**: `filters=service_name@=Khám,price>=100000` → thỏa cả 2 điều kiện (AND).
- [ ] **GET sort**: `sortField=price&sortOrder=DESC` → sắp đúng.
- [ ] **GET by id hợp lệ** → 200; **id không tồn tại** → 404; **id không phải UUID** (vd `070899`) → 404 (không phải 500).
- [ ] **PUT cột thật**: đổi `service_name`/`price`/`exam_area_id` → cập nhật đúng.
- [ ] **PUT field lạ**: gửi `service_type`/`description` → merge vào `raw_data`, không mất, key `raw_data` cũ vẫn giữ.
- [ ] **PUT 404**: `id` không tồn tại / sai định dạng UUID.
