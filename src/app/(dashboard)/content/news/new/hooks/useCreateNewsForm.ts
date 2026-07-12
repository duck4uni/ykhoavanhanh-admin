import { useState } from "react";
import { useRouter } from "next/navigation";
import { postsHooks, postsMediaService, postsService } from "@/api/postsApi";
import type { ApiFile } from "@/components/shares/rich-text-editor/types/types";
import { toast } from "@/components/ui/Toast";
import { useNewsFormState } from "../../_editor/hooks/useNewsFormState";
import { slugify } from "../../_editor/types";

/** State + logic cho trang "Tạo tin tức mới". */
export function useCreateNewsForm() {
  const router = useRouter();
  const state = useNewsFormState();
  const { form, pendingThumbnail, setPendingThumbnail, setIsUploading, setIsEditorUploading } = state;

  // ID của post DRAFT được tạo trước để phục vụ upload media
  const [draftPostId, setDraftPostId] = useState<string | null>(null);

  const patchMutation = postsHooks.usePatch();
  const createMutation = postsHooks.useCreate({
    onSuccess: () => {
      toast.success("Tạo tin tức thành công");
      router.push("/content/news");
    },
    onError: (err) => toast.error(err.message || "Tạo tin tức thất bại"),
  });

  async function getOrCreateDraftId(): Promise<string> {
    if (draftPostId) return draftPostId;
    const draft = await postsService.create({
      name: form.name.trim() || "Bài viết mới",
      status: "DRAFT",
    });
    setDraftPostId(draft.id);
    return draft.id;
  }

  async function handleEditorUpload(file: File): Promise<(ApiFile & { url: string }) | null> {
    setIsEditorUploading(true);
    try {
      const postId = await getOrCreateDraftId();
      return await postsService.uploadEditorFileForPost(postId, file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload ảnh thất bại");
      return null;
    } finally {
      setIsEditorUploading(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tiêu đề tin tức");
      return;
    }

    let thumbnailPath = form.thumbnail_path;

    if (pendingThumbnail) {
      setIsUploading(true);
      try {
        const postId = await getOrCreateDraftId();
        const media = await postsMediaService.upload(postId, pendingThumbnail, { media_type: "THUMBNAIL" });
        thumbnailPath = media.url ?? media.file_path;
        setPendingThumbnail(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload ảnh thất bại");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      ...form,
      thumbnail_path: thumbnailPath,
      slug: form.slug.trim() || slugify(form.name),
      category_id: form.category_id || undefined,
    };

    if (draftPostId) {
      // Patch post DRAFT đã tạo thay vì tạo mới
      patchMutation.mutate(
        { id: draftPostId, data: payload },
        {
          onSuccess: () => {
            toast.success("Tạo tin tức thành công");
            router.push("/content/news");
          },
          onError: (err) => toast.error(err.message || "Tạo tin tức thất bại"),
        }
      );
    } else {
      createMutation.mutate(payload);
    }
  }

  const isMutating = createMutation.isPending || patchMutation.isPending;
  const isSaving = isMutating || state.isUploading || state.isEditorUploading;

  return {
    ...state,
    router,
    handleEditorUpload,
    handleSubmit,
    isMutating,
    isSaving,
  };
}
