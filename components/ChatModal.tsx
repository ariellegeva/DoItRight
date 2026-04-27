'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, Check } from 'lucide-react'
import clsx from 'clsx'
import { addMissions, getCurrentWeekMonday } from '@/lib/storage'
import type { ChatMessage, Mission } from '@/lib/types'

interface ParsedMission {
  id: string
  emoji: string
  text: string
}

interface Props {
  onClose: () => void
  onMissionsAdded: () => void
}

function parseMissions(text: string): ParsedMission[] {
  const lines = text.split('\n')
  const missions: ParsedMission[] = []

  for (const line of lines) {
    const match = line.match(/^\[MISSION\]\s+(.+)/)
    if (!match) continue
    const raw = match[1].trim()
    const emojiMatch = raw.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])\s*/)
    const emoji = emojiMatch ? emojiMatch[1] : '✅'
    const missionText = emojiMatch ? raw.slice(emojiMatch[0].length).trim() : raw
    missions.push({ id: `m-${Date.now()}-${missions.length}`, emoji, text: missionText })
  }
  return missions
}

function stripMissionLines(text: string): string {
  return text
    .split('\n')
    .filter(line => !line.match(/^\[MISSION\]/))
    .join('\n')
    .trim()
}

export default function ChatModal({ onClose, onMissionsAdded }: Props) {
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [latestMissions, setLatestMissions] = useState<ParsedMission[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isStreaming])

  // Trigger initial AI message on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    streamAI([{ role: 'user', content: 'Hello! Please suggest my weekly health missions.' }], true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function streamAI(apiMessages: { role: string; content: string }[], isInitial = false) {
    setIsStreaming(true)
    const aiId = `ai-${Date.now()}`

    if (!isInitial) {
      setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '' }])
    } else {
      setMessages([{ id: aiId, role: 'assistant', content: '' }])
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages(prev =>
          prev.map(m => m.id === aiId ? { ...m, content: fullText } : m)
        )
      }

      const parsed = parseMissions(fullText)
      if (parsed.length > 0) {
        setLatestMissions(parsed)
        setSelectedIds(new Set(parsed.map(m => m.id)))
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === aiId
          ? { ...m, content: "Hmm, couldn't reach the AI right now. Check your API key and try again!" }
          : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')

    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    const apiHistory = updatedMessages
      .filter(m => !(m.id.startsWith('ai-') && m.content === ''))
      .map(m => ({ role: m.role, content: m.content }))

    streamAI(apiHistory)
  }

  function toggleMissionSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleAddMissions() {
    const selected = latestMissions.filter(m => selectedIds.has(m.id))
    if (selected.length === 0) return

    const weekOf = getCurrentWeekMonday()
    const missions: Mission[] = selected.map(m => ({
      id: `${m.id}-${Date.now()}`,
      text: m.text,
      emoji: m.emoji,
      completed: false,
      weekOf,
      createdAt: new Date().toISOString(),
    }))

    addMissions(missions)
    onMissionsAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in"
         style={{ background: 'rgba(2,6,23,0.97)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
           style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 14px rgba(56,189,248,0.5)' }}>
            <Sparkles size={16} className="text-dark-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Your Wellness Coach</p>
            <p className="text-[10px] text-ice-400/60 font-semibold">Powered by Claude AI</p>
          </div>
        </div>
        <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <div className="flex gap-1 py-1">
                <span className="typing-dot w-2 h-2 rounded-full bg-ice-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-ice-400 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-ice-400 inline-block" />
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'rounded-2xl px-4 py-3 max-w-[85%] text-sm font-semibold leading-relaxed',
              msg.role === 'user'
                ? 'text-dark-950 rounded-tr-sm'
                : 'glass text-slate-200 rounded-tl-sm',
            )}
            style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' } : {}}>
              {msg.role === 'assistant' ? (
                <>
                  <span className="whitespace-pre-wrap">
                    {stripMissionLines(msg.content)}
                    {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-1 h-4 ml-0.5 bg-ice-400 animate-pulse rounded-sm align-middle" />
                    )}
                  </span>
                </>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Mission suggestion cards */}
        {latestMissions.length > 0 && !isStreaming && (
          <div className="space-y-2 animate-slide-up">
            <p className="text-xs text-ice-400/60 font-bold uppercase tracking-widest px-1 pt-1">
              Suggested Missions — tap to select
            </p>
            {latestMissions.map(m => (
              <button key={m.id} onClick={() => toggleMissionSelect(m.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 active:scale-98',
                        selectedIds.has(m.id)
                          ? 'bg-ice-500/15 border border-ice-400/50'
                          : 'glass opacity-60',
                      )}>
                <div className={clsx(
                  'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                  selectedIds.has(m.id) ? 'bg-ice-500 border-ice-400' : 'border-slate-600',
                )}>
                  {selectedIds.has(m.id) && <Check size={12} className="text-dark-950" strokeWidth={3} />}
                </div>
                <span className="text-lg flex-shrink-0">{m.emoji}</span>
                <span className="text-sm font-semibold text-white leading-snug">{m.text}</span>
              </button>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleAddMissions}
                      disabled={selectedIds.size === 0}
                      className="ice-btn flex-1 py-3 text-sm text-dark-950 disabled:opacity-30 disabled:cursor-not-allowed">
                Add {selectedIds.size > 0 ? selectedIds.size : ''} Mission{selectedIds.size !== 1 ? 's' : ''} to My Week ✓
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 font-semibold">
              We recommend 3–7 missions per week
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3" style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Customize your missions…"
            disabled={isStreaming}
            className="flex-1 glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-ice-400/50 transition-all disabled:opacity-40"
          />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 14px rgba(56,189,248,0.3)' }}>
            <Send size={16} className="text-dark-950" />
          </button>
        </div>
      </div>
    </div>
  )
}
