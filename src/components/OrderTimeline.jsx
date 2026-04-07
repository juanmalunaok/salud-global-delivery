import { CheckCircle, Clock, XCircle } from 'lucide-react'

const TIMELINE_STEPS_RECETA = [
  { key: 'esperando_receta', label: 'Esperando receta' },
  { key: 'receta_validada', label: 'Receta validada' },
  { key: 'presupuestado', label: 'Presupuesto enviado' },
  { key: 'pagado', label: 'Pago confirmado' },
  { key: 'en_preparacion', label: 'En preparación' },
  { key: 'listo', label: 'Listo para despacho' },
  { key: 'entregado', label: 'Entregado' },
]

const TIMELINE_STEPS_NORMAL = [
  { key: 'pendiente', label: 'Pedido recibido' },
  { key: 'presupuestado', label: 'Presupuesto enviado' },
  { key: 'pagado', label: 'Pago confirmado' },
  { key: 'en_preparacion', label: 'En preparación' },
  { key: 'listo', label: 'Listo para despacho' },
  { key: 'entregado', label: 'Entregado' },
]

const STATUS_ORDER_RECETA = {
  esperando_receta: 0,
  receta_validada: 1,
  presupuestado: 2,
  pagado: 3,
  en_preparacion: 4,
  listo: 5,
  entregado: 6,
  cancelado: -1,
}

const STATUS_ORDER_NORMAL = {
  pendiente: 0,
  presupuestado: 1,
  pagado: 2,
  en_preparacion: 3,
  listo: 4,
  entregado: 5,
  cancelado: -1,
}

function formatTs(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderTimeline({ status, orderType, createdAt, updatedAt }) {
  const isReceta = orderType === 'con_receta' || status === 'esperando_receta' || status === 'receta_validada'
  const TIMELINE_STEPS = isReceta ? TIMELINE_STEPS_RECETA : TIMELINE_STEPS_NORMAL
  const STATUS_ORDER = isReceta ? STATUS_ORDER_RECETA : STATUS_ORDER_NORMAL
  const currentIndex = STATUS_ORDER[status] ?? 0
  const isCancelled = status === 'cancelado'

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 py-4">
        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-700">Pedido cancelado</p>
          <p className="text-sm text-gray-500">{formatTs(updatedAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIndex
        const isLast = idx === TIMELINE_STEPS.length - 1

        return (
          <div key={step.key} className="flex gap-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-primary text-white' : 'bg-gray-100 border-2 border-gray-300'
                }`}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-6 mt-1 ${done && idx < currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? '' : ''}`}>
              <p className={`font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {idx === 0 && createdAt && (
                <p className="text-sm text-gray-500">{formatTs(createdAt)}</p>
              )}
              {idx === currentIndex && idx !== 0 && updatedAt && (
                <p className="text-sm text-gray-500">{formatTs(updatedAt)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
