import type { Metadata } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'Retirement Simulator',
  description: 'Monte Carlo retirement planning using historical S&P 500 returns',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
