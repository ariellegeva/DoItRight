'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Check, ChevronDown, ChevronUp } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import { getMissions, getPastWeeks, formatWeekLabel } from '@/lib/firestore'
import type { Mission } from '@/lib/types'

interface WeekGroup {
  weekOf: string
  label: string
  missions: Mission[]
  completed: number
}

export default function PastPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [groups, setGroups]     = useState<WeekGroup[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loaded, setLoaded]     = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    async function load() {
      const [weeks, all] = await Promise.all([getPastWeeks(user!.uid), getMissions(user!.uid)])
      const built: WeekGroup[] = weeks.map(weekOf => {
        const m = all.filter(x => x.weekOf === weekOf)
        return { weekOf, label: formatWeekLabel(weekOf), missions: m, completed: m.filter(x => x.checkins?.length).length }
      })
      setGroups(built)
      if (built.length > 0) setExpanded(new Set([built[0].weekOf]))
      setLoaded(true)
    }
    load()
  }, [user, loading, router])

  if (!loaded) return null

  function toggle(weekOf: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(weekOf) ? n.delete(weekOf) : n.add(weekOf); return n })
  }

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} className="text-ice-400" />
        <h1 className="text-2xl font-black text-white">Past Missions</h1>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)' }}>
            <Clock size={28} className="text-ice-400/40" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">No past missions yet.</p>
          <p className="text-slate-600 text-xs font-semibold mt-1">Complete a week first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const pct  = group.missions.length > 0 ? Math.round((group.completed / group.missions.length) * 100) : 0
            const open = expanded.has(group.weekOf)
            return (
              <div key={group.weekOf} className="glass rounded-2xl overflow-hidden animate-fade-in">
                <button onClick={() => toggle(group.weekOf)} className="w-full flex items-center justify-between px-4 py-4">
                  <div className="text-left">
                    <p className="text-sm font-black text-white">Week of {group.label}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{group.completed}/{group.missions.length} missions with check-ins</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black ${pct === 100 ? 'text-ice-300' : 'text-slate-400'}`}>{pct}%</span>
                    {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </button>
                <div className="px-4 pb-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)' : 'rgba(56,189,248,0.4)' }} />
                  </div>
                </div>
                {open && (
                  <div className="px-4 pb-4 pt-3 space-y-2 border-t border-ice-400/10 mt-2">
                    {group.missions.map(m => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${m.checkins?.length ? 'bg-ice-500 border-ice-400' : 'border-slate-600'}`}>
                          {m.checkins?.length ? <Check size={10} className="text-dark-950" strokeWidth={3} /> : null}
                        </div>
                        <span className="text-base flex-shrink-0">{m.emoji}</span>
                        <span className={`text-xs font-semibold ${m.checkins?.length ? 'text-slate-400' : 'text-slate-500'}`}>{m.text}</span>
                        {m.checkins?.length ? <span className="ml-auto text-[10px] font-black text-ice-400/50">{m.checkins.length}×</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <BottomNav />
    </main>
  )
}
