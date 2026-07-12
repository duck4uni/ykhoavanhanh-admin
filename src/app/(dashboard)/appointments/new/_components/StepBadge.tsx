/** Số thứ tự bước trong tiêu đề section. */
export function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
      {n}
    </span>
  );
}
