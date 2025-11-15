import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ChatbotWrapper from '@/components/ChatbotWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NM2TECH LLC - Timesheet',
  description: 'Time tracking application for NM2TECH LLC employees and contractors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ChatbotWrapper />
      </body>
    </html>
  )
}





