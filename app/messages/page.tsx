'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { fetchNudges, sendNudge, markNudgesSeen, type NudgeRow } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Bell, Zap } from 'lucide-react'

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function NudgesPage() {
  const { user, friends, session, isLoading } = useApp()
  const [nudges, setNudges] = useState<NudgeRow[]>([])
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user.id) return
    fetchNudges(user.id).then(setNudges)
    markNudgesSeen(user.id)
  }, [user.id])

  async function handleNudge(friendId: string) {
    if (!user.id || sent.has(friendId)) return
    setSending(friendId)
    await sendNudge(user.id, friendId)
    setSent((prev) => new Set(prev).add(friendId))
    setSending(null)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )

  return (
    <div className={cn('min-h-screen transition-colors duration-500', session.isActive ? 'locked-in' : '')}>
      <div className="max-w-lg mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <h1 className="text-lg font-bold tracking-tight">Nudges</h1>
          <p className="text-xs text-muted-foreground">Ping your people to lock in</p>
        </div>

        {/* Send nudges to friends */}
        {friends.length > 0 && (
          <div className="p-4 border-b border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Your people</p>
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent border border-border flex items-center justify-center">
                      <span className="text-sm font-bold">{friend.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{friend.username}</span>
                      <p className="text-xs text-muted-foreground">{friend.weeklyHours.toFixed(1)}h this week</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNudge(friend.id)}
                    disabled={sending === friend.id || sent.has(friend.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      sent.has(friend.id)
                        ? 'bg-accent text-muted-foreground cursor-default'
                        : session.isActive
                          ? 'bg-lockin-red/10 text-lockin-red hover:bg-lockin-red/20 border border-lockin-red/30'
                          : 'bg-foreground text-background hover:bg-foreground/90'
                    )}
                  >
                    <Zap className="w-3 h-3" />
                    {sent.has(friend.id) ? 'Sent!' : sending === friend.id ? '...' : 'Nudge'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming nudges */}
        <div className="p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Incoming ({nudges.length})
          </p>
          {nudges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No nudges yet</p>
              <p className="text-xs mt-1">Follow people from the leaderboard</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    nudge.seen
                      ? 'bg-card border-border'
                      : session.isActive
                        ? 'bg-lockin-red/5 border-lockin-red/20'
                        : 'bg-accent/50 border-border'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border',
                    nudge.seen ? 'bg-accent border-border' : 'bg-foreground/10 border-foreground/20'
                  )}>
                    <span className="text-sm font-bold">
                      {((nudge.from_profile as any)?.username ?? '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{(nudge.from_profile as any)?.username ?? 'Someone'}</span>
                      {' '}<span className="text-muted-foreground">says:</span>{' '}
                      <span>{nudge.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(new Date(nudge.created_at))}
                    </p>
                  </div>
                  {!nudge.seen && (
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      session.isActive ? 'bg-lockin-red' : 'bg-foreground'
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
