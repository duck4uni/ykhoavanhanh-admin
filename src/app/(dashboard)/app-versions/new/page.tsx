"use client";

import { useRouter } from "next/navigation";
import { appVersionsHooks } from "@/api/appVersionsApi";
import { toast } from "@/components/ui/Toast";
import { AppVersionForm } from "../_components/AppVersionForm";
import {
  EMPTY_APP_VERSION_FORM,
  appVersionFormToPayload,
  validateAppVersionForm,
  type AppVersionFormValues,
} from "../types";

export default function NewAppVersionPage() {
  const router = useRouter();

  const createMutation = appVersionsHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo bản cập nhật thành công");
      router.push("/app-versions");
    },
    onError: (err) => toast.error(err.message || "Tạo bản cập nhật thất bại"),
  });

  function handleSubmit(form: AppVersionFormValues) {
    const error = validateAppVersionForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    createMutation.mutate(appVersionFormToPayload(form));
  }

  return (
    <AppVersionForm
      title="Thêm bản cập nhật"
      subtitle="Khai báo phiên bản mới của ứng dụng và chính sách cập nhật"
      submitLabel="Tạo bản cập nhật"
      initialForm={EMPTY_APP_VERSION_FORM}
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
