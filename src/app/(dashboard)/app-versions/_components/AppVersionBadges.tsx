import { normalizeValue, platformLabel, statusLabel, updateTypeLabel } from "../types";

const BADGE_BASE = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";

export function PlatformBadge({ value }: { value: string }) {
  const isIos = normalizeValue(value) === "ios";
  return (
    <span
      className={`${BADGE_BASE} ${
        isIos ? "border-slate-200 bg-slate-100 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-600"
      }`}
    >
      {platformLabel(value)}
    </span>
  );
}

export function UpdateTypeBadge({ value }: { value: string }) {
  const v = normalizeValue(value);
  const isForce = v === "force" || v === "required";
  return (
    <span
      className={`${BADGE_BASE} ${
        isForce ? "border-red-200 bg-red-50 text-red-600" : "border-sky-200 bg-sky-50 text-sky-600"
      }`}
    >
      {updateTypeLabel(value)}
    </span>
  );
}

export function VersionStatusBadge({ value }: { value: string }) {
  const active = normalizeValue(value) === "active";
  return (
    <span
      className={`${BADGE_BASE} ${
        active ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {statusLabel(value)}
    </span>
  );
}
