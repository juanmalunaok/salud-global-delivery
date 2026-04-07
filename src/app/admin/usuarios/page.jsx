'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { getAllUsers, getUserOrders, updateUserDoc } from '@/lib/firestore'
import {
  Users, Search, User, Mail, Phone, MapPin, Package,
  Shield, ShieldOff, CreditCard, Cross, Download, Calendar,
} from 'lucide-react'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import toast from 'react-hot-toast'

function formatDate(ts) {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatPrice(n) {
  return n?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }) ?? '—'
}

function exportToCSV(users) {
  const headers = ['Nombre', 'Email', 'Teléfono', 'DNI', 'Obra Social', 'Dirección', 'Rol', 'Perfil completo', 'Registrado']
  const rows = users
    .filter(u => u.role !== 'admin')
    .map(u => [
      u.name || '',
      u.email || '',
      u.phone || '',
      u.documento || '',
      u.obraSocial || '',
      u.address || '',
      u.role || '',
      u.profileComplete ? 'Sí' : 'No',
      formatDate(u.createdAt),
    ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clientes-salud-global-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV descargado. Importalo en Google Sheets.')
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userOrders, setUserOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [changingRole, setChangingRole] = useState(false)

  const fetchUsers = async () => {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const openUserDetail = async (user) => {
    setSelectedUser(user)
    setOrdersLoading(true)
    try {
      const orders = await getUserOrders(user.id)
      setUserOrders(orders)
    } catch {
      setUserOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleToggleAdmin = async (user) => {
    setChangingRole(true)
    try {
      const newRole = user.role === 'admin' ? 'customer' : 'admin'
      await updateUserDoc(user.id, { role: newRole })
      toast.success(`Rol cambiado a "${newRole}".`)
      fetchUsers()
      if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, role: newRole })
    } catch {
      toast.error('Error al cambiar el rol.')
    } finally {
      setChangingRole(false)
    }
  }

  const filtered = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.documento?.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  const totalOrders = userOrders.length
  const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Usuarios</h1>
          <p className="text-text-secondary text-sm mt-1">
            {users.filter(u => u.role !== 'admin').length} cliente{users.filter(u => u.role !== 'admin').length !== 1 ? 's' : ''} registrado{users.filter(u => u.role !== 'admin').length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => exportToCSV(users)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o DNI..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        >
          <option value="">Todos los roles</option>
          <option value="customer">Clientes</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay usuarios que coincidan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Usuario</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Teléfono</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Registrado</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Rol</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name || '—'}</p>
                          {u.documento && <p className="text-xs text-gray-400">DNI {u.documento}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{u.phone || '—'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {u.role === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openUserDetail(u)}
                          className="text-sm text-primary font-medium hover:underline"
                        >
                          Ver perfil
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          disabled={changingRole}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                          title={u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        >
                          {u.role === 'admin' ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => { setSelectedUser(null); setUserOrders([]) }}
        title="Perfil del cliente"
        maxWidth="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              {selectedUser.photoURL ? (
                <img src={selectedUser.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-lg">{selectedUser.name || 'Sin nombre'}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedUser.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedUser.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {selectedUser.role === 'admin' ? 'Admin' : 'Cliente'}
                </span>
              </div>
            </div>

            {/* Stats */}
            {!ordersLoading && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pedidos totales</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{formatPrice(totalSpent)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total gastado</p>
                </div>
              </div>
            )}

            {/* Contact info */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos de contacto</p>
              <div className="grid grid-cols-1 gap-2">
                <InfoRow icon={Mail} label="Email" value={selectedUser.email} />
                <InfoRow icon={Phone} label="Teléfono" value={selectedUser.phone} />
                <InfoRow icon={MapPin} label="Dirección" value={selectedUser.address} />
              </div>
            </div>

            {/* Health info */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos de salud</p>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow icon={CreditCard} label="DNI" value={selectedUser.documento} />
                <InfoRow icon={Cross} label="Obra social" value={selectedUser.obraSocial} />
              </div>
            </div>

            {/* Registration */}
            <InfoRow icon={Calendar} label="Registrado el" value={formatDate(selectedUser.createdAt)} />

            {/* Orders */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Historial de pedidos</p>
              {ordersLoading ? (
                <div className="flex justify-center py-6"><LoadingSpinner /></div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-1.5" />
                  <p className="text-sm text-gray-400">Sin pedidos todavía.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {userOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary">{formatPrice(order.total)}</span>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  )
}
