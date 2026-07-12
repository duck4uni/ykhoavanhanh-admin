import { ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "../statusConfig";
import type { NewsStatus } from "../types";

type Props = {
  headerLabel: string;
  status: NewsStatus;
  isSaving: boolean;
  submitLabel: string;
  onBack: () => void;
  onSubmit: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
};

/** Khung layout chung của trang soạn tin: thanh trên + lưới 2 cột. */
export function NewsEditorShell({ headerLabel, status, isSaving, submitLabel, onBack, onSubmit, left, right }: Props) {
  const currentStatus = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-[100dvh] bg-slate-50/50">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200/80 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 hover:text-slate-800 -ml-2">
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <div className="w-px h-5 bg-slate-200" />
            <span className="text-sm font-medium text-slate-800">{headerLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", currentStatus.color)}>
              <StatusIcon className="w-3 h-3" />
              {currentStatus.label}
            </div>
            <Button type="button" onClick={onSubmit} disabled={isSaving} size="sm" className="gap-2 shadow-sm active:scale-[0.98] transition-transform">
              {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">{left}</div>
          <div className="space-y-6 lg:sticky lg:top-[4.5rem] lg:self-start">{right}</div>
        </div>
      </div>
    </div>
  );
}
