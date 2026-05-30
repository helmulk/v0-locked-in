'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mockUsers } from '@/lib/mock-data'
import { useApp } from '@/components/providers/app-provider'
import { cn } from '@/lib/utils'
import { UserPlus, UserCheck, ChevronRight, Flame } from 'lucide-react'

export default function LeaderboardPage() {
  const { friends, addFriend, removeFriend, session } = useApp()
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all')

  const sortedUsers = [...mockUsers].sort((a, b) => {
    if (timeFilter === 'week') return b.weeklyHours - a.weeklyHours
    return b.totalHours - a.totalHours
  })

  const getHours = (user: typeof mockUsers[0]) => {
    if (timeFilter === 'week') return user.weeklyHours
    return user.totalHours
  }

  const isFriend = (userId: string) => friends.some(f => f.id === userId)

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            The grind never stops. Where do you rank?
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'week', 'today'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-wider transition-colors",
                timeFilter === filter
                  ? session.isActive 
                    ? "bg-lockin-red text-foreground" 
                    : "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'Today'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-4 mb-8 h-48">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-2">
              <span className="text-lg font-bold">{sortedUsers[1]?.username.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs text-muted-foreground mb-1">2nd</span>
            <div className="w-20 h-20 bg-card rounded-t-lg flex flex-col items-center justify-center">
              <span className="text-xs font-medium truncate max-w-full px-1">{sortedUsers[1]?.username}</span>
              <span className="text-sm font-mono text-muted-foreground">{getHours(sortedUsers[1]).toFixed(1)}h</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <Flame className={cn(
              "w-6 h-6 mb-1",
              session.isActive ? "text-lockin-red" : "text-foreground"
            )} />
            <div className={cn(
              "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-2",
              session.isActive ? "border-lockin-red bg-lockin-red/10" : "border-foreground bg-card"
            )}>
              <span className="text-xl font-bold">{sortedUsers[0]?.username.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs text-muted-foreground mb-1">1st</span>
            <div className={cn(
              "w-24 h-28 rounded-t-lg flex flex-col items-center justify-center",
              session.isActive ? "bg-lockin-red/20" : "bg-card"
            )}>
              <span className="text-sm font-medium truncate max-w-full px-1">{sortedUsers[0]?.username}</span>
              <span className="text-lg font-mono font-bold">{getHours(sortedUsers[0]).toFixed(1)}h</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-2">
              <span className="text-lg font-bold">{sortedUsers[2]?.username.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs text-muted-foreground mb-1">3rd</span>
            <div className="w-20 h-16 bg-card rounded-t-lg flex flex-col items-center justify-center">
              <span className="text-xs font-medium truncate max-w-full px-1">{sortedUsers[2]?.username}</span>
              <span className="text-sm font-mono text-muted-foreground">{getHours(sortedUsers[2]).toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* Full List */}
        <div className="space-y-2">
          {sortedUsers.slice(3).map((user, index) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-muted-foreground/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground w-6">
                  {index + 4}
                </span>
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.username}</span>
                    {user.streak >= 7 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                        {user.streak}d streak
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getHours(user).toFixed(1)}h {timeFilter === 'all' ? 'total' : timeFilter === 'week' ? 'this week' : 'today'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isFriend(user.id)) {
                      removeFriend(user.id)
                    } else {
                      addFriend(user.id)
                    }
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isFriend(user.id)
                      ? "text-lockin-red hover:bg-lockin-red/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {isFriend(user.id) ? (
                    <UserCheck className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
