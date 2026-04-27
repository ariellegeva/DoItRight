'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, Check, CheckCheck } from 'lucide-react'
import clsx from 'clsx'
import { replaceWeekMissions, getCurrentWeekMonday } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import type { ChatMessage, Mission } from '@/lib/types'

interface ParsedMission {
  id: string
  emoji: string
  text: string
}

interface Props {
  mode: 'new' | 'edit'
  initialMissions?: Mission[]   // existing missions when in edit mode
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
  return text.split('\n').filter(l => !l.match(/^\[MISSION\]/)).join('\n').trim()
}

export default function ChatModal({ mode, initialMissions = [], onClose, onMissionsAdded }: Props) {
  const { user } = useAuth()
  const seedMissions: ParsedMission[] = initialMissions.map(m => ({ id: m.id, emoji: m.emoji, text: m.text }))

  const [messages, setMessages]             = useState<(ChatMessage & { id: string })[]>([])
  const [input, setInput]                   = useState('')
  const [isStreaming, setIsStreaming]       = useState(false)
  const [latestMissions, setLatestMissions] = useState<ParsedMission[]>(mode === 'edit' ? seedMissions : [])
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set(mode === 'edit' ? seedMissions.map(m => m.id) : []))
  const scrollRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, latestMissions, isStreaming])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (mode === 'edit' && initialMissions.length > 0) {
      const missionList = initialMissions
        .map((m, i) => `${i + 1}. ${m.emoji} ${m.text}`)
        .join('\n')
      streamAI([{
        role: 'user',
        content: `My current missions this week are:\n${missionList}\n\nLet's review them together.`,
      }])
    } else {
      streamAI([{ role: 'user', content: 'Hello! Please suggest my weekly health missions.' }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function streamAI(apiMessages: { role: string; content: string }[]) {
    setIsStreaming(true)
    const aiId = `ai-${Date.now()}`
    setMessages(prev => [...prev.filter(m => m.content !== ''), { id: aiId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'API error')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m))
      }

      const parsed = parseMissions(fullText)
      if (parsed.length > 0) {
        setLatestMissions(parsed)
        setSelectedIds(new Set(parsed.map(m => m.id)))
      }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : ''
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, content: `Couldn't reach the AI. ${detail || 'Check your API key and restart the dev server.'}` } : m
      ))
    } finally {
      setIsStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')

    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)

    // Build API history: prepend the hidden initial message so AI has context
    const hiddenInit = mode === 'edit' && initialMissions.length > 0
      ? [{
          role: 'user' as const,
          content: `My current missions this week are:\n${initialMissions.map((m, i) => `${i + 1}. ${m.emoji} ${m.text}`).join('\n')}\n\nLet's review them together.`,
        }]
      : [{ role: 'user' as const, content: 'Hello! Please suggest my weekly health missions.' }]

    const aiHistory = updated.filter(m => m.content !== '').map(m => ({ role: m.role, content: m.content }))
    streamAI([hiddenInit[0], ...aiHistory.slice(1)])
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() { setSelectedIds(new Set(latestMissions.map(m => m.id))) }

  async function handleAddMissions() {
    if (!user) return
    const selected = latestMissions.filter(m => selectedIds.has(m.id))
    if (selected.length === 0) return
    const weekOf = getCurrentWeekMonday()
    const missions: Mission[] = selected.map(m => ({
      id: `${m.id}-${Date.now()}`,
      text: m.text,
      emoji: m.emoji,
      completed: false,
      checkins: [],
      weekOf,
      createdAt: new Date().toISOString(),
    }))
    await replaceWeekMissions(user.uid, weekOf, missions)
    onMissionsAdded()
    onClose()
  }

  const allSelected = latestMissions.length > 0 && selectedIds.size === latestMissions.length

  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
         style={{ background: 'rgba(2,6,23,0.98)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4"
           style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 14px rgba(56,189,248,0.5)' }}>
            <Sparkles size={16} className="text-dark-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Your Wellness Coach</p>
            <p className="text-[10px] text-ice-400/60 font-semibold">
              {mode === 'edit' ? 'Editing your missions' : 'Powered by Groq'}
            </p>
          </div>
        </div>
        <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      {/* Hint bar — only when missions are ready to confirm */}
      {latestMissions.length > 0 && !isStreaming && (
        <div className="flex-shrink-0 px-4 py-3 space-y-2"
             style={{ background: 'rgba(56,189,248,0.05)', borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
          <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Your options</p>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5 px-2"
                 style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}>
              <CheckCheck size={16} className="text-ice-300" />
              <span className="text-[11px] font-black text-ice-300 text-center leading-tight">Accept all</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5 px-2"
                 style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <Check size={16} className="text-ice-400" />
              <span className="text-[11px] font-black text-ice-400 text-center leading-tight">Pick some</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-2.5 px-2"
                 style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <Send size={16} className="text-slate-400" />
              <span className="text-[11px] font-black text-slate-400 text-center leading-tight">Keep chatting</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages + mission cards */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
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
              msg.role === 'user' ? 'rounded-tr-sm text-dark-950' : 'glass text-slate-200 rounded-tl-sm',
            )}
            style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' } : {}}>
              <span className="whitespace-pre-wrap">
                {msg.role === 'assistant' ? stripMissionLines(msg.content) : msg.content}
                {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                  <span className="inline-block w-1 h-4 ml-0.5 bg-ice-400 animate-pulse rounded-sm align-middle" />
                )}
              </span>
            </div>
          </div>
        ))}

        {/* Mission cards */}
        {latestMissions.length > 0 && !isStreaming && (
          <div className="space-y-2 animate-slide-up pb-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-ice-400/60 font-bold uppercase tracking-widest">
                {mode === 'edit' ? 'Updated missions' : 'Suggested missions'}
              </p>
              <button onClick={allSelected ? () => setSelectedIds(new Set()) : selectAll}
                      className="text-[11px] font-black text-ice-400 hover:text-ice-200 transition-colors">
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            {latestMissions.map(m => (
              <button key={m.id} onClick={() => toggleSelect(m.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                        selectedIds.has(m.id) ? 'border border-ice-400/50' : 'glass opacity-60',
                      )}
                      style={selectedIds.has(m.id) ? { background: 'rgba(56,189,248,0.1)' } : {}}>
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
            <p className="text-center text-[10px] text-slate-600 font-semibold pt-1">
              We recommend 3–7 missions per week
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 space-y-2"
           style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}>
        {latestMissions.length > 0 && (
          <button onClick={handleAddMissions} disabled={selectedIds.size === 0}
                  className="ice-btn w-full py-3 text-sm text-dark-950 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Check size={15} strokeWidth={3} />
            {mode === 'edit' ? 'Save' : 'Add'} {selectedIds.size > 0 ? selectedIds.size : ''} Mission{selectedIds.size !== 1 ? 's' : ''}
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              mode === 'edit'
                ? 'What would you like to change?'
                : latestMissions.length > 0
                ? 'Swap a mission, add one, ask for changes…'
                : 'Tell me about your lifestyle…'
            }
            disabled={isStreaming}
            className="flex-1 glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-ice-400/50 transition-all disabled:opacity-40"
          />
          <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 14px rgba(56,189,248,0.3)' }}>
            <Send size={16} className="text-dark-950" />
          </button>
        </div>
      </div>
    </div>
  )
}
