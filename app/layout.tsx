import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ToastContainer from '@/components/ui/ToastContainer'
import PWARegister from '@/components/PWARegister'
import PWAManifest from '@/components/PWAManifest'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TuntasinAja - Social Homework Thread',
  description: 'Platform sosial berbasis thread untuk berbagi dan melacak tugas sekolah harian',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TuntasinAja',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export const viewport = {
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" type="application/manifest+json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TuntasinAja" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('ServiceWorker registered:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('ServiceWorker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <PWAManifest />
        <Providers>
          {children}
          <ToastContainer />
          <PWARegister />
        </Providers>
      </body>
    </html>
  )
}
