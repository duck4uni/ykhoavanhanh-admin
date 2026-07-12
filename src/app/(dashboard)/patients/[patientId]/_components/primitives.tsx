/** Các khối trình bày dùng lại trong trang chi tiết bệnh nhân. */

export function EmptyTab({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-slate-800">{value || "—"}</span>
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-700">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
