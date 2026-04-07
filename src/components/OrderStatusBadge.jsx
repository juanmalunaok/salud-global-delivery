export const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  },
  presupuestado: {
    label: 'Presupuestado',
    className: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  pagado: {
    label: 'Pagado',
    className: 'bg-green-100 text-green-800 border border-green-300',
  },
  en_preparacion: {
    label: 'En preparación',
    className: 'bg-purple-100 text-purple-800 border border-purple-300',
  },
  listo: {
    label: 'Listo',
    className: 'bg-teal-100 text-teal-800 border border-teal-300',
  },
  entregado: {
    label: 'Entregado',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border border-red-300',
  },
}

export default function OrderStatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  )
}
