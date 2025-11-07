import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yalla — Trivia Demo',
  description: 'Single-screen trivia demo (AR/EN)'
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
