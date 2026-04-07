import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Salud Global - Farmacia y Perfumería',
  description: 'Pedí tus medicamentos y productos de salud online. Delivery rápido y seguro.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Salud Global',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#1565C0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Salud Global" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="bg-white text-gray-900 font-body">
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#1B5E4B', secondary: '#fff' },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
