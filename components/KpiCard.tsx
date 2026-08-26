export function KpiCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-[10px] px-5 py-[18px]">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className="font-mono text-[26px] font-semibold mt-2 tabular-nums">
        {value}
      </div>
      <div className="text-[13px] mt-1.5" style={{ color: subColor ?? "var(--ink-2)" }}>
        {sub}
      </div>
    </div>
  );
}
