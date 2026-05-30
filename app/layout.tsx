import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppProvider } from '@/components/providers/app-provider'
import { Navigation } from '@/components/navigation'
import { SetupBanner } from '@/components/setup-banner'

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans'
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'Locked - Outwork Everyone',
  description: 'They&apos;re grinding while you&apos;re scrolling. Lock in or get left behind.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#141414',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <AppProvider>
          <SetupBanner />
          <Navigation />
          <main className="pb-20 md:pb-0 md:pl-20">
            {children}
          </main>
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
