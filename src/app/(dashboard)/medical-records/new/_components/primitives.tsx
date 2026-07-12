import { CardHeader, CardTitle } from "@/components/ui/Card";

export function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-3 text-lg text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {step}
        </span>
        {title}
      </CardTitle>
    </CardHeader>
  );
}

export function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_120px_10px_1fr] items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
      />
    </div>
  );
}
