'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import OrderTimeline from '@/components/OrderTimeline'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { getOrder, updateOrderStatus, updateOrder } from '@/lib/firestore'
import {
  ChevronLeft, User, Phone, MapPin, Mail, MessageSquare,
  Link as LinkIcon, CheckCircle, Package, Truck, Star, XCircle,
  Save, FileText, Store
} from 'lucide-react'

const BRANCH_LABELS = { ac: 'AC', juncal: 'Juncal', fondo: 'Fondo', libertador: 'Libertador', cervino: 'Cerviño', santa_fe: 'Santa Fe' }
import toast from 'react-hot-toast'

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function formatDate(ts) {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')
  const [adjustedTotal, setAdjustedTotal] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const fetchOrder = async () => {
    const data = await getOrder(id)
    setOrder(data)
    if (data) {
      setPaymentLink(data.paymentLink || '')
      setAdjustedTotal(data.total?.toString() || '')
      setAdminNotes(data.adminNotes || '')
    }
    setLoading(false)
  }

  useEffect(() => { fetchOrder() }, [id])

  const doAction = async (fn) => {
    setActionLoading(true)
    try {
      await fn()
      await fetchOrder()
    } catch (err) {
      console.error(err)
      toast.error('Error al realizar la acción.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendBudget = () => {
    if (!paymentLink.trim()) {
      toast.error('Ingresá el link de MercadoPago antes de continuar.')
      return
    }
    doAction(async () => {
      await updateOrderStatus(id, 'presupuestado', {
        paymentLink: paymentLink.trim(),
        total: parseFloat(adjustedTotal) || order.total,
      })
      toast.success('Presupuesto enviado al cliente.')
    })
  }

  const handleConfirmPayment = () =>
    doAction(async () => {
      await updateOrderStatus(id, 'pagado')
      toast.success('Pago confirmado.')
    })

  const handleStartPrep = () =>
    doAction(async () => {
      await updateOrderStatus(id, 'en_preparacion')
      toast.success('Pedido en preparación.')
    })

  const handleMarkReady = () =>
    doAction(async () => {
      await updateOrderStatus(id, 'listo')
      toast.success('Pedido marcado como listo.')
    })

  const handleMarkDelivered = () =>
    doAction(async () => {
      await updateOrderStatus(id, 'entregado')
      toast.success('Pedido entregado. ¡Gracias!')
    })

  const handleCancel = () =>
    doAction(async () => {
      await updateOrderStatus(id, 'cancelado')
      setCancelModal(false)
      toast.success('Pedido cancelado.')
    })

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateOrder(id, { adminNotes })
      toast.success('Notas guardadas.')
    } catch (err) {
      toast.error('Error al guardar las notas.')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Pedido no encontrado.</p>
        <Link href="/admin" className="text-primary hover:underline mt-2 inline-block">← Volver al dashboard</Link>
      </div>
    )
  }

  const isPendiente = order.status === 'pendiente'
  const isPresupuestado = order.status === 'presupuestado'
  const isPagado = order.status === 'pagado'
  const isEnPrep = order.status === 'en_preparacion'
  const isListo = order.status === 'listo'
  const isEntregado = order.status === 'entregado'
  const isCancelado = order.status === 'cancelado'
  const isClosed = isEntregado || isCancelado

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Back */}
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Volver al dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 font-heading">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-gray-500">Creado el {formatDate(order.createdAt)}</p>
        </div>
        {!isClosed && (
          <button
            onClick={() => setCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Cancelar pedido
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 font-heading flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              Productos del pedido
            </h2>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} x {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between font-bold">
              <span>Total del pedido</span>
              <span className="text-primary text-lg">{formatPrice(order.total)}</span>
            </div>
            {order.customerNotes && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-semibold text-amber-800 mb-1">Notas del cliente:</p>
                <p className="text-sm text-amber-700">{order.customerNotes}</p>
              </div>
            )}
          </div>

          {/* Action panel */}
          {!isClosed && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4 font-heading">Acciones del pedido</h2>

              {isPendiente && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      Link de pago (MercadoPago)
                    </label>
                    <input
                      type="url"
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      placeholder="https://mpago.la/..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      Total ajustado (si cambia el precio)
                    </label>
                    <input
                      type="number"
                      value={adjustedTotal}
                      onChange={(e) => setAdjustedTotal(e.target.value)}
                      placeholder={order.total?.toString()}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <p className="text-xs text-gray-400 mt-1">Dejá vacío para mantener el total original.</p>
                  </div>
                  <button
                    onClick={handleSendBudget}
                    disabled={actionLoading}
                    className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <CheckCircle className="w-5 h-5" />}
                    Enviar presupuesto al cliente
                  </button>
                </div>
              )}

              {isPresupuestado && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-medium text-blue-800 mb-1">Link de pago cargado:</p>
                    <a href={order.paymentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                      {order.paymentLink}
                    </a>
                  </div>
                  <p className="text-sm text-gray-500">Esperando que el cliente realice el pago.</p>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <CheckCircle className="w-5 h-5" />}
                    Confirmar pago recibido
                  </button>
                </div>
              )}

              {isPagado && (
                <button
                  onClick={handleStartPrep}
                  disabled={actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <Package className="w-5 h-5" />}
                  Comenzar preparación
                </button>
              )}

              {isEnPrep && (
                <button
                  onClick={handleMarkReady}
                  disabled={actionLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <Star className="w-5 h-5" />}
                  Marcar como listo
                </button>
              )}

              {isListo && (
                <button
                  onClick={handleMarkDelivered}
                  disabled={actionLoading}
                  className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <Truck className="w-5 h-5" />}
                  Marcar como entregado
                </button>
              )}
            </div>
          )}

          {/* Admin notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 font-heading flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Notas internas
            </h2>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notas internas sobre este pedido (no visibles para el cliente)..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
            >
              {savingNotes ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <Save className="w-4 h-4" />}
              Guardar notas
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 font-heading flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Datos del cliente
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="text-sm text-gray-900">{order.customerName || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 break-all">{order.customerEmail || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-sm text-gray-900">{order.customerPhone || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="text-sm text-gray-900">{order.customerAddress || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Tipo de entrega</p>
                  {order.deliveryType === 'pickup' ? (
                    <>
                      <p className="text-sm font-semibold text-primary">
                        Retiro en sucursal · {BRANCH_LABELS[order.branch] || order.branch}
                      </p>
                      {order.pickupDateLabel && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">📅 {order.pickupDateLabel}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-900">Delivery a domicilio</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 font-heading">Historial del pedido</h2>
            <OrderTimeline
              status={order.status}
              createdAt={order.createdAt}
              updatedAt={order.updatedAt}
            />
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar pedido">
        <p className="text-gray-600 text-sm mb-6">
          ¿Estás seguro de que querés cancelar el pedido <strong>{order.orderNumber}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setCancelModal(false)}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            No, mantener
          </button>
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            {actionLoading ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
            Sí, cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}
