# Hướng Dẫn Sử Dụng Province Open API Việt Nam v2

Tài liệu này tổng hợp cách sử dụng API dữ liệu hành chính Việt Nam từ **Province Open API v2**.

Base URL:

```txt
https://provinces.open-api.vn/api/v2
```

> Lưu ý: API v2 dùng cho dữ liệu hành chính Việt Nam sau sáp nhập tỉnh/thành từ 07/2025. Nếu hệ thống cần dữ liệu mới, nên dùng `/api/v2` thay vì `/api` hoặc `/api/v1`.

---

## 1. Danh sách API chính

| Chức năng | Method | Endpoint | Mô tả |
|---|---:|---|---|
| Lấy danh sách tỉnh/thành | GET | `/p/` | Trả về danh sách tỉnh/thành |
| Lấy chi tiết tỉnh/thành | GET | `/p/{code}` | Trả về chi tiết một tỉnh/thành theo mã code |
| Lấy danh sách phường/xã | GET | `/w/` | Trả về danh sách phường/xã |
| Lấy chi tiết phường/xã | GET | `/w/{code}` | Trả về chi tiết một phường/xã theo mã code |

---

## 2. Lấy danh sách tỉnh/thành

### Endpoint

```http
GET /p/
```

### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/p/
```

### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `search` | string | Không | Tìm kiếm tỉnh/thành theo tên |

### Ví dụ request

Lấy toàn bộ tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/
```

Tìm kiếm tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/?search=Hà Nội
```

### Response mẫu

```json
[
  {
    "name": "Thành phố Hà Nội",
    "code": 1,
    "division_type": "thành phố trung ương",
    "codename": "ha_noi",
    "phone_code": 24,
    "wards": []
  }
]
```

---

## 3. Lấy chi tiết tỉnh/thành theo code

### Endpoint

```http
GET /p/{code}
```

### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/p/1
```

### Path params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `code` | number | Có | Mã tỉnh/thành |

### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `depth` | number | Không | Mức độ dữ liệu trả về. Nhận giá trị `1` hoặc `2` |

### Ý nghĩa `depth`

| Giá trị | Mô tả |
|---:|---|
| `1` | Chỉ lấy thông tin tỉnh/thành |
| `2` | Lấy thông tin tỉnh/thành kèm danh sách phường/xã |

### Ví dụ request

Lấy chi tiết tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/p/1
```

Lấy chi tiết tỉnh/thành kèm danh sách phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/p/1?depth=2
```

### Response mẫu với `depth=1`

```json
{
  "name": "Thành phố Hà Nội",
  "code": 1,
  "division_type": "thành phố trung ương",
  "codename": "ha_noi",
  "phone_code": 24,
  "wards": []
}
```

### Response mẫu với `depth=2`

```json
{
  "name": "Thành phố Hà Nội",
  "code": 1,
  "division_type": "thành phố trung ương",
  "codename": "ha_noi",
  "phone_code": 24,
  "wards": [
    {
      "name": "Phường Hoàn Kiếm",
      "code": 4,
      "division_type": "phường",
      "codename": "phuong_hoan_kiem",
      "province_code": 1
    }
  ]
}
```

---

## 4. Lấy danh sách phường/xã

### Endpoint

```http
GET /w/
```

### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/w/
```

### Query params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `province` | number | Không | Lọc phường/xã theo mã tỉnh/thành |
| `search` | string | Không | Tìm kiếm phường/xã theo tên |

### Ví dụ request

Lấy toàn bộ phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/w/
```

Lấy phường/xã theo tỉnh/thành:

```http
GET https://provinces.open-api.vn/api/v2/w/?province=1
```

Tìm kiếm phường/xã:

```http
GET https://provinces.open-api.vn/api/v2/w/?search=Bà Rịa
```

Kết hợp lọc theo tỉnh/thành và tìm kiếm:

```http
GET https://provinces.open-api.vn/api/v2/w/?province=79&search=Bà Rịa
```

### Response mẫu

```json
[
  {
    "name": "Phường Bà Rịa",
    "code": 26560,
    "division_type": "phường",
    "codename": "phuong_ba_ria",
    "province_code": 79
  }
]
```

---

## 5. Lấy chi tiết phường/xã theo code

### Endpoint

```http
GET /w/{code}
```

### URL đầy đủ

```http
GET https://provinces.open-api.vn/api/v2/w/26560
```

### Path params

| Tên | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---:|---|
| `code` | number | Có | Mã phường/xã |

### Ví dụ request

```http
GET https://provinces.open-api.vn/api/v2/w/26560
```

### Response mẫu

```json
{
  "name": "Phường Bà Rịa",
  "code": 26560,
  "division_type": "phường",
  "codename": "phuong_ba_ria",
  "province_code": 79
}
```

---

## 6. Flow sử dụng trong form địa chỉ

Khi làm form chọn địa chỉ, nên triển khai theo flow sau:

```txt
Bước 1: Load danh sách tỉnh/thành
GET /p/

Bước 2: Người dùng chọn tỉnh/thành
Lưu province.code và province.name

Bước 3: Load danh sách phường/xã theo province_code
GET /w/?province={province_code}

Bước 4: Người dùng chọn phường/xã
Lưu ward.code, ward.name và ward.province_code

Bước 5: Người dùng nhập địa chỉ chi tiết
Ví dụ: số nhà, tên đường

Bước 6: Ghép thành địa chỉ đầy đủ
address_detail + ward_name + province_name
```

Ví dụ địa chỉ đầy đủ:

```txt
123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh
```

---

## 7. Cấu trúc lưu database khuyến nghị

Nên lưu cả `code` và `name` để tránh trường hợp API thay đổi hoặc cần hiển thị lại dữ liệu cũ.

```sql
province_code INTEGER,
province_name VARCHAR(255),
ward_code INTEGER,
ward_name VARCHAR(255),
address_detail TEXT,
full_address TEXT
```

Ví dụ:

```json
{
  "province_code": 79,
  "province_name": "Thành phố Hồ Chí Minh",
  "ward_code": 26560,
  "ward_name": "Phường Bà Rịa",
  "address_detail": "123 Nguyễn Văn Linh",
  "full_address": "123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh"
}
```

---

## 8. Ví dụ gọi API bằng JavaScript

```js
const BASE_URL = 'https://provinces.open-api.vn/api/v2';

export async function getProvinces(search = '') {
  const url = new URL(`${BASE_URL}/p/`);

  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách tỉnh/thành');
  }

  return response.json();
}

export async function getProvinceDetail(code, depth = 1) {
  const url = new URL(`${BASE_URL}/p/${code}`);
  url.searchParams.set('depth', String(depth));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy chi tiết tỉnh/thành');
  }

  return response.json();
}

export async function getWards({ provinceCode, search } = {}) {
  const url = new URL(`${BASE_URL}/w/`);

  if (provinceCode) {
    url.searchParams.set('province', String(provinceCode));
  }

  if (search) {
    url.searchParams.set('search', search);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Không thể lấy danh sách phường/xã');
  }

  return response.json();
}

export async function getWardDetail(code) {
  const response = await fetch(`${BASE_URL}/w/${code}`);

  if (!response.ok) {
    throw new Error('Không thể lấy chi tiết phường/xã');
  }

  return response.json();
}
```

---

## 9. Ví dụ gọi API bằng Axios

```js
import axios from 'axios';

const provinceApi = axios.create({
  baseURL: 'https://provinces.open-api.vn/api/v2',
  timeout: 10000,
});

export async function getProvinces(search) {
  const response = await provinceApi.get('/p/', {
    params: {
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getProvinceDetail(code, depth = 1) {
  const response = await provinceApi.get(`/p/${code}`, {
    params: {
      depth,
    },
  });

  return response.data;
}

export async function getWards(provinceCode, search) {
  const response = await provinceApi.get('/w/', {
    params: {
      province: provinceCode || undefined,
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getWardDetail(code) {
  const response = await provinceApi.get(`/w/${code}`);
  return response.data;
}
```

---

## 10. Ví dụ dùng trong React form

```jsx
import { useEffect, useState } from 'react';
import { getProvinces, getWards } from './provinceApi';

export default function AddressForm() {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      setWardCode('');
      return;
    }

    getWards({ provinceCode }).then(setWards);
  }, [provinceCode]);

  return (
    <form>
      <select
        value={provinceCode}
        onChange={(event) => setProvinceCode(event.target.value)}
      >
        <option value="">Chọn tỉnh/thành</option>
        {provinces.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </select>

      <select
        value={wardCode}
        onChange={(event) => setWardCode(event.target.value)}
        disabled={!provinceCode}
      >
        <option value="">Chọn phường/xã</option>
        {wards.map((ward) => (
          <option key={ward.code} value={ward.code}>
            {ward.name}
          </option>
        ))}
      </select>

      <input
        value={addressDetail}
        onChange={(event) => setAddressDetail(event.target.value)}
        placeholder="Số nhà, tên đường"
      />
    </form>
  );
}
```

---

## 11. Khuyến nghị khi dùng production

Không nên để frontend phụ thuộc trực tiếp quá nhiều vào API public trong các hệ thống production lớn.

Nên dùng một trong hai hướng:

### Cách 1: Frontend gọi trực tiếp API public

Phù hợp với dự án nhỏ, MVP hoặc demo.

Ưu điểm:

- Nhanh triển khai.
- Không cần tạo bảng địa chỉ trong database.
- Không cần backend xử lý đồng bộ dữ liệu.

Nhược điểm:

- Phụ thuộc vào API bên thứ ba.
- Nếu API public lỗi, form địa chỉ của hệ thống cũng bị ảnh hưởng.
- Khó kiểm soát version dữ liệu.

### Cách 2: Backend đồng bộ dữ liệu về database nội bộ

Phù hợp với dự án production.

Ưu điểm:

- Chủ động dữ liệu.
- Tốc độ truy vấn nhanh hơn.
- Không phụ thuộc trực tiếp vào API public khi người dùng thao tác.
- Dễ kiểm soát dữ liệu theo version của hệ thống.

Nhược điểm:

- Cần tạo bảng lưu tỉnh/thành, phường/xã.
- Cần viết job đồng bộ dữ liệu.

---

## 12. Bảng database nội bộ khuyến nghị

### Bảng `provinces`

```sql
CREATE TABLE provinces (
  code INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  division_type VARCHAR(100),
  codename VARCHAR(255),
  phone_code INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `wards`

```sql
CREATE TABLE wards (
  code INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  division_type VARCHAR(100),
  codename VARCHAR(255),
  province_code INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_wards_province
    FOREIGN KEY (province_code)
    REFERENCES provinces(code)
);
```

---

## 13. Mapping dữ liệu khi lưu địa chỉ user

Khi user chọn địa chỉ, request gửi lên backend nên có dạng:

```json
{
  "province_code": 79,
  "ward_code": 26560,
  "address_detail": "123 Nguyễn Văn Linh"
}
```

Backend xử lý:

```txt
1. Kiểm tra province_code có tồn tại không
2. Kiểm tra ward_code có tồn tại không
3. Kiểm tra ward.province_code có khớp với province_code không
4. Ghép full_address
5. Lưu vào database
```

Response trả về:

```json
{
  "province_code": 79,
  "province_name": "Thành phố Hồ Chí Minh",
  "ward_code": 26560,
  "ward_name": "Phường Bà Rịa",
  "address_detail": "123 Nguyễn Văn Linh",
  "full_address": "123 Nguyễn Văn Linh, Phường Bà Rịa, Thành phố Hồ Chí Minh"
}
```

---

## 14. Validation khuyến nghị

Khi lưu địa chỉ, backend nên kiểm tra:

- `province_code` bắt buộc.
- `ward_code` bắt buộc.
- `address_detail` bắt buộc nếu hệ thống cần địa chỉ cụ thể.
- `province_code` phải tồn tại trong danh sách tỉnh/thành.
- `ward_code` phải tồn tại trong danh sách phường/xã.
- `ward.province_code` phải trùng với `province_code` user gửi lên.
- Không tin hoàn toàn `province_name` và `ward_name` gửi từ frontend, backend nên lấy lại từ database hoặc API.

---

## 15. Gợi ý API nội bộ cho backend

Nếu hệ thống đồng bộ dữ liệu về database nội bộ, backend có thể expose các API sau:

```http
GET /api/v1/provinces
GET /api/v1/provinces/:code
GET /api/v1/provinces/:code/wards
GET /api/v1/wards/:code
```

Ví dụ response:

```json
{
  "success": true,
  "data": [
    {
      "code": 79,
      "name": "Thành phố Hồ Chí Minh",
      "division_type": "thành phố trung ương",
      "codename": "ho_chi_minh",
      "phone_code": 28
    }
  ]
}
```

---

## 16. Gợi ý service sync dữ liệu

Flow sync dữ liệu:

```txt
1. Gọi API GET /p/
2. Lưu danh sách tỉnh/thành vào bảng provinces
3. Với từng province, gọi GET /w/?province={province_code}
4. Lưu danh sách phường/xã vào bảng wards
5. Nếu dữ liệu đã tồn tại thì update
6. Nếu dữ liệu chưa tồn tại thì insert
```

Pseudo code:

```js
async function syncProvinceData() {
  const provinces = await getProvinces();

  for (const province of provinces) {
    await upsertProvince(province);

    const wards = await getWards(province.code);

    for (const ward of wards) {
      await upsertWard(ward);
    }
  }
}
```

---

## 17. Tổng kết endpoint thường dùng

```txt
GET /p/
Lấy danh sách tỉnh/thành

GET /p/?search={keyword}
Tìm kiếm tỉnh/thành

GET /p/{code}
Lấy chi tiết tỉnh/thành

GET /p/{code}?depth=2
Lấy chi tiết tỉnh/thành kèm danh sách phường/xã

GET /w/
Lấy danh sách phường/xã

GET /w/?province={province_code}
Lấy danh sách phường/xã theo tỉnh/thành

GET /w/?province={province_code}&search={keyword}
Tìm kiếm phường/xã trong một tỉnh/thành

GET /w/{code}
Lấy chi tiết phường/xã
```

