'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProtectedRoute from '@/components/ProtectedRoute'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeToUserOrders, updateOrder, createNotification, ADMIN_EMAIL } from '@/lib/firestore'
import { Package, ChevronDown, ChevronUp, ExternalLink, ShoppingBag, Store, Truck, CalendarClock, Mail, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BRANCH_LABELS = { ac: 'AC', juncal: 'Juncal', fondo: 'Fondo', libertador: 'Libertador', cervino: 'Cerviño', santa_fe: 'Santa Fe' }

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function formatDate(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)
  const [markingShared, setMarkingShared] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)

  const handleMarkShared = async () => {
    setMarkingShared(true)
    try {
      await updateOrder(order.id, { recetaCompartida: true })
      toast.success('¡Gracias! La farmacia validará tu receta pronto.')
    } catch {
      toast.error('Error al confirmar. Intentá de nuevo.')
    } finally {
      setMarkingShared(false)
    }
  }

  const handleOpenPayment = () => {
    window.open(order.paymentLink, '_blank', 'noopener,noreferrer')
    setPaymentModal(true)
  }

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true)
    try {
      await updateOrder(order.id, { pagoPendienteConfirmacion: true })
      await createNotification({
        type: 'pago_confirmado',
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
      })
      setPaymentModal(false)
      toast.success('¡Gracias! El equipo confirmará tu pago pronto.')
    } catch {
      toast.error('Error al confirmar. Intentá de nuevo.')
    } finally {
      setConfirmingPayment(false)
    }
  }

  return (
    <>
    {/* Payment confirmation modal */}
    {paymentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPaymentModal(false)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center font-heading mb-2">Completá tu pago</h3>
          <p className="text-sm text-gray-500 text-center mb-1">
            Se abrió MercadoPago en otra pestaña.
          </p>
          <p className="text-sm text-gray-500 text-center mb-6">
            Una vez que realizaste el pago, avisanos tocando el botón de abajo y el equipo lo confirmará.
          </p>
          <button
            onClick={handleConfirmPayment}
            disabled={confirmingPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            Ya realicé el pago
          </button>
          <button
            onClick={() => setPaymentModal(false)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            Todavía no pagué
          </button>
        </div>
      </div>
    )}

    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      order.status === 'pendiente' ? 'border-yellow-300 shadow-yellow-50 shadow-md' : 'border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 font-heading">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} size="sm" />
              </div>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {order.items?.length || 0} producto{order.items?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="font-bold text-primary text-lg">{formatPrice(order.total)}</p>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Cancellation notice */}
      {order.status === 'cancelado' && (
        <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
          <p className="text-sm font-bold text-red-800 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 flex-shrink-0" /> Pedido cancelado
          </p>
          {order.cancelReason && (
            <p className="text-sm text-red-700">
              <span className="font-medium">Motivo:</span> {order.cancelReason}
            </p>
          )}
          <p className="text-sm text-red-700">
            {order.hadPayment
              ? 'Si realizaste un pago, un asesor de Salud Global se va a comunicar con vos para hacer efectivo el reintegro.'
              : 'Si tenés alguna consulta, comunicate con la farmacia.'}
          </p>
        </div>
      )}

      {/* Recipe CTA */}
      {order.status === 'esperando_receta' && (
        <div className="mx-5 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
          {!order.recetaCompartida ? (
            <>
              <p className="text-sm font-medium text-orange-800 mb-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Enviá tu receta por email
              </p>
              <p className="text-xs text-orange-700 mb-3">
                Reenviá el mail de la receta a{' '}
                <a href={`mailto:${ADMIN_EMAIL}?subject=Receta pedido ${order.orderNumber}`} className="font-semibold underline">
                  {ADMIN_EMAIL}
                </a>
                {' '}poniendo en el asunto: <strong>Receta pedido {order.orderNumber}</strong>.
              </p>
              <button
                onClick={handleMarkShared}
                disabled={markingShared}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ya compartí el mail de la receta
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Receta enviada — esperando validación de la farmacia.</span>
            </div>
          )}
        </div>
      )}

      {/* Payment CTA */}
      {order.status === 'presupuestado' && order.paymentLink && (
        <div className="mx-5 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          {order.pagoPendienteConfirmacion ? (
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Pago enviado — el equipo lo confirmará pronto.</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-blue-800 mb-2">
                ¡Tu presupuesto está listo! Hacé click para pagar.
              </p>
              <button
                onClick={handleOpenPayment}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ir a pagar con MercadoPago
              </button>
            </>
          )}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Detalle del pedido</h3>
          <div className="space-y-2 mb-4">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  {item.name} <span className="text-gray-400">x{item.quantity}</span>
                </span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          {order.recetaDiscountApplied && order.discountAmount > 0 && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm space-y-1">
              <p className="font-semibold text-green-800">Descuento receta validada</p>
              <div className="flex justify-between text-gray-600">
                <span>Total original</span>
                <span>{formatPrice(order.originalTotal ?? order.total)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Descuento aplicado</span>
                <span>- {formatPrice(order.discountAmount)}</span>
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.finalTotal ?? order.total)}</span>
            </div>
          </div>
          {order.customerNotes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-1">Tus notas:</p>
              <p className="text-sm text-gray-700">{order.customerNotes}</p>
            </div>
          )}
          <div className="mt-2 p-3 bg-gray-50 rounded-xl flex items-start gap-2">
            {order.deliveryType === 'pickup' ? (
              <>
                <Store className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    Retiro en sucursal · <span className="text-primary">{BRANCH_LABELS[order.branch] || order.branch}</span>
                  </p>
                  {order.pickupDateLabel && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <CalendarClock className="w-3 h-3" />
                      Fecha estimada: <span className="font-medium capitalize">{order.pickupDateLabel}</span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Delivery a domicilio{order.customerAddress ? ` · ${order.customerAddress}` : ''}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}

function MisPedidosContent() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2 font-heading">Todavía no hiciste ningún pedido</h2>
        <p className="text-gray-400 mb-6">Explorá el catálogo y hacé tu primer pedido.</p>
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
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

export default function MisPedidosPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background-secondary">
        <Navbar />
        <CartDrawer />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 font-heading mb-6">Mis pedidos</h1>
          <MisPedidosContent />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
