"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export type SortDir = "asc" | "desc"

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={11} className="opacity-30 shrink-0" />
  return dir === "asc"
    ? <ArrowUp size={11} className="text-[#367C2B] shrink-0" />
    : <ArrowDown size={11} className="text-[#367C2B] shrink-0" />
}

export function useSortableTable<Col extends string>() {
  const [sortCol, setSortCol] = useState<Col | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(col: Col) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  function sortRows<R>(
    rows: R[],
    comparators: Partial<Record<Col, (a: R, b: R) => number>>,
  ): R[] {
    if (!sortCol) return rows
    const cmp = comparators[sortCol]
    if (!cmp) return rows
    return [...rows].sort((a, b) => {
      const result = cmp(a, b)
      return sortDir === "asc" ? result : -result
    })
  }

  return { sortCol, sortDir, toggleSort, sortRows }
}
