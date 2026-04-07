'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'sg_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch (_) {}
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          image: product.image,
          quantity,
        },
      ]
    })
  }

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeItem(productId)
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const total = subtotal
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        total,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
