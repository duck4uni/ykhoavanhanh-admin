/**
 * Input – wraps shadcn/ui Input, giữ nguyên API cũ (label, error, hint).
 */
import * as React from "react";
import { cn } from "@/lib/utils";

function RequiredLabel({ label }: { label: string }) {
  const required = label.trimEnd().endsWith("*");
  const text = required ? label.trimEnd().slice(0, -1).trimEnd() : label;
  return (
    <>
      {text}
      {required && <span className="ml-1 text-red-500">*</span>}
    </>
  );
}

// Inline shadcn/ui Input để tránh case conflict trên Windows
function ShadcnInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { ShadcnInput };

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            <RequiredLabel label={label} />
          </label>
        )}
        <ShadcnInput
          ref={ref}
          aria-invalid={!!error}
          className={cn(error && "border-destructive focus-visible:ring-destructive/50", className)}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
