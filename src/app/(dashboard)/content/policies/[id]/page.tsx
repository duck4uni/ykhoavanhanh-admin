"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { policiesHooks } from "@/api/policiesApi";
import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { TextViewer } from "@/components/shares/rich-text-editor/text-viewer";
import { formatDateTime } from "@/lib/utils";
import { PolicyStatusBadge } from "../_components/PolicyStatusBadge";

/** Trang chi tiết chính sách (chỉ xem). */
export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: policy, isLoading, isError } = policiesHooks.useDetail(id);

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
          <Button className="mt-4" onClick={() => router.push("/content/policies")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/content/policies")} className="-ml-2">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Chi tiết chính sách</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{policy.title}</p>
        </div>
        <PolicyStatusBadge active={policy.is_active} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Tiêu đề</p>
            <p className="text-sm font-semibold text-slate-800">{policy.title}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Thứ tự hiển thị</p>
            <p className="text-sm text-slate-700">{policy.sort_order ?? 0}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Ngày tạo</p>
            <p className="text-sm text-slate-700">{policy.created_at ? formatDateTime(policy.created_at) : "—"}</p>
            {policy.created_by && <p className="mt-0.5 text-xs text-slate-400">Admin</p>}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Cập nhật lần cuối</p>
            <p className="text-sm text-slate-700">{policy.updated_at ? formatDateTime(policy.updated_at) : "—"}</p>
            {policy.updated_by && <p className="mt-0.5 text-xs text-slate-400">Admin</p>}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Nội dung chính sách</p>
          {policy.description ? (
            <div className="text-viewer text-sm text-slate-600 [overflow-wrap:anywhere]">
              <TextViewer content={policy.description} />
            </div>
          ) : (
            <p className="text-sm text-slate-600">Không có nội dung</p>
          )}
        </div>
      </div>
    </div>
  );
}
