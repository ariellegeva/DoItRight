'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Target, CheckCircle, LogOut, User } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { getUser, clearUser, getMissions, calculateStreak } from '@/lib/storage'
import type { User as UserType } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [stats, setStats] = useState({ total: 0, completed: 0, streak: 0, weeks: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)

    const missions = getMissions()
    const weeks = new Set(missions.map(m => m.weekOf)).size
    setStats({
      total: missions.length,
      completed: missions.filter(m => m.completed).length,
      streak: calculateStreak(),
      weeks,
    })
    setLoaded(true)
  }, [router])

  function handleLogout() {
    clearUser()
    router.replace('/login')
  }

  if (!loaded || !user) return null

  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const statItems = [
    { icon: Flame,       value: stats.streak,         label: 'Week Streak',  color: 'text-orange-400' },
    { icon: Target,      value: stats.weeks,          label: 'Weeks Active', color: 'text-ice-300'    },
    { icon: CheckCircle, value: stats.completed,      label: 'Completed',    color: 'text-green-400'  },
    { icon: Target,      value: `${completionRate}%`, label: 'Success Rate', color: 'text-ice-300'    },
  ]

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <User size={20} className="text-ice-400" />
        <h1 className="text-2xl font-black text-white">Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-dark-950"
               style={{
                 background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                 boxShadow: '0 0 32px rgba(56,189,248,0.3)',
               }}>
            {initials}
          </div>
          {stats.streak > 0 && (
            <div className="absolute -bottom-2 -right-2 flex items-center gap-0.5 bg-orange-500 rounded-xl px-2 py-1">
              <Flame size={10} className="text-white" />
              <span className="text-[10px] font-black text-white">{stats.streak}</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-black text-white">{user.name}</h2>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">{user.email}</p>
        <p className="text-xs text-slate-600 font-semibold mt-1">Member since {memberSince}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up">
        {statItems.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {stats.total > 0 && (
        <div className="glass rounded-2xl p-4 mb-6 animate-fade-in">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">All-time completion</span>
            <span className="text-xs font-black text-ice-300">{stats.completed}/{stats.total}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
            <div className="h-full rounded-full"
                 style={{
                   width: `${completionRate}%`,
                   background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                   boxShadow: '0 0 8px rgba(56,189,248,0.4)',
                 }} />
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all active:scale-97">
        <LogOut size={16} />
        Sign Out
      </button>

      <BottomNav />
    </main>
  )
}
