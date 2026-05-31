'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Compass, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'

const navItems = [
  { href: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/feed', icon: Compass, label: 'Explore' },
  { href: '/', icon: Home, label: 'Locked', isMain: true },
  { href: '/messages', icon: Bell, label: 'Nudges' },
  { href: '/profile', icon: User, label: 'You' },
]

export function Navigation() {
  const pathname = usePathname()
  const { session, nudgeCount, user } = useApp()
  const isLoggedIn = Boolean(user?.id)

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden border-t transition-colors duration-500',
        session.isActive ? 'bg-background/95 border-lockin-red/30' : 'bg-background/95 border-border'
      )}>
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label, isMain }) => {
            const isActive = pathname === href
            const showBadge = href === '/messages' && nudgeCount > 0
            const showAuthDot = href === '/profile' && !isLoggedIn
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1 transition-colors relative',
                  isMain ? 'w-20' : 'w-full',
                  isMain && !isActive && 'relative -top-3',
                  isActive
                    ? session.isActive ? 'text-lockin-red' : 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isMain ? (
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all',
                    isActive
                      ? session.isActive ? 'bg-lockin-red/20 border-lockin-red' : 'bg-foreground/10 border-foreground'
                      : 'bg-card border-muted-foreground/30'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lockin-red text-[9px] font-bold text-white flex items-center justify-center">
                          {nudgeCount > 9 ? '9+' : nudgeCount}
                        </span>
                      )}
                      {showAuthDot && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/60 border border-background" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className={cn(
        'fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col w-20 border-r transition-colors duration-500',
        session.isActive ? 'bg-background border-lockin-red/30' : 'bg-background border-border'
      )}>
        <div className="flex flex-col items-center h-full py-6">
          <div className={cn(
            'text-xl font-bold tracking-tighter mb-4 transition-colors duration-500',
            session.isActive ? 'text-lockin-red' : 'text-foreground'
          )}>
            LD
          </div>

          <div className="flex flex-col items-center gap-1">
            {navItems.filter((i) => !i.isMain).slice(0, 2).map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href
              return (
                <Link key={href} href={href} className={cn(
                  'flex flex-col items-center justify-center w-16 h-14 rounded-lg gap-1 transition-all',
                  isActive
                    ? session.isActive ? 'text-lockin-red bg-lockin-red/10' : 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex-1 flex items-center justify-center">
            {navItems.filter((i) => i.isMain).map(({ href, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link key={href} href={href} className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all',
                  isActive
                    ? session.isActive ? 'bg-lockin-red/20 border-lockin-red text-lockin-red' : 'bg-foreground/10 border-foreground text-foreground'
                    : session.isActive
                      ? 'bg-card border-lockin-red/50 text-lockin-red/70 hover:border-lockin-red hover:text-lockin-red'
                      : 'bg-card border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
                )}>
                  <Icon className="w-6 h-6" />
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-1">
            {navItems.filter((i) => !i.isMain).slice(2).map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href
              const showBadge = href === '/messages' && nudgeCount > 0
              const showAuthDot = href === '/profile' && !isLoggedIn
              return (
                <Link key={href} href={href} className={cn(
                  'flex flex-col items-center justify-center w-16 h-14 rounded-lg gap-1 transition-all relative',
                  isActive
                    ? session.isActive ? 'text-lockin-red bg-lockin-red/10' : 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}>
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lockin-red text-[9px] font-bold text-white flex items-center justify-center">
                        {nudgeCount > 9 ? '9+' : nudgeCount}
                      </span>
                    )}
                    {showAuthDot && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/50 border border-background" />
                    )}
                  </div>
                  <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
