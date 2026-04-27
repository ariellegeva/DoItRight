'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Target } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import MissionCard from '@/components/MissionCard'
import ChatModal from '@/components/ChatModal'
import {
  getUser,
  getMissionsForWeek,
  getCurrentWeekMonday,
  formatWeekLabel,
} from '@/lib/storage'
import type { Mission } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [weekLabel, setWeekLabel] = useState('')
  const [loaded, setLoaded] = useState(false)

  const loadMissions = useCallback(() => {
    const weekOf = getCurrentWeekMonday()
    setMissions(getMissionsForWeek(weekOf))
    setWeekLabel(formatWeekLabel(weekOf))
  }, [])

  useEffect(() => {
    const user = getUser()
    if (!user) { router.replace('/login'); return }
    loadMissions()
    setLoaded(true)
  }, [router, loadMissions])

  if (!loaded) return null

  const today = new Date().toISOString().split('T')[0]
  const doneToday = missions.filter(m => (m.checkins ?? []).includes(today)).length
  const total = missions.length
  const progress = total > 0 ? Math.round((doneToday / total) * 100) : 0

  return (
    <main className="page-container max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Do It Right</h1>
          <p className="text-xs text-ice-400/60 font-bold mt-0.5">Week of {weekLabel}</p>
        </div>
        {missions.length > 0 && (
          <button onClick={() => setChatOpen(true)}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <Plus size={18} className="text-ice-300" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {missions.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">Weekly Progress</span>
            <span className="text-sm font-black text-ice-300">{doneToday}/{total} today</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                boxShadow: '0 0 8px rgba(56,189,248,0.5)',
              }}
            />
          </div>
          {progress === 100 && (
            <p className="text-center text-xs font-black text-ice-300 mt-2 animate-fade-in">
              🏆 All missions done today — you crushed it!
            </p>
          )}
        </div>
      )}

      {/* Mission list */}
      {missions.length > 0 ? (
        <div className="space-y-3">
          {missions.map(m => (
            <div key={m.id} className="group">
              <MissionCard mission={m} onUpdate={loadMissions} />
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-2"
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

          <button
            onClick={() => setChatOpen(true)}
            className="ice-btn px-8 py-4 text-base text-dark-950 animate-glow-pulse"
          >
            Begin Your Week ✨
          </button>
        </div>
      )}

      {chatOpen && (
        <ChatModal
          onClose={() => setChatOpen(false)}
          onMissionsAdded={loadMissions}
        />
      )}

      <BottomNav />
    </main>
  )
}
