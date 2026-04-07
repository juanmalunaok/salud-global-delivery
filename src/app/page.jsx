'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnnouncementModal from '@/components/AnnouncementModal'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { getProducts, getActiveAnnouncements, createOrder } from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Package, Pill, Store, Truck, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BRANCHES = [
  { value: 'ac', label: 'AC' },
  { value: 'juncal', label: 'Juncal' },
  { value: 'fondo', label: 'Fondo' },
  { value: 'libertador', label: 'Libertador' },
  { value: 'cervino', label: 'Cerviño' },
  { value: 'santa_fe', label: 'Santa Fe' },
]

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'nutrición', label: 'Nutrición' },
  { value: 'dermocosmética', label: 'Dermocosmética' },
  { value: 'cuidado_personal', label: 'Cuidado Personal' },
  { value: 'perfumeria', label: 'Perfumería' },
  { value: 'bebes', label: 'Bebés' },
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-4 bg-gray-100 rounded w-3/5" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-9 bg-gray-100 rounded-xl w-24" />
        </div>
      </div>
    </div>
  )
}

const SEEN_KEY = 'sg_seen_announcements'

function getSeenIds() {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}
function markSeen(id) {
  try {
    const seen = getSeenIds()
    if (!seen.includes(id)) sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]))
  } catch {}
}

function RecetaModal({ onClose }) {
  const { user, userDoc } = useAuth()
  const router = useRouter()
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [branch, setBranch] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      router.push('/login')
      return
    }
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
        customerDocumento: userDoc?.documento || '',
        customerObraSocial: userDoc?.obraSocial || '',
        customerNotes: notes,
        deliveryType,
        orderType: 'con_receta',
        branch: deliveryType === 'pickup' ? branch : null,
        customPickupDate: null,
        items: [],
        subtotal: 0,
        total: 0,
        discountPercent: 0,
        discountAmount: 0,
        finalTotal: 0,
      })
      setDone(true)
    } catch {
      toast.error('Error al crear el pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Pill className="w-5 h-5" />
            <h2 className="font-bold font-heading">Pedido por receta médica</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">¡Pedido creado!</h3>
            <p className="text-sm text-gray-500 mb-1">Ahora enviá la foto de tu receta al mail indicado</p>
            <p className="text-sm text-gray-500 mb-6">y avisanos desde <strong>Mis pedidos</strong>.</p>
            <button
              onClick={() => router.push('/mis-pedidos')}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Ver mis pedidos
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Si ya tenés una receta médica podés crear el pedido directamente. La farmacia te contactará con el presupuesto.
            </p>

            {/* Delivery type */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">¿Cómo recibís tu pedido?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setDeliveryType('delivery'); setBranch('') }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    deliveryType === 'delivery' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Truck className="w-4 h-4" /> Delivery
                </button>
                <button
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    deliveryType === 'pickup' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Store className="w-4 h-4" /> Retiro
                </button>
              </div>
            </div>

            {/* Branch */}
            {deliveryType === 'pickup' && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Elegí la sucursal:</p>
                <div className="grid grid-cols-3 gap-2">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setBranch(b.value)}
                      className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        branch === b.value ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: nombre del medicamento, dosis, médico que lo recetó..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <LoadingSpinner size="sm" className="border-white/30 border-t-white" /> : null}
              Crear pedido por receta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modalAnnouncement, setModalAnnouncement] = useState(null)
  const [bannerAnnouncement, setBannerAnnouncement] = useState(null)
  const [recetaModal, setRecetaModal] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getActiveAnnouncements().then((announcements) => {
      const seen = getSeenIds()
      for (const a of announcements) {
        const alreadySeen = a.showOnce && seen.includes(a.id)
        if (alreadySeen) continue
        if (a.displayType === 'modal' || a.displayType === 'both') {
          setModalAnnouncement(a)
        }
        if (a.displayType === 'banner' || a.displayType === 'both') {
          setBannerAnnouncement(a)
        }
        break // mostrar solo el más reciente
      }
    })
  }, [])

  const closeModal = useCallback(() => {
    if (modalAnnouncement?.showOnce) markSeen(modalAnnouncement.id)
    setModalAnnouncement(null)
  }, [modalAnnouncement])

  const closeBanner = useCallback(() => {
    if (bannerAnnouncement?.showOnce) markSeen(bannerAnnouncement.id)
    setBannerAnnouncement(null)
  }, [bannerAnnouncement])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = !category || p.category === category
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [products, search, category])

  return (
    <div className="min-h-screen flex flex-col bg-background-secondary">
      {modalAnnouncement && (
        <AnnouncementModal announcement={modalAnnouncement} onClose={closeModal} />
      )}
      {recetaModal && <RecetaModal onClose={() => setRecetaModal(false)} />}
      <Navbar />
      {bannerAnnouncement && (
        <AnnouncementBanner announcement={bannerAnnouncement} onClose={closeBanner} />
      )}
      <CartDrawer />

      {/* Hero */}
      <section className="bg-primary text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-3">
            Pedí tus medicamentos online
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Encontrá todo lo que necesitás y recibilo en la comodidad de tu hogar.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Receta CTA */}
          <button
            onClick={() => user ? setRecetaModal(true) : router.push('/login')}
            className="mt-4 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            <Pill className="w-4 h-4" />
            ¿Solo tenés receta? Pedí sin agregar productos
          </button>
        </div>
      </section>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                category === cat.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-text-secondary mb-4">
            {filtered.length === 0
              ? 'No se encontraron productos'
              : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin resultados</h3>
            <p className="text-gray-400 max-w-sm">
              {search
                ? `No encontramos productos para "${search}". Probá con otro término.`
                : 'No hay productos en esta categoría por el momento.'}
            </p>
            {(search || category) && (
              <button
                onClick={() => { setSearch(''); setCategory('') }}
                className="mt-4 text-primary font-medium hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
