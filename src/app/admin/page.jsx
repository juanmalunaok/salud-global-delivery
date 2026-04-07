'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { subscribeToAllOrders, seedProducts, getAllProducts } from '@/lib/firestore'
import { Package, Clock, CreditCard, CheckCircle, RefreshCw, Database, DollarSign, Store, Search } from 'lucide-react'

const BRANCH_LABELS = { ac: 'AC', juncal: 'Juncal', fondo: 'Fondo', libertador: 'Libertador', cervino: 'Cerviño', santa_fe: 'Santa Fe' }
import toast from 'react-hot-toast'

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function formatDate(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'presupuestado', label: 'Presupuestados' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'listo', label: 'Listos' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'cancelado', label: 'Cancelados' },
]

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchOrder, setSearchOrder] = useState('')
  const [seedModal, setSeedModal] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    const unsub = subscribeToAllOrders((data) => {
      setOrders(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const PAID_STATUSES = ['pagado', 'en_preparacion', 'listo', 'entregado']

  const stats = {
    pendiente: orders.filter((o) => o.status === 'pendiente').length,
    presupuestado: orders.filter((o) => o.status === 'presupuestado').length,
    en_preparacion: orders.filter((o) => o.status === 'en_preparacion').length,
    entregadoHoy: orders.filter((o) => {
      if (o.status !== 'entregado') return false
      const ts = o.deliveredAt?.toDate?.() || (o.deliveredAt ? new Date(o.deliveredAt) : null)
      return ts && ts >= today
    }).length,
    revenueHoy: orders
      .filter((o) => {
        if (!PAID_STATUSES.includes(o.status)) return false
        const ts = o.paidAt?.toDate?.() || (o.paidAt ? new Date(o.paidAt) : null)
        if (ts) return ts >= today
        // fallback: createdAt today
        const created = o.createdAt?.toDate?.() || (o.createdAt ? new Date(o.createdAt) : null)
        return created && created >= today
      })
      .reduce((sum, o) => sum + (o.adjustedTotal ?? o.total ?? 0), 0),
  }

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (searchOrder.trim()) {
      const q = searchOrder.trim().replace(/^#/, '')
      const matchNum = o.orderNum?.toString().includes(q)
      const matchStr = o.orderNumber?.toLowerCase().includes(q.toLowerCase())
      return matchNum || matchStr
    }
    return true
  })

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const existing = await getAllProducts()
      if (existing.length > 0) {
        toast('Ya hay productos cargados. Eliminá los existentes primero si querés resetear.', { icon: 'ℹ️' })
        setSeedModal(false)
        setSeeding(false)
        return
      }
      await seedProducts()
      toast.success('¡17 productos de ejemplo cargados correctamente!')
      setSeedModal(false)
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar los productos.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Gestioná los pedidos de Salud Global</p>
        </div>
        <button
          onClick={() => setSeedModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Database className="w-4 h-4" />
          Cargar productos de prueba
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Pendientes</span>
          </div>
          <p className="text-3xl font-bold text-yellow-900">{stats.pendiente}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Esperando pago</span>
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.presupuestado}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">En preparación</span>
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.en_preparacion}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Entregados hoy</span>
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.entregadoHoy}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Recaudado hoy</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{formatPrice(stats.revenueHoy)}</p>
        </div>
      </div>

      {/* Search by order number */}
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchOrder}
          onChange={(e) => setSearchOrder(e.target.value)}
          placeholder="Buscar por nº de pedido..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
              statusFilter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay pedidos {statusFilter ? 'con este estado' : 'todavía'}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Pedido</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Fecha</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      order.status === 'pendiente' ? 'bg-yellow-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customerName || '—'}</p>
                        <p className="text-xs text-gray-500">{order.customerPhone || order.customerEmail || ''}</p>
                        {order.deliveryType === 'pickup' && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Store className="w-3 h-3" />
                            Retiro · {BRANCH_LABELS[order.branch] || order.branch}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-primary">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/pedido/${order.id}`}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seed modal */}
      <Modal isOpen={seedModal} onClose={() => setSeedModal(false)} title="Cargar productos de prueba">
        <p className="text-gray-600 text-sm mb-4">
          Esto va a cargar 17 productos de ejemplo en Firestore. Si ya hay productos existentes, la operación se cancelará automáticamente.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setSeedModal(false)}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            {seeding ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : <Database className="w-4 h-4" />}
            {seeding ? 'Cargando...' : 'Cargar productos'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
