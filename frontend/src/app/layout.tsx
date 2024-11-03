// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Web3Provider } from '@/contexts/Web3Context'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}