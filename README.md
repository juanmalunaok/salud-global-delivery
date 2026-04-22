# Salud Global - Sistema de Delivery

Sistema web de delivery de medicamentos para **Salud Global Farmacias y Perfumerías**.

## Stack

- **Frontend:** Next.js 14 (App Router)
- **Backend/DB:** Firebase (Firestore + Auth)
- **Hosting:** Vercel
- **Estilos:** Tailwind CSS
- **Íconos:** Lucide React

## Funcionalidades

### Cliente
- Catálogo público con búsqueda y filtros por categoría
- Login con Google
- Carrito de compras persistente (localStorage)
- Confirmar pedido con notas adicionales
- Ver historial de pedidos y estado en tiempo real
- Recibir link de pago de MercadoPago cuando el admin lo carga
- Editar perfil (nombre, teléfono, dirección)

### Admin
- Dashboard con stats de pedidos y listado filtrable en tiempo real
- Flujo completo de estados: Pendiente → Presupuestado → Pagado → En preparación → Listo → Entregado
- Cargar link de MercadoPago y ajustar precio en presupuesto
- Notas internas por pedido
- CRUD completo de productos (con toggle activo/inactivo)
- Gestión de usuarios (ver pedidos, cambiar rol)
- Carga de productos de prueba (seed)

## Setup

### 1. Clonar el repo

```bash
git clone https://github.com/tu-usuario/salud-global-delivery.git
cd salud-global-delivery
npm install
```

### 2. Configurar Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activar **Firestore Database** (modo producción)
3. Activar **Authentication** → proveedor **Google**
4. Copiar las credenciales del proyecto

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar `.env.local` con las credenciales de Firebase.

### 4. Firestore Rules

En Firebase Console → Firestore → Rules, pegar el contenido de `firestore.rules`.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Admin

Los usuarios con email `juanma.lunaok@gmail.com` y `joserodrigovcorilla@gmail.com` son admins predeterminados. Cuando inician sesión con Google por primera vez, su documento en `/users` se crea automáticamente con `role: "admin"`.

Para cargar productos de prueba: ingresar al admin → botón **"Cargar productos de prueba"** en el dashboard.

## Deploy en Vercel

1. Push al repo de GitHub
2. Conectar en [Vercel](https://vercel.com)
3. Agregar las variables de entorno de Firebase
4. Deploy automático

## Estructura del proyecto

```
src/
├── app/
│   ├── page.jsx                    # Catálogo público
│   ├── login/page.jsx              # Login con Google
│   ├── cart/page.jsx               # Carrito + confirmar pedido
│   ├── mis-pedidos/page.jsx        # Historial pedidos cliente
│   ├── perfil/page.jsx             # Perfil usuario
│   └── admin/
│       ├── page.jsx                # Dashboard admin
│       ├── pedido/[id]/page.jsx    # Detalle pedido admin
│       ├── productos/page.jsx      # CRUD productos
│       └── usuarios/page.jsx       # Gestión usuarios
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ProductCard.jsx
│   ├── CartDrawer.jsx
│   ├── OrderStatusBadge.jsx
│   ├── OrderTimeline.jsx
│   ├── AdminSidebar.jsx
│   ├── Modal.jsx
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── CartContext.jsx
└── lib/
    ├── firebase.js
    └── firestore.js
```

## Flujo de estados del pedido

```
PENDIENTE → PRESUPUESTADO → PAGADO → EN PREPARACIÓN → LISTO → ENTREGADO
                                                              ↓
                                                          CANCELADO (desde cualquier estado)
```
