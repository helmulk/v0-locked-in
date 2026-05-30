'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Compass, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'

const navItems = [
  { href: '/', icon: Home, label: 'Lock In' },
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/feed', icon: Compass, label: 'Feed' },
  { href: '/messages', icon: MessageCircle, label: 'DMs' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Navigation() {
  const pathname = usePathname()
  const { session } = useApp()

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden border-t transition-colors duration-500",
        session.isActive 
          ? "bg-background/95 border-lockin-red/30" 
          : "bg-background/95 border-border"
      )}>
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive 
                    ? session.isActive 
                      ? "text-lockin-red" 
                      : "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className={cn(
        "fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col w-20 border-r transition-colors duration-500",
        session.isActive 
          ? "bg-background border-lockin-red/30" 
          : "bg-background border-border"
      )}>
        <div className="flex flex-col items-center py-6 gap-2">
          <div className={cn(
            "text-xl font-bold tracking-tighter mb-6 transition-colors duration-500",
            session.isActive ? "text-lockin-red" : "text-foreground"
          )}>
            LI
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-16 rounded-lg gap-1 transition-all",
                  isActive 
                    ? session.isActive 
                      ? "text-lockin-red bg-lockin-red/10" 
                      : "text-foreground bg-accent" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
