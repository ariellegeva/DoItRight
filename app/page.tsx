'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Target, RefreshCw, Copy } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import MissionCard from '@/components/MissionCard'
import ChatModal from '@/components/ChatModal'
import { useAuth } from '@/context/AuthContext'
import {
  getMissionsForWeek, getLastWeekMissions, replaceWeekMissions,
  getCurrentWeekMonday, formatWeekLabel, getToday,
} from '@/lib/firestore'
import type { Mission } from '@/lib/types'

type ChatMode = 'new' | 'edit'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [missions, setMissions]               = useState<Mission[]>([])
  const [lastWeekMissions, setLastWeekMissions] = useState<Mission[]>([])
  const [chatOpen, setChatOpen]               = useState(false)
  const [chatMode, setChatMode]               = useState<ChatMode>('new')
  const [weekLabel, setWeekLabel]             = useState('')
  const [isMonday, setIsMonday]               = useState(false)
  const [dataLoading, setDataLoading]         = useState(true)

  const loadMissions = useCallback(async () => {
    if (!user) return
    const weekOf = getCurrentWeekMonday()
    const [current, lastWeek] = await Promise.all([
      getMissionsForWeek(user.uid, weekOf),
      getLastWeekMissions(user.uid),
    ])
    setMissions(current)
    setLastWeekMissions(lastWeek)
    setWeekLabel(formatWeekLabel(weekOf))
    setIsMonday(new Date().getDay() === 1)
    setDataLoading(false)
  }, [user])

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (user) loadMissions()
  }, [user, loading, router, loadMissions])

  if (loading || dataLoading) return null

  const today     = getToday()
  const doneToday = missions.filter(m => (m.checkins ?? []).includes(today)).length
  const total     = missions.length
  const progress  = total > 0 ? Math.round((doneToday / total) * 100) : 0

  function openChat(mode: ChatMode) { setChatMode(mode); setChatOpen(true) }

  async function handleKeepLastWeek() {
    if (!user) return
    const weekOf = getCurrentWeekMonday()
    const copied: Mission[] = lastWeekMissions.map(m => ({
      ...m,
      id: `copy-${m.id}-${Date.now()}`,
      weekOf,
      completed: false,
      checkins: [],
      createdAt: new Date().toISOString(),
    }))
    await replaceWeekMissions(user.uid, weekOf, copied)
    await loadMissions()
    setChatMode('edit')
    setChatOpen(true)
  }

  const showNewWeek = isMonday && missions.length === 0

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Do It Right</h1>
          <p className="text-xs text-ice-400/60 font-bold mt-0.5">Week of {weekLabel}</p>
        </div>
        {missions.length > 0 && (
          <button onClick={() => openChat('edit')}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <Plus size={18} className="text-ice-300" />
          </button>
        )}
      </div>

      {missions.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Weekly Progress</span>
            <span className="text-sm font-black text-ice-300">{doneToday}/{total} today</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 8px rgba(56,189,248,0.5)' }} />
          </div>
          {progress === 100 && (
            <p className="text-center text-xs font-black text-ice-300 mt-2 animate-fade-in">
              🏆 All missions done today — you crushed it!
            </p>
          )}
        </div>
      )}

      {missions.length > 0 ? (
        <div className="space-y-3">
          {missions.map(m => <MissionCard key={m.id} mission={m} onUpdate={loadMissions} />)}
        </div>
      ) : showNewWeek ? (
        <div className="flex flex-col items-center text-center animate-fade-in pt-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-1">New week!</h2>
          <p className="text-slate-500 text-sm font-semibold mb-8 max-w-xs leading-relaxed">
            Time to set your goals. Start fresh or carry over last week's missions.
          </p>
          <div className="w-full space-y-3">
            <button onClick={() => openChat('new')}
                    className="ice-btn w-full py-4 flex items-center justify-center gap-2 text-sm text-dark-950">
              <Sparkles size={16} /> Customize new missions
            </button>
            {lastWeekMissions.length > 0 && (
              <button onClick={handleKeepLastWeek}
                      className="ice-outline-btn w-full py-4 flex items-center justify-center gap-2 text-sm">
                <Copy size={15} /> Keep last week's missions
              </button>
            )}
            <button onClick={() => openChat('new')}
                    className="w-full py-3 text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={12} /> Start completely fresh
            </button>
          </div>
          <p className="text-ice-400/40 text-xs font-bold mt-6">We recommend 3–7 missions per week</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
                 style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <Target size={44} className="text-ice-400/60" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 16px rgba(56,189,248,0.5)' }}>
              <Sparkles size={14} className="text-dark-950" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">No missions yet</h2>
          <p className="text-slate-500 text-sm font-semibold mb-8 max-w-xs leading-relaxed">
            Chat with your AI coach to build a personalized set of weekly health missions.
          </p>
          <p className="text-ice-400/50 text-xs font-bold mb-6">We recommend 3–7 missions per week</p>
          <button onClick={() => openChat('new')} className="ice-btn px-8 py-4 text-base text-dark-950 animate-glow-pulse">
            Begin Your Week ✨
          </button>
        </div>
      )}

      {chatOpen && (
        <ChatModal
          mode={chatMode}
          initialMissions={chatMode === 'edit' ? missions : []}
          onClose={() => setChatOpen(false)}
          onMissionsAdded={loadMissions}
        />
      )}

      <BottomNav />
    </main>
  )
}
