"use client";

import { useCreateNewsForm } from "./hooks/useCreateNewsForm";
import { NewsEditorShell } from "../_editor/_components/NewsEditorShell";
import { NewsMetadataCard } from "../_editor/_components/NewsMetadataCard";
import { NewsContentCard } from "../_editor/_components/NewsContentCard";
import { NewsThumbnailCard } from "../_editor/_components/NewsThumbnailCard";
import { NewsPublishCard } from "../_editor/_components/NewsPublishCard";

export default function NewNewsPage() {
  const ctrl = useCreateNewsForm();
  const { form, setForm, categoryOptions } = ctrl;

  return (
    <NewsEditorShell
      headerLabel="Tạo tin tức mới"
      status={form.status}
      isSaving={ctrl.isSaving}
      submitLabel="Tạo tin tức"
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
            minHeightClass="min-h-[600px]"
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
            primaryLabel="Tạo tin tức"
            onSubmit={() => ctrl.handleSubmit()}
            onCancel={() => ctrl.router.back()}
          />
        </>
      }
    />
  );
}
