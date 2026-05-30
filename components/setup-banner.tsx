'use client'

import { isSupabaseConfigured } from '@/lib/supabase'

export function SetupBanner() {
  if (isSupabaseConfigured()) return null

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-medium">Database not connected</p>
      <p className="mt-1 text-amber-100/80">
        Add{' '}
        <code className="rounded bg-black/30 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-black/30 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
        <code className="rounded bg-black/30 px-1 py-0.5">.env.local</code>, then restart{' '}
        <code className="rounded bg-black/30 px-1 py-0.5">pnpm dev</code>.
      </p>
    </div>
  )
}
