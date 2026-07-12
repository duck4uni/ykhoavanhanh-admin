import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { postsHooks, postsMediaService, postsService } from "@/api/postsApi";
import type { ApiFile } from "@/components/shares/rich-text-editor/types/types";
import { toast } from "@/components/ui/Toast";
import { useNewsFormState } from "../../_editor/hooks/useNewsFormState";
import type { NewsStatus } from "../../_editor/types";

/** State + logic cho trang "Chỉnh sửa tin tức". */
export function useEditNewsForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: post, isLoading } = postsHooks.useDetail(id);

  const state = useNewsFormState();
  const { form, setForm, pendingThumbnail, setPendingThumbnail, setIsUploading, setIsEditorUploading } = state;
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (post) {
      setForm({
        name: post.name ?? "",
        description: post.description ?? "",
        content: post.content ?? "",
        thumbnail_path: post.thumbnail_path ?? "",
        category_id: post.category_id ?? "",
        slug: post.slug ?? "",
        status: (post.status as NewsStatus) ?? "DRAFT",
        is_featured: post.is_featured ?? false,
      });
      setFormInitialized(true);
    }
  }, [post, setForm]);

  async function handleEditorUpload(file: File): Promise<(ApiFile & { url: string }) | null> {
    setIsEditorUploading(true);
    try {
      return await postsService.uploadEditorFileForPost(id, file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload ảnh thất bại");
      return null;
    } finally {
      setIsEditorUploading(false);
    }
  }

  const patchMutation = postsHooks.usePatch({
    onSuccess: () => {
      toast.success("Cập nhật tin tức thành công");
      router.push("/content/news");
    },
    onError: (err) => toast.error(err.message || "Cập nhật tin tức thất bại"),
  });

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
        const media = await postsMediaService.upload(id, pendingThumbnail, { media_type: "THUMBNAIL" });
        thumbnailPath = media.url ?? media.file_path;
        setPendingThumbnail(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload ảnh thất bại");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    patchMutation.mutate({
      id,
      data: {
        name: form.name,
        description: form.description,
        content: form.content,
        category_id: form.category_id || undefined,
        slug: form.slug.trim() || undefined,
        thumbnail_path: thumbnailPath || undefined,
        status: form.status,
        is_featured: form.is_featured,
      },
    });
  }

  const isMutating = patchMutation.isPending;
  const isSaving = isMutating || state.isUploading || state.isEditorUploading;

  return {
    ...state,
    router,
    post,
    isLoading,
    formInitialized,
    handleEditorUpload,
    handleSubmit,
    isMutating,
    isSaving,
  };
}
