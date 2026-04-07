import { Cross, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + desc */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Cross className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-none font-heading">Salud Global</p>
                <p className="text-xs text-white/70">Farmacia y Perfumería</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Tu farmacia de confianza. Pedí tus medicamentos y productos de salud desde la comodidad de tu hogar.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4 font-heading">Navegación</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link href="/mis-pedidos" className="hover:text-white transition-colors">Mis pedidos</Link></li>
              <li><Link href="/perfil" className="hover:text-white transition-colors">Mi perfil</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 font-heading">Contacto</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Salud Global Farmacias, Argentina</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+54 11 0000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@saludglobal.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-white/50">© 2026 Salud Global Farmacias y Perfumerías. Todos los derechos reservados.</p>
          <p className="text-xs text-white/30">Sistema de delivery online</p>
        </div>
      </div>
    </footer>
  )
}
