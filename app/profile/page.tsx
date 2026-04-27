'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Target, CheckCircle, LogOut, User } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getMissions, calculateStreakFromMissions } from '@/lib/firestore'
import type { Mission } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loaded, setLoaded]     = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    getMissions(user.uid).then(m => { setMissions(m); setLoaded(true) })
  }, [user, loading, router])

  async function handleLogout() {
    await signOut(auth)
    router.replace('/login')
  }

  if (!loaded || !user) return null

  const name     = user.displayName || user.email || 'You'
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const streak   = calculateStreakFromMissions(missions)
  const weeks    = new Set(missions.map(m => m.weekOf)).size
  const completed = missions.filter(m => m.checkins?.length).length
  const total     = missions.length
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0
  const since     = new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const statItems = [
    { icon: Flame,       value: streak,    label: 'Week Streak',  color: 'text-orange-400' },
    { icon: Target,      value: weeks,     label: 'Weeks Active', color: 'text-ice-300'    },
    { icon: CheckCircle, value: completed, label: 'Completed',    color: 'text-green-400'  },
    { icon: Target,      value: `${rate}%`,label: 'Success Rate', color: 'text-ice-300'    },
  ]

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <User size={20} className="text-ice-400" />
        <h1 className="text-2xl font-black text-white">Profile</h1>
      </div>

      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-dark-950"
               style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 32px rgba(56,189,248,0.3)' }}>
            {initials}
          </div>
          {streak > 0 && (
            <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-orange-500 rounded-xl px-2 py-1">
              <Flame size={10} className="text-white" />
              <span className="text-[10px] font-black text-white">{streak}</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-black text-white">{name}</h2>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">{user.email}</p>
        <p className="text-xs text-slate-600 font-semibold mt-1">Member since {since}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up">
        {statItems.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">All-time completion</span>
            <span className="text-xs font-black text-ice-300">{completed}/{total}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${rate}%`, background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 8px rgba(56,189,248,0.4)' }} />
          </div>
        </div>
      )}

      <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all active:scale-97">
        <LogOut size={16} /> Sign Out
      </button>

      <BottomNav />
    </main>
  )
}
