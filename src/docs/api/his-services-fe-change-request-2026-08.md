# Đề nghị BE cập nhật API — Dịch vụ khám (`his-services`) & Bác sĩ (`doctors`)

Ghi lại các thay đổi FE đã làm trong đợt sửa màn **Dịch vụ khám** / **Thêm lịch khám mới**,
để BE đối chiếu và cập nhật API cho khớp. Không có migration DB bắt buộc — tất cả field mới
đều đi qua cột `raw_data` (jsonb) sẵn có — nhưng có **1 bug cần BE xác nhận/sửa** (mục 3).

Phạm vi: `POST/PUT /his-services`, `GET /his-services`, `GET /doctors`.

---

## 1. Khu vực khám / chuyên khoa trên dịch vụ khám → không còn bắt buộc

**Trước:** FE bắt buộc chọn `exam_area_id` khi tạo dịch vụ (validate phía client), coi như
1 dịch vụ chỉ thuộc 1 khu vực + 1 chuyên khoa.

**Sau:** `exam_area_id` và `specialty_id` là tùy chọn. Để trống nghĩa là dịch vụ (kèm bảng
giá) dùng chung được cho mọi chuyên khoa / phòng khám / khu khám. Khi sửa dịch vụ mà xóa
trắng lựa chọn, FE gửi `null` (không phải bỏ field) để gỡ ràng buộc cũ:

```json
// PUT /his-services/{id}
{
  "exam_area_id": null,
  "specialty_id": null
}
```

**Cần BE xác nhận:** cả 2 cột đã là nullable FK với `ON DELETE SET NULL` theo tài liệu cũ
([his-services-api.md](his-services-api.md#L26)), nên nhận `null` qua `PUT` phải set được
cột về `NULL` bình thường qua `BaseProvider.put()`. Không cần đổi schema — chỉ cần đảm bảo
handler không lọc bỏ field có giá trị `null` trước khi update (một số handler khác trong
codebase có thói quen `field ?? existingValue`, cần kiểm tra riêng cho 2 cột này).

---

## 2. Nhiều mức giá theo loại bảo hiểm cho cùng 1 mã dịch vụ (`price_levels`)

**Bài toán:** 1 mã dịch vụ (`service_id`) cần nhiều mức giá khác nhau theo loại bảo hiểm,
ví dụ ID `16852`: Khám thường/DV 230.000đ, Khám BHYT 185.000đ, Khám VIP... (tạm xếp vào DV
vì danh sách loại hiện chỉ có 4 lựa chọn — xem mục 2.4). Bảng `his_services` chỉ có 1 cột
`price` nên **không đổi schema**, thay vào đó FE lưu toàn bộ danh sách mức giá vào
`raw_data.price_levels` (mảng), cột `price` giữ **mức giá mặc định** để các API/màn hình
cũ (tạo lịch khám, đặt khám, danh sách dịch vụ) không cần sửa gì vẫn đọc đúng.

### 2.1. Cấu trúc `price_levels`

```ts
type PriceLevel = {
  code: string;              // "BHYT" | "BHXH" | "BHT" | "DV" — mã loại bảo hiểm
  label: string;              // Nhãn hiển thị, vd "BHYT", "Dịch vụ (DV)"
  price: number;
  is_default: boolean;        // true cho đúng 1 phần tử — mức ghi vào cột `price`
  status: "ACTIVE" | "INACTIVE"; // Tạm ngưng vẫn lưu giá, không tính vào insurancetype
};
```

Ví dụ `raw_data`:

```json
{
  "raw_data": {
    "price_levels": [
      { "code": "DV",   "label": "Dịch vụ (DV)", "price": 230000, "is_default": true,  "status": "ACTIVE" },
      { "code": "BHYT", "label": "BHYT",          "price": 185000, "is_default": false, "status": "ACTIVE" },
      { "code": "BHXH", "label": "BHXH",          "price": 200000, "is_default": false, "status": "INACTIVE" }
    ]
  }
}
```

Mỗi loại bảo hiểm (BHYT/BHXH/BHT/DV) chỉ khai **tối đa 1 mức giá** — FE chặn trùng ở UI.
`is_default` luôn là mức **ACTIVE đầu tiên** trong danh sách người dùng nhập (không có UI
chọn thủ công); nếu tất cả đều `INACTIVE` thì lấy phần tử đầu tiên.

### 2.2. `POST /his-services` — request thay đổi

Field lạ ở top-level **không** được BE merge vào `raw_data` (đúng theo tài liệu hiện tại),
nên FE gửi `price_levels` lồng trong `raw_data`:

```json
{
  "service_id": "16852",
  "service_name": "Khám Nội tổng quát",
  "price": 230000,
  "exam_area_id": null,
  "specialty_id": null,
  "raw_data": {
    "servicetype": "KHÁM",
    "insurancetype": "DV/BHYT",
    "price_levels": [ /* như trên */ ]
  }
}
```

→ **Không cần BE đổi gì** ở nhánh POST, jsonb tự nhận field mới. Chỉ cần xác nhận
`raw_data` được lưu nguyên vẹn (không strip key lạ).

### 2.3. `PUT /his-services/{id}` — request thay đổi

Theo tài liệu hiện tại, field lạ ở top-level **được** BE tự động merge vào `raw_data` (giữ
key cũ, đè key trùng tên) — xem
[his-services-create-update-api.md:114](his-services-create-update-api.md#L114). FE tận
dụng đúng cơ chế này, gửi `price_levels` **ở top-level** (không lồng trong `raw_data`):

```json
{
  "service_name": "Khám Nội tổng quát",
  "price": 230000,
  "price_levels": [ /* như trên, mảng đầy đủ — override toàn bộ key raw_data.price_levels cũ */ ],
  "exam_area_id": null,
  "specialty_id": null,
  "servicetype": "KHÁM",
  "insurancetype": "DV/BHYT",
  "description": "..."
}
```

**Cần BE xác nhận:** cơ chế merge hiện tại là merge theo **key ở object cấp 1** của
`raw_data` (đè nguyên giá trị ứng với key trùng tên), không deep-merge phần tử bên trong
mảng. Vì FE luôn gửi **toàn bộ mảng `price_levels`** mỗi lần lưu (không gửi mảng rời rạc
từng phần tử), hành vi "đè nguyên key" là đúng ý muốn — chỉ cần xác nhận BE không cố
deep-merge 2 mảng cũ/mới lại với nhau (sẽ làm trùng lặp phần tử).

### 2.4. Response — cần BE trả lại `price_levels` khi GET

`GET /his-services` và `GET /his-services/{id}` cần tiếp tục trả `raw_data.price_levels`
y nguyên (không cần xử lý gì thêm nếu response hiện tại đã trả full `raw_data`). FE tự
parse ở [`hisServicesApi.ts`](../../src/api/hisServicesApi.ts) hàm `parsePriceLevels()`:
bỏ qua phần tử thiếu `label`/`price` không hợp lệ, mặc định `status` = `ACTIVE` nếu thiếu
(tương thích dữ liệu cũ).

### 2.5. Danh sách loại bảo hiểm hiện đang cố định 4 giá trị

FE hiện chỉ cho chọn `BHYT`, `BHXH`, `BHT`, `DV` (dropdown, không tự nhập). Nếu nghiệp vụ
cần thêm mức khác không phải loại bảo hiểm (vd "Khám VIP", "Khám theo yêu cầu") thì cần bàn
thêm hướng mở rộng — hiện tại các mức đó phải tạm xếp vào `DV`. Nêu ở đây để BE biết giới
hạn hiện tại, không phải việc cần BE sửa ngay.

### 2.6. Gợi ý dài hạn (không cấp thiết)

Nếu về sau cần lọc/báo cáo theo mức giá (vd "tất cả dịch vụ có giá BHYT ≥ X"), lưu trong
jsonb sẽ khó filter ở DB. Khi đó có thể cân nhắc bảng con `his_service_price_levels` quan
hệ 1-n với `his_services`. Chưa cần thiết ở giai đoạn này.

---

## 3. 🐛 Bug cần BE kiểm tra: OR filter 2 field khác nhau không trả kết quả

Tài liệu [api-full-reference.md:13](api-full-reference.md#L13) ghi middleware pattern B
(`sequelize-api-paginate`, dùng ở `his-services`) hỗ trợ cú pháp OR khác field:

```
filters=field==value|field2==value2
```

FE đã thử áp dụng cho tìm kiếm dịch vụ khám (tìm theo **tên hoặc mã dịch vụ** cùng lúc):

```
GET /his-services?filters=service_name@=<kw>|service_id@=<kw>
```

**Kết quả thực tế: không trả về bản ghi nào**, dù `<kw>` khớp cả tên lẫn mã của các dịch vụ
đang có trong DB. Ví dụ cụ thể: filter `service_name@=12648|service_id@=12648` trong khi
DB có dịch vụ `service_id = "12648"` — response `rows: []`.

**FE đã tạm workaround** (không chờ BE fix): đoán field dựa vào định dạng từ khóa — toàn
chữ số thì lọc theo `service_id@=`, còn lại lọc theo `service_name@=` (chỉ gửi 1 field mỗi
lần, không dùng `|`). Xem
[useExamServiceList.ts:44-51](../../src/app/(dashboard)/exam-services/hooks/useExamServiceList.ts#L44).
Áp dụng heuristic tương tự cho tìm bác sĩ theo tên/mã ở màn tạo lịch khám
([useNewScheduleForm.ts:176-192](../../src/app/(dashboard)/appointments/new/hooks/useNewScheduleForm.ts#L176)),
dùng `doctor_id@=`/`doctor_name@=`.

**Đề nghị BE:**
1. Kiểm tra vì sao `filters` dạng `field==value|field2==value2` không hoạt động trên
   endpoint `/his-services` (và có thể ảnh hưởng `/doctors` — FE chưa thử OR ở đây, đã
   dùng luôn workaround). Có thể do parser chỉ hỗ trợ `|` để OR **nhiều giá trị của cùng 1
   field** (`status==ACTIVE|INACTIVE`) chứ không phải OR giữa 2 field khác nhau như tài
   liệu mô tả — nếu vậy cần sửa lại tài liệu cho đúng thực tế thay vì sửa code.
2. Nếu sửa được OR khác field, FE sẽ bỏ heuristic đoán field (đơn giản và đúng hơn, vì mã
   bác sĩ đôi khi không toàn số, vd `BS01`).
3. Phương án thay thế nếu OR khó sửa: thêm 1 param tìm kiếm nhanh kiểu `q=<keyword>` ở BE,
   tự OR nội bộ trên các field liên quan (tên + mã) cho từng resource cần tìm kiếm kép
   (`his-services`, `doctors`), FE gọi `?q=<keyword>` thay vì tự suy đoán field.

---

## Tóm tắt việc BE cần làm

| # | Việc | Bắt buộc? |
|---|---|---|
| 1 | Xác nhận `PUT /his-services/{id}` nhận `exam_area_id: null` / `specialty_id: null` và set cột về NULL đúng cách | Nên xác nhận |
| 2 | Xác nhận `raw_data` (POST) và merge `raw_data` theo key (PUT) giữ nguyên `price_levels` không bị strip/deep-merge sai | Nên xác nhận |
| 3 | Sửa (hoặc đính chính tài liệu) hành vi OR `field==value\|field2==value2` trên `/his-services` — hiện không trả kết quả | Cần xác nhận, có workaround tạm |
| 4 | (Tùy chọn, dài hạn) Cân nhắc endpoint `q=` tìm kiếm nhanh đa field, hoặc bảng quan hệ riêng cho `price_levels` nếu cần lọc/báo cáo theo giá | Không cấp thiết |
