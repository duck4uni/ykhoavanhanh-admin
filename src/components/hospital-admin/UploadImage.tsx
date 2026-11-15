"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { X, UploadCloud } from "lucide-react";
import { Link } from "@/lib/link";
interface UploadImageProps {
  existingUrls: string[];
  pendingFiles: File[];
  onExistingChange: (urls: string[]) => void;
  onPendingChange: (files: File[]) => void;
}

export function UploadImage({
  existingUrls,
  pendingFiles,
  onExistingChange,
  onPendingChange,
}: UploadImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [previews, setPreviews] = useState<string[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => [...prev, previewUrl]);
    onPendingChange([...pendingFiles, file]);
    e.target.value = "";
  }

  function handleRemoveExisting(url: string) {
    onExistingChange(existingUrls.filter((u) => u !== url));
  }

  function handleRemovePending(index: number) {
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    onPendingChange(newFiles);
    setPreviews(newPreviews);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud data-icon="inline-start" />
        Chọn ảnh
      </Button>

      {(existingUrls.length > 0 || previews.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {existingUrls.map((url) => (
            <div key={url} className="relative group w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL ảnh động từ backend, chưa khai báo remotePatterns cho next/image */}
              <img
                src={Link.imgEndpoid + url}
                alt="preview"
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveExisting(url)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Xóa"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {previews.map((url, idx) => (
            <div key={url} className="relative group w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước dạng blob URL, next/image không hỗ trợ */}
              <img
                src={url}
                alt="preview"
                className="w-full h-full object-cover rounded-lg border border-gray-200 opacity-80"
              />
              <span className="absolute bottom-1 left-1 text-[10px] bg-yellow-500 text-white px-1 rounded">Chưa upload</span>
              <button
                type="button"
                onClick={() => handleRemovePending(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Xóa"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
