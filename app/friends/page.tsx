'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, Copy, Check, Flame } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { getUser, addMissions, getCurrentWeekMonday, MOCK_FRIENDS } from '@/lib/storage'
import type { Friend } from '@/lib/types'

export default function FriendsPage() {
  const router = useRouter()
  const [friends] = useState<Friend[]>(MOCK_FRIENDS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!getUser()) { router.replace('/login'); return }
    setLoaded(true)
  }, [router])

  if (!loaded) return null

  function handleCopy(friend: Friend) {
    const weekOf = getCurrentWeekMonday()
    addMissions(friend.missions.map(m => ({
      id: `copy-${m.id}-${Date.now()}`,
      text: m.text,
      emoji: m.emoji,
      completed: false,
      weekOf,
      createdAt: new Date().toISOString(),
    })))
    setCopied(friend.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Users size={20} className="text-ice-400" />
        <h1 className="text-2xl font-black text-white">Friends</h1>
      </div>
      <p className="text-xs text-slate-500 font-semibold mb-6">
        See what your crew is up to · copy their missions for inspiration
      </p>

      <div className="space-y-3">
        {friends.map(friend => {
          const completedCount = friend.missions.filter(m => m.completed).length
          const isOpen = expanded === friend.id

          return (
            <div key={friend.id} className="glass rounded-2xl overflow-hidden animate-fade-in">
              {/* Friend row */}
              <button onClick={() => setExpanded(isOpen ? null : friend.id)}
                      className="w-full flex items-center gap-3 px-4 py-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm text-dark-950"
                     style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
                  {friend.initials}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-white">{friend.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame size={11} className="text-orange-400" />
                    <span className="text-[10px] font-bold text-orange-400">{friend.streak} week streak</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-ice-300">{completedCount}/{friend.missions.length}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">done</p>
                </div>
              </button>

              {/* Expanded missions */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-ice-400/10 pt-3 space-y-2">
                  {friend.missions.map(m => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.completed ? 'bg-ice-500 border-ice-400' : 'border-slate-600'}`}>
                        {m.completed && <Check size={10} className="text-dark-950" strokeWidth={3} />}
                      </div>
                      <span className="text-base flex-shrink-0">{m.emoji}</span>
                      <span className={`text-xs font-semibold flex-1 ${m.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {m.text}
                      </span>
                    </div>
                  ))}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleCopy(friend)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                              copied === friend.id
                                ? 'bg-green-500/20 border border-green-400/50 text-green-400'
                                : 'ice-outline-btn'
                            }`}>
                      {copied === friend.id ? (
                        <><Check size={13} /> Copied!</>
                      ) : (
                        <><Copy size={13} /> Copy Missions</>
                      )}
                    </button>

                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border border-slate-700/50 text-slate-600 relative cursor-not-allowed">
                      <MessageCircle size={13} />
                      Message
                      <span className="absolute -top-2 -right-1 bg-ice-600 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white">
                        SOON
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Coming soon banner */}
      <div className="mt-6 glass rounded-2xl px-4 py-3 border border-ice-400/10 text-center animate-fade-in">
        <p className="text-xs font-bold text-slate-500">
          🔒 Friend syncing & messaging coming soon
        </p>
      </div>

      <BottomNav />
    </main>
  )
}
