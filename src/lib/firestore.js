import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

// ───────────────────────────────────────────────
// USERS
// ───────────────────────────────────────────────

export const ADMIN_EMAIL = 'juanma.lunaok@gmail.com'

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createUserDoc(uid, { email, name, photoURL }) {
  const role = email === ADMIN_EMAIL ? 'admin' : 'customer'
  await setDoc(doc(db, 'users', uid), {
    email,
    name: name || '',
    photoURL: photoURL || '',
    role,
    phone: '',
    address: '',
    createdAt: serverTimestamp(),
  })
  return role
}

export async function updateUserDoc(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ───────────────────────────────────────────────
// PRODUCTS
// ───────────────────────────────────────────────

export async function getProducts(filters = {}) {
  let q = collection(db, 'products')
  const constraints = []
  if (filters.category) constraints.push(where('category', '==', filters.category))
  constraints.push(where('active', '==', true))
  q = query(q, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllProducts() {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createProduct(data) {
  return addDoc(collection(db, 'products'), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  })
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'products', id), data)
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id))
}

// ───────────────────────────────────────────────
// ORDERS
// ───────────────────────────────────────────────

function generateOrderNumber() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 900) + 100
  return `SG-${date}-${rand}`
}

export async function createOrder(userId, orderData) {
  const orderNumber = generateOrderNumber()
  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    userId,
    orderNumber,
    status: 'pendiente',
    paymentLink: '',
    adminNotes: '',
    paidAt: null,
    deliveredAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getOrder(id) {
  const snap = await getDoc(doc(db, 'orders', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserOrders(userId) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getAllOrders() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateOrderStatus(id, status, extra = {}) {
  const data = {
    status,
    updatedAt: serverTimestamp(),
    ...extra,
  }
  if (status === 'pagado') data.paidAt = serverTimestamp()
  if (status === 'entregado') data.deliveredAt = serverTimestamp()
  await updateDoc(doc(db, 'orders', id), data)
}

export async function updateOrder(id, data) {
  await updateDoc(doc(db, 'orders', id), { ...data, updatedAt: serverTimestamp() })
}

// ───────────────────────────────────────────────
// REALTIME LISTENERS
// ───────────────────────────────────────────────

export function subscribeToAllOrders(callback) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeToUserOrders(userId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ───────────────────────────────────────────────
// SEED
// ───────────────────────────────────────────────

export const SEED_PRODUCTS = [
  { name: 'Ibuprofeno 400mg x 20 comp', category: 'medicamentos', price: 3500, stock: 50, description: 'Antiinflamatorio y analgésico de venta libre.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Ibuprofeno' },
  { name: 'Amoxicilina 500mg x 15 comp', category: 'medicamentos', price: 5200, stock: 30, description: 'Antibiótico de amplio espectro. Requiere receta médica.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Amoxicilina' },
  { name: 'Omeprazol 20mg x 14 comp', category: 'medicamentos', price: 4100, stock: 40, description: 'Inhibidor de la bomba de protones para gastritis y reflujo.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Omeprazol' },
  { name: 'Loratadina 10mg x 10 comp', category: 'medicamentos', price: 2800, stock: 60, description: 'Antihistamínico para alergias. Sin sueño.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Loratadina' },
  { name: 'Paracetamol 500mg x 16 comp', category: 'medicamentos', price: 2200, stock: 80, description: 'Analgésico y antipirético de venta libre.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Paracetamol' },
  { name: 'Diclofenac 75mg x 20 comp', category: 'medicamentos', price: 3900, stock: 35, description: 'Antiinflamatorio para dolor muscular y articular.', image: 'https://placehold.co/400x400/1B5E4B/white?text=Diclofenac' },
  { name: 'Vitamina D3 1000UI x 30 caps', category: 'nutrición', price: 4980, stock: 25, description: 'Suplemento de vitamina D3 para huesos y sistema inmune.', image: 'https://placehold.co/400x400/2A7A62/white?text=Vit+D3' },
  { name: 'Magnesio 400mg x 30 comp', category: 'nutrición', price: 4317, stock: 30, description: 'Suplemento de magnesio para músculos y sistema nervioso.', image: 'https://placehold.co/400x400/2A7A62/white?text=Magnesio' },
  { name: 'Creatina Micronizada ENA 150g', category: 'nutrición', price: 14625, stock: 15, description: 'Creatina monohidrato para rendimiento deportivo.', image: 'https://placehold.co/400x400/2A7A62/white?text=Creatina' },
  { name: 'Whey Protein True Made Chocolate 930g', category: 'nutrición', price: 51675, stock: 10, description: 'Proteína de suero de leche sabor chocolate.', image: 'https://placehold.co/400x400/2A7A62/white?text=Whey' },
  { name: 'Cicaplast Baume B5 La Roche Posay 100ml', category: 'dermocosmética', price: 72356, stock: 12, description: 'Bálsamo reparador para pieles dañadas e irritadas.', image: 'https://placehold.co/400x400/134539/white?text=Cicaplast' },
  { name: 'Gel Limpiador Espumoso CeraVe 473ml', category: 'dermocosmética', price: 44889, stock: 15, description: 'Limpiador facial con ceramidas para piel normal a grasa.', image: 'https://placehold.co/400x400/134539/white?text=CeraVe' },
  { name: 'Serum Vitamina C Garnier 30ml', category: 'cuidado_personal', price: 28792, stock: 20, description: 'Sérum iluminador con vitamina C al 3.5%.', image: 'https://placehold.co/400x400/4CAF50/white?text=Serum+C' },
  { name: 'Protector Solar FPS 40 Dermaglós 250ml', category: 'cuidado_personal', price: 16252, stock: 18, description: 'Protector solar facial y corporal FPS 40.', image: 'https://placehold.co/400x400/4CAF50/white?text=FPS+40' },
  { name: 'Mascara Pestañas Maybelline Firework', category: 'perfumeria', price: 28007, stock: 22, description: 'Máscara de pestañas voluminizadora y alargadora.', image: 'https://placehold.co/400x400/6B7280/white?text=Mascara' },
  { name: 'Chupete Ultra Air Philips Avent 6-18M x2', category: 'bebes', price: 10584, stock: 15, description: 'Chupete de silicona ultra ventilado para bebés.', image: 'https://placehold.co/400x400/2563EB/white?text=Chupete' },
  { name: 'Pampers Toallitas Húmedas x48', category: 'bebes', price: 5006, stock: 40, description: 'Toallitas húmedas sin alcohol ni perfume para bebés.', image: 'https://placehold.co/400x400/2563EB/white?text=Toallitas' },
]

export async function seedProducts() {
  const results = []
  for (const product of SEED_PRODUCTS) {
    const ref = await addDoc(collection(db, 'products'), {
      ...product,
      active: true,
      createdAt: serverTimestamp(),
    })
    results.push(ref.id)
  }
  return results
}
