import { AlignLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { TextEditor } from "@/components/shares/rich-text-editor";
import type { ApiFile } from "@/components/shares/rich-text-editor/types/types";

type Props = {
  content: string;
  onChangeContent: (value: string) => void;
  onUpload: (file: File) => Promise<(ApiFile & { url: string }) | null>;
  isEditorUploading: boolean;
  /** Chiều cao tối thiểu vùng soạn thảo (khác nhau giữa trang tạo & sửa). */
  minHeightClass?: string;
  /** Key ép re-mount editor khi dữ liệu prefill sẵn sàng (trang sửa). */
  editorKey?: string;
};

/** Card trình soạn thảo nội dung bài viết. */
export function NewsContentCard({
  content,
  onChangeContent,
  onUpload,
  isEditorUploading,
  minHeightClass = "min-h-[600px]",
  editorKey,
}: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <AlignLeft className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Nội dung bài viết</h2>
            <p className="text-xs text-slate-400 mt-0.5">Soạn thảo nội dung chi tiết với trình soạn thảo</p>
          </div>
        </div>
        {isEditorUploading && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Spinner size="sm" />
            <span>Đang upload ảnh...</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <TextEditor
          key={editorKey}
          content={content}
          onChangeContent={onChangeContent}
          contentClassName={`${minHeightClass} rounded-xl border border-slate-200 text-sm`}
          uploadFile={{
            onUpload,
            isLoading: isEditorUploading,
            baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
          }}
        />
      </div>
    </section>
  );
}
