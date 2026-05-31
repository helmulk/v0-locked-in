'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { fetchWeeklyActivity, getUserRank, updateUsername, signOut, type WeeklyDay } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Clock, Flame, Trophy, Calendar, Settings, ChevronRight, X, LogOut, User, Check } from 'lucide-react'

export default function MyProfilePage() {
  const { user, session, friends, users, isLoading, refreshData } = useApp()
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameSaved, setUsernameSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!user.id) return
    fetchWeeklyActivity(user.id).then(setWeeklyData)
    setNewUsername(user.username)
  }, [user.id, user.weeklyHours, user.username])

  async function handleSaveUsername() {
    if (!user.id || !newUsername.trim() || newUsername === user.username) return
    setSavingUsername(true)
    await updateUsername(user.id, newUsername.trim())
    await refreshData()
    setUsernameSaved(true)
    setSavingUsername(false)
    setTimeout(() => setUsernameSaved(false), 2000)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.push('/login')
  }

  const rank = getUserRank(users, user.id)
  const stats = [
    { label: 'Total Hours', value: user.totalHours.toFixed(1), icon: Clock },
    { label: 'This Week', value: user.weeklyHours.toFixed(1), icon: Calendar },
    { label: 'Streak', value: `${user.streak}d`, icon: Flame },
    { label: 'Rank', value: rank > 0 ? `#${rank}` : '—', icon: Trophy },
  ]

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user.id) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold mb-2">Sign in to track your grind</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Create an account to log sessions, appear on the leaderboard, and follow other grinders.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="w-full py-3 rounded-lg bg-foreground text-background text-sm font-medium text-center hover:bg-foreground/90 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="w-full py-3 rounded-lg bg-card border border-border text-sm font-medium text-center hover:bg-accent transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  )

  return (
    <div className={cn('min-h-screen transition-colors duration-500', session.isActive ? 'locked-in' : '')}>
      <div className="max-w-lg mx-auto p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile card */}
        <div className={cn(
          'p-6 rounded-xl border mb-6',
          session.isActive ? 'border-lockin-red/30 bg-lockin-red/5' : 'border-border bg-card'
        )}>
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              'w-20 h-20 rounded-full border-2 flex items-center justify-center',
              session.isActive ? 'border-lockin-red' : 'border-foreground'
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

        {/* Weekly chart */}
        <div className="mb-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">This Week</h3>
          <div className="flex items-end justify-between h-24 gap-2 p-4 rounded-lg bg-card border border-border">
            {weeklyData.map((day) => {
              const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.01)
              const height = maxHours > 0 ? (day.hours / maxHours) * 100 : 0
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end h-12">
                    <div
                      className={cn(
                        'w-full max-w-6 rounded-t transition-all',
                        day.hours > 0
                          ? session.isActive ? 'bg-lockin-red' : 'bg-foreground'
                          : 'bg-border'
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

        {/* Following */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Following ({friends.length})
            </h3>
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
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

        <Link
          href="/"
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-lg font-medium transition-colors',
            session.isActive
              ? 'bg-lockin-red text-foreground hover:bg-lockin-red-glow'
              : 'bg-foreground text-background hover:bg-foreground/90'
          )}
        >
          {session.isActive ? 'Currently Locked In' : 'Start a Session'}
        </Link>
      </div>

      {/* ── Settings modal ────────────────────────────────────────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 mb-2 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Username */}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Username</label>
              <div className="flex gap-2">
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Your username"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={savingUsername || newUsername === user.username || !newUsername.trim()}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                    usernameSaved
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : 'bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed'
                  )}
                >
                  {usernameSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : savingUsername ? '...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
