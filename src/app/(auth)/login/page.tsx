'use client'

import { signIn } from 'next-auth/react'
import { signUp } from './actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Sparkles, UsersRound, Zap } from 'lucide-react'
import { QuizzaLogo, QuizzaMark } from '@/components/QuizzaLogo'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      if (mode === 'signup') {
        await signUp(email, password)
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/games')
        router.refresh()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#32113d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-90" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(252,184,48,.32), transparent 26rem), radial-gradient(circle at 90% 75%, rgba(227,24,89,.38), transparent 30rem)' }} />
        <div className="absolute -right-20 top-20 h-96 w-96 rotate-12 opacity-25"><QuizzaMark className="h-full w-full" /></div>
        <div className="relative z-10"><QuizzaLogo inverse /></div>
        <div className="relative z-10 max-w-xl pb-10">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"><Sparkles className="h-4 w-4 text-[#fcb830]" /> Live quizzes, made electric</span>
          <h1 className="text-6xl font-black leading-[0.98] tracking-[-0.055em]">Turn every question into a moment.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Build rounds, energize teams, and run the entire show from one fast, focused command center.</p>
          <div className="mt-9 flex gap-7 text-sm text-white/75">
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#fcb830]" /> Fast setup</span>
            <span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#ee4080]" /> Live scoring</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#f99522]" /> Game-ready</span>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} QUIZZA</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><QuizzaLogo /></div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primary">{mode === 'login' ? 'Welcome back' : 'Join QUIZZA'}</p>
          <h2 className="text-4xl font-black tracking-[-0.04em]">{mode === 'login' ? 'Ready to play?' : 'Create your account'}</h2>
          <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">
            {mode === 'login' ? 'Sign in to manage your games and launch the next round.' : 'Start building memorable quiz experiences in minutes.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold">Email address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="flex h-12 w-full rounded-xl border border-input bg-white px-4 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              required
              minLength={8}
              className="flex h-12 w-full rounded-xl border border-input bg-white px-4 py-2 text-sm placeholder:text-muted-foreground"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="quizza-button h-12 w-full text-base"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="h-11 text-sm font-semibold text-muted-foreground transition hover:text-primary"
            >
              {mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          </form>
        </div>
      </section>
    </main>
  )
}
