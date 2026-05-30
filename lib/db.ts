import { supabase } from './supabase'
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

export interface ChatRow {
  id: string
  name: string | null
  is_group: boolean
}

export interface MessageRow {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface SessionRow {
  id: string
  user_id: string
  duration: number
  created_at: string
}

export interface WeeklyDay {
  day: string
  hours: number
}

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    totalHours: Number(row.total_hours) || 0,
    weeklyHours: Number(row.weekly_hours) || 0,
    streak: Number(row.streak) || 0,
    joinedAt: new Date(),
  }
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  }
}

function sessionDurationForPost(
  sessions: SessionRow[],
  userId: string,
  postCreatedAt: string
): number {
  const postDate = new Date(postCreatedAt)
  const postDay = postDate.toDateString()

  const match = sessions
    .filter((s) => s.user_id === userId && new Date(s.created_at).toDateString() === postDay)
    .sort(
      (a, b) =>
        Math.abs(new Date(a.created_at).getTime() - postDate.getTime()) -
        Math.abs(new Date(b.created_at).getTime() - postDate.getTime())
    )[0]

  return match ? Number(match.duration) || 0 : 0
}

export async function resolveCurrentUserId(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_CURRENT_USER_ID
  if (fromEnv) return fromEnv

  const { data } = await supabase.from('profiles').select('id').limit(1).single()
  return data?.id ?? null
}

export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('total_hours', { ascending: false })

  if (error) {
    console.error('fetchProfiles:', error.message)
    return []
  }

  return (data as ProfileRow[]).map(mapProfile)
}

export async function fetchProfileById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()

  if (error || !data) {
    console.error('fetchProfileById:', error?.message)
    return null
  }

  return mapProfile(data as ProfileRow)
}

export async function fetchPosts(): Promise<Post[]> {
  const [{ data: postRows, error: postsError }, { data: profileRows }, { data: sessionRows }] =
    await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('sessions').select('*'),
    ])

  if (postsError) {
    console.error('fetchPosts:', postsError.message)
    return []
  }

  const profilesById = new Map(
    ((profileRows as ProfileRow[]) || []).map((p) => [p.id, mapProfile(p)])
  )
  const sessions = (sessionRows as SessionRow[]) || []

  return ((postRows as PostRow[]) || []).map((row) => {
    const user = profilesById.get(row.user_id) ?? {
      id: row.user_id,
      username: 'unknown',
      totalHours: 0,
      weeklyHours: 0,
      streak: 0,
      joinedAt: new Date(),
    }

    return {
      id: row.id,
      userId: row.user_id,
      user,
      imageUrl: row.image_url || '',
      duration: sessionDurationForPost(sessions, row.user_id, row.created_at),
      description: row.description ?? undefined,
      likes: row.likes ?? 0,
      dislikes: row.dislikes ?? 0,
      createdAt: new Date(row.created_at),
    }
  })
}

export async function fetchChatsForUser(currentUserId: string): Promise<Chat[]> {
  const [{ data: chatRows, error: chatsError }, { data: messageRows }, { data: profileRows }] =
    await Promise.all([
      supabase.from('chats').select('*').order('id'),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
      supabase.from('profiles').select('*'),
    ])

  if (chatsError) {
    console.error('fetchChatsForUser:', chatsError.message)
    return []
  }

  const profilesById = new Map(
    ((profileRows as ProfileRow[]) || []).map((p) => [p.id, mapProfile(p)])
  )
  const currentUser =
    profilesById.get(currentUserId) ??
    ({
      id: currentUserId,
      username: 'you',
      totalHours: 0,
      weeklyHours: 0,
      streak: 0,
      joinedAt: new Date(),
    } satisfies User)

  const messagesByChat = new Map<string, MessageRow[]>()
  for (const row of (messageRows as MessageRow[]) || []) {
    const list = messagesByChat.get(row.chat_id) ?? []
    list.push(row)
    messagesByChat.set(row.chat_id, list)
  }

  return ((chatRows as ChatRow[]) || []).map((chat) => {
    const chatMessages = (messagesByChat.get(chat.id) || []).map(mapMessage)
    const senderIds = [...new Set(chatMessages.map((m) => m.senderId))]
    if (!senderIds.includes(currentUserId)) {
      senderIds.push(currentUserId)
    }

    const participants = senderIds
      .map((id) => profilesById.get(id))
      .filter((p): p is User => Boolean(p))

    if (!participants.find((p) => p.id === currentUserId)) {
      participants.unshift(currentUser)
    }

    const lastMessage =
      chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : undefined

    return {
      id: chat.id,
      name: chat.name ?? undefined,
      isGroup: chat.is_group,
      participants,
      lastMessage,
      messages: chatMessages,
    }
  })
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('fetchMessages:', error.message)
    return []
  }

  return ((data as MessageRow[]) || []).map(mapMessage)
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, content })
    .select()
    .single()

  if (error || !data) {
    console.error('sendMessage:', error?.message)
    return null
  }

  return mapMessage(data as MessageRow)
}

export async function createSession(
  userId: string,
  durationHours: number
): Promise<SessionRow | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, duration: durationHours })
    .select()
    .single()

  if (error || !data) {
    console.error('createSession:', error?.message)
    return null
  }

  return data as SessionRow
}

export async function updateProfileHours(
  userId: string,
  addedHours: number,
  currentStreak: number
): Promise<void> {
  const profile = await fetchProfileById(userId)
  if (!profile) return

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfToday.toISOString())

  let newStreak = currentStreak
  if (todayCount === 1) {
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    const { count: yesterdayCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfYesterday.toISOString())
      .lt('created_at', startOfToday.toISOString())

    newStreak = (yesterdayCount ?? 0) > 0 ? currentStreak + 1 : 1
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      total_hours: profile.totalHours + addedHours,
      weekly_hours: profile.weeklyHours + addedHours,
      streak: newStreak,
    })
    .eq('id', userId)

  if (error) {
    console.error('updateProfileHours:', error.message)
  }
}

export async function updatePostReaction(
  postId: string,
  field: 'likes' | 'dislikes',
  value: number
): Promise<void> {
  const { error } = await supabase.from('posts').update({ [field]: value }).eq('id', postId)

  if (error) {
    console.error('updatePostReaction:', error.message)
  }
}

export async function fetchWeeklyActivity(userId: string): Promise<WeeklyDay[]> {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const orderedLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  if (weekStart.getDay() === 0) {
    weekStart.setDate(weekStart.getDate() - 6)
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('duration, created_at')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())

  if (error) {
    console.error('fetchWeeklyActivity:', error.message)
    return orderedLabels.map((day) => ({ day, hours: 0 }))
  }

  const hoursByDay = new Map<string, number>()
  for (const label of orderedLabels) {
    hoursByDay.set(label, 0)
  }

  for (const row of (data as { duration: number; created_at: string }[]) || []) {
    const label = dayLabels[new Date(row.created_at).getDay()]
    hoursByDay.set(label, (hoursByDay.get(label) ?? 0) + (Number(row.duration) || 0))
  }

  return orderedLabels.map((day) => ({ day, hours: hoursByDay.get(day) ?? 0 }))
}

export async function fetchUserSessions(userId: string, limit = 12): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('fetchUserSessions:', error.message)
    return []
  }

  return (data as SessionRow[]) || []
}

export function getUserRank(profiles: User[], userId: string): number {
  const sorted = [...profiles].sort((a, b) => b.totalHours - a.totalHours)
  const index = sorted.findIndex((p) => p.id === userId)
  return index >= 0 ? index + 1 : 0
}
