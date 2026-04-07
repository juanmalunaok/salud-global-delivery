'use client'

import { useState, useEffect } from 'react'
import { getAllObrasSociales, createObraSocial, updateObraSocial, deleteObraSocial } from '@/lib/firestore'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, Cross, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

const EMPTY_FORM = { nombre: '', descuento: 40, active: true }

export default function ObrasSocialesAdmin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const data = await getAllObrasSociales()
    setList(data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true) }
  const openEdit = (os) => {
    setEditing(os)
    setForm({ nombre: os.nombre, descuento: os.descuento, active: os.active ?? true })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio.'); return }
    setSaving(true)
    try {
      const data = { nombre: form.nombre.trim(), descuento: Number(form.descuento), active: form.active }
      if (editing) {
        await updateObraSocial(editing.id, data)
        toast.success('Obra social actualizada.')
      } else {
        await createObraSocial(data)
        toast.success('Obra social creada.')
      }
      setFormOpen(false)
      await fetchAll()
    } catch { toast.error('Error al guardar.') }
    finally { setSaving(false) }
  }

  const toggleActive = async (os) => {
    try {
      await updateObraSocial(os.id, { active: !os.active })
      await fetchAll()
    } catch { toast.error('Error al cambiar estado.') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteObraSocial(deleteModal.id)
      toast.success('Obra social eliminada.')
      setDeleteModal(null)
      await fetchAll()
    } catch { toast.error('Error al eliminar.') }
    finally { setDeleting(false) }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading flex items-center gap-2">
            <Cross className="w-5 h-5 text-primary" />
            Obras Sociales
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configurá el % de descuento por obra social. Se aplica automáticamente al carrito del cliente.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Info */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        El nombre de la obra social debe coincidir exactamente con lo que el cliente cargó en su perfil (sin distinción de mayúsculas).
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Cross className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No hay obras sociales configuradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Obra social</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Descuento</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((os) => (
                <tr key={os.id} className={`hover:bg-gray-50 transition-colors ${!os.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4 font-medium text-gray-900">{os.nombre}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full">
                      {os.descuento}% OFF
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${os.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {os.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => toggleActive(os)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title={os.active ? 'Desactivar' : 'Activar'}>
                        {os.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(os)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteModal(os)} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Editar obra social' : 'Nueva obra social'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="ej: IOMA, OSDE, Swiss Medical..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de descuento</label>
            <div className="grid grid-cols-5 gap-2">
              {DISCOUNT_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, descuento: pct }))}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.descuento === pct
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-gray-700">Activa (aplica descuento a clientes)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setFormOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
              {saving ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar obra social">
        <p className="text-sm text-gray-600 mb-6">¿Eliminás <strong>{deleteModal?.nombre}</strong>? Los pedidos existentes no se ven afectados.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2">
            {deleting ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
