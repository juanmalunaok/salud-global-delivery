export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }[size]

  return (
    <div className={`${sizeClass} border-gray-200 border-t-primary rounded-full animate-spin ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-secondary text-sm">Cargando...</p>
      </div>
    </div>
  )
}
