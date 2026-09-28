"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { policiesHooks } from "@/api/policiesApi";
import { LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { PolicyForm } from "../../_components/PolicyForm";
import { EMPTY_POLICY_FORM, mapPolicyToForm, policyFormToPayload, type PolicyFormValues } from "../../types";

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: policy, isLoading, isError } = policiesHooks.useDetail(id);

  const patchMutation = policiesHooks.usePatch({
    onSuccess: () => {
      toast.success("Cập nhật chính sách thành công");
      router.push("/content/policies");
    },
    onError: (err) => toast.error(err.message || "Cập nhật chính sách thất bại"),
  });

  const initialForm: PolicyFormValues = useMemo(
    () => (policy ? mapPolicyToForm(policy) : EMPTY_POLICY_FORM),
    [policy]
  );

  function handleSubmit(form: PolicyFormValues) {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chính sách");
      return;
    }
    patchMutation.mutate({ id, data: policyFormToPayload(form) });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSection text="Đang tải chính sách..." />
      </div>
    );
  }

  if (isError || !policy) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p className="text-sm text-muted-foreground">Không tìm thấy chính sách.</p>
          <button
            onClick={() => router.push("/content/policies")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <PolicyForm
      key={policy.id}
      title="Chỉnh sửa chính sách"
      subtitle="Cập nhật nội dung, trạng thái và thứ tự hiển thị của chính sách."
      submitLabel="Lưu thay đổi"
      initialForm={initialForm}
      isSubmitting={patchMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
}
