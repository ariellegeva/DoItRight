'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  subscribeToMessages,
  sendMessage,
  getChatId,
  type ChatMessage,
} from '@/lib/firestore'

export default function ChatPage() {
  const router       = useRouter()
  const params       = useParams()
  const chatId       = params.chatId as string
  const { user, loading } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  // Extract the other user's uid from chatId (sorted pair)
  const otherUid = chatId?.split('_').find(id => id !== user?.uid) ?? ''

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
  }, [user, loading, router])

  useEffect(() => {
    if (!chatId) return
    const unsub = subscribeToMessages(chatId, setMessages)
    return unsub
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!user || !input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      await sendMessage(chatId, user.uid, user.displayName ?? 'You', text)
    } finally {
      setSending(false)
    }
  }

  if (loading || !user) return null

  return (
    <main className="flex flex-col h-screen max-w-md mx-auto"
          style={{ background: '#020617' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(56,189,248,0.1)', background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => router.push('/friends')}
                className="p-2 rounded-xl text-slate-500 hover:text-ice-400 hover:bg-ice-400/10 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-sm font-black text-white leading-none">Message</p>
          <p className="text-[10px] text-slate-600 font-semibold mt-0.5">End-to-end between friends</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <p className="text-slate-500 font-semibold text-sm">No messages yet</p>
            <p className="text-slate-600 text-xs font-semibold mt-1">Say hi! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.senderUid === user.uid
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                mine
                  ? 'text-dark-950 rounded-br-sm'
                  : 'text-white rounded-bl-sm'
              }`}
              style={mine
                ? { background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }
                : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
           style={{ borderTop: '1px solid rgba(56,189,248,0.1)', background: 'rgba(2,6,23,0.95)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Message…"
          className="flex-1 bg-dark-800 border border-slate-700/50 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-600 font-semibold focus:outline-none focus:border-ice-400/40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
          <Send size={16} className="text-dark-950" strokeWidth={2.5} />
        </button>
      </div>
    </main>
  )
}
