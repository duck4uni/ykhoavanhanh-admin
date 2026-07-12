# Yêu cầu chỉnh sửa giao diện: Thêm lịch khám mới

## 1. Mục tiêu

Cập nhật màn hình **Thêm lịch khám mới** để đáp ứng nghiệp vụ:

- Một bác sĩ có thể phụ trách **nhiều chuyên khoa**.
- Một bác sĩ có thể khám **nhiều dịch vụ khám**.
- Một bác sĩ có thể làm việc tại **nhiều khu vực/phòng khám**.
- Mỗi lịch khám có thể cấu hình **nhiều phạm vi khám**.
- Mỗi lịch khám có thể cấu hình **nhiều khung giờ**, mỗi khung giờ có **slot riêng**.
- Khung giờ có thể áp dụng cho **toàn bộ phạm vi khám** hoặc **một số phạm vi cụ thể**.

Màn hình cần rõ ràng, dễ thao tác, tránh nhập sai dữ liệu và phù hợp với hệ thống quản trị bệnh viện.

---

## 2. Vấn đề giao diện hiện tại

Màn hình hiện tại đang theo logic đơn giản:

- Chọn 1 bác sĩ.
- Chọn 1 khu khám.
- Chọn 1 ca khám.
- Nhập danh sách khung giờ.

Cách này chưa đủ cho nghiệp vụ thực tế vì một bác sĩ có thể khám nhiều chuyên khoa, nhiều dịch vụ và nhiều khu vực/phòng khác nhau trong cùng một ngày hoặc cùng một lịch làm việc.

Ví dụ:

| Bác sĩ | Chuyên khoa | Khu vực/phòng | Dịch vụ khám |
|---|---|---|---|
| BS. Nguyễn Thị Thúy Kiều | Nhi khoa | Khu khám chuyên sâu | Khám tổng quát |
| BS. Nguyễn Thị Thúy Kiều | Tai Mũi Họng | Phòng 303 | Nội soi tai mũi họng |
| BS. Nguyễn Thị Thúy Kiều | Tim mạch | Khu khám chuyên sâu | Khám tim mạch |

Nếu chỉ dùng multi-select riêng lẻ cho chuyên khoa, khu vực và dịch vụ thì dữ liệu sẽ dễ bị mơ hồ, không biết dịch vụ nào thuộc chuyên khoa nào và được khám ở khu vực/phòng nào.

---

## 3. Nguyên tắc thiết kế mới

Nên chia màn hình thành 3 khối chính:

1. **Thông tin lịch khám**  
   Chứa thông tin chung của lịch.

2. **Phạm vi khám áp dụng**  
   Chứa danh sách tổ hợp chuyên khoa - khu vực/phòng - dịch vụ khám.

3. **Khung giờ làm việc**  
   Chứa danh sách khung giờ, số slot và phạm vi áp dụng.

Bên phải giữ card **Tóm tắt lịch khám** để admin kiểm tra trước khi tạo.

---

## 4. Layout đề xuất

```text
Thêm lịch khám mới
Tạo lịch làm việc và cấu hình phạm vi khám cho bác sĩ.

[Quay lại]

┌───────────────────────────────────────────────┐   ┌───────────────────────┐
│ 1. Thông tin lịch khám                         │   │ Tóm tắt lịch khám       │
│ Bác sĩ | Ngày khám | Trạng thái                │   │ Bác sĩ                  │
│ Thông tin năng lực bác sĩ                      │   │ Ngày khám               │
│ Ghi chú                                        │   │ Phạm vi áp dụng          │
└───────────────────────────────────────────────┘   │ Khung giờ               │
                                                    │ Tổng slot               │
┌───────────────────────────────────────────────┐   │ Cảnh báo cấu hình       │
│ 2. Phạm vi khám áp dụng                        │   │                         │
│ [+ Thêm phạm vi khám]                          │   │ [Hủy] [Tạo lịch khám]   │
│ Bảng phạm vi khám                              │   └───────────────────────┘
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ 3. Khung giờ làm việc                          │
│ [Tự sinh khung giờ] [+ Thêm khung giờ]         │
│ Bảng khung giờ                                 │
└───────────────────────────────────────────────┘
```

---

## 5. Khối 1: Thông tin lịch khám

### 5.1. Trường dữ liệu

| Field | Loại input | Bắt buộc | Ghi chú |
|---|---|---:|---|
| Bác sĩ | Select | Có | Chọn 1 bác sĩ |
| Ngày khám | Date picker | Có | Không nhỏ hơn ngày hiện tại nếu không cho tạo lịch quá khứ |
| Trạng thái | Select | Có | Hoạt động / Tạm ngưng |
| Ghi chú | Text input | Không | Ghi chú chung cho lịch |

### 5.2. Sau khi chọn bác sĩ

Hiển thị thông tin nhanh của bác sĩ ngay dưới dropdown:

```text
BS. Nguyễn Thị Thúy Kiều
3 chuyên khoa | 6 dịch vụ | 2 khu vực khám
```

Có thể hiển thị dạng mini card:

| Thông tin | Hiển thị |
|---|---|
| Chuyên khoa | 3 |
| Dịch vụ | 6 |
| Khu vực/phòng | 2 |

### 5.3. Quy tắc

- Chưa chọn bác sĩ thì không cho thêm phạm vi khám.
- Sau khi chọn bác sĩ, danh sách chuyên khoa/dịch vụ/khu vực chỉ lấy theo cấu hình của bác sĩ đó.
- Nếu bác sĩ chưa có chuyên khoa/dịch vụ/khu vực thì hiển thị cảnh báo:

```text
Bác sĩ chưa được cấu hình chuyên khoa, dịch vụ hoặc khu vực khám. Vui lòng cập nhật hồ sơ bác sĩ trước khi tạo lịch.
```

---

## 6. Khối 2: Phạm vi khám áp dụng

### 6.1. Mục tiêu

Khối này dùng để xác định bác sĩ sẽ khám những tổ hợp nào trong lịch này.

Mỗi dòng là một tổ hợp:

```text
Chuyên khoa + Khu vực/phòng + Dịch vụ khám + Phí khám + Trạng thái
```

### 6.2. Bảng đề xuất

| Cột | Mô tả |
|---|---|
| Chuyên khoa | Chuyên khoa bác sĩ phụ trách |
| Khu vực/phòng | Khu vực hoặc phòng bác sĩ làm việc |
| Dịch vụ khám | Dịch vụ bác sĩ thực hiện |
| Phí khám | Giá áp dụng cho dịch vụ trong lịch này |
| Trạng thái | Hoạt động / Tạm tắt |
| Thao tác | Sửa / Xóa |

Ví dụ:

| Chuyên khoa | Khu vực/phòng | Dịch vụ khám | Phí khám | Trạng thái |
|---|---|---|---:|---|
| Nhi khoa | Khu khám chuyên sâu | Khám tổng quát | 150.000đ | Hoạt động |
| Tai Mũi Họng | Phòng 303 | Nội soi tai mũi họng | 200.000đ | Hoạt động |
| Tim mạch | Khu khám chuyên sâu | Khám tim mạch | 250.000đ | Hoạt động |

### 6.3. Nút thêm phạm vi khám

Nút:

```text
+ Thêm phạm vi khám
```

Khi bấm, có thể mở modal hoặc thêm dòng inline.

Form thêm phạm vi gồm:

| Field | Loại input | Bắt buộc | Ghi chú |
|---|---|---:|---|
| Chuyên khoa | Select | Có | Lọc theo bác sĩ đã chọn |
| Khu vực/phòng | Select | Có | Lọc theo bác sĩ hoặc cấu hình hệ thống |
| Dịch vụ khám | Select | Có | Lọc theo chuyên khoa và bác sĩ |
| Phí khám | Number input | Có | Không âm |
| Trạng thái | Select | Có | Mặc định Hoạt động |
| Ghi chú | Text input | Không | Ghi chú riêng cho phạm vi |

### 6.4. Quy tắc nghiệp vụ

- Không cho thêm 2 dòng phạm vi trùng hoàn toàn cùng lúc:

```text
Chuyên khoa + Khu vực/phòng + Dịch vụ khám
```

- Dịch vụ phải thuộc chuyên khoa đã chọn.
- Dịch vụ phải nằm trong danh sách bác sĩ được phép khám.
- Khu vực/phòng phải nằm trong danh sách bác sĩ được phép làm việc hoặc được cấu hình cho lịch.
- Phí khám phải lớn hơn hoặc bằng 0.
- Nếu phí khám bằng 0 thì nên cảnh báo nhẹ:

```text
Dịch vụ đang có phí khám bằng 0đ. Vui lòng kiểm tra lại trước khi tạo lịch.
```

---

## 7. Khối 3: Khung giờ làm việc

### 7.1. Mục tiêu

Cấu hình các khung giờ khám trong ngày. Mỗi khung giờ có số slot riêng.

Ví dụ:

| Bắt đầu | Kết thúc | Slot khám | Áp dụng cho |
|---|---|---:|---|
| 08:00 | 08:30 | 20 | Tất cả phạm vi |
| 08:30 | 09:00 | 20 | Tất cả phạm vi |
| 09:00 | 09:30 | 20 | Nhi khoa - Khám tổng quát |
| 09:30 | 10:00 | 20 | Tai Mũi Họng - Nội soi |

### 7.2. Bảng khung giờ

| Cột | Mô tả |
|---|---|
| Bắt đầu | Giờ bắt đầu khung |
| Kết thúc | Giờ kết thúc khung |
| Slot khám | Số lượt đặt khám cho khung giờ |
| Áp dụng cho | Tất cả phạm vi hoặc chọn phạm vi cụ thể |
| Thao tác | Xóa |

### 7.3. Nút tự sinh khung giờ

Nút:

```text
Tự sinh khung giờ
```

Khi bấm, mở modal với các trường:

| Field | Loại input | Ví dụ |
|---|---|---|
| Thời gian bắt đầu | Time picker | 08:00 |
| Thời gian kết thúc | Time picker | 12:00 |
| Mỗi khung | Select/Number | 30 phút |
| Slot mỗi khung | Number | 20 |
| Áp dụng cho | Select | Tất cả phạm vi / Chọn phạm vi |

Sau khi tạo, hệ thống sinh danh sách:

```text
08:00 - 08:30 | 20 slot
08:30 - 09:00 | 20 slot
09:00 - 09:30 | 20 slot
09:30 - 10:00 | 20 slot
10:00 - 10:30 | 20 slot
10:30 - 11:00 | 20 slot
11:00 - 11:30 | 20 slot
11:30 - 12:00 | 20 slot
```

### 7.4. Quy tắc validation khung giờ

- Giờ bắt đầu phải nhỏ hơn giờ kết thúc.
- Không cho khung giờ trùng hoặc chồng lấn nhau nếu cùng phạm vi áp dụng.
- Slot phải là số nguyên dương.
- Slot không được bằng 0.
- Nếu tổng slot quá lớn, hiển thị cảnh báo:

```text
Tổng số slot đang cao hơn mức thông thường. Vui lòng kiểm tra lại cấu hình.
```

- Nếu chọn áp dụng cho phạm vi cụ thể, bắt buộc đã có ít nhất 1 phạm vi khám.

---

## 8. Card bên phải: Tóm tắt lịch khám

### 8.1. Nội dung hiển thị

```text
Tóm tắt lịch khám

Bác sĩ: Nguyễn Thị Thúy Kiều
Ngày khám: 03/07/2026
Phạm vi áp dụng: 3
Khung giờ: 4
Tổng slot: 80
Dự kiến hiển thị: Có
```

### 8.2. Cảnh báo cấu hình

Card nên hiển thị cảnh báo nếu còn thiếu dữ liệu:

```text
Cảnh báo:
- Chưa chọn bác sĩ
- Chưa có phạm vi khám
- Chưa có khung giờ làm việc
- Có dịch vụ chưa cấu hình phí khám
- Có khung giờ chưa chọn phạm vi áp dụng
```

### 8.3. Nút hành động

| Nút | Kiểu | Ghi chú |
|---|---|---|
| Hủy | Secondary | Quay lại danh sách hoặc hủy thao tác |
| Tạo lịch khám | Primary | Chỉ enable khi dữ liệu hợp lệ |

---

## 9. Payload API đề xuất

### 9.1. Tạo lịch khám

```json
{
  "doctor_id": "doctor_001",
  "date": "2026-07-03",
  "status": "active",
  "note": "Ca sáng thứ Tư",
  "scopes": [
    {
      "specialty_id": "specialty_pediatrics",
      "area_id": "area_specialized",
      "room_id": "room_201",
      "service_id": "service_general_checkup",
      "fee": 150000,
      "status": "active",
      "note": ""
    },
    {
      "specialty_id": "specialty_ent",
      "area_id": "area_specialized",
      "room_id": "room_303",
      "service_id": "service_ent_endoscopy",
      "fee": 200000,
      "status": "active",
      "note": ""
    }
  ],
  "time_slots": [
    {
      "start_time": "08:00",
      "end_time": "08:30",
      "slot_limit": 20,
      "scope_ids": "all"
    },
    {
      "start_time": "08:30",
      "end_time": "09:00",
      "slot_limit": 20,
      "scope_ids": "all"
    },
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "slot_limit": 20,
      "scope_ids": ["scope_001"]
    }
  ]
}
```

### 9.2. Ghi chú mapping

- `scopes` là danh sách phạm vi khám áp dụng.
- `time_slots` là danh sách khung giờ.
- `scope_ids: "all"` nghĩa là khung giờ áp dụng cho toàn bộ phạm vi khám.
- Nếu khung giờ chỉ áp dụng cho một số phạm vi, dùng danh sách ID phạm vi.

---

## 10. UI copy đề xuất

### Tiêu đề trang

```text
Thêm lịch khám mới
Tạo lịch làm việc và cấu hình phạm vi khám cho bác sĩ.
```

### Khối thông tin lịch khám

```text
Thông tin lịch khám
Chọn bác sĩ, ngày khám và trạng thái hiển thị lịch.
```

### Khối phạm vi khám

```text
Phạm vi khám áp dụng
Cấu hình chuyên khoa, khu vực/phòng và dịch vụ mà bác sĩ thực hiện trong lịch này.
```

### Khối khung giờ

```text
Khung giờ làm việc
Mỗi khung giờ có số slot riêng và có thể áp dụng cho toàn bộ hoặc một số phạm vi khám.
```

### Tóm tắt

```text
Tóm tắt lịch khám
Vui lòng kiểm tra lại thông tin trước khi tạo lịch.
```

---

## 11. Checklist sửa UI

### Layout

- [ ] Tách màn hình thành 3 khối: Thông tin lịch khám, Phạm vi khám áp dụng, Khung giờ làm việc.
- [ ] Giữ card tóm tắt bên phải.
- [ ] Thêm trạng thái cảnh báo cấu hình trong card tóm tắt.

### Thông tin lịch khám

- [ ] Sau khi chọn bác sĩ, hiển thị số chuyên khoa, số dịch vụ, số khu vực/phòng.
- [ ] Không cho thêm phạm vi nếu chưa chọn bác sĩ.
- [ ] Không cho tạo lịch nếu thiếu bác sĩ hoặc ngày khám.

### Phạm vi khám áp dụng

- [ ] Thay dropdown khu khám đơn bằng bảng phạm vi khám.
- [ ] Thêm nút `+ Thêm phạm vi khám`.
- [ ] Mỗi dòng gồm chuyên khoa, khu vực/phòng, dịch vụ, phí khám, trạng thái, thao tác.
- [ ] Chặn trùng tổ hợp chuyên khoa + khu vực/phòng + dịch vụ.

### Khung giờ làm việc

- [ ] Mỗi khung giờ gồm bắt đầu, kết thúc, slot khám, áp dụng cho.
- [ ] Thêm chức năng tự sinh khung giờ.
- [ ] Tự tính tổng số khung giờ và tổng slot.
- [ ] Chặn khung giờ bị chồng lấn.

### Tóm tắt

- [ ] Hiển thị bác sĩ, ngày khám, số phạm vi, số khung giờ, tổng slot.
- [ ] Hiển thị cảnh báo nếu thiếu phạm vi hoặc khung giờ.
- [ ] Disable nút tạo lịch nếu dữ liệu chưa hợp lệ.

---

## 12. Gợi ý style

### Màu sắc

```css
--page-bg: #F8FBFF;
--card-bg: #FFFFFF;
--border: #E2E8F0;
--primary: #0B63B6;
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--text-main: #0F172A;
--text-muted: #64748B;
```

### Component

- Card bo góc 14–16px.
- Table header nền `#F8FBFF`.
- Badge trạng thái dùng màu nhẹ.
- Button primary dùng xanh bệnh viện.
- Nút xóa dùng icon đỏ nhưng không quá nổi bật.
- Background content dùng gradient xanh trắng nhẹ, không dùng pattern quá dày.

---

## 13. Kết luận

Hướng chỉnh sửa chính:

```text
Bác sĩ chọn 1 lần
Phạm vi khám là bảng nhiều dòng
Khung giờ là bảng nhiều dòng
Tóm tắt lịch khám ở bên phải
```

Cách này xử lý tốt nghiệp vụ **một bác sĩ có nhiều chuyên khoa, nhiều dịch vụ và nhiều khu vực/phòng khám**, đồng thời giúp admin dễ kiểm tra dữ liệu trước khi tạo lịch.
