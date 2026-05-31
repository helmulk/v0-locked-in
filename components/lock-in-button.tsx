'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ProfileRow } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Users, Plus, X, Check, ChevronRight } from 'lucide-react'

type AppMode = 'idle' | 'deficit-setup' | 'deficit-stare' | 'deficit-transition' | 'active' | 'confirm-end'

interface Goal { id: number; text: string; done: boolean }

const PRESETS = [25, 45, 60, 90]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export function LockInButton() {
  const { session, startSession, endSession, updateElapsed } = useApp()
  const [mode, setMode] = useState<AppMode>('idle')

  // Time selection
  const [selectedMins, setSelectedMins] = useState(25)
  const [customMins, setCustomMins] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  // Goals
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalInput, setGoalInput] = useState('')
  const goalIdRef = useRef(0)

  // Timers
  const [remaining, setRemaining] = useState(0)
  const [totalSecs, setTotalSecs] = useState(0)
  const tickRef = useRef<NodeJS.Timeout | null>(null)

  // Deficit setup
  const [stareMins, setStareMins] = useState(5)
  const [studyMins, setStudyMins] = useState(25)
  const [stareRemaining, setStareRemaining] = useState(0)

  // Leaderboard preview
  const [topUsers, setTopUsers] = useState<ProfileRow[]>([])
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    getSupabase().from('profiles').select('*')
      .order('weekly_hours', { ascending: false }).limit(3)
      .then(({ data }) => {
        setTopUsers((data as ProfileRow[]) || [])
        setActiveUsers((data as ProfileRow[])?.length ?? 0)
      })
  }, [])

  // Clear tick on unmount
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current) }, [])

  // ── Countdown tick ────────────────────────────────────────────────────────
  function startCountdown(secs: number, onDone: () => void) {
    if (tickRef.current) clearInterval(tickRef.current)
    setRemaining(secs)
    setTotalSecs(secs)
    tickRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        updateElapsed(secs - next)
        if (next <= 0) {
          clearInterval(tickRef.current!)
          onDone()
          return 0
        }
        return next
      })
    }, 1000)
  }

  // ── Stare countdown ───────────────────────────────────────────────────────
  function startStareCountdown(secs: number) {
    if (tickRef.current) clearInterval(tickRef.current)
    setStareRemaining(secs)
    tickRef.current = setInterval(() => {
      setStareRemaining((prev) => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(tickRef.current!)
          setMode('deficit-transition')
          setTimeout(() => {
            setMode('active')
            startSession()
            startCountdown(studyMins * 60, handleSessionDone)
          }, 2000)
          return 0
        }
        return next
      })
    }, 1000)
  }

  // ── Normal lock in ────────────────────────────────────────────────────────
  function handleLockIn() {
    const mins = showCustom && customMins ? parseInt(customMins) : selectedMins
    if (!mins || mins < 1) return
    setMode('active')
    startSession()
    startCountdown(mins * 60, handleSessionDone)
  }

  function handleSessionDone() {
    endSession()
    setMode('idle')
    setGoals([])
  }

  function handleTapOut() {
    const elapsed = totalSecs - remaining
    if (elapsed < 60) {
      if (tickRef.current) clearInterval(tickRef.current)
      endSession()
      setMode('idle')
      setGoals([])
    } else {
      setMode('confirm-end')
    }
  }

  function confirmEnd() {
    if (tickRef.current) clearInterval(tickRef.current)
    endSession()
    setMode('idle')
    setGoals([])
  }

  // ── Deficit start ─────────────────────────────────────────────────────────
  function handleStartDeficit() {
    setMode('deficit-stare')
    startStareCountdown(stareMins * 60)
  }

  // ── Goals ─────────────────────────────────────────────────────────────────
  function addGoal() {
    if (!goalInput.trim() || goals.length >= 5) return
    setGoals((prev) => [...prev, { id: goalIdRef.current++, text: goalInput.trim(), done: false }])
    setGoalInput('')
  }

  function toggleGoal(id: number) {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, done: !g.done } : g))
  }

  function removeGoal(id: number) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  const progress = totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0
  const circumference = 2 * Math.PI * 88

  // ── Deficit stare screen ──────────────────────────────────────────────────
  if (mode === 'deficit-stare') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-600 text-xs uppercase tracking-widest">stare at the screen</p>
        <div className="text-7xl font-mono font-bold text-zinc-700">{formatTime(stareRemaining)}</div>
        <p className="text-zinc-700 text-xs">clear your mind. no scrolling.</p>
        <button
          onClick={() => { if (tickRef.current) clearInterval(tickRef.current); setMode('idle') }}
          className="absolute bottom-8 text-zinc-800 text-xs hover:text-zinc-600 transition-colors"
        >
          cancel
        </button>
      </div>
    )
  }

  // ── Deficit transition ────────────────────────────────────────────────────
  if (mode === 'deficit-transition') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-lockin-red text-3xl font-bold uppercase tracking-widest animate-pulse">
          LOCK IN
        </p>
      </div>
    )
  }

  // ── Confirm end ───────────────────────────────────────────────────────────
  if (mode === 'confirm-end') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6">
        <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-lockin-red/30">
          <h3 className="text-lg font-bold text-lockin-red mb-2">End Session?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You've been locked in for {formatTime(totalSecs - remaining)}. Tap out now?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setMode('active')}
              className="flex-1 py-3 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              Keep Going
            </button>
            <button
              onClick={confirmEnd}
              className="flex-1 py-3 rounded-lg bg-lockin-red text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Tap Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Active session ────────────────────────────────────────────────────────
  if (mode === 'active') {
    return (
      <div className="locked-in min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col items-center justify-center p-6 gap-6">

        {/* Goals + Timer + Goals layout */}
        <div className="w-full max-w-2xl flex items-center justify-center gap-6">

          {/* Left goals (desktop) */}
          <div className="hidden md:flex flex-col gap-2 w-48 flex-shrink-0">
            {goals.filter((_, i) => i % 2 === 0).map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  'text-left text-sm px-3 py-2 rounded-lg border transition-all',
                  goal.done
                    ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                )}
              >
                {goal.text}
              </button>
            ))}
          </div>

          {/* Timer ring */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r="88" fill="none" stroke="currentColor"
                strokeWidth="3" className="text-border" />
              <circle cx="110" cy="110" r="88" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                className="text-lockin-red transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div className="text-5xl font-mono font-bold text-lockin-red tracking-tighter">
                {formatTime(remaining)}
              </div>
              <div className="text-xs text-lockin-red/40 uppercase tracking-widest">remaining</div>
            </div>
          </div>

          {/* Right goals (desktop) */}
          <div className="hidden md:flex flex-col gap-2 w-48 flex-shrink-0">
            {goals.filter((_, i) => i % 2 === 1).map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  'text-left text-sm px-3 py-2 rounded-lg border transition-all',
                  goal.done
                    ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                )}
              >
                {goal.text}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile goals (below timer) */}
        {goals.length > 0 && (
          <div className="md:hidden flex flex-col gap-2 w-full max-w-xs">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  'text-left text-sm px-3 py-2 rounded-lg border transition-all flex items-center gap-2',
                  goal.done
                    ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                    : 'border-border text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                  goal.done ? 'border-lockin-red/30 bg-lockin-red/10' : 'border-border'
                )}>
                  {goal.done && <Check className="w-2.5 h-2.5 text-lockin-red/50" />}
                </div>
                {goal.text}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleTapOut}
          className="mt-2 px-8 py-3 rounded-full border border-lockin-red/40 text-lockin-red text-sm font-medium hover:bg-lockin-red/10 transition-colors"
        >
          Tap out
        </button>
      </div>
    )
  }

  // ── Idle / setup ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen p-6 gap-5">

      {/* Active users */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span className="font-mono">{activeUsers} people grinding rn</span>
      </div>

      {/* Time presets */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => { setSelectedMins(m); setShowCustom(false) }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedMins === m && !showCustom
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
            )}
          >
            {m}m
          </button>
        ))}
        <button
          onClick={() => setShowCustom(true)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
            showCustom
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="minutes"
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            className="w-24 bg-card border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
            min={1} max={480}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      )}

      {/* Goals input */}
      <div className="w-full max-w-xs space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">
          Goals ({goals.length}/5)
        </p>
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
            <span className="flex-1 text-sm text-muted-foreground">{goal.text}</span>
            <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {goals.length < 5 && (
          <div className="flex gap-2">
            <input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Add a goal..."
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            <button
              onClick={addGoal}
              disabled={!goalInput.trim()}
              className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Lock in button */}
      <button
        onClick={handleLockIn}
        className="relative group w-48 h-48 md:w-56 md:h-56 transition-all duration-300"
      >
        <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/30 group-hover:border-foreground/50 transition-colors" />
        <div className="absolute inset-2 rounded-full bg-accent/50 group-hover:bg-accent flex items-center justify-center transition-all">
          <span className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-foreground">
            Lock in
          </span>
        </div>
      </button>

      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        they're watching
      </p>

      {/* Deficit mode */}
      <button
        onClick={() => setMode('deficit-setup')}
        className="flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors border border-border/50 rounded-lg px-3 py-2"
      >
        Dopamine deficit mode
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Leaderboard preview */}
      {topUsers.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">outworking you today</div>
          <div className="space-y-2">
            {topUsers.map((profile, i) => (
              <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{profile.username}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {(Number(profile.weekly_hours) || 0).toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deficit setup modal ─────────────────────────────────────────── */}
      {mode === 'deficit-setup' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setMode('idle')}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 mb-2 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Dopamine Deficit Mode</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stare at a blank screen first to clear your mind, then lock in
                </p>
              </div>
              <button onClick={() => setMode('idle')} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                  Stare time (min)
                </label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {[1, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => setStareMins(m)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                        stareMins === m ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >{m}m</button>
                  ))}
                </div>
                <input
                  type="number" value={stareMins}
                  onChange={(e) => setStareMins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  min={1} max={30}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                  Study time (min)
                </label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {[25, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => setStudyMins(m)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                        studyMins === m ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >{m}m</button>
                  ))}
                </div>
                <input
                  type="number" value={studyMins}
                  onChange={(e) => setStudyMins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  min={1} max={480}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/50 border border-border">
              <p className="text-xs text-muted-foreground">
                You'll stare at a black screen for <span className="text-foreground font-medium">{stareMins} min</span>,
                then immediately lock in for <span className="text-foreground font-medium">{studyMins} min</span>.
                No phone. No scrolling. Just focus.
              </p>
            </div>

            <button
              onClick={handleStartDeficit}
              className="w-full py-3 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Start deficit mode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
