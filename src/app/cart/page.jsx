'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { createOrder, getPickupDate } from '@/lib/firestore'
import { ShoppingBag, Trash2, Plus, Minus, ChevronLeft, FileText, MapPin, Truck, Store, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'

const BRANCHES = [
  { value: 'ac', label: 'AC' },
  { value: 'juncal', label: 'Juncal' },
  { value: 'fondo', label: 'Fondo' },
  { value: 'libertador', label: 'Libertador' },
  { value: 'cervino', label: 'Cerviño' },
  { value: 'santa_fe', label: 'Santa Fe' },
]

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function CartContent() {
  const { items, removeItem, updateQuantity, total, subtotal, clearCart } = useCart()
  const { user, userDoc } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [branch, setBranch] = useState('')

  const handleConfirm = async () => {
    if (items.length === 0) return
    if (deliveryType === 'pickup' && !branch) {
      toast.error('Seleccioná una sucursal para el retiro.')
      return
    }
    setSubmitting(true)
    try {
      await createOrder(user.uid, {
        customerName: userDoc?.name || user.displayName || '',
        customerEmail: user.email || '',
        customerPhone: userDoc?.phone || '',
        customerAddress: userDoc?.address || '',
        customerNotes: notes,
        deliveryType,
        branch: deliveryType === 'pickup' ? branch : null,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal,
        total,
      })
      clearCart()
      toast.success('¡Pedido confirmado! Te avisamos cuando esté listo el presupuesto.')
      router.push('/mis-pedidos')
    } catch (err) {
      console.error(err)
      toast.error('Hubo un error al crear el pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2 font-heading">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-6">Agregá productos desde el catálogo para hacer tu pedido.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-light transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Items list */}
      <div className="lg:col-span-2 space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
            {item.image && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 leading-snug">{item.name}</h3>
              <p className="text-primary font-semibold mt-1">{formatPrice(item.unitPrice)}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Subtotal: <span className="font-medium text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Delivery type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            ¿Cómo recibís tu pedido?
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setDeliveryType('delivery'); setBranch('') }}
              className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                deliveryType === 'delivery'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Truck className="w-5 h-5" />
              Delivery a domicilio
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                deliveryType === 'pickup'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Store className="w-5 h-5" />
              Retiro en sucursal
            </button>
          </div>

          {deliveryType === 'pickup' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Elegí la sucursal:</p>
                <div className="grid grid-cols-3 gap-2">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBranch(b.value)}
                      className={`py-2 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        branch === b.value
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <CalendarClock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">Fecha estimada de retiro:</p>
                  <p className="text-sm text-blue-700 font-medium capitalize">{getPickupDate().label}</p>
                  <p className="text-xs text-blue-600 mt-0.5">Los retiros son martes y jueves. Pedidos antes de las 11 hs se retiran el mismo día.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: necesito el medicamento genérico, tengo receta médica, entregar en portería..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-heading">Resumen del pedido</h2>

          <div className="space-y-2 text-sm pb-4 border-b border-gray-100">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-2">
                <span className="text-gray-600 truncate flex-1">
                  {item.name.split(' ').slice(0, 3).join(' ')}... x{item.quantity}
                </span>
                <span className="text-gray-900 font-medium flex-shrink-0">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="py-4 border-b border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entrega</span>
              <span className="text-gray-700 font-medium">
                {deliveryType === 'pickup'
                  ? `Retiro en ${BRANCHES.find(b => b.value === branch)?.label || '—'}`
                  : 'Delivery · A coordinar'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="font-semibold text-gray-900">Total estimado</span>
            <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            El precio final puede ajustarse según disponibilidad. El equipo de Salud Global te enviará el presupuesto definitivo.
          </p>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                Enviando pedido...
              </>
            ) : (
              'Confirmar pedido'
            )}
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background-secondary">
        <Navbar />
        <CartDrawer />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Tu carrito</h1>
          </div>
          <CartContent />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
