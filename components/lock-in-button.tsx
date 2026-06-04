'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { fetchActiveCount, setLockInStatus, uploadSessionPhoto, createPost } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Plus, X, Check, ChevronRight, Camera, ImageIcon } from 'lucide-react'

type AppMode = 'idle' | 'deficit-setup' | 'deficit-stare' | 'deficit-transition' | 'active' | 'share'

interface Goal { id: number; text: string; done: boolean }

const PRESETS = [25, 45, 60, 90]

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function formatMins(s: number): string {
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

export function LockInButton() {
  const { user, session, startSession, endSession, updateElapsed } = useApp()
  const [mode, setMode] = useState<AppMode>('idle')
  const [selectedMins, setSelectedMins] = useState(25)
  const [customMins, setCustomMins] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalInput, setGoalInput] = useState('')
  const goalIdRef = useRef(0)
  const [remaining, setRemaining] = useState(0)
  const [totalSecs, setTotalSecs] = useState(0)
  const [sessionSecs, setSessionSecs] = useState(0)
  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const [stareMins, setStareMins] = useState(5)
  const [studyMins, setStudyMins] = useState(25)
  const [stareRemaining, setStareRemaining] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [showDeficitSetup, setShowDeficitSetup] = useState(false)

  // Share flow
  const [sharePhoto, setSharePhoto] = useState<File | null>(null)
  const [sharePreview, setSharePreview] = useState<string | null>(null)
  const [shareCaption, setShareCaption] = useState('')
  const [sharing, setSharing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchActiveCount().then(setActiveCount)
    const iv = setInterval(() => fetchActiveCount().then(setActiveCount), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current) }, [])

  function startCountdown(secs: number, onDone: () => void) {
    if (tickRef.current) clearInterval(tickRef.current)
    setRemaining(secs); setTotalSecs(secs); setSessionSecs(0)
    tickRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        setSessionSecs((s) => s + 1)
        updateElapsed(secs - next)
        if (next <= 0) { clearInterval(tickRef.current!); onDone(); return 0 }
        return next
      })
    }, 1000)
  }

  function startStare(secs: number) {
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
            if (user.id) setLockInStatus(user.id, true)
            startCountdown(studyMins * 60, handleSessionDone)
          }, 2000)
          return 0
        }
        return next
      })
    }, 1000)
  }

  function handleLockIn() {
    const mins = showCustom && customMins ? parseInt(customMins) : selectedMins
    if (!mins || mins < 1) return
    setMode('active')
    startSession()
    if (user.id) setLockInStatus(user.id, true)
    startCountdown(mins * 60, handleSessionDone)
  }

  function handleSessionDone() {
    if (user.id) setLockInStatus(user.id, false)
    endSession()
    setSessionSecs(totalSecs)
    setMode('share')
  }

  function handleTapOut() {
    if (tickRef.current) clearInterval(tickRef.current)
    if (user.id) setLockInStatus(user.id, false)
    const elapsed = totalSecs - remaining
    setSessionSecs(elapsed)
    endSession()
    setMode('share')
  }

  async function handleShare() {
    setSharing(true)
    let imageUrl: string | null = null
    if (sharePhoto && user.id) {
      imageUrl = await uploadSessionPhoto(user.id, sharePhoto)
    }
    if (user.id && (shareCaption.trim() || imageUrl)) {
      await createPost(user.id, shareCaption.trim() || `Locked in for ${formatMins(sessionSecs)}`, imageUrl ?? undefined)
    }
    resetShare()
  }

  function resetShare() {
    setSharing(false)
    setSharePhoto(null)
    setSharePreview(null)
    setShareCaption('')
    setGoals([])
    setMode('idle')
  }

  function addGoal() {
    if (!goalInput.trim() || goals.length >= 6) return
    setGoals((p) => [...p, { id: goalIdRef.current++, text: goalInput.trim(), done: false }])
    setGoalInput('')
  }

  function toggleGoal(id: number) {
    setGoals((p) => p.map((g) => g.id === id ? { ...g, done: !g.done } : g))
  }

  function removeGoal(id: number) {
    setGoals((p) => p.filter((g) => g.id !== id))
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setSharePhoto(f)
    const reader = new FileReader()
    reader.onload = (ev) => setSharePreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const progress = totalSecs > 0 ? ((totalSecs - remaining) / totalSecs) * 100 : 0
  const circumference = 2 * Math.PI * 88

  // ── deficit stare ────────────────────────────────────────────────────────
  if (mode === 'deficit-stare') return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6">
      <p className="text-zinc-700 text-xs uppercase tracking-widest">stare at the screen</p>
      <div className="text-7xl font-mono font-bold text-zinc-600">{formatTime(stareRemaining)}</div>
      <p className="text-zinc-800 text-xs">clear your mind. no scrolling.</p>
      <button onClick={() => { if (tickRef.current) clearInterval(tickRef.current); setMode('idle') }}
        className="absolute bottom-8 text-zinc-800 text-xs hover:text-zinc-600 transition-colors">cancel</button>
    </div>
  )

  // ── deficit transition ───────────────────────────────────────────────────
  if (mode === 'deficit-transition') return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <p className="text-lockin-red text-3xl font-bold uppercase tracking-widest animate-pulse">LOCK IN</p>
    </div>
  )

  // ── share / photo upload ─────────────────────────────────────────────────
  if (mode === 'share') return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 mb-2 space-y-4">
        <div className="text-center">
          <p className="text-3xl font-mono font-bold text-lockin-red">{formatMins(sessionSecs)}</p>
          <p className="text-sm text-muted-foreground mt-1">locked in — nice work</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Share what you accomplished
          </p>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors overflow-hidden',
              sharePreview ? 'border-lockin-red/40' : 'border-border hover:border-muted-foreground/50'
            )}
          >
            {sharePreview ? (
              <img src={sharePreview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Tap to add a photo</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
            onChange={onFileChange} className="hidden" />
        </div>

        <input
          value={shareCaption}
          onChange={(e) => setShareCaption(e.target.value)}
          placeholder="What did you get done? (optional)"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />

        {goals.some(g => g.done) && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
            {goals.filter(g => g.done).map(g => (
              <div key={g.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-lockin-red flex-shrink-0" />
                <span className="line-through">{g.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={resetShare}
            className="flex-1 py-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Skip
          </button>
          <button onClick={handleShare} disabled={sharing}
            className="flex-1 py-3 rounded-lg bg-lockin-red text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {sharing ? 'Sharing...' : 'Share to feed'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── active session ───────────────────────────────────────────────────────
  if (mode === 'active') return (
    <div className="locked-in min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-full max-w-3xl flex items-center justify-center gap-6">

        {/* Left goals */}
        <div className="hidden md:flex flex-col gap-3 w-52 flex-shrink-0">
          {goals.filter((_, i) => i % 2 === 0).map((g) => (
            <button key={g.id} onClick={() => toggleGoal(g.id)}
              className={cn(
                'text-left px-4 py-3 rounded-xl border transition-all',
                g.done
                  ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                  : 'border-border text-foreground hover:border-lockin-red/40 bg-card'
              )}>
              <span className="text-base font-medium leading-snug">{g.text}</span>
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="relative flex-shrink-0">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r="88" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
            <circle cx="110" cy="110" r="88" fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className="text-lockin-red transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="text-5xl font-mono font-bold text-lockin-red tracking-tighter">{formatTime(remaining)}</div>
            <div className="text-xs text-lockin-red/40 uppercase tracking-widest">remaining</div>
          </div>
        </div>

        {/* Right goals */}
        <div className="hidden md:flex flex-col gap-3 w-52 flex-shrink-0">
          {goals.filter((_, i) => i % 2 === 1).map((g) => (
            <button key={g.id} onClick={() => toggleGoal(g.id)}
              className={cn(
                'text-left px-4 py-3 rounded-xl border transition-all',
                g.done
                  ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                  : 'border-border text-foreground hover:border-lockin-red/40 bg-card'
              )}>
              <span className="text-base font-medium leading-snug">{g.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile goals */}
      {goals.length > 0 && (
        <div className="md:hidden grid grid-cols-2 gap-2 w-full max-w-xs">
          {goals.map((g) => (
            <button key={g.id} onClick={() => toggleGoal(g.id)}
              className={cn(
                'text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                g.done
                  ? 'border-lockin-red/20 text-lockin-red/40 line-through bg-lockin-red/5'
                  : 'border-border text-foreground bg-card'
              )}>
              {g.text}
            </button>
          ))}
        </div>
      )}

      <button onClick={handleTapOut}
        className="px-8 py-3 rounded-full border border-lockin-red/40 text-lockin-red text-sm font-medium hover:bg-lockin-red/10 transition-colors">
        Tap out
      </button>
    </div>
  )

  // ── idle ─────────────────────────────────────────────────────────────────
  const leftGoals  = goals.filter((_, i) => i % 2 === 0)
  const rightGoals = goals.filter((_, i) => i % 2 === 1)

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen p-6 gap-5">

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-lockin-red animate-pulse inline-block" />
        <span className="font-mono">{activeCount} people locked in rn</span>
      </div>

      {/* Time presets */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PRESETS.map((m) => (
          <button key={m} onClick={() => { setSelectedMins(m); setShowCustom(false) }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              selectedMins === m && !showCustom
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
            )}>{m}m</button>
        ))}
        <button onClick={() => setShowCustom(true)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
            showCustom ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}>Custom</button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input type="number" placeholder="minutes" value={customMins}
            onChange={(e) => setCustomMins(e.target.value)} min={1} max={480}
            className="w-24 bg-card border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring" />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      )}

      {/* Goals + button row */}
      <div className="w-full max-w-3xl flex items-center justify-center gap-6">

        {/* Left goals (desktop) */}
        <div className="hidden md:flex flex-col gap-3 w-52 flex-shrink-0 min-h-[200px] justify-center">
          {leftGoals.map((g) => (
            <div key={g.id}
              className="flex items-start justify-between gap-2 px-4 py-3 rounded-xl bg-card border border-border group">
              <span className="text-base font-medium leading-snug flex-1">{g.text}</span>
              <button onClick={() => removeGoal(g.id)}
                className="text-muted-foreground/30 hover:text-muted-foreground transition-colors mt-0.5 opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {leftGoals.length === 0 && (
            <p className="text-xs text-muted-foreground/30 text-center">goals appear here</p>
          )}
        </div>

        {/* Lock in button */}
        <button onClick={handleLockIn}
          className="relative group flex-shrink-0 w-48 h-48 md:w-56 md:h-56 transition-all duration-300">
          <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/25 group-hover:border-foreground/50 transition-colors" />
          <div className="absolute inset-2 rounded-full bg-accent/50 group-hover:bg-accent flex items-center justify-center transition-all">
            <span className="text-2xl md:text-3xl font-bold uppercase tracking-widest">Lock in</span>
          </div>
        </button>

        {/* Right goals (desktop) */}
        <div className="hidden md:flex flex-col gap-3 w-52 flex-shrink-0 min-h-[200px] justify-center">
          {rightGoals.map((g) => (
            <div key={g.id}
              className="flex items-start justify-between gap-2 px-4 py-3 rounded-xl bg-card border border-border group">
              <span className="text-base font-medium leading-snug flex-1">{g.text}</span>
              <button onClick={() => removeGoal(g.id)}
                className="text-muted-foreground/30 hover:text-muted-foreground transition-colors mt-0.5 opacity-0 group-hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {rightGoals.length === 0 && goals.length > 0 && (
            <p className="text-xs text-muted-foreground/30 text-center">more goals here</p>
          )}
        </div>
      </div>

      {/* Mobile goals */}
      {goals.length > 0 && (
        <div className="md:hidden grid grid-cols-2 gap-2 w-full max-w-xs">
          {goals.map((g) => (
            <div key={g.id} className="flex items-start justify-between gap-1 px-3 py-2.5 rounded-xl bg-card border border-border">
              <span className="text-sm font-medium leading-snug flex-1">{g.text}</span>
              <button onClick={() => removeGoal(g.id)} className="text-muted-foreground/30 hover:text-muted-foreground mt-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Goal input */}
      {goals.length < 6 && (
        <div className="flex gap-2 w-full max-w-xs">
          <input value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            placeholder={goals.length === 0 ? "Add a goal for this session..." : "Add another goal..."}
            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40" />
          <button onClick={addGoal} disabled={!goalInput.trim()}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-30">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">they're watching</p>

      <button onClick={() => setShowDeficitSetup(true)}
        className="flex items-center gap-2 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors border border-border/40 rounded-lg px-3 py-2">
        Dopamine deficit mode <ChevronRight className="w-3 h-3" />
      </button>

      {/* Deficit setup modal */}
      {showDeficitSetup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowDeficitSetup(false)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 mb-2 space-y-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Dopamine Deficit Mode</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Clear your mind first, then lock in</p>
              </div>
              <button onClick={() => setShowDeficitSetup(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Stare time</label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {[1,3,5,10].map((m) => (
                    <button key={m} onClick={() => setStareMins(m)}
                      className={cn('px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                        stareMins === m ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                      )}>{m}m</button>
                  ))}
                </div>
                <input type="number" value={stareMins} min={1} max={30}
                  onChange={(e) => setStareMins(Math.max(1, parseInt(e.target.value)||1))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Study time</label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {[25,45,60,90].map((m) => (
                    <button key={m} onClick={() => setStudyMins(m)}
                      className={cn('px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                        studyMins === m ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                      )}>{m}m</button>
                  ))}
                </div>
                <input type="number" value={studyMins} min={1} max={480}
                  onChange={(e) => setStudyMins(Math.max(1, parseInt(e.target.value)||1))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-accent/50 border border-border text-xs text-muted-foreground">
              Stare at a blank screen for <span className="text-foreground font-medium">{stareMins}m</span> to 
              clear dopamine, then lock in for <span className="text-foreground font-medium">{studyMins}m</span>.
            </div>
            <button onClick={() => { setShowDeficitSetup(false); setMode('deficit-stare'); startStare(stareMins * 60) }}
              className="w-full py-3 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
              Start deficit mode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
