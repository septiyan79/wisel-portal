"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

interface PaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function handlePageSize(e: React.ChangeEvent<HTMLSelectElement>) {
    onPageSizeChange(Number(e.target.value))
    onPageChange(1)
  }

  const btnBase = "flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold transition-colors"
  const btnActive = "bg-[#367C2B] text-white"
  const btnInactive = "text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap px-5 py-3.5 border-t border-gray-100">
      {/* Rows per page */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={handlePageSize}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Info + nav */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">
          {from}–{to} of {total}
        </span>

        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnInactive : btnInactive}`}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} ${btnInactive}`}
          title="Previous"
        >
          <ChevronLeft size={14} />
        </button>

        <span className={`${btnBase} ${btnActive} min-w-7 px-2`}>{page}</span>
        <span className="text-xs text-gray-400">/ {totalPages}</span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} ${btnInactive}`}
          title="Next"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={`${btnBase} ${btnInactive}`}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
