"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useCreatePatient } from "@/api/patientApi";
import { useProvinces, useWards } from "@/api/addressesApi";
import { toast } from "@/components/ui/Toast";
import type { CreatePatientPayload } from "@/types/patient";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CloudUpload,
  FileSearch,
  IdCard,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "09xxxxxxxx";
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 2)}x${"x".repeat(Math.min(6, Math.max(0, digits.length - 5)))}${digits.slice(-3)}`;
}

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

function SummaryRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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
    patientfirstname: "",
    patientlastname: "",
    patientbirthday: "",
    patientsex: "",
    patientphonenumber: "",
    patientethnic: "",
    identifynumber: "",
    insurancenumber: "",
    email: "",
    addressdetail: "",
    addressstreet: "",
    addressprovince: "",
    addresscity: "",
    addressward: "",
    addresscountry: "VN",
    professionid: "",
  });

  const { data: provinces } = useProvinces();
  const { data: wards } = useWards(form.addressprovince || null);

  const createMutation = useCreatePatient({
    onSuccess: (data) => {
      toast.success(`Đã thêm bệnh nhân thành công! Mã BN: ${data.his_patient_id ?? data.id}`);
      router.push("/patients");
    },
    onError: (err) => toast.error(err.message || "Tạo bệnh nhân thất bại"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === "addressprovince") {
        newForm.addresscity = "";
        newForm.addressward = "";
      }
      if (name === "addresscity") newForm.addressward = "";
      return newForm;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientfirstname || !form.patientlastname || !form.patientbirthday || !form.patientsex || !form.patientphonenumber) {
      toast.error("Vui lòng nhập đầy đủ họ tên, ngày sinh, giới tính và số điện thoại.");
      return;
    }
    if (!/^\d{10}$/.test(form.patientphonenumber)) {
      toast.error("Số điện thoại phải gồm đúng 10 chữ số và không được nhập chữ.");
      return;
    }
    const payload: CreatePatientPayload = {
      patientid: "",
      patientfirstname: form.patientfirstname,
      patientlastname: form.patientlastname,
      patientbirthday: form.patientbirthday || undefined,
      patientsex: form.patientsex || undefined,
      patientphonenumber: form.patientphonenumber || undefined,
      patientethnic: form.patientethnic || undefined,
      identifynumber: form.identifynumber || undefined,
      insurancenumber: form.insurancenumber || undefined,
      addressdetail: form.addressdetail || undefined,
      addressstreet: form.addressstreet || undefined,
      addressprovince: form.addressprovince || undefined,
      addresscity: form.addresscity || undefined,
      addressward: form.addressward || undefined,
      addresscountry: form.addresscountry || undefined,
      professionid: form.professionid || undefined,
    };
    createMutation.mutate({ payload });
  };

  const loading = createMutation.isPending;
  const isLoadingAddress = !provinces;

  const fullName = useMemo(() => [form.patientfirstname, form.patientlastname].filter(Boolean).join(" ") || "Chưa nhập", [form.patientfirstname, form.patientlastname]);

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
            <p className="mt-1 text-sm text-muted-foreground">Tạo hồ sơ bệnh nhân mới và đồng bộ thông tin lên HIS</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-primary-700">
          <FileSearch className="h-4 w-4" /> Kiểm tra trùng hồ sơ
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={1} title="Thông tin định danh" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input className={inputClass} label="Họ, chữ lót *" name="patientfirstname" value={form.patientfirstname} onChange={handleChange} placeholder="Nhập họ, chữ lót" required />
                <Input className={inputClass} label="Tên *" name="patientlastname" value={form.patientlastname} onChange={handleChange} placeholder="Nhập tên" required />
                <Input className={inputClass} label="Ngày sinh *" name="patientbirthday" type="date" value={form.patientbirthday} onChange={handleChange} required />
                <Select
                  label="Giới tính *"
                  value={form.patientsex}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, patientsex: val }))}
                  options={[{ value: "nam", label: "Nam" }, { value: "nu", label: "Nữ" }]}
                  placeholder="Chọn giới tính"
                  className={selectClass}
                  required
                />
                <Input
                  className={inputClass}
                  label="Dân tộc"
                  name="patientethnic"
                  value={form.patientethnic}
                  onChange={handleChange}
                  placeholder="Nhập dân tộc"
                />
                <Input
                  className={inputClass}
                  label="Nghề nghiệp"
                  name="professionid"
                  value={form.professionid}
                  onChange={handleChange}
                  placeholder="Nhập nghề nghiệp"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={2} title="Thông tin giấy tờ" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input className={inputClass} label="Số CCCD" name="identifynumber" value={form.identifynumber} onChange={handleChange} placeholder="Nhập số CCCD" hint="CCCD gồm 12 chữ số" />
                <Input className={inputClass} label="Mã BHYT" name="insurancenumber" value={form.insurancenumber} onChange={handleChange} placeholder="Nhập mã BHYT" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <SectionTitle step={3} title="Thông tin liên hệ" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  className={inputClass}
                  label="Số điện thoại *"
                  name="patientphonenumber"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={form.patientphonenumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      patientphonenumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  placeholder="09xxxxxxxx"
                  hint="Số điện thoại gồm đúng 10 chữ số"
                  required
                />
                <Input className={inputClass} label="Email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Địa chỉ</h3>
                <div className="grid gap-4 md:grid-cols-[240px_1fr]">
                  <Input className={inputClass} label="Số nhà" name="addressdetail" value={form.addressdetail} onChange={handleChange} placeholder="Nhập số nhà" />
                  <Input className={inputClass} label="Đường/Thôn" name="addressstreet" value={form.addressstreet} onChange={handleChange} placeholder="Nhập đường hoặc thôn/xóm" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Select
                    label="Tỉnh/Thành"
                    name="addressprovince"
                    value={form.addressprovince}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, addressprovince: val, addresscity: "", addressward: "" }))}
                    options={provinceOptions}
                    placeholder={isLoadingAddress ? "Đang tải..." : "Chọn tỉnh/thành"}
                    disabled={isLoadingAddress}
                    className={selectClass}
                  />
                  <Select
                    label="Phường/Xã"
                    name="addressward"
                    value={form.addressward}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, addressward: val }))}
                    options={wardOptions}
                    placeholder={!form.addressprovince ? "Vui lòng chọn tỉnh/thành trước" : wardOptions.length ? "Chọn phường/xã" : "Không có dữ liệu"}
                    disabled={!form.addressprovince}
                    className={selectClass}
                  />
                </div>
                <div className="mt-4">
                  <Select
                    label="Quốc gia"
                    name="addresscountry"
                    value={form.addresscountry}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, addresscountry: val }))}
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
                <SummaryRow icon={UserRound} label="Họ tên" value={fullName} />
                <SummaryRow icon={CalendarDays} label="Ngày sinh" value={formatDateLabel(form.patientbirthday)} />
                <SummaryRow icon={Phone} label="SĐT" value={maskPhone(form.patientphonenumber)} />
                <SummaryRow icon={IdCard} label="CCCD" value={form.identifynumber || "Chưa nhập"} />
                <SummaryRow icon={ShieldCheck} label="BHYT" value={form.insurancenumber || "Chưa nhập"} />
              </div>

              <div className="space-y-3 border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><Search className="h-4 w-4 text-primary-600" /> Kiểm tra trùng hồ sơ</span>
                  <span className="rounded-full bg-warning-light px-3 py-1 text-xs font-semibold text-warning">Chưa thực hiện</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><CloudUpload className="h-4 w-4 text-primary-600" /> Đồng bộ HIS</span>
                  <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">Sẵn sàng tạo mới</span>
                </div>
              </div>

              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-primary-800">
                <p className="font-medium">Vui lòng kiểm tra kỹ thông tin trước khi tạo hồ sơ.</p>
                <p className="mt-1 text-primary-700">Sau khi lưu, thông tin sẽ được đồng bộ lên hệ thống HIS.</p>
              </div>

              <div className="grid grid-cols-[1fr_2fr] gap-3 pt-1">
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => router.back()}>Hủy</Button>
                <Button type="submit" variant="primary" className="h-11 rounded-xl" disabled={loading}>
                  {loading ? <><Spinner size="sm" className="mr-2" />Đang lưu...</> : "Tạo hồ sơ trên HIS"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
