"use client";

import { AlertCircle, ChevronLeft, CircleCheck } from "lucide-react";
import { LoadingSection } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useEditNewsForm } from "./hooks/useEditNewsForm";
import { NewsEditorShell } from "../_editor/_components/NewsEditorShell";
import { NewsMetadataCard } from "../_editor/_components/NewsMetadataCard";
import { NewsContentCard } from "../_editor/_components/NewsContentCard";
import { NewsThumbnailCard } from "../_editor/_components/NewsThumbnailCard";
import { NewsPublishCard } from "../_editor/_components/NewsPublishCard";

export default function EditNewsPage() {
  const ctrl = useEditNewsForm();
  const { form, setForm, categoryOptions, post } = ctrl;

  if (ctrl.isLoading) {
    return <LoadingSection text="Đang tải dữ liệu bài viết..." />;
  }

  if (!post) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">Không tìm thấy tin tức</p>
            <p className="text-xs text-slate-400">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => ctrl.router.push("/content/news")}>
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <NewsEditorShell
      headerLabel="Chỉnh sửa tin tức"
      status={form.status}
      isSaving={ctrl.isSaving}
      submitLabel="Lưu thay đổi"
      onBack={() => ctrl.router.back()}
      onSubmit={() => ctrl.handleSubmit()}
      left={
        <>
          <NewsMetadataCard form={form} setForm={setForm} categoryOptions={categoryOptions} />
          <NewsContentCard
            content={form.content}
            onChangeContent={(value) => setForm({ ...form, content: value })}
            onUpload={ctrl.handleEditorUpload}
            isEditorUploading={ctrl.isEditorUploading}
            minHeightClass="min-h-[500px]"
            editorKey={ctrl.formInitialized ? "ready" : "loading"}
          />
        </>
      }
      right={
        <>
          <NewsThumbnailCard
            value={form.thumbnail_path}
            onChange={(url) => setForm((f) => ({ ...f, thumbnail_path: url }))}
            pendingFile={ctrl.pendingThumbnail}
            onPendingChange={(file) => ctrl.setPendingThumbnail(file)}
          />
          <NewsPublishCard
            form={form}
            setForm={setForm}
            isSaving={ctrl.isSaving}
            isUploading={ctrl.isUploading}
            isMutating={ctrl.isMutating}
            primaryLabel="Lưu thay đổi"
            onSubmit={() => ctrl.handleSubmit()}
            onCancel={() => ctrl.router.back()}
            footer={
              post.published_at ? (
                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1 pt-1">
                  <CircleCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Xuất bản {new Date(post.published_at).toLocaleDateString("vi-VN")}
                </p>
              ) : null
            }
          />
        </>
      }
    />
  );
}
