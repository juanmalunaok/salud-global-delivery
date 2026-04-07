import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Salud Global - Farmacia y Perfumería',
  description: 'Pedí tus medicamentos y productos de salud online. Delivery rápido y seguro.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💊</text></svg>",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900 font-body">
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster
              position="top-right"
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
