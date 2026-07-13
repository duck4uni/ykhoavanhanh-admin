"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, ImageIcon, Mail, Phone, Stethoscope, Trash2, UserRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import { specialtiesHooks } from "@/api/specialtiesApi";
import { filesHooks } from "@/api/filesApi";
import { toast } from "@/components/ui/Toast";
import type { HisDoctor } from "@/api/doctorsApi";

export type DoctorFormValues = {
  doctorid: string;
  doctorname: string;
  specialty_id: string;
  description: string;
  avatar_url: string;
  academic_degree: string;
  academic_title: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  booking_note: string;
  booking_group: string;
  status: string;
  display_group: string;
  display_priority: string;
};

export function createInitialDoctorForm(): DoctorFormValues {
  return {
    doctorid: "",
    doctorname: "",
    specialty_id: "",
    description: "",
    avatar_url: "",
    academic_degree: "",
    academic_title: "",
    phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    booking_note: "",
    booking_group: "",
    status: "ACTIVE",
    display_group: "",
    display_priority: "",
  };
}

function getImageSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isValidPhoneNumber(value: string): boolean {
  const phone = value.replace(/[\s.\-()]/g, "");
  if (!phone) return true;
  return /^(0\d{9,10}|84\d{9,10}|\+84\d{9,10})$/.test(phone);
}

export function mapDoctorToForm(doctor: HisDoctor): DoctorFormValues {
  return {
    doctorid: doctor.doctorid,
    doctorname: doctor.doctorname,
    specialty_id: doctor.specialty_id ?? "",
    description: doctor.description ?? "",
    avatar_url: doctor.avatar_url ?? "",
    academic_degree: doctor.academic_degree ?? "",
    academic_title: doctor.academic_title ?? "",
    phone: doctor.phone ?? "",
    email: doctor.email ?? "",
    gender: doctor.gender ?? "",
    date_of_birth: doctor.date_of_birth ?? "",
    booking_note: doctor.booking_note ?? "",
    booking_group: doctor.booking_group ?? "",
    status: doctor.status ?? "ACTIVE",
    display_group: doctor.display_group?.toString() ?? "",
    display_priority: doctor.display_priority?.toString() ?? "",
  };
}

type Props = {
  title: string;
  subtitle: string;
  submitLabel: string;
  initialForm: DoctorFormValues;
  isSubmitting: boolean;
  onSubmit: (form: DoctorFormValues) => void;
  /** Bắt buộc nhập chuyên khoa, số điện thoại, giới tính (dùng khi thêm bác sĩ). */
  requireContactFields?: boolean;
};

export function DoctorForm({ title, subtitle, submitLabel, initialForm, isSubmitting, onSubmit, requireContactFields = false }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<DoctorFormValues>(initialForm);
  const { data: specialtiesData } = specialtiesHooks.useList();
  const specialties = specialtiesData?.rows ?? [];
  const uploadMutation = filesHooks.useUpload({
    onSuccess: (file) => {
      setForm((current) => ({ ...current, avatar_url: file.original }));
      toast.success("Upload ảnh đại diện thành công");
    },
    onError: (err) => toast.error(err.message || "Upload ảnh thất bại"),
  });
  const avatarSrc = getImageSrc(form.avatar_url);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.doctorid.trim() || !form.doctorname.trim()) return;
    if (requireContactFields && (!form.specialty_id || !form.phone.trim() || !form.gender)) return;
    onSubmit(form);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/doctors")}
            className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-500 shadow-sm transition-colors hover:bg-surface-secondary"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Mã bác sĩ *" value={form.doctorid} onChange={(e) => setForm((p) => ({ ...p, doctorid: e.target.value }))} placeholder="VD: BS001" />
              <Input label="Tên bác sĩ *" value={form.doctorname} onChange={(e) => setForm((p) => ({ ...p, doctorname: e.target.value }))} placeholder="VD: Nguyễn Văn A" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Chuyên khoa{requireContactFields && <span className="ml-1 text-red-500">*</span>}</label>
              <select
                value={form.specialty_id}
                required={requireContactFields}
                onChange={(e) => setForm((p) => ({ ...p, specialty_id: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
              >
                <option value="">Chọn chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Học vị" value={form.academic_degree} onChange={(e) => setForm((p) => ({ ...p, academic_degree: e.target.value }))} placeholder="VD: Thạc sĩ" />
              <Input label="Học hàm" value={form.academic_title} onChange={(e) => setForm((p) => ({ ...p, academic_title: e.target.value }))} placeholder="VD: Bác sĩ Chuyên khoa II" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label={`Số điện thoại${requireContactFields ? " *" : ""}`} type="tel" required={requireContactFields} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="VD: 0909000000" />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="doctor@example.com" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Giới tính{requireContactFields && <span className="ml-1 text-red-500">*</span>}</label>
                <select value={form.gender} required={requireContactFields} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10">
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <Input label="Ngày sinh" type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Ảnh đại diện</label>
              {form.avatar_url ? (
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
                    {avatarSrc && <Image src={avatarSrc} alt="avatar preview" fill sizes="96px" className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">Ảnh đại diện đã tải lên</p>
                    <p className="mt-1 truncate text-xs text-slate-400" title={form.avatar_url}>{form.avatar_url}</p>
                    <button
                      type="button"
                      disabled={uploadMutation.isPending}
                      onClick={() => setForm((current) => ({ ...current, avatar_url: "" }))}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-primary-300 hover:bg-primary-50/40">
                  <ImageIcon className="mb-2 h-6 w-6 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {uploadMutation.isPending ? "Đang upload ảnh..." : "Chọn ảnh từ máy"}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">Hỗ trợ PNG, JPG, WEBP. File sẽ được upload lên hệ thống.</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Vui lòng chọn file ảnh");
                        return;
                      }
                      uploadMutation.mutate(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nhóm đặt khám" value={form.booking_group} onChange={(e) => setForm((p) => ({ ...p, booking_group: e.target.value }))} placeholder="VD: GENERAL" />
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Trạng thái</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10">
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nhóm hiển thị" type="number" value={form.display_group} onChange={(e) => setForm((p) => ({ ...p, display_group: e.target.value }))} placeholder="VD: 1" />
              <Input label="Ưu tiên hiển thị" type="number" value={form.display_priority} onChange={(e) => setForm((p) => ({ ...p, display_priority: e.target.value }))} placeholder="VD: 10" />
            </div>

            <Input label="Ghi chú đặt khám" value={form.booking_note} onChange={(e) => setForm((p) => ({ ...p, booking_note: e.target.value }))} placeholder="VD: Chỉ nhận lịch buổi sáng" />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Mô tả</label>
              <div className="doctor-description-editor min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10">
                <TextEditor
                  key={`${form.doctorid}-${initialForm.description}`}
                  content={form.description}
                  onChangeContent={(content) => setForm((p) => ({ ...p, description: content }))}
                  contentClassName="min-h-[180px] [overflow-wrap:anywhere]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={isSubmitting || uploadMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
                {(isSubmitting || uploadMutation.isPending) && <Spinner size="sm" />}{submitLabel}
              </button>
              <button type="button" onClick={() => router.push("/doctors")} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
                Hủy
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0 lg:sticky lg:top-6">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Xem trước</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Thông tin bác sĩ sẽ hiển thị như bên dưới.</p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-100 text-primary-600">
                  {avatarSrc ? (
                    <Image src={avatarSrc} alt={form.doctorname || "avatar"} fill sizes="44px" className="object-cover" unoptimized />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-800">{form.doctorname.trim() || "Tên bác sĩ"}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary-600">{form.doctorid.trim() || "Mã bác sĩ"}</p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><Stethoscope className="h-4 w-4" /> Chuyên khoa</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">{specialties.find((s) => s.id === form.specialty_id)?.name || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4" /> Học vị / học hàm</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">{[form.academic_degree, form.academic_title].filter(Boolean).join(" - ") || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> Điện thoại</dt>
                  <dd className="font-medium text-slate-700">{form.phone.trim() || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> Email</dt>
                  <dd className="max-w-[60%] truncate text-right font-medium text-slate-700">{form.email.trim() || "—"}</dd>
                </div>
              </dl>

              {form.booking_note.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Ghi chú đặt khám</p>
                  <p className="mt-1 text-sm text-slate-700">{form.booking_note.trim()}</p>
                </div>
              )}
              {form.description.trim() && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-muted-foreground">Mô tả</p>
                  <div
                    className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: form.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
