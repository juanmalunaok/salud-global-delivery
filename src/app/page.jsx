'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import AnnouncementModal from '@/components/AnnouncementModal'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { getProducts, getActiveAnnouncements } from '@/lib/firestore'
import { Search, Package } from 'lucide-react'

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

export default function CatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modalAnnouncement, setModalAnnouncement] = useState(null)
  const [bannerAnnouncement, setBannerAnnouncement] = useState(null)

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
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
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
