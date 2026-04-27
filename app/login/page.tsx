'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getUser, saveUser } from '@/lib/storage'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (getUser()) router.replace('/')
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('What should we call you?'); return }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email.'); return }

    saveUser({
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    })
    router.replace('/')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, #020617 60%)' }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
             style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 32px rgba(56,189,248,0.4)' }}>
          <Sparkles size={30} className="text-dark-950" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Do It Right</h1>
        <p className="text-ice-400/60 text-sm font-semibold mt-1">
          Your weekly health missions, powered by AI
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-3xl p-6 animate-slide-up">
        <h2 className="text-lg font-black text-white mb-5">Let's get started</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="e.g. Alex"
              className="w-full glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-ice-400/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              className="w-full glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:border-ice-400/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold animate-fade-in">{error}</p>
          )}

          <button type="submit"
                  className="ice-btn w-full py-3.5 flex items-center justify-center gap-2 text-sm text-dark-950 mt-2">
            Get Started
            <ArrowRight size={16} strokeWidth={3} />
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 font-semibold mt-4">
          No password needed • Your data stays on your device
        </p>
      </div>

      {/* Background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.05) 0%, transparent 60%)' }} />
    </main>
  )
}
