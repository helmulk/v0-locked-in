'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { currentUser, mockUsers, mockPosts, mockChats } from '@/lib/mock-data'
import type { User, Post, Chat } from '@/lib/types'

interface LockInSession {
  isActive: boolean
  startTime: Date | null
  elapsedSeconds: number
}

interface AppContextType {
  // User
  user: User
  
  // Lock In State
  session: LockInSession
  startSession: () => void
  endSession: () => void
  updateElapsed: (seconds: number) => void
  
  // Social
  users: User[]
  posts: Post[]
  chats: Chat[]
  friends: User[]
  
  // Actions
  addFriend: (userId: string) => void
  removeFriend: (userId: string) => void
  likePost: (postId: string) => void
  dislikePost: (postId: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User>(currentUser)
  const [users] = useState<User[]>(mockUsers)
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [chats] = useState<Chat[]>(mockChats)
  const [friends, setFriends] = useState<User[]>([mockUsers[0], mockUsers[1]])
  
  const [session, setSession] = useState<LockInSession>({
    isActive: false,
    startTime: null,
    elapsedSeconds: 0,
  })

  const startSession = useCallback(() => {
    setSession({
      isActive: true,
      startTime: new Date(),
      elapsedSeconds: 0,
    })
  }, [])

  const endSession = useCallback(() => {
    setSession({
      isActive: false,
      startTime: null,
      elapsedSeconds: 0,
    })
  }, [])

  const updateElapsed = useCallback((seconds: number) => {
    setSession(prev => ({ ...prev, elapsedSeconds: seconds }))
  }, [])

  const addFriend = useCallback((userId: string) => {
    const userToAdd = users.find(u => u.id === userId)
    if (userToAdd && !friends.find(f => f.id === userId)) {
      setFriends(prev => [...prev, userToAdd])
    }
  }, [users, friends])

  const removeFriend = useCallback((userId: string) => {
    setFriends(prev => prev.filter(f => f.id !== userId))
  }, [])

  const likePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ))
  }, [])

  const dislikePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, dislikes: p.dislikes + 1 } : p
    ))
  }, [])

  return (
    <AppContext.Provider value={{
      user,
      session,
      startSession,
      endSession,
      updateElapsed,
      users,
      posts,
      chats,
      friends,
      addFriend,
      removeFriend,
      likePost,
      dislikePost,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
