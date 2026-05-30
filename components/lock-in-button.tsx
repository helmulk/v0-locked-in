'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function LockInButton() {
  const { session, startSession, endSession, updateElapsed } = useApp()
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)
  const [topUsers, setTopUsers] = useState<ProfileRow[]>([])
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    async function loadLeaderboardPreview() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('weekly_hours', { ascending: false })
        .limit(3)

      setTopUsers((data as ProfileRow[]) || [])
      setActiveUsers((data as ProfileRow[])?.length ?? 0)
    }

    loadLeaderboardPreview()
  }, [])

  useEffect(() => {
    if (!session.isActive || !session.startTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.startTime!.getTime()) / 1000)
      updateElapsed(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [session.isActive, session.startTime, updateElapsed])

  const handleClick = useCallback(() => {
    if (session.isActive) {
      if (session.elapsedSeconds < 60) {
        endSession()
      } else {
        setShowConfirmEnd(true)
      }
    } else {
      startSession()
    }
  }, [session.isActive, session.elapsedSeconds, startSession, endSession])

  const confirmEnd = useCallback(() => {
    endSession()
    setShowConfirmEnd(false)
  }, [endSession])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen p-6">
      {session.isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-lockin-red/5 animate-breathing" />
        </div>
      )}

      <div className={cn(
        "flex items-center gap-2 mb-8 text-sm transition-colors duration-500",
        session.isActive ? "text-lockin-red/70" : "text-muted-foreground"
      )}>
        <Users className="w-4 h-4" />
        <span className="font-mono">{activeUsers} people grinding rn</span>
      </div>

      {session.isActive && (
        <div className="mb-8">
          <div className="text-6xl md:text-8xl font-mono font-bold text-lockin-red tracking-tighter">
            {formatTime(session.elapsedSeconds)}
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        className={cn(
          "relative group transition-all duration-500 ease-out",
          session.isActive 
            ? "w-32 h-32 md:w-40 md:h-40" 
            : "w-56 h-56 md:w-72 md:h-72"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-500",
          session.isActive 
            ? "border-lockin-red animate-pulse-glow" 
            : "border-muted-foreground/30 group-hover:border-foreground/50"
        )} />
        
        <div className={cn(
          "absolute inset-2 md:inset-3 rounded-full flex items-center justify-center transition-all duration-500",
          session.isActive 
            ? "bg-lockin-red/10" 
            : "bg-accent/50 group-hover:bg-accent"
        )}>
          <span className={cn(
            "font-bold uppercase tracking-widest transition-all duration-500",
            session.isActive 
              ? "text-lockin-red text-lg md:text-xl" 
              : "text-foreground text-2xl md:text-3xl"
          )}>
            {session.isActive ? 'TAP OUT' : 'LOCK IN'}
          </span>
        </div>
      </button>

      <p className={cn(
        "mt-8 text-sm font-medium uppercase tracking-widest transition-colors duration-500",
        session.isActive ? "text-lockin-red/50" : "text-muted-foreground"
      )}>
        {session.isActive ? 'prove them wrong' : 'they\'re watching'}
      </p>

      {!session.isActive && (
        <div className="mt-12 w-full max-w-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            outworking you today
          </div>
          {topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No rankings yet</p>
          ) : (
            <div className="space-y-2">
              {topUsers.map((profile, i) => (
                <div 
                  key={profile.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{profile.username}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {(Number(profile.weekly_hours) || 0).toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showConfirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6">
          <div className="w-full max-w-sm p-6 rounded-xl bg-card border border-lockin-red/30">
            <h3 className="text-lg font-bold text-lockin-red mb-2">End Session?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ve been locked in for {formatTime(session.elapsedSeconds)}. Ready to show what you accomplished?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmEnd(false)}
                className="flex-1 py-3 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={confirmEnd}
                className="flex-1 py-3 rounded-lg bg-lockin-red text-foreground text-sm font-medium hover:bg-lockin-red-glow transition-colors"
              >
                End & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
