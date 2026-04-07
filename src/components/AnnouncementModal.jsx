'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

export default function AnnouncementModal({ announcement, onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!announcement) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Image */}
        {announcement.imageUrl && (
          <div className="relative w-full h-48">
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header bar */}
        <div className="bg-primary px-6 py-4 flex items-start justify-between gap-3">
          <h2 className="text-white font-bold text-lg font-heading leading-tight">
            {announcement.title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {announcement.body}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
