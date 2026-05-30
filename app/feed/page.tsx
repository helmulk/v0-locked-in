'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/components/providers/app-provider'
import { cn } from '@/lib/utils'
import { ThumbsUp, ThumbsDown, UserPlus, UserCheck, Clock, MoreHorizontal } from 'lucide-react'

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function FeedPage() {
  const { posts, friends, addFriend, removeFriend, likePost, dislikePost, session, isLoading } = useApp()
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [dislikedPosts, setDislikedPosts] = useState<Set<string>>(new Set())

  const handleLike = (postId: string) => {
    if (likedPosts.has(postId)) return
    if (dislikedPosts.has(postId)) {
      setDislikedPosts(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
    setLikedPosts(prev => new Set(prev).add(postId))
    likePost(postId)
  }

  const handleDislike = (postId: string) => {
    if (dislikedPosts.has(postId)) return
    if (likedPosts.has(postId)) {
      setLikedPosts(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
    setDislikedPosts(prev => new Set(prev).add(postId))
    dislikePost(postId)
  }

  const isFriend = (userId: string) => friends.some(f => f.id === userId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading feed...</p>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4">
          <h1 className="text-lg font-bold tracking-tight">For You</h1>
          <p className="text-xs text-muted-foreground">See what others accomplished</p>
        </div>

        {/* Feed */}
        <div className="divide-y divide-border">
          {posts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No posts yet</p>
              <p className="text-xs mt-1">Lock in and share your work</p>
            </div>
          )}
          {posts.map((post) => (
            <article key={post.id} className="p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <Link 
                  href={`/profile/${post.user.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-colors",
                    session.isActive 
                      ? "border-lockin-red/50 group-hover:border-lockin-red" 
                      : "border-border group-hover:border-foreground"
                  )}>
                    <span className="text-sm font-bold">
                      {post.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-sm group-hover:underline">
                      {post.user.username}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.duration.toFixed(1)}h locked in
                      </span>
                      <span>·</span>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => isFriend(post.user.id) ? removeFriend(post.user.id) : addFriend(post.user.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors text-sm",
                      isFriend(post.user.id)
                        ? "text-lockin-red"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isFriend(post.user.id) ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Post Image (placeholder) */}
              <div className="aspect-[4/3] rounded-lg bg-card border border-border mb-3 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold">{post.user.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-xs">@{post.user.username}</p>
                  <p className="text-sm font-mono mt-1">{post.duration.toFixed(1)}h</p>
                </div>
              </div>

              {/* Description */}
              {post.description && (
                <p className="text-sm mb-3">
                  <span className="font-medium">{post.user.username}</span>{' '}
                  <span className="text-muted-foreground">{post.description}</span>
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg transition-colors",
                    likedPosts.has(post.id)
                      ? session.isActive 
                        ? "bg-lockin-red/10 text-lockin-red" 
                        : "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <ThumbsUp className={cn("w-4 h-4", likedPosts.has(post.id) && "fill-current")} />
                  <span className="text-sm font-mono">{post.likes}</span>
                </button>
                <button
                  onClick={() => handleDislike(post.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg transition-colors",
                    dislikedPosts.has(post.id)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <ThumbsDown className={cn("w-4 h-4", dislikedPosts.has(post.id) && "fill-current")} />
                  <span className="text-sm font-mono">{post.dislikes}</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State or Load More */}
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">You&apos;ve seen all recent posts</p>
          <p className="text-xs mt-1">Time to lock in and create your own</p>
        </div>
      </div>
    </div>
  )
}
