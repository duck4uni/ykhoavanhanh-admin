"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useCreateAdminPatient } from "@/api/adminPatientsApi";
import { useProvinces, useWards } from "@/api/addressesApi";
import { toast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  IdCard,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const FALLBACK_FACILITY_ID = "6b7caa40-1a83-4449-8b69-e8d19567c0f7";

function formatDateLabel(value: string): string {
  if (!value) return "Chưa nhập";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-3 text-lg text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {step}
        </span>
        {title}
      </CardTitle>
    </CardHeader>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_120px_10px_1fr] items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

const inputClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";
const selectClass = "h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-primary-500/10";

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    his_patient_id: "",
    patient_last_name: "",
    patient_first_name: "",
    birthday: "",
    sex: "",
    ethnic_name: "",
    profession_name: "",
    identity_number: "",
    insurance_number: "",
    insurance_expired_date_text: "",
    phone_number: "",
    address_detail: "",
    address_street: "",
    province_code: "",
    province_name: "",
    ward_code: "",
    ward_name: "",
    country_code: "VN",
    country_name: "Việt Nam",
  });

  const { data: provinces } = useProvinces();
  const { data: wards } = useWards(form.province_code || null);

  const facilityId = FALLBACK_FACILITY_ID;

  const createMutation = useCreateAdminPatient({
    onSuccess: () => {
      toast.success("Đã thêm bệnh nhân thành công!");
      router.push("/patients");
    },
    onError: (err) => toast.error(err.message || "Tạo bệnh nhân thất bại"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fullName = useMemo(
    () => [form.patient_last_name, form.patient_first_name].filter(Boolean).join(" ").trim(),
    [form.patient_last_name, form.patient_first_name]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.his_patient_id.trim()) {
      toast.error("Vui lòng nhập mã bệnh nhân (mã HIS).");
      return;
    }
    if (!fullName) {
      toast.error("Vui lòng nhập họ và tên bệnh nhân.");
      return;
    }
    if (form.phone_number && !/^\d{10}$/.test(form.phone_number)) {
      toast.error("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    const addressFull = [
      form.address_detail,
      form.address_street,
      form.ward_name,
      form.province_name,
      form.country_name,
    ]
      .filter(Boolean)
      .join(", ");

    createMutation.mutate({
      facility_id: facilityId,
      his_patient_id: form.his_patient_id.trim(),
      patient_full_name: fullName,
      patient_first_name: form.patient_first_name.trim() || undefined,
      patient_last_name: form.patient_last_name.trim() || undefined,
      birthday: form.birthday || undefined,
      birth_year: form.birthday ? form.birthday.slice(0, 4) : undefined,
      sex: form.sex || undefined,
      ethnic_name: form.ethnic_name.trim() || undefined,
      profession_name: form.profession_name.trim() || undefined,
      identity_number: form.identity_number.trim() || undefined,
      insurance_number: form.insurance_number.trim() || undefined,
      insurance_expired_date_text: form.insurance_expired_date_text || undefined,
      phone_number: form.phone_number.trim() || undefined,
      address_detail: form.address_detail.trim() || undefined,
      address_street: form.address_street.trim() || undefined,
      ward_code: form.ward_code || undefined,
      ward_name: form.ward_name || undefined,
      province_code: form.province_code || undefined,
      province_name: form.province_name || undefined,
      country_code: form.country_code || undefined,
      country_name: form.country_name || undefined,
      address_full: addressFull || undefined,
    });
  };

  const loading = createMutation.isPending;
  const isLoadingAddress = !provinces;

  const provinceOptions = provinces?.map((p) => ({ value: p.city, label: p.cityname })) || [];
  const wardOptions = wards?.map((w) => ({ value: w.wardcode, label: w.wardname || w.wardcode })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" className="h-10 gap-2 text-primary-700 hover:bg-primary-50" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Thêm bệnh nhân mới</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tạo hồ sơ bệnh nhân mới trong hệ thống</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={1} title="Thông tin định danh" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  className={inputClass}
                  label="Mã bệnh nhân (HIS) *"
                  name="his_patient_id"
                  value={form.his_patient_id}
                  onChange={handleChange}
                  placeholder="VD: BN-2025-001"
                  hint="Mã duy nhất trong cơ sở y tế"
                  required
                />
                <div />
                <Input className={inputClass} label="Họ, chữ lót *" name="patient_last_name" value={form.patient_last_name} onChange={handleChange} placeholder="Nhập họ, chữ lót" required />
                <Input className={inputClass} label="Tên *" name="patient_first_name" value={form.patient_first_name} onChange={handleChange} placeholder="Nhập tên" required />
                <Input className={inputClass} label="Ngày sinh" name="birthday" type="date" value={form.birthday} onChange={handleChange} />
                <Select
                  label="Giới tính"
                  value={form.sex}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, sex: val }))}
                  options={[{ value: "MALE", label: "Nam" }, { value: "FEMALE", label: "Nữ" }]}
                  placeholder="Chọn giới tính"
                  className={selectClass}
                />
                <Input className={inputClass} label="Dân tộc" name="ethnic_name" value={form.ethnic_name} onChange={handleChange} placeholder="Nhập dân tộc" />
                <Input className={inputClass} label="Nghề nghiệp" name="profession_name" value={form.profession_name} onChange={handleChange} placeholder="Nhập nghề nghiệp" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={2} title="Thông tin giấy tờ" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input className={inputClass} label="Số CCCD" name="identity_number" value={form.identity_number} onChange={handleChange} placeholder="Nhập số CCCD" hint="CCCD gồm 12 chữ số" />
                <Input className={inputClass} label="Mã BHYT" name="insurance_number" value={form.insurance_number} onChange={handleChange} placeholder="Nhập mã BHYT" />
                <Input className={inputClass} label="Hạn BHYT" name="insurance_expired_date_text" type="date" value={form.insurance_expired_date_text} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

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
        </div>

        <div className="space-y-5">
          <Card className="sticky top-6 rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <ClipboardList className="h-5 w-5 text-primary-600" /> Tóm tắt hồ sơ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4 border-b border-slate-100 pb-5">
                <SummaryRow icon={IdCard} label="Mã BN" value={form.his_patient_id || "Chưa nhập"} />
                <SummaryRow icon={UserRound} label="Họ tên" value={fullName || "Chưa nhập"} />
                <SummaryRow icon={CalendarDays} label="Ngày sinh" value={formatDateLabel(form.birthday)} />
                <SummaryRow icon={Phone} label="SĐT" value={form.phone_number || "Chưa nhập"} />
                <SummaryRow icon={ShieldCheck} label="BHYT" value={form.insurance_number || "Chưa nhập"} />
                <SummaryRow icon={Building2} label="Cơ sở" value={facilityId !== FALLBACK_FACILITY_ID ? "Đã xác định" : "Mặc định"} />
              </div>

              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
                <p className="font-medium">Vui lòng kiểm tra kỹ thông tin trước khi tạo hồ sơ.</p>
                <p className="mt-1 text-primary-700">Mã bệnh nhân phải là duy nhất trong cơ sở y tế.</p>
              </div>

              <div className="grid grid-cols-[1fr_2fr] gap-3 pt-1">
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => router.back()}>Hủy</Button>
                <Button type="submit" variant="primary" className="h-11 rounded-xl" disabled={loading}>
                  {loading ? <><Spinner size="sm" className="mr-2" />Đang lưu...</> : "Tạo bệnh nhân"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
