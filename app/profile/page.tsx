'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/providers/app-provider'
import { fetchWeeklyActivity, getUserRank, type WeeklyDay } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Clock, Flame, Trophy, Calendar, Settings, ChevronRight } from 'lucide-react'

export default function MyProfilePage() {
  const { user, session, friends, users, isLoading } = useApp()
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([])

  useEffect(() => {
    if (!user.id) return
    fetchWeeklyActivity(user.id).then(setWeeklyData)
  }, [user.id, user.weeklyHours])

  const rank = getUserRank(users, user.id)

  const stats = [
    { label: 'Total Hours', value: user.totalHours.toFixed(1), icon: Clock },
    { label: 'This Week', value: user.weeklyHours.toFixed(1), icon: Calendar },
    { label: 'Streak', value: `${user.streak}d`, icon: Flame },
    { label: 'Rank', value: rank > 0 ? `#${rank}` : '—', icon: Trophy },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
          <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className={cn(
          "p-6 rounded-xl border mb-6",
          session.isActive ? "border-lockin-red/30 bg-lockin-red/5" : "border-border bg-card"
        )}>
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-20 h-20 rounded-full border-2 flex items-center justify-center",
              session.isActive ? "border-lockin-red" : "border-foreground"
            )}>
              <span className="text-2xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-sm text-muted-foreground">
                Member since {user.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-xl font-mono font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            This Week
          </h3>
          <div className="flex items-end justify-between h-24 gap-2 p-4 rounded-lg bg-card border border-border">
            {weeklyData.map((day) => {
              const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.01)
              const height = maxHours > 0 ? (day.hours / maxHours) * 100 : 0
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-12">
                    <div
                      className={cn(
                        "w-full max-w-6 rounded-t transition-all",
                        day.hours > 0
                          ? session.isActive ? "bg-lockin-red" : "bg-foreground"
                          : "bg-border"
                      )}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Following ({friends.length})
            </h3>
            <Link 
              href="/leaderboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Find more
            </Link>
          </div>
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">Follow people from the leaderboard.</p>
            ) : (
              friends.slice(0, 3).map((friend) => (
                <Link
                  key={friend.id}
                  href={`/profile/${friend.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-muted-foreground/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-sm font-bold">{friend.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{friend.username}</span>
                      <p className="text-xs text-muted-foreground">{friend.weeklyHours.toFixed(1)}h this week</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/"
            className={cn(
              "flex items-center justify-center gap-2 w-full py-4 rounded-lg font-medium transition-colors",
              session.isActive 
                ? "bg-lockin-red text-foreground hover:bg-lockin-red-glow" 
                : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            {session.isActive ? 'Currently Locked In' : 'Start a Session'}
          </Link>
        </div>
      </div>
    </div>
  )
}
