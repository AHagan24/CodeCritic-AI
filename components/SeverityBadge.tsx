import type { Severity } from "@/app/types/review";

const severityStyles: Record<Severity, string> = {
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  high: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  critical: "border-rose-500/20 bg-rose-500/10 text-rose-200",
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  );
}
