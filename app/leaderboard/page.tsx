'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/lib/db'
import { useApp } from '@/components/providers/app-provider'
import { cn } from '@/lib/utils'
import { UserPlus, UserCheck, ChevronRight, Flame } from 'lucide-react'

export default function LeaderboardPage() {
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      if (!error) {
        setUsers((data as ProfileRow[]) || [])
      }
      setLoading(false)
    }

    loadUsers()
  }, [])

  const { friends, addFriend, removeFriend, session } = useApp()
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'today'>('all')

  const sortedUsers = [...users].sort((a, b) => {
    if (timeFilter === 'week') return (b.weekly_hours ?? 0) - (a.weekly_hours ?? 0)
    return (b.total_hours ?? 0) - (a.total_hours ?? 0)
  })

  const getHours = (profile: ProfileRow) => {
    if (timeFilter === 'week') return Number(profile.weekly_hours) || 0
    return Number(profile.total_hours) || 0
  }

  const isFriend = (userId: string) => friends.some((f) => f.id === userId)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading rankings...</p>
      </div>
    )
  }

  if (sortedUsers.length === 0) {
    return (
      <div className={cn('min-h-screen transition-colors duration-500', session.isActive ? 'locked-in' : '')}>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Rankings</h1>
          <p className="text-sm text-muted-foreground">No profiles yet. Lock in to be the first on the board.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Rankings</h1>
          <p className="text-sm text-muted-foreground">
            {session.isActive 
              ? "Good. You&apos;re locked in. Now stay there." 
              : "They&apos;re outworking you right now. What are you doing?"
            }
          </p>
        </div>

        <div className="flex gap-2 mb-10">
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

        {sortedUsers.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10 pt-8">
            <Link href={`/profile/${sortedUsers[1]?.id}`} className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-2 group-hover:border-muted-foreground transition-colors">
                <span className="text-lg font-bold">{sortedUsers[1]?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-muted-foreground mb-1">2nd</span>
              <div className="w-20 h-20 bg-card rounded-t-lg flex flex-col items-center justify-center group-hover:bg-accent/50 transition-colors">
                <span className="text-xs font-medium truncate max-w-full px-1">{sortedUsers[1]?.username}</span>
                <span className="text-sm font-mono text-muted-foreground">{getHours(sortedUsers[1]).toFixed(1)}h</span>
              </div>
            </Link>

            <Link href={`/profile/${sortedUsers[0]?.id}`} className="flex flex-col items-center group cursor-pointer">
              <Flame className={cn(
                "w-6 h-6 mb-1",
                session.isActive ? "text-lockin-red" : "text-foreground"
              )} />
              <div className={cn(
                "w-20 h-20 rounded-full border-2 flex items-center justify-center mb-2 transition-colors",
                session.isActive ? "border-lockin-red bg-lockin-red/10 group-hover:bg-lockin-red/20" : "border-foreground bg-card group-hover:bg-accent/50"
              )}>
                <span className="text-xl font-bold">{sortedUsers[0]?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-muted-foreground mb-1">1st</span>
              <div className={cn(
                "w-24 h-28 rounded-t-lg flex flex-col items-center justify-center transition-colors",
                session.isActive ? "bg-lockin-red/20 group-hover:bg-lockin-red/30" : "bg-card group-hover:bg-accent/50"
              )}>
                <span className="text-sm font-medium truncate max-w-full px-1">{sortedUsers[0]?.username}</span>
                <span className="text-lg font-mono font-bold">{getHours(sortedUsers[0]).toFixed(1)}h</span>
              </div>
            </Link>

            <Link href={`/profile/${sortedUsers[2]?.id}`} className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-2 group-hover:border-muted-foreground transition-colors">
                <span className="text-lg font-bold">{sortedUsers[2]?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs text-muted-foreground mb-1">3rd</span>
              <div className="w-20 h-16 bg-card rounded-t-lg flex flex-col items-center justify-center group-hover:bg-accent/50 transition-colors">
                <span className="text-xs font-medium truncate max-w-full px-1">{sortedUsers[2]?.username}</span>
                <span className="text-sm font-mono text-muted-foreground">{getHours(sortedUsers[2]).toFixed(1)}h</span>
              </div>
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {sortedUsers.slice(sortedUsers.length >= 3 ? 3 : 0).map((profile, index) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-muted-foreground/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground w-6">
                  {sortedUsers.length >= 3 ? index + 4 : index + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-sm font-bold">{profile.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.username}</span>
                    {(profile.streak ?? 0) >= 7 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                        {profile.streak}d streak
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {getHours(profile).toFixed(1)}h {timeFilter === 'all' ? 'total' : timeFilter === 'week' ? 'this week' : 'today'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isFriend(profile.id)) {
                      removeFriend(profile.id)
                    } else {
                      addFriend(profile.id)
                    }
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isFriend(profile.id)
                      ? "text-lockin-red hover:bg-lockin-red/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {isFriend(profile.id) ? (
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
