import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import ToastContainer from '@/components/ui/ToastContainer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TuntasinAja',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TuntasinAja" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        {/* Theme initialization script - runs before React to prevent flash */}
        {/* Always use 'auto' mode - follow device theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Always use auto mode - follow device theme
              var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              
              // Apply theme immediately before React renders based on device preference
              if (systemPrefersDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              
              // Save 'auto' to localStorage
              localStorage.setItem('tuntasin-theme', 'auto');
            } catch (e) {
              // Fallback to light if localStorage fails
              console.error('Theme initialization error:', e);
            }
          })();
        `}} />
        {/* Early error handler script - runs before React loads and on app resume */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var errorShown = false;
            
            function checkForNetworkError() {
              if (errorShown) return true;
              
              // Don't show error if React app is already rendered (let React handle errors)
              if (document.getElementById('__next') || document.querySelector('[data-reactroot]') || window.__NEXT_DATA__) {
                return false;
              }
              
              var bodyText = document.body ? document.body.textContent || document.body.innerText : '';
              
              // Only check for actual network errors, not all JSON errors
              if (bodyText) {
                // Must contain both "error" AND network-related keywords
                var hasNetworkError = (bodyText.indexOf('"error"') !== -1 || bodyText.indexOf('{"error":') !== -1) &&
                                      (bodyText.indexOf('Network request failed') !== -1 ||
                                       bodyText.indexOf('Failed to fetch') !== -1 ||
                                       bodyText.indexOf('ERR_NAME_NOT_RESOLVED') !== -1 ||
                                       bodyText.indexOf('NetworkError') !== -1);
                
                // Also check if it's a pure JSON error response (not from React)
                var isJsonErrorOnly = bodyText.trim().startsWith('{') && 
                                     bodyText.indexOf('"error"') !== -1 &&
                                     bodyText.indexOf('Network') !== -1 &&
                                     bodyText.length < 500; // JSON errors are usually short
                
                if (hasNetworkError || isJsonErrorOnly) {
                  showErrorPage();
                  return true;
                }
              }
              return false;
            }
            
            function showErrorPage() {
              errorShown = true;
              document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;background:#1a1a2e;color:white;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;"><div style="font-size:4rem;margin-bottom:1rem;">⚠️</div><h1 style="font-size:1.5rem;margin-bottom:0.5rem;font-weight:600;">Koneksi Gagal</h1><p style="color:#a0a0a0;margin-bottom:2rem;font-size:0.95rem;max-width:300px;line-height:1.5;">Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.</p><button onclick="window.location.reload()" style="padding:1rem 2.5rem;background:#ef4444;color:white;border:none;border-radius:0.75rem;font-size:1.1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);transition:all 0.2s;">🔄 Muat Ulang</button><p style="color:#666;margin-top:1.5rem;font-size:0.75rem;">Klik tombol di atas untuk mencoba lagi</p></div>';
              document.body.style.margin = '0';
              document.body.style.padding = '0';
            }
            
            // Check when app comes back from background (visibility change)
            document.addEventListener('visibilitychange', function() {
              if (!document.hidden) {
                // App is now visible (resumed from background)
                errorShown = false; // Reset flag
                setTimeout(checkForNetworkError, 100);
                setTimeout(checkForNetworkError, 500);
                setTimeout(checkForNetworkError, 1000);
                setTimeout(checkForNetworkError, 2000);
                setTimeout(checkForNetworkError, 3000);
              }
            });
            
            // Check on page focus (another way to detect app resume)
            window.addEventListener('focus', function() {
              errorShown = false;
              setTimeout(checkForNetworkError, 100);
              setTimeout(checkForNetworkError, 500);
              setTimeout(checkForNetworkError, 1000);
            });
            
            // Check immediately on page load
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(checkForNetworkError, 100);
              });
            } else {
              setTimeout(checkForNetworkError, 100);
            }
            
            // Also check after delays in case content loads later
            setTimeout(checkForNetworkError, 500);
            setTimeout(checkForNetworkError, 1000);
            setTimeout(checkForNetworkError, 2000);
            
            // Continuous monitoring for errors
            setInterval(checkForNetworkError, 2000);
            
            // Watch for body changes using MutationObserver
            if (typeof MutationObserver !== 'undefined') {
              var observer = new MutationObserver(function() {
                setTimeout(checkForNetworkError, 100);
              });
              if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true, characterData: true });
              } else {
                document.addEventListener('DOMContentLoaded', function() {
                  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
                });
              }
            }
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <ToastContainer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
