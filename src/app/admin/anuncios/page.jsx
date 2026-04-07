'use client'

import { useState, useEffect } from 'react'
import {
  getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement
} from '@/lib/firestore'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone, LayoutTemplate, Rows, Square } from 'lucide-react'
import toast from 'react-hot-toast'

const DISPLAY_TYPES = [
  { value: 'modal', label: 'Modal (popup)', icon: Square },
  { value: 'banner', label: 'Banner (tira)', icon: Rows },
  { value: 'both', label: 'Ambos', icon: LayoutTemplate },
]

const BANNER_COLORS = [
  { value: 'blue', label: 'Azul', bg: 'bg-blue-600' },
  { value: 'green', label: 'Verde', bg: 'bg-green-600' },
  { value: 'amber', label: 'Amarillo', bg: 'bg-amber-500' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-600' },
  { value: 'purple', label: 'Violeta', bg: 'bg-purple-600' },
]

const EMPTY_FORM = {
  title: '',
  body: '',
  imageUrl: '',
  displayType: 'both',
  bannerColor: 'blue',
  showOnce: true,
  active: true,
}

export default function AnunciosAdmin() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const data = await getAllAnnouncements()
    setAnnouncements(data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      title: a.title || '',
      body: a.body || '',
      imageUrl: a.imageUrl || '',
      displayType: a.displayType || 'both',
      bannerColor: a.bannerColor || 'blue',
      showOnce: a.showOnce ?? true,
      active: a.active ?? true,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Título y mensaje son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const data = {
        title: form.title.trim(),
        body: form.body.trim(),
        imageUrl: form.imageUrl.trim(),
        displayType: form.displayType,
        bannerColor: form.bannerColor,
        showOnce: form.showOnce,
        active: form.active,
      }
      if (editing) {
        await updateAnnouncement(editing.id, data)
        toast.success('Anuncio actualizado.')
      } else {
        await createAnnouncement(data)
        toast.success('Anuncio creado.')
      }
      setFormOpen(false)
      await fetchAll()
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (a) => {
    try {
      await updateAnnouncement(a.id, { active: !a.active })
      await fetchAll()
      toast.success(a.active ? 'Anuncio desactivado.' : 'Anuncio activado.')
    } catch {
      toast.error('Error al cambiar estado.')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAnnouncement(deleteModal.id)
      toast.success('Anuncio eliminado.')
      setDeleteModal(null)
      await fetchAll()
    } catch {
      toast.error('Error al eliminar.')
    } finally {
      setDeleting(false)
    }
  }

  const displayLabel = (type) => DISPLAY_TYPES.find(d => d.value === type)?.label || type

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Anuncios
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mostrá mensajes o promociones a los clientes en la app.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo anuncio
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay anuncios todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-all ${
                a.active ? 'border-gray-100' : 'border-gray-100 opacity-50'
              }`}
            >
              {/* Color dot */}
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                a.active ? 'bg-green-500' : 'bg-gray-300'
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {displayLabel(a.displayType)}
                  </span>
                  {a.showOnce && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      1 vez por sesión
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{a.body}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(a)}
                  title={a.active ? 'Desactivar' : 'Activar'}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {a.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteModal(a)}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar anuncio' : 'Nuevo anuncio'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ej: ¡Oferta especial de invierno!"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="ej: 20% de descuento en toda la línea de vitaminas hasta el viernes."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (URL, opcional)</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dónde mostrar</label>
            <div className="grid grid-cols-3 gap-2">
              {DISPLAY_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, displayType: value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                    form.displayType === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(form.displayType === 'banner' || form.displayType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color del banner</label>
              <div className="flex gap-2">
                {BANNER_COLORS.map(({ value, label, bg }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, bannerColor: value }))}
                    title={label}
                    className={`w-8 h-8 rounded-full ${bg} transition-all ${
                      form.bannerColor === value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showOnce}
                onChange={(e) => setForm(f => ({ ...f, showOnce: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Mostrar solo 1 vez por sesión</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-gray-700">Activo (visible para clientes)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setFormOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
              {editing ? 'Guardar cambios' : 'Crear anuncio'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar anuncio">
        <p className="text-sm text-gray-600 mb-6">
          ¿Eliminás el anuncio <strong>"{deleteModal?.title}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal(null)}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
