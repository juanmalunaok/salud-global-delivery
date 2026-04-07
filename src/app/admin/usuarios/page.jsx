'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { getAllUsers, getUserOrders, updateUserDoc } from '@/lib/firestore'
import { Users, Search, User, Mail, Phone, MapPin, Package, Shield, ShieldOff } from 'lucide-react'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import toast from 'react-hot-toast'

function formatDate(ts) {
  if (!ts) return '—'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
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
    } catch (err) {
      console.error(err)
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
      toast.success(`Rol de ${user.name || user.email} cambiado a "${newRole}".`)
      fetchUsers()
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, role: newRole })
      }
    } catch (err) {
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
      u.email?.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-heading">Usuarios</h1>
        <p className="text-text-secondary text-sm mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
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
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{u.name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-600'
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
                          Ver pedidos
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
        title="Pedidos del usuario"
        maxWidth="max-w-xl"
      >
        {selectedUser && (
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.name || 'Sin nombre'}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="text-sm text-gray-500">{selectedUser.phone}</p>
                )}
                {selectedUser.address && (
                  <p className="text-xs text-gray-400 mt-1">{selectedUser.address}</p>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Historial de pedidos</h3>

            {ordersLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Este usuario no hizo pedidos todavía.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
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
        )}
      </Modal>
    </div>
  )
}
