'use client'

import { Send } from 'lucide-react'
import { KeyboardEvent } from 'react'

interface ChatInputProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t bg-white">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tanya sesuatu... (Enter kirim)"
        rows={1}
        style={{ resize: 'none' }}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#367C2B] disabled:bg-gray-50"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#367C2B] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#2d6724] transition-colors"
        aria-label="Kirim pesan"
      >
        <Send size={15} />
      </button>
    </div>
  )
}
