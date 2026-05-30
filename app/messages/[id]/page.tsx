'use client'

import { useState, useRef, useEffect, use } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/providers/app-provider'
import { mockChats } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { ArrowLeft, Send, Users, Info } from 'lucide-react'
import type { Message } from '@/lib/types'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { session, user } = useApp()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chat = mockChats.find(c => c.id === id)
  const otherParticipant = chat?.participants.find(p => p.id !== user.id)
  const chatName = chat?.isGroup ? chat.name : otherParticipant?.username

  useEffect(() => {
    if (chat) {
      setMessages(chat.messages)
    }
  }, [chat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: `m${Date.now()}`,
      senderId: user.id,
      content: newMessage.trim(),
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chat not found</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border",
              session.isActive ? "border-lockin-red/30 bg-lockin-red/5" : "border-border bg-card"
            )}>
              {chat.isGroup ? (
                <Users className="w-4 h-4 text-muted-foreground" />
              ) : (
                <span className="text-sm font-bold">
                  {otherParticipant?.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <span className="font-medium text-sm">{chatName}</span>
              {chat.isGroup && (
                <p className="text-xs text-muted-foreground">
                  {chat.participants.length} members
                </p>
              )}
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === user.id
            const sender = chat.participants.find(p => p.id === message.senderId)

            return (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  isOwn ? "items-end" : "items-start"
                )}
              >
                {chat.isGroup && !isOwn && (
                  <span className="text-xs text-muted-foreground mb-1 ml-1">
                    {sender?.username}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl",
                    isOwn
                      ? session.isActive 
                        ? "bg-lockin-red text-foreground rounded-br-md" 
                        : "bg-foreground text-background rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {formatTime(message.createdAt)}
                </span>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-16 md:bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              "p-2.5 rounded-full transition-colors",
              newMessage.trim()
                ? session.isActive 
                  ? "bg-lockin-red text-foreground" 
                  : "bg-foreground text-background"
                : "bg-card text-muted-foreground"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
