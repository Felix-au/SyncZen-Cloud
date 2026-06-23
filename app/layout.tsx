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
}

export const metadata: Metadata = {
  metadataBase: new URL('https://synczen.cloud'),
  title: { default: 'SyncZen - Cloud Hotel Check-In & PMS', template: '%s | SyncZen' },
  description: 'Cloud hotel check-in and management platform — register hotels, manage rooms, and process guest check-ins from anywhere.',
  keywords: ['hotel management', 'check-in', 'hotel software', 'SyncZen', 'property management system', 'PMS', 'hotel booking'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://synczen.cloud',
    title: 'SyncZen - Cloud Hotel Check-In & PMS',
    description: 'Cloud hotel check-in and management platform — register hotels, manage rooms, and process guest check-ins from anywhere.',
    siteName: 'SyncZen',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'SyncZen Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'SyncZen - Cloud Hotel Check-In & PMS',
    description: 'Cloud hotel check-in and management platform — register hotels, manage rooms, and process guest check-ins from anywhere.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: 'googlecb84d8cd2044b548',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('synczen-theme');
                var theme = stored || 'dark';
                if (theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.removeAttribute('data-theme');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
