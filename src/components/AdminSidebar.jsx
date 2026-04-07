'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Cross, LayoutDashboard, Package, Users, LogOut, ChevronLeft, Megaphone, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToUnreadNotifications, markNotificationRead } from '@/lib/firestore'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/anuncios', label: 'Anuncios', icon: Megaphone },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const prevIdsRef = useRef(new Set())
  const initialLoadRef = useRef(true)

  useEffect(() => {
    const unsub = subscribeToUnreadNotifications((notifs) => {
      setNotifications(notifs)

      if (initialLoadRef.current) {
        // On first load, just register existing ids without toasting
        notifs.forEach((n) => prevIdsRef.current.add(n.id))
        initialLoadRef.current = false
        return
      }

      // Show toast only for truly new notifications
      for (const n of notifs) {
        if (!prevIdsRef.current.has(n.id)) {
          prevIdsRef.current.add(n.id)
          if (n.type === 'pago_confirmado') {
            try { new Audio('/notification.mp3').play() } catch {}
            toast(
              (t) => (
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">💳 Pago confirmado por cliente</p>
                    <p className="text-sm text-gray-600">{n.customerName} — {n.orderNumber}</p>
                  </div>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id)
                      markNotificationRead(n.id)
                      router.push(`/admin/pedido/${n.orderId}`)
                    }}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                  >
                    Ver pedido
                  </button>
                </div>
              ),
              { duration: 15000, style: { maxWidth: 380 } }
            )
          }
        }
      }

      // Clean up ids no longer unread
      const currentIds = new Set(notifs.map((n) => n.id))
      for (const id of prevIdsRef.current) {
        if (!currentIds.has(id)) prevIdsRef.current.delete(id)
      }
    })
    return unsub
  }, [router])

  const isActive = (item) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary-dark text-white flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold leading-none font-heading">Salud Global</p>
            <p className="text-xs text-white/60">Panel Admin</p>
          </div>
          {notifications.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {notifications.length > 0 && (
        <div className="mx-3 mt-3 bg-yellow-400/20 border border-yellow-400/40 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            {notifications.length} pago{notifications.length > 1 ? 's' : ''} pendiente{notifications.length > 1 ? 's' : ''}
          </p>
          {notifications.slice(0, 3).map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id)
                router.push(`/admin/pedido/${n.orderId}`)
              }}
              className="w-full text-left text-xs text-yellow-100 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <span className="font-semibold">{n.orderNumber}</span> · {n.customerName}
            </button>
          ))}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer links */}
      <div className="p-4 space-y-1 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          Ver sitio
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
