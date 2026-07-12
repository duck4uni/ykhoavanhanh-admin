import { Image as ImageIcon } from "lucide-react";
import { ThumbnailUpload } from "@/components/hospital-admin/ThumbnailUpload";

type Props = {
  value: string;
  onChange: (url: string) => void;
  pendingFile: File | null;
  onPendingChange: (file: File | null) => void;
};

/** Card ảnh đại diện bài viết. */
export function NewsThumbnailCard({ value, onChange, pendingFile, onPendingChange }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Ảnh đại diện</h2>
          <p className="text-xs text-slate-400 mt-0.5">Hiển thị trong danh sách tin tức</p>
        </div>
      </div>
      <div className="p-6">
        <ThumbnailUpload
          value={value}
          onChange={onChange}
          pendingFile={pendingFile}
          onPendingChange={onPendingChange}
        />
      </div>
    </section>
  );
}
