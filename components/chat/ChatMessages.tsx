'use client'

import { useEffect, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>
          }
          return part
        })

        if (line.startsWith('### ')) return <h3 key={i} className="font-semibold mt-2 mb-0.5">{parts.slice(1)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} className="font-bold mt-2 mb-0.5">{parts.slice(1)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} className="font-bold mt-2 mb-1">{parts.slice(1)}</h1>
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <div key={i} className="flex gap-1.5"><span className="mt-0.5 shrink-0">•</span><span>{parts.slice(1)}</span></div>
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/)
          return <div key={i} className="flex gap-1.5"><span className="shrink-0">{match![1]}.</span><span>{match![2]}</span></div>
        }
        if (line === '') return <div key={i} className="h-2" />
        return <p key={i} className="leading-relaxed">{parts}</p>
      })}
    </>
  )
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-gray-500">Halo! Saya AI asisten Wisel.</p>
        <p className="text-xs text-gray-400 mt-2">Contoh pertanyaan:</p>
        <div className="mt-2 space-y-1 text-xs text-gray-400 text-left w-full max-w-65">
          <p>• &ldquo;Berapa total transaksi bulan ini?&rdquo;</p>
          <p>• &ldquo;Part apa yang paling banyak dibeli?&rdquo;</p>
          <p>• &ldquo;Cari part number RE123&rdquo;</p>
          <p>• &ldquo;Cara tambah transaksi manual?&rdquo;</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-[#367C2B] text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}
          >
            {msg.role === 'assistant' ? (
              <SimpleMarkdown text={msg.content} />
            ) : (
              <span className="whitespace-pre-wrap">{msg.content}</span>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
            <span className="flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
