import { getSupabase, isSupabaseConfigured } from './supabase'
import type { User, Post, Chat, Message } from './types'

export interface ProfileRow {
  id: string
  username: string
  total_hours: number
  weekly_hours: number
  streak: number
}

export interface PostRow {
  id: string
  user_id: string
  image_url: string | null
  description: string | null
  likes: number
  dislikes: number
  created_at: string
}

export interface SessionRow {
  id: string
  user_id: string
  duration: number
  created_at: string
}

export interface NudgeRow {
  id: string
  from_id: string
  to_id: string
  message: string
  seen: boolean
  created_at: string
  from_profile?: ProfileRow
}

export interface WeeklyDay {
  day: string
  hours: number
}

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username ?? 'unknown',
    totalHours: Number(row.total_hours) || 0,
    weeklyHours: Number(row.weekly_hours) || 0,
    streak: Number(row.streak) || 0,
    joinedAt: new Date(),
  }
}

export async function resolveCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data: { user } } = await getSupabase().auth.getUser()
  return user?.id ?? null
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().auth.signOut()
}

export async function fetchProfiles(): Promise<User[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await getSupabase()
    .from('profiles').select('*').order('total_hours', { ascending: false })
  if (error) { console.error('fetchProfiles:', error.message); return [] }
  return (data as ProfileRow[]).map(mapProfile)
}

export async function fetchProfileById(id: string): Promise<User | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await getSupabase().from('profiles').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapProfile(data as ProfileRow)
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('profiles').update({ username }).eq('id', userId)
}

export async function createSession(userId: string, durationHours: number): Promise<SessionRow | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await getSupabase()
    .from('sessions').insert({ user_id: userId, duration: durationHours }).select().single()
  if (error || !data) { console.error('createSession:', error?.message); return null }
  return data as SessionRow
}

export async function updateProfileHours(userId: string, addedHours: number, currentStreak: number): Promise<void> {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabase()
  const profile = await fetchProfileById(userId)
  if (!profile) return

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const { count: todayCount } = await supabase
    .from('sessions').select('*', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', startOfToday.toISOString())

  let newStreak = currentStreak
  if (todayCount === 1) {
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const { count: yestCount } = await supabase
      .from('sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString())
    newStreak = (yestCount ?? 0) > 0 ? currentStreak + 1 : 1
  }

  await supabase.from('profiles').update({
    total_hours: profile.totalHours + addedHours,
    weekly_hours: profile.weeklyHours + addedHours,
    streak: newStreak,
  }).eq('id', userId)
}

export async function fetchWeeklyActivity(userId: string): Promise<WeeklyDay[]> {
  const orderedLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  if (!isSupabaseConfigured()) return orderedLabels.map((day) => ({ day, hours: 0 }))
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0)
  const d = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - (d === 0 ? 6 : d - 1))
  const { data, error } = await getSupabase()
    .from('sessions').select('duration, created_at')
    .eq('user_id', userId).gte('created_at', weekStart.toISOString())
  if (error) return orderedLabels.map((day) => ({ day, hours: 0 }))
  const hoursByDay = new Map(orderedLabels.map((l) => [l, 0]))
  for (const row of (data as { duration: number; created_at: string }[]) || []) {
    const label = dayLabels[new Date(row.created_at).getDay()]
    hoursByDay.set(label, (hoursByDay.get(label) ?? 0) + (Number(row.duration) || 0))
  }
  return orderedLabels.map((day) => ({ day, hours: hoursByDay.get(day) ?? 0 }))
}

export async function fetchUserSessions(userId: string, limit = 12): Promise<SessionRow[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await getSupabase()
    .from('sessions').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return (data as SessionRow[]) || []
}

export async function fetchPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabase()
  const [{ data: postRows, error }, { data: profileRows }, { data: sessionRows }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
    supabase.from('sessions').select('*'),
  ])
  if (error) { console.error('fetchPosts:', error.message); return [] }
  const profilesById = new Map(((profileRows as ProfileRow[]) || []).map((p) => [p.id, mapProfile(p)]))
  const sessions = (sessionRows as SessionRow[]) || []
  return ((postRows as PostRow[]) || []).map((row) => {
    const user = profilesById.get(row.user_id) ?? {
      id: row.user_id, username: 'unknown', totalHours: 0, weeklyHours: 0, streak: 0, joinedAt: new Date(),
    }
    const postDate = new Date(row.created_at).toDateString()
    const match = sessions
      .filter((s) => s.user_id === row.user_id && new Date(s.created_at).toDateString() === postDate)
      .sort((a, b) => Math.abs(new Date(a.created_at).getTime() - new Date(row.created_at).getTime()) -
        Math.abs(new Date(b.created_at).getTime() - new Date(row.created_at).getTime()))[0]
    return {
      id: row.id, userId: row.user_id, user,
      imageUrl: row.image_url || '',
      duration: match ? Number(match.duration) || 0 : 0,
      description: row.description ?? undefined,
      likes: row.likes ?? 0, dislikes: row.dislikes ?? 0,
      createdAt: new Date(row.created_at),
    }
  })
}

export async function createPost(userId: string, description: string, imageUrl?: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('posts').insert({ user_id: userId, description, image_url: imageUrl ?? null })
}

export async function updatePostReaction(postId: string, field: 'likes' | 'dislikes', value: number): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('posts').update({ [field]: value }).eq('id', postId)
}

export async function fetchFollowing(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  const { data } = await getSupabase().from('follows').select('following_id').eq('follower_id', userId)
  return ((data || []) as { following_id: string }[]).map((r) => r.following_id)
}

export async function follow(followerId: string, followingId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('follows').upsert({ follower_id: followerId, following_id: followingId })
}

export async function unfollow(followerId: string, followingId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
}

export async function fetchNudges(userId: string): Promise<NudgeRow[]> {
  if (!isSupabaseConfigured()) return []
  const { data } = await getSupabase()
    .from('nudges')
    .select('*, from_profile:profiles!nudges_from_id_fkey(id, username, total_hours, weekly_hours, streak)')
    .eq('to_id', userId).order('created_at', { ascending: false }).limit(20)
  return (data as NudgeRow[]) || []
}

export async function sendNudge(fromId: string, toId: string, message = 'Lock in! 🔒'): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('nudges').insert({ from_id: fromId, to_id: toId, message })
}

export async function markNudgesSeen(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().from('nudges').update({ seen: true }).eq('to_id', userId).eq('seen', false)
}

export async function countUnseenNudges(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const { count } = await getSupabase()
    .from('nudges').select('*', { count: 'exact', head: true })
    .eq('to_id', userId).eq('seen', false)
  return count ?? 0
}

export function getUserRank(profiles: User[], userId: string): number {
  const sorted = [...profiles].sort((a, b) => b.totalHours - a.totalHours)
  const index = sorted.findIndex((p) => p.id === userId)
  return index >= 0 ? index + 1 : 0
}

export async function fetchChatsForUser(_userId: string): Promise<Chat[]> { return [] }
export async function fetchMessages(_chatId: string): Promise<Message[]> { return [] }
export async function sendMessage(_chatId: string, _senderId: string, _content: string): Promise<Message | null> { return null }
