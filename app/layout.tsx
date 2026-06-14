import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // prevents double-tap zoom on inputs
}

export const metadata: Metadata = {
  title: { default: 'SyncZen Cloud', template: '%s | SyncZen Cloud' },
  description: 'Cloud hotel check-in and management platform — register hotels, manage rooms, and process guest check-ins from anywhere.',
  keywords: ['hotel management', 'check-in', 'hotel software', 'SyncZen Cloud'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
