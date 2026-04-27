'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { UserPlus, Check, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUserProfile, addFriend, isFriend } from '@/lib/firestore'

export default function InvitePage() {
  const router         = useRouter()
  const params         = useParams()
  const theirUid       = params.userId as string
  const { user, loading } = useAuth()

  const [profile, setProfile]   = useState<{ name: string; email: string } | null>(null)
  const [already, setAlready]   = useState(false)
  const [adding, setAdding]     = useState(false)
  const [done, setDone]         = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!theirUid) return
    getUserProfile(theirUid).then(p => {
      if (!p) { setNotFound(true); return }
      setProfile(p)
    })
  }, [theirUid])

  useEffect(() => {
    if (!user || !theirUid) return
    isFriend(user.uid, theirUid).then(setAlready)
  }, [user, theirUid])

  async function handleAdd() {
    if (!user) { router.push('/login'); return }
    if (theirUid === user.uid) return
    setAdding(true)
    try {
      await addFriend(user.uid, theirUid)
      setDone(true)
      setAlready(true)
    } finally {
      setAdding(false)
    }
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        {notFound
          ? <p className="text-slate-500 font-semibold">Invite link not found.</p>
          : <div className="w-8 h-8 rounded-full border-2 border-ice-400/30 border-t-ice-400 animate-spin" />}
      </main>
    )
  }

  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const isSelf   = user?.uid === theirUid

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, #020617 60%)' }}>

      <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-dark-950 mb-4"
             style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 32px rgba(56,189,248,0.35)' }}>
          {initials}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-ice-400" />
          <p className="text-xs font-bold text-ice-400/70 uppercase tracking-widest">Do It Right</p>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">{profile.name}</h1>
        <p className="text-slate-500 text-sm font-semibold mb-8">wants to be your health accountability buddy 💪</p>

        {isSelf ? (
          <div className="glass rounded-2xl px-5 py-4 w-full mb-4">
            <p className="text-sm font-bold text-slate-400">This is your own invite link.</p>
            <p className="text-xs text-slate-600 font-semibold mt-1">Share it with friends so they can add you!</p>
          </div>
        ) : already || done ? (
          <div className="flex items-center gap-2 py-4 px-6 rounded-2xl mb-4"
               style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)' }}>
            <Check size={18} className="text-ice-300" strokeWidth={3} />
            <span className="text-sm font-black text-ice-300">
              {done ? 'Added as friend!' : 'Already friends'}
            </span>
          </div>
        ) : (
          <button onClick={handleAdd} disabled={adding}
                  className="ice-btn w-full py-4 flex items-center justify-center gap-2 text-sm text-dark-950 mb-4 disabled:opacity-50">
            <UserPlus size={16} strokeWidth={2.5} />
            {adding ? 'Adding…' : `Add ${profile.name.split(' ')[0]} as Friend`}
          </button>
        )}

        {!user && (
          <p className="text-xs text-slate-600 font-semibold mb-4">
            You need to <button onClick={() => router.push('/login')} className="text-ice-400 underline">sign in</button> first
          </p>
        )}

        <button onClick={() => router.push('/')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors">
          <ArrowLeft size={12} /> Back to app
        </button>
      </div>
    </main>
  )
}
