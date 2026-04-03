import { STATUS_MAP } from "@/data/customer"

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP["menunggu"]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
      <s.icon size={11} />
      {s.label}
    </span>
  )
}
