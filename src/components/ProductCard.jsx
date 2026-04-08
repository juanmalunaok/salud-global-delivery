'use client'

import { ShoppingCart, Check } from 'lucide-react'
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
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image area */}
      <div className="relative p-3 pb-0">
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square">
          <img
            src={product.image || `https://placehold.co/400x400/1B5E4B/white?text=${encodeURIComponent(product.name.slice(0, 10))}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Category badge */}
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">Sin stock</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 relative">
        {/* Name */}
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 font-heading pr-10">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 pr-10">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="mt-3">
          <p className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</p>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-orange-500 mt-0.5">¡Últimas {product.stock} unidades!</p>
          )}
          {inCart && (
            <p className="text-xs text-primary font-medium mt-0.5">{inCart.quantity} en el carrito</p>
          )}
        </div>

        {/* Floating cart button */}
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className={`absolute bottom-4 right-4 w-12 h-12 rounded-2xl shadow-md flex items-center justify-center transition-all duration-200 ${
            added
              ? 'bg-green-500 text-white shadow-green-200'
              : product.stock === 0
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
              : 'bg-white hover:bg-primary hover:text-white text-gray-700 hover:shadow-lg'
          }`}
        >
          {added ? (
            <Check className="w-5 h-5" />
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
