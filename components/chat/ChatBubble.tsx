'use client'

import { useState, useCallback } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { ChatMessages, type ChatMessage } from './ChatMessages'
import { ChatInput } from './ChatInput'

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const { text } = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan. Pastikan GROQ_API_KEY sudah dikonfigurasi dan coba lagi.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-95 h-130 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#367C2B] px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="text-white font-semibold text-sm">AI Assistant Wisel</p>
              <p className="text-green-200 text-xs">Powered by Groq · Llama 3.3</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-green-200 transition-colors"
              aria-label="Tutup chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <ChatMessages messages={messages} isLoading={isLoading} />

          {/* Input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full bg-[#367C2B] text-white shadow-lg flex items-center justify-center hover:bg-[#2d6724] transition-colors"
        aria-label={isOpen ? 'Tutup AI Chat' : 'Buka AI Chat'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
