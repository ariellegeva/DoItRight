'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageCircle, Link, Check } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import { getFriends, removeFriend, getChatId, type FriendRecord } from '@/lib/firestore'

export default function FriendsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [friends, setFriends]   = useState<FriendRecord[]>([])
  const [copied, setCopied]     = useState(false)
  const [loaded, setLoaded]     = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!user) return
    getFriends(user.uid).then(f => { setFriends(f); setLoaded(true) })
  }, [user, loading, router])

  if (!loaded) return null

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${user?.uid}`
    : ''

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleRemove(theirUid: string) {
    if (!user) return
    await removeFriend(user.uid, theirUid)
    setFriends(prev => prev.filter(f => f.uid !== theirUid))
  }

  return (
    <main className="page-container max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Users size={20} className="text-ice-400" />
        <h1 className="text-2xl font-black text-white">Friends</h1>
      </div>
      <p className="text-xs text-slate-500 font-semibold mb-5">
        Invite friends to keep each other accountable
      </p>

      {/* Invite link card */}
      <div className="glass rounded-2xl p-4 mb-6 animate-fade-in">
        <p className="text-xs font-black text-ice-400/70 uppercase tracking-widest mb-2">Your Invite Link</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-dark-800 rounded-xl px-3 py-2 overflow-hidden">
            <p className="text-xs font-semibold text-slate-400 truncate">{inviteLink}</p>
          </div>
          <button onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                    copied
                      ? 'bg-green-500/20 border border-green-400/50 text-green-400'
                      : 'ice-btn text-dark-950'
                  }`}>
            {copied ? <><Check size={13} /> Copied!</> : <><Link size={13} /> Copy</>}
          </button>
        </div>
        <p className="text-[10px] text-slate-600 font-semibold mt-2">
          Share this link — anyone who opens it can add you as a friend
        </p>
      </div>

      {/* Friends list */}
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)' }}>
            <Users size={28} className="text-ice-400/40" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">No friends yet</p>
          <p className="text-slate-600 text-xs font-semibold mt-1">Share your invite link to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map(friend => {
            const initials = friend.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={friend.uid} className="glass rounded-2xl px-4 py-4 flex items-center gap-3 animate-fade-in">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm text-dark-950"
                     style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{friend.name}</p>
                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                    Added {new Date(friend.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/messages/${getChatId(user!.uid, friend.uid)}`)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700/50 text-slate-500 hover:text-ice-400 hover:border-ice-400/30 hover:bg-ice-400/10 transition-all">
                    <MessageCircle size={12} />
                  </button>
                  <button onClick={() => handleRemove(friend.uid)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {friends.length > 0 && (
        <div className="mt-4 glass rounded-2xl px-4 py-3 text-center">
          <p className="text-xs font-bold text-slate-500">
            🔒 Viewing friend missions coming soon
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
