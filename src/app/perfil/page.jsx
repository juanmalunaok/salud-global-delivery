'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserDoc } from '@/lib/firestore'
import { User, Phone, MapPin, Mail, Save, CreditCard, Cross } from 'lucide-react'
import toast from 'react-hot-toast'

function PerfilContent() {
  const { user, userDoc, refreshUserDoc } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', address: '', obraSocial: '', documento: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userDoc) {
      setForm({
        name: userDoc.name || '',
        phone: userDoc.phone || '',
        address: userDoc.address || '',
        obraSocial: userDoc.obraSocial || '',
        documento: userDoc.documento || '',
      })
    }
  }, [userDoc])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUserDoc(user.uid, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        obraSocial: form.obraSocial.trim(),
        documento: form.documento.trim(),
      })
      await refreshUserDoc()
      toast.success('Perfil actualizado correctamente.')
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-white">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-16 h-16 rounded-2xl border-2 border-white/30" />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-xl font-heading">{userDoc?.name || user?.displayName || 'Usuario'}</h2>
              <p className="text-white/70 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {userDoc?.role === 'admin' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              Nombre completo
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre completo"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar (asociado a tu cuenta de Google).</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-gray-400" />
              Teléfono
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Ej: 11 1234-5678"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              DNI / Documento
            </label>
            <input
              type="text"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              placeholder="Número de documento"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Cross className="w-4 h-4 text-gray-400" />
              Obra social
            </label>
            <input
              type="text"
              value={form.obraSocial}
              onChange={(e) => setForm({ ...form, obraSocial: e.target.value })}
              placeholder="Ej: OSDE, PAMI, Swiss Medical... o &quot;Particular&quot;"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Dirección de entrega
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Calle, número, piso, depto, barrio, ciudad..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Esta dirección se usará por defecto en tus pedidos.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background-secondary">
        <Navbar />
        <CartDrawer />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 font-heading mb-6">Mi perfil</h1>
          <PerfilContent />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
