'use client'

import { X } from 'lucide-react'

const COLOR_CLASSES = {
  blue:   'bg-blue-600 text-white',
  green:  'bg-green-600 text-white',
  amber:  'bg-amber-500 text-white',
  red:    'bg-red-600 text-white',
  purple: 'bg-purple-600 text-white',
}

export default function AnnouncementBanner({ announcement, onClose }) {
  if (!announcement) return null

  const colorClass = COLOR_CLASSES[announcement.bannerColor] || COLOR_CLASSES.blue

  return (
    <div className={`w-full px-4 py-3 flex items-center gap-3 ${colorClass}`}>
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <span className="font-semibold text-sm">{announcement.title}</span>
        <span className="hidden sm:inline text-sm opacity-90"> — {announcement.body}</span>
        <p className="sm:hidden text-xs opacity-90 mt-0.5 line-clamp-2">{announcement.body}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Cerrar anuncio"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
