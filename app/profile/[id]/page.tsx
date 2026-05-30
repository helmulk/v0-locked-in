'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchProfileById,
  fetchWeeklyActivity,
  fetchUserSessions,
  type WeeklyDay,
  type SessionRow,
} from '@/lib/db'
import { useApp } from '@/components/providers/app-provider'
import { cn } from '@/lib/utils'
import { ArrowLeft, UserPlus, UserCheck, Flame, Calendar, Clock, Image as ImageIcon } from 'lucide-react'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { friends, addFriend, removeFriend, session } = useApp()
  const [user, setUser] = useState<Awaited<ReturnType<typeof fetchProfileById>>>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [profile, weekly, userSessions] = await Promise.all([
        fetchProfileById(id),
        fetchWeeklyActivity(id),
        fetchUserSessions(id),
      ])
      setUser(profile)
      setWeeklyData(weekly)
      setSessions(userSessions)
      setLoading(false)
    }
    load()
  }, [id])

  const isFriend = friends.some((f) => f.id === id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-20 h-20 rounded-full border-2 flex items-center justify-center",
              session.isActive ? "border-lockin-red bg-lockin-red/10" : "border-foreground bg-card"
            )}>
              <span className="text-2xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1">{user.username}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {user.streak}d streak
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {user.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => isFriend ? removeFriend(user.id) : addFriend(user.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isFriend
                ? "bg-lockin-red/10 text-lockin-red hover:bg-lockin-red/20"
                : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            {isFriend ? (
              <>
                <UserCheck className="w-4 h-4" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Total Hours</span>
            </div>
            <span className="text-3xl font-mono font-bold">{user.totalHours.toFixed(1)}</span>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">This Week</span>
            </div>
            <span className="text-3xl font-mono font-bold">{user.weeklyHours.toFixed(1)}</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Weekly Activity
          </h2>
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyData.map((day) => {
              const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.01)
              const height = maxHours > 0 ? (day.hours / maxHours) * 100 : 0
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-24">
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        day.hours > 0
                          ? session.isActive ? "bg-lockin-red" : "bg-foreground"
                          : "bg-border"
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Proof of Work
          </h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sessions.map((proof) => (
                <div
                  key={proof.id}
                  className="aspect-square rounded-lg bg-card border border-border flex flex-col items-center justify-center text-muted-foreground hover:border-muted-foreground/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-mono">{(Number(proof.duration) || 0).toFixed(1)}h</span>
                  <span className="text-[10px] mt-1">
                    {new Date(proof.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
