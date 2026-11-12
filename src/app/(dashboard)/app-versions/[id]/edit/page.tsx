"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { appVersionsHooks } from "@/api/appVersionsApi";
import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { AppVersionForm } from "../../_components/AppVersionForm";
import {
  EMPTY_APP_VERSION_FORM,
  appVersionFormToPayload,
  mapAppVersionToForm,
  validateAppVersionForm,
  type AppVersionFormValues,
} from "../../types";

export default function EditAppVersionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: item, isLoading, isError } = appVersionsHooks.useDetail(id);

  const updateMutation = appVersionsHooks.useUpdate({
    onSuccess: () => {
      toast.success("Cập nhật bản cập nhật thành công");
      router.push("/app-versions");
    },
    onError: (err) => toast.error(err.message || "Cập nhật bản cập nhật thất bại"),
  });

  const initialForm: AppVersionFormValues = useMemo(
    () => (item ? mapAppVersionToForm(item) : EMPTY_APP_VERSION_FORM),
    [item]
  );

  function handleSubmit(form: AppVersionFormValues) {
    const error = validateAppVersionForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    updateMutation.mutate({ id, data: appVersionFormToPayload(form) });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSection text="Đang tải bản cập nhật..." />
      </div>
    );
  }

  // GET /app-versions/{id} trả 200 với responseData = null khi không tồn tại.
  if (isError || !item) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p className="text-sm text-muted-foreground">Không tìm thấy bản cập nhật.</p>
          <Button className="mt-4" onClick={() => router.push("/app-versions")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppVersionForm
      title="Chỉnh sửa bản cập nhật"
      subtitle={`${item.version_name} (${item.version_code})`}
      submitLabel="Lưu thay đổi"
      initialForm={initialForm}
      isSubmitting={updateMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
