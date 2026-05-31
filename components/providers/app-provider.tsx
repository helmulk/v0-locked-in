'use client'

import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react'
import {
  resolveCurrentUserId, fetchProfiles, fetchPosts,
  createSession, updateProfileHours, updatePostReaction,
  fetchFollowing, follow, unfollow, countUnseenNudges,
} from '@/lib/db'
import type { User, Post, Chat } from '@/lib/types'

interface LockInSession {
  isActive: boolean
  startTime: Date | null
  elapsedSeconds: number
}

interface AppContextType {
  user: User
  isLoading: boolean
  session: LockInSession
  startSession: () => void
  endSession: () => Promise<void>
  updateElapsed: (seconds: number) => void
  users: User[]
  posts: Post[]
  chats: Chat[]
  friends: User[]
  nudgeCount: number
  refreshData: () => Promise<void>
  addFriend: (userId: string) => void
  removeFriend: (userId: string) => void
  likePost: (postId: string) => void
  dislikePost: (postId: string) => void
}

const defaultUser: User = {
  id: '', username: 'you', totalHours: 0, weeklyHours: 0, streak: 0, joinedAt: new Date(),
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [followIds, setFollowIds] = useState<string[]>([])
  const [nudgeCount, setNudgeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<LockInSession>({
    isActive: false, startTime: null, elapsedSeconds: 0,
  })

  const refreshData = useCallback(async () => {
    const currentUserId = await resolveCurrentUserId()
    if (!currentUserId) { setIsLoading(false); return }

    const [profiles, postsData, followingIds, unseen] = await Promise.all([
      fetchProfiles(),
      fetchPosts(),
      fetchFollowing(currentUserId),
      countUnseenNudges(currentUserId),
    ])

    const currentUser = profiles.find((p) => p.id === currentUserId) ?? { ...defaultUser, id: currentUserId }
    setUser(currentUser)
    setUsers(profiles)
    setPosts(postsData)
    setFollowIds(followingIds)
    setNudgeCount(unseen)
    setIsLoading(false)
  }, [])

  useEffect(() => { refreshData() }, [refreshData])

  const friends = users.filter((u) => followIds.includes(u.id) && u.id !== user.id)

  const startSession = useCallback(() => {
    setSession({ isActive: true, startTime: new Date(), elapsedSeconds: 0 })
  }, [])

  const endSession = useCallback(async () => {
    const elapsed = session.elapsedSeconds
    const startTime = session.startTime
    setSession({ isActive: false, startTime: null, elapsedSeconds: 0 })
    if (!user.id || !startTime || elapsed < 60) return
    const durationHours = elapsed / 3600
    await createSession(user.id, durationHours)
    await updateProfileHours(user.id, durationHours, user.streak)
    await refreshData()
  }, [session.elapsedSeconds, session.startTime, user.id, user.streak, refreshData])

  const updateElapsed = useCallback((seconds: number) => {
    setSession((prev) => ({ ...prev, elapsedSeconds: seconds }))
  }, [])

  const addFriend = useCallback(async (userId: string) => {
    if (!user.id) return
    setFollowIds((prev) => prev.includes(userId) ? prev : [...prev, userId])
    await follow(user.id, userId)
  }, [user.id])

  const removeFriend = useCallback(async (userId: string) => {
    if (!user.id) return
    setFollowIds((prev) => prev.filter((id) => id !== userId))
    await unfollow(user.id, userId)
  }, [user.id])

  const likePost = useCallback((postId: string) => {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === postId)
      if (!post) return prev
      const likes = post.likes + 1
      updatePostReaction(postId, 'likes', likes)
      return prev.map((p) => (p.id === postId ? { ...p, likes } : p))
    })
  }, [])

  const dislikePost = useCallback((postId: string) => {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === postId)
      if (!post) return prev
      const dislikes = post.dislikes + 1
      updatePostReaction(postId, 'dislikes', dislikes)
      return prev.map((p) => (p.id === postId ? { ...p, dislikes } : p))
    })
  }, [])

  return (
    <AppContext.Provider value={{
      user, isLoading, session, startSession, endSession, updateElapsed,
      users, posts, chats: [], friends, nudgeCount,
      refreshData, addFriend, removeFriend, likePost, dislikePost,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
