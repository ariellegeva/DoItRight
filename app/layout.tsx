import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Do It Right',
  description: 'Your weekly health missions, powered by AI.',
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
