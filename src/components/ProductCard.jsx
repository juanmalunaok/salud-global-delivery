'use client'

import { ShoppingCart, Plus, Check } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import toast from 'react-hot-toast'

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

const CATEGORY_LABELS = {
  medicamentos: 'Medicamentos',
  perfumeria: 'Perfumería',
  'dermocosmética': 'Dermocosm.',
  'nutrición': 'Nutrición',
  bebes: 'Bebés',
  cuidado_personal: 'Cuidado personal',
}

export default function ProductCard({ product }) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.productId === product.id)

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    toast.success(`${product.name.split(' ').slice(0, 3).join(' ')}... agregado al carrito`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-background-secondary overflow-hidden">
        <img
          src={product.image || `https://placehold.co/400x400/1B5E4B/white?text=${encodeURIComponent(product.name.slice(0, 10))}`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category badge */}
        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit font-medium mb-2">
          {CATEGORY_LABELS[product.category] || product.category}
        </span>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug flex-1 line-clamp-2 font-heading">
          {product.name}
        </h3>

        {/* Price + Button */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <div>
            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-orange-500">¡Últimas {product.stock} unidades!</p>
            )}
            {product.stock === 0 && (
              <p className="text-xs text-red-500">Sin stock</p>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
              added
                ? 'bg-green-500 text-white'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-light text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:block">Agregado</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Agregar</span>
              </>
            )}
          </button>
        </div>

        {/* Cart qty indicator */}
        {inCart && (
          <p className="text-xs text-primary/70 mt-2 font-medium">
            {inCart.quantity} en el carrito
          </p>
        )}
      </div>
    </div>
  )
}
