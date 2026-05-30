'use client'

import { useApp } from '@/components/providers/app-provider'
import { LockInButton } from '@/components/lock-in-button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { session } = useApp()

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      session.isActive ? "locked-in" : ""
    )}>
      <LockInButton />
    </div>
  )
}
