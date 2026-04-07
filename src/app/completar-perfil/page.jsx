'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserDoc } from '@/lib/firestore'
import LoadingSpinner from '@/components/LoadingSpinner'
import { User, Phone, MapPin, CreditCard, Cross, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'name', label: 'Nombre completo', icon: User, type: 'text', placeholder: 'Tu nombre y apellido', required: true },
  { key: 'phone', label: 'Teléfono', icon: Phone, type: 'tel', placeholder: 'Ej: 11 1234-5678', required: true },
  { key: 'documento', label: 'DNI / Documento', icon: CreditCard, type: 'text', placeholder: 'Número de documento', required: true },
  { key: 'address', label: 'Dirección de entrega', icon: MapPin, type: 'textarea', placeholder: 'Calle, número, piso, depto, barrio...', required: false },
]

export default function CompletarPerfilPage() {
  const { user, userDoc, loading, refreshUserDoc } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', documento: '', address: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) { router.replace('/login'); return }
      if (userDoc?.profileComplete) { router.replace('/'); return }
      if (userDoc) {
        setForm({
          name: userDoc.name || user.displayName || '',
          phone: userDoc.phone || '',
          documento: userDoc.documento || '',
          address: userDoc.address || '',
        })
      }
    }
  }, [user, userDoc, loading, router])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio.'); return }
    if (!form.phone.trim()) { toast.error('El teléfono es obligatorio.'); return }
    if (!form.documento.trim()) { toast.error('El documento es obligatorio.'); return }
    setSaving(true)
    try {
      await updateUserDoc(user.uid, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        documento: form.documento.trim(),
        address: form.address.trim(),
        profileComplete: true,
      })
      await refreshUserDoc()
      toast.success('¡Perfil completado! Bienvenido/a a Salud Global.')
      router.replace('/')
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar los datos. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !userDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Cross className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading">Completá tu perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Necesitamos algunos datos para procesar tus pedidos</p>
        </div>

        {/* Google account info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 mb-4 shadow-sm">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-auto" />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {FIELDS.map(({ key, label, icon: Icon, type, placeholder, required }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Icon className="w-4 h-4 text-gray-400" />
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              {type === 'textarea' ? (
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              ) : (
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {saving ? (
              <><LoadingSpinner size="sm" className="border-white/30 border-t-white" /> Guardando...</>
            ) : (
              'Guardar y continuar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
