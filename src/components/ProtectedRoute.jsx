'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from './LoadingSpinner'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, userDoc, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (requireAdmin && userDoc?.role !== 'admin') {
      router.push('/')
    }
  }, [user, userDoc, loading, requireAdmin, router])

  if (loading) return <PageLoader />
  if (!user) return null
  if (requireAdmin && userDoc?.role !== 'admin') return null

  return children
}
