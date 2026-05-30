import type { User, Post, Chat, Message } from './types'

export const currentUser: User = {
  id: 'current',
  username: 'you',
  totalHours: 47.5,
  weeklyHours: 12.3,
  streak: 7,
  joinedAt: new Date('2024-01-15'),
}

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'alex_grind',
    totalHours: 234.5,
    weeklyHours: 28.3,
    streak: 45,
    joinedAt: new Date('2023-08-10'),
  },
  {
    id: '2',
    username: 'maria.focus',
    totalHours: 189.2,
    weeklyHours: 24.1,
    streak: 32,
    joinedAt: new Date('2023-09-22'),
  },
  {
    id: '3',
    username: 'dev_mode',
    totalHours: 156.8,
    weeklyHours: 21.5,
    streak: 28,
    joinedAt: new Date('2023-10-05'),
  },
  {
    id: '4',
    username: 'night.owl',
    totalHours: 142.3,
    weeklyHours: 19.8,
    streak: 21,
    joinedAt: new Date('2023-11-12'),
  },
  {
    id: '5',
    username: 'early_bird',
    totalHours: 128.9,
    weeklyHours: 18.2,
    streak: 19,
    joinedAt: new Date('2023-12-01'),
  },
  {
    id: '6',
    username: 'code.ninja',
    totalHours: 98.4,
    weeklyHours: 15.6,
    streak: 14,
    joinedAt: new Date('2024-01-08'),
  },
  {
    id: '7',
    username: 'study.hard',
    totalHours: 87.2,
    weeklyHours: 14.3,
    streak: 12,
    joinedAt: new Date('2024-01-20'),
  },
  {
    id: '8',
    username: 'deep_work',
    totalHours: 76.5,
    weeklyHours: 12.8,
    streak: 10,
    joinedAt: new Date('2024-02-05'),
  },
]

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    imageUrl: '/posts/work-1.jpg',
    duration: 3.5,
    description: 'finally cracked that algorithm',
    likes: 47,
    dislikes: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    imageUrl: '/posts/work-2.jpg',
    duration: 2.8,
    description: 'design sprint complete',
    likes: 38,
    dislikes: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    imageUrl: '/posts/work-3.jpg',
    duration: 4.2,
    description: 'shipped it',
    likes: 62,
    dislikes: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: '4',
    userId: '4',
    user: mockUsers[3],
    imageUrl: '/posts/work-4.jpg',
    duration: 1.5,
    description: 'late night grind',
    likes: 29,
    dislikes: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
]

export const mockChats: Chat[] = [
  {
    id: '1',
    isGroup: false,
    participants: [currentUser, mockUsers[0]],
    lastMessage: {
      id: 'm1',
      senderId: '1',
      content: 'yo just hit 4 hours today',
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    messages: [
      {
        id: 'm1',
        senderId: '1',
        content: 'yo just hit 4 hours today',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: 'm2',
        senderId: 'current',
        content: 'nice, im about to lock in now',
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
      },
    ],
  },
  {
    id: '2',
    name: 'grind gang',
    isGroup: true,
    participants: [currentUser, mockUsers[0], mockUsers[1], mockUsers[2]],
    lastMessage: {
      id: 'm3',
      senderId: '2',
      content: 'anyone else locked in rn?',
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    messages: [
      {
        id: 'm3',
        senderId: '2',
        content: 'anyone else locked in rn?',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: 'm4',
        senderId: '3',
        content: 'yup on hour 2',
        createdAt: new Date(Date.now() - 1000 * 60 * 40),
      },
    ],
  },
  {
    id: '3',
    isGroup: false,
    participants: [currentUser, mockUsers[1]],
    lastMessage: {
      id: 'm5',
      senderId: 'current',
      content: 'lets go for 5 hours tmrw',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    messages: [
      {
        id: 'm5',
        senderId: 'current',
        content: 'lets go for 5 hours tmrw',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    ],
  },
]

export const weeklyData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.2 },
  { day: 'Wed', hours: 1.8 },
  { day: 'Thu', hours: 4.1 },
  { day: 'Fri', hours: 2.9 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 1.5 },
]
