'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { saveUserProfile } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const redirect       = searchParams.get('redirect') ?? '/'
  const { user, loading } = useAuth()
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace(redirect)
  }, [user, loading, router, redirect])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isSignUp && !name.trim()) { setError('What should we call you?'); return }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setSubmitting(true)
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        await saveUserProfile(cred.user.uid, name.trim(), email.trim().toLowerCase())
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
      router.replace(redirect)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/email-already-in-use') setError('Account already exists — try signing in.')
      else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') setError('Wrong email or password.')
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Try again later.')
      else setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, #020617 60%)' }}>

      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
             style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 32px rgba(56,189,248,0.4)' }}>
          <Sparkles size={30} className="text-dark-950" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Do It Right</h1>
        <p className="text-ice-400/60 text-sm font-semibold mt-1">Your weekly health missions, powered by AI</p>
      </div>

      <div className="w-full max-w-sm glass rounded-3xl p-6 animate-slide-up">
        <div className="flex glass rounded-2xl p-1 mb-5">
          <button onClick={() => { setIsSignUp(true); setError('') }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${isSignUp ? 'bg-ice-500 text-dark-950' : 'text-slate-500'}`}>
            Sign Up
          </button>
          <button onClick={() => { setIsSignUp(false); setError('') }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${!isSignUp ? 'bg-ice-500 text-dark-950' : 'text-slate-500'}`}>
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Your Name</label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
                     placeholder="e.g. Alex"
                     className="w-full glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none transition-all" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                   placeholder="you@example.com"
                   className="w-full glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                   placeholder="Min. 6 characters"
                   className="w-full glass rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none transition-all" />
          </div>

          {error && <p className="text-red-400 text-xs font-bold animate-fade-in">{error}</p>}

          <button type="submit" disabled={submitting}
                  className="ice-btn w-full py-3.5 flex items-center justify-center gap-2 text-sm text-dark-950 mt-2 disabled:opacity-50">
            {submitting ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
            {!submitting && <ArrowRight size={16} strokeWidth={3} />}
          </button>
        </form>
      </div>
    </main>
  )
}
