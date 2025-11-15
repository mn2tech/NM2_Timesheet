import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ChatbotWrapper from '@/components/ChatbotWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NM2TECH LLC - Timesheet',
  description: 'Time tracking application for NM2TECH LLC employees and contractors',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NM2Timesheet',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  // Next.js App Router automatically serves app/icon.svg as the favicon
  // No need to explicitly define it in metadata
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NM2Timesheet" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        {children}
        <ChatbotWrapper />
      </body>
    </html>
  )
}





