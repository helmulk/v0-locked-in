'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/providers/app-provider'
import { mockChats } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Plus, Users, Search } from 'lucide-react'

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

export default function MessagesPage() {
  const { session, user } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = mockChats.filter(chat => {
    const chatName = chat.isGroup 
      ? chat.name 
      : chat.participants.find(p => p.id !== user.id)?.username
    return chatName?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold tracking-tight">Messages</h1>
            <button className={cn(
              "p-2 rounded-lg transition-colors",
              session.isActive 
                ? "bg-lockin-red/10 text-lockin-red hover:bg-lockin-red/20" 
                : "bg-accent text-foreground hover:bg-accent/80"
            )}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-border">
          {filteredChats.map((chat) => {
            const otherParticipant = chat.participants.find(p => p.id !== user.id)
            const chatName = chat.isGroup ? chat.name : otherParticipant?.username
            const lastMessageSender = chat.lastMessage?.senderId === user.id 
              ? 'You' 
              : chat.isGroup 
                ? chat.participants.find(p => p.id === chat.lastMessage?.senderId)?.username 
                : null

            return (
              <Link
                key={chat.id}
                href={`/messages/${chat.id}`}
                className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Avatar */}
                <div className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center border",
                  session.isActive ? "border-lockin-red/30 bg-lockin-red/5" : "border-border bg-card"
                )}>
                  {chat.isGroup ? (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <span className="text-lg font-bold">
                      {otherParticipant?.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{chatName}</span>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessageSender && <span>{lastMessageSender}: </span>}
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredChats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No conversations found</p>
            <p className="text-xs mt-1">Start a chat with someone from the leaderboard</p>
          </div>
        )}
      </div>
    </div>
  )
}
