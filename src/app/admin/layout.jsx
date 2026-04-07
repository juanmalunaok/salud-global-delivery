import ProtectedRoute from '@/components/ProtectedRoute'
import AdminSidebar from '@/components/AdminSidebar'

export const metadata = {
  title: 'Panel Admin - Salud Global',
}

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requireAdmin>
      <div className="flex min-h-screen bg-background-secondary">
        <AdminSidebar />
        <div className="flex-1 ml-64 min-h-screen">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
}
