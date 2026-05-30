export interface User {
  id: string
  username: string
  avatar?: string
  totalHours: number
  weeklyHours: number
  streak: number
  joinedAt: Date
}

export interface Session {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  duration: number
  proofImage?: string
  verified: boolean
}

export interface Post {
  id: string
  userId: string
  user: User
  imageUrl: string
  duration: number
  description?: string
  likes: number
  dislikes: number
  createdAt: Date
}

export interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date
}

export interface Chat {
  id: string
  name?: string
  isGroup: boolean
  participants: User[]
  lastMessage?: Message
  messages: Message[]
}

export interface FriendRequest {
  id: string
  from: User
  to: User
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}
