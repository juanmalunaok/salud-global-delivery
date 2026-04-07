'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cross } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function LoginPage() {
  const { user, userDoc, loading, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    if (!loading && user && userDoc) {
      if (userDoc.role === 'admin') {
        router.replace('/admin')
      } else if (!userDoc.profileComplete) {
        router.replace('/completar-perfil')
      } else {
        router.replace('/')
      }
    }
  }, [user, userDoc, loading, router])

  const handleLogin = async () => {
    setLoggingIn(true)
    try {
      await loginWithGoogle()
      // Redirect handled by useEffect
    } catch (err) {
      console.error(err)
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Error al iniciar sesión. Intentá de nuevo.')
      }
      setLoggingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Cross className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Salud Global</h1>
            <p className="text-sm text-gray-500 mt-1">Farmacia y Perfumería</p>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 font-heading mb-2">
              Iniciá sesión para continuar
            </h2>
            <p className="text-sm text-gray-500">
              Accedé con tu cuenta de Google para hacer pedidos y ver tu historial.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loggingIn ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{loggingIn ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}</span>
          </button>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al iniciar sesión aceptás nuestros{' '}
            <span className="text-primary">términos y condiciones</span>.
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <a href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
            ← Volver al catálogo
          </a>
        </div>
      </div>
    </div>
  )
}
