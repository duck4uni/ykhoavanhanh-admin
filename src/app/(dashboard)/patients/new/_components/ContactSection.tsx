import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionTitle } from "./primitives";
import { inputClass, selectClass } from "../types";
import type { NewPatientController } from "../hooks/useNewPatientForm";

/** Bước 3: Thông tin liên hệ + địa chỉ. */
export function ContactSection({ ctrl }: { ctrl: NewPatientController }) {
  const { form, setForm, handleChange, provinces, wards, isLoadingAddress, provinceOptions, wardOptions } = ctrl;

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <SectionTitle step={3} title="Thông tin liên hệ" />
      <CardContent className="space-y-4 pt-2">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            className={inputClass}
            label="Số điện thoại"
            name="phone_number"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={form.phone_number}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                phone_number: e.target.value.replace(/\D/g, "").slice(0, 10),
              }))
            }
            placeholder="09xxxxxxxx"
            hint="Số điện thoại gồm 10 chữ số"
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Địa chỉ</h3>
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <Input className={inputClass} label="Số nhà" name="address_detail" value={form.address_detail} onChange={handleChange} placeholder="Nhập số nhà" />
            <Input className={inputClass} label="Đường/Thôn" name="address_street" value={form.address_street} onChange={handleChange} placeholder="Nhập đường hoặc thôn/xóm" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Tỉnh/Thành"
              value={form.province_code}
              onValueChange={(val) => {
                const p = provinces?.find((x) => x.city === val);
                setForm((prev) => ({
                  ...prev,
                  province_code: val,
                  province_name: p?.cityname ?? "",
                  ward_code: "",
                  ward_name: "",
                }));
              }}
              options={provinceOptions}
              placeholder={isLoadingAddress ? "Đang tải..." : "Chọn tỉnh/thành"}
              disabled={isLoadingAddress}
              className={selectClass}
            />
            <Select
              label="Phường/Xã"
              value={form.ward_code}
              onValueChange={(val) => {
                const w = wards?.find((x) => x.wardcode === val);
                setForm((prev) => ({ ...prev, ward_code: val, ward_name: w?.wardname ?? "" }));
              }}
              options={wardOptions}
              placeholder={!form.province_code ? "Vui lòng chọn tỉnh/thành trước" : wardOptions.length ? "Chọn phường/xã" : "Không có dữ liệu"}
              disabled={!form.province_code}
              className={selectClass}
            />
          </div>
          <div className="mt-4">
            <Select
              label="Quốc gia"
              value={form.country_code}
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  country_code: val,
                  country_name: val === "VN" ? "Việt Nam" : "",
                }))
              }
              options={[{ value: "VN", label: "Việt Nam" }, { value: "OTHER", label: "Quốc gia khác" }]}
              placeholder="Chọn quốc gia"
              className={selectClass}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
