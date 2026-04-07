'use client'

import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

function formatPrice(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, itemCount } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const handleCheckout = () => {
    if (!user) {
      setIsOpen(false)
      router.push('/login')
      return
    }
    setIsOpen(false)
    router.push('/cart')
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-gray-900 font-heading">Tu carrito</h2>
            {itemCount > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 font-medium">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400 mt-1">Agregá productos desde el catálogo</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 text-primary text-sm font-medium hover:underline"
              >
                Ver catálogo →
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                {item.image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-primary font-semibold mt-0.5">
                    {formatPrice(item.unitPrice)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">Total estimado</span>
              <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-1">
              El precio final puede variar según disponibilidad de stock.
            </p>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {user ? 'Confirmar pedido' : 'Iniciar sesión para continuar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
