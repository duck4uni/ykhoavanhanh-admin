# Doctors API - model mới, request và response

File này ghi lại các thay đổi hiện tại của module `src/controllers/api/v1.0/doctors/` sau khi model `hisDoctor` được cập nhật.

## Thay đổi chính

- Bảng/model `his_doctors` không còn dùng `facility_id`.
- Controller `POST /doctors` và `PUT /doctors/{id}` sẽ bỏ qua `facility_id` nếu client cũ vẫn gửi lên.
- `GET /doctors` và `GET /doctors/{id}` include thêm model `specialty` để map tên chuyên khoa từ `specialty_id`.
- `hisDoctorProvider.syncFromHis()` không dùng `bulkUpsert` theo unique key cũ nữa, mà match theo `doctor_id`, sau đó update các field mới.
- `GET /doctors/export` không resolve/gửi `facility_id` nữa và export thêm các cột mới của doctor.

## Model doctor hiện tại

```ts
type Doctor = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  description?: string;
  his_updated_at?: string;
  raw_data?: object;
  synced_at: string;
  created_at: string;
  updated_at: string;
  specialty_id?: string;
  avatar_url?: string;
  is_delete: boolean;
  academic_degree?: string;
  academic_title?: string;
  phone?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string; // YYYY-MM-DD
  booking_note?: string;
  booking_group?: string;
  status: string; // default ACTIVE
  display_group?: number;
  display_priority?: number;
};
```

Khi gọi `GET /doctors` hoặc `GET /doctors/{id}`, response có thêm object:

```ts
type DoctorSpecialty = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
};

type DoctorWithSpecialty = Doctor & {
  specialty: DoctorSpecialty | null;
};
```

## Response wrapper chung

Các endpoint dùng `res.sendOk()` sẽ được wrap dạng:

```json
{
  "message": "Lấy danh sách bác sĩ thành công",
  "message_en": "Get doctors successful",
  "responseData": {},
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

Các lỗi `sendError()` hoặc `sendErrorStatus()` có dạng:

```json
{
  "message": "Đã có lỗi xảy ra, vui lòng thử lại sau",
  "message_en": "There has been a problem with the system, please try again later",
  "responseData": null,
  "status": "fail",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": [
    {
      "message": "Doctor not found",
      "action": null
    }
  ]
}
```

## GET /v1.0/doctors

Lấy danh sách bác sĩ từ DB nội bộ, chỉ lấy bản ghi `is_delete = false`.

### Query request

```ts
type GetDoctorsQuery = {
  currentPage?: number;
  pageSize?: number;
  filters?: string;
  sortField?: keyof Doctor | "specialty_id";
  sortOrder?: "ASC" | "DESC";
  idbv?: string; // Không dùng nữa, giữ lại để không vỡ client cũ.
};
```

Ví dụ:

```http
GET /v1.0/doctors?currentPage=1&pageSize=10&sortField=doctor_name&sortOrder=ASC
```

Lọc ví dụ:

```http
GET /v1.0/doctors?filters=doctor_name@=Nguyễn,status==ACTIVE
```

Lưu ý:

- Không dùng `facility_id` để filter/sort nữa.
- Nếu client gửi `sortField=facility_id`, controller bỏ qua và sort mặc định theo `doctor_name ASC`.
- Nếu client gửi `filters` có `facility_id`, controller bỏ field này trước khi query.

### Response

```json
{
  "message": "Lấy danh sách bác sĩ thành công",
  "message_en": "Get doctors successful",
  "responseData": {
    "count": 1,
    "rows": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "doctor_id": "BS001",
        "doctor_name": "Nguyễn Văn A",
        "description": "Bác sĩ khoa Tim mạch",
        "his_updated_at": null,
        "raw_data": null,
        "synced_at": "2026-07-09T02:30:00.000Z",
        "created_at": "2026-07-09T02:30:00.000Z",
        "updated_at": "2026-07-09T02:30:00.000Z",
        "specialty_id": "22222222-2222-2222-2222-222222222222",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_delete": false,
        "academic_degree": "Thạc sĩ",
        "academic_title": "Bác sĩ Chuyên khoa II",
        "phone": "0909000000",
        "email": "doctor@example.com",
        "gender": "MALE",
        "date_of_birth": "1980-01-01",
        "booking_note": "Chỉ nhận lịch buổi sáng",
        "booking_group": "GENERAL",
        "status": "ACTIVE",
        "display_group": 1,
        "display_priority": 10,
        "specialty": {
          "id": "22222222-2222-2222-2222-222222222222",
          "name": "Tim mạch",
          "description": "Chuyên khoa Tim mạch",
          "is_active": true
        }
      }
    ],
    "totalPages": 1,
    "currentPage": 1
  },
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

## GET /v1.0/doctors/{id}

Lấy chi tiết bác sĩ theo UUID trong DB, không phải mã HIS `doctor_id`.

### Path request

```ts
type GetDoctorByIdParams = {
  id: string; // UUID row his_doctors.id
};
```

Ví dụ:

```http
GET /v1.0/doctors/11111111-1111-1111-1111-111111111111
```

### Response 200

`responseData` là một `DoctorWithSpecialty`.

```json
{
  "message": "Lấy thông tin bác sĩ thành công",
  "message_en": "Get doctor successful",
  "responseData": {
    "id": "11111111-1111-1111-1111-111111111111",
    "doctor_id": "BS001",
    "doctor_name": "Nguyễn Văn A",
    "specialty_id": "22222222-2222-2222-2222-222222222222",
    "status": "ACTIVE",
    "is_delete": false,
    "specialty": {
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "Tim mạch",
      "description": "Chuyên khoa Tim mạch",
      "is_active": true
    }
  },
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

### Response 404

```json
{
  "message": "Không tìm thấy bác sĩ",
  "message_en": "Doctor not found",
  "responseData": null,
  "status": "fail",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": [
    {
      "message": "Doctor not found",
      "action": null
    }
  ]
}
```

## POST /v1.0/doctors

Tạo bác sĩ mới trong DB nội bộ.

### Body request

```ts
type CreateDoctorBody = {
  doctor_id: string;
  doctor_name: string;
  description?: string;
  specialty_id?: string;
  avatar_url?: string;
  his_updated_at?: string;
  academic_degree?: string;
  academic_title?: string;
  phone?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string; // YYYY-MM-DD
  booking_note?: string;
  booking_group?: string;
  status?: string; // default ACTIVE
  display_group?: number;
  display_priority?: number;
};
```

Không gửi `facility_id`. Nếu gửi nhầm, controller sẽ bỏ qua.

Ví dụ:

```json
{
  "doctor_id": "BS001",
  "doctor_name": "Nguyễn Văn A",
  "description": "Bác sĩ khoa Tim mạch",
  "specialty_id": "22222222-2222-2222-2222-222222222222",
  "avatar_url": "https://example.com/avatar.jpg",
  "academic_degree": "Thạc sĩ",
  "academic_title": "Bác sĩ Chuyên khoa II",
  "phone": "0909000000",
  "email": "doctor@example.com",
  "gender": "MALE",
  "date_of_birth": "1980-01-01",
  "booking_note": "Chỉ nhận lịch buổi sáng",
  "booking_group": "GENERAL",
  "status": "ACTIVE",
  "display_group": 1,
  "display_priority": 10
}
```

### Response

```json
{
  "message": "Tạo bác sĩ thành công",
  "message_en": "Create doctor successful",
  "responseData": {
    "id": "11111111-1111-1111-1111-111111111111",
    "doctor_id": "BS001",
    "doctor_name": "Nguyễn Văn A",
    "status": "ACTIVE",
    "is_delete": false
  },
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

## PUT /v1.0/doctors/{id}

Cập nhật bác sĩ theo UUID trong DB.

### Body request

Tất cả field đều optional. Dùng cùng shape với `CreateDoctorBody`.

```ts
type UpdateDoctorBody = Partial<CreateDoctorBody>;
```

Ví dụ:

```json
{
  "doctor_name": "Nguyễn Văn A Updated",
  "specialty_id": "22222222-2222-2222-2222-222222222222",
  "booking_note": "Ưu tiên lịch đặt khám online",
  "display_priority": 20
}
```

Không gửi `facility_id`. Nếu gửi nhầm, controller sẽ bỏ qua.

### Response

```json
{
  "message": "Cập nhật bác sĩ thành công",
  "message_en": "Update doctor successful",
  "responseData": {
    "id": "11111111-1111-1111-1111-111111111111",
    "doctor_id": "BS001",
    "doctor_name": "Nguyễn Văn A Updated",
    "booking_note": "Ưu tiên lịch đặt khám online",
    "display_priority": 20,
    "status": "ACTIVE"
  },
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

## DELETE /v1.0/doctors/{id}

Xóa mềm bác sĩ bằng cách set `is_delete = true`.

### Request

```http
DELETE /v1.0/doctors/11111111-1111-1111-1111-111111111111
```

### Response

```json
{
  "message": "Xóa bác sĩ thành công",
  "message_en": "Delete doctor successful",
  "responseData": null,
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

## GET /v1.0/doctors/export

Gọi HIS `/api/doctor/?ip=&idbv=` theo query hiện tại, sync dữ liệu về DB bằng `hisDoctorProvider.syncFromHis()`, rồi trả file Excel.

### Query request

```ts
type ExportDoctorsQuery = {
  idbv?: string;
  ip?: string;
  [key: string]: string | undefined;
};
```

Lưu ý: `facility_id` đã bỏ khỏi `his_doctors`, endpoint export không resolve `facilityId` nữa.

### Response

Binary Excel:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="bac-si-<timestamp>.xlsx"
```

Các cột export hiện tại:

- Mã bác sĩ
- Tên bác sĩ
- Mô tả
- Chuyên khoa ID
- Học hàm
- Học vị
- Điện thoại
- Email
- Giới tính
- Ngày sinh
- Ghi chú đặt khám
- Nhóm đặt khám
- Trạng thái
- Nhóm hiển thị
- Ưu tiên hiển thị

## POST /v1.0/doctors/import

Import Excel hiện tại vẫn là luồng cũ: đọc file Excel rồi gọi external HIS API `/api/doctor/` cho từng dòng. Endpoint này chưa ghi trực tiếp vào DB nội bộ.

### Request

`multipart/form-data`

```ts
type ImportDoctorsFormData = {
  file: File; // .xlsx hoặc .xls
};
```

File hiện tại đọc 3 cột:

```ts
type ImportRow = {
  doctor_id: string;
  doctor_name: string;
  description?: string;
};
```

### Response

```json
{
  "message": "Import hoàn tất: 1 thành công, 0 lỗi",
  "message_en": "Import done: 1 success, 0 error",
  "responseData": {
    "total": 1,
    "success": 1,
    "error": 0,
    "results": [
      {
        "row": 2,
        "doctor_id": "BS001",
        "doctor_name": "Nguyễn Văn A",
        "status": "success"
      }
    ]
  },
  "status": "success",
  "timeStamp": "2026-07-09 09:30:00",
  "violations": null
}
```

## GET /v1.0/doctors/template

Trả file Excel mẫu cho import. Template hiện tại vẫn theo luồng import cũ, gồm 3 cột:

- Mã bác sĩ (*)
- Tên bác sĩ (*)
- Mô tả

Response là binary Excel:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="mau-nhap-bac-si.xlsx"
```

## Ghi chú cho frontend

- Dùng `specialty.name` để hiển thị tên chuyên khoa ở list/detail.
- Không dùng `facility_id` trong doctor nữa.
- Nếu cần lọc theo trạng thái, dùng `filters=status==ACTIVE`.
- Nếu cần sort nhóm hiển thị, dùng `sortField=display_group` hoặc `sortField=display_priority`.
- `date_of_birth` gửi theo `YYYY-MM-DD`.
- `POST` và `PUT` hiện không whitelist chặt body, nhưng frontend nên chỉ gửi các field trong `CreateDoctorBody`/`UpdateDoctorBody`.
