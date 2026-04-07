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
  runTransaction,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

// ───────────────────────────────────────────────
// STORAGE
// ───────────────────────────────────────────────
export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

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
    obraSocial: '',
    documento: '',
    profileComplete: role === 'admin', // admin no necesita completar perfil
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

async function getNextOrderNumber() {
  const counterRef = doc(db, 'meta', 'orderCounter')
  let nextNum = 1
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    nextNum = snap.exists() ? (snap.data().count || 0) + 1 : 1
    tx.set(counterRef, { count: nextNum })
  })
  return nextNum
}

// Returns { date: Date, label: string } for pickup orders
export function getPickupDate(now = new Date()) {
  const day = now.getDay() // 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
  const hour = now.getHours()
  const isPickupDay = day === 2 || day === 4 // Martes o Jueves
  const before11 = hour < 11

  let pickupDate
  if (isPickupDay && before11) {
    pickupDate = new Date(now)
  } else {
    // Próximo jueves
    const daysUntilThursday = ((4 - day + 7) % 7) || 7
    pickupDate = new Date(now)
    pickupDate.setDate(now.getDate() + daysUntilThursday)
  }
  pickupDate.setHours(0, 0, 0, 0)

  const label = pickupDate.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
  return { date: pickupDate, label }
}

export async function createOrder(userId, orderData) {
  const orderNum = await getNextOrderNumber()
  const orderNumber = `#${orderNum}`

  let pickupDateISO = null
  let pickupDateLabel = null
  if (orderData.deliveryType === 'pickup') {
    if (orderData.orderType === 'con_receta' && orderData.customPickupDate) {
      const d = new Date(orderData.customPickupDate + 'T00:00:00')
      pickupDateISO = d.toISOString()
      pickupDateLabel = d.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })
    } else {
      const { date, label } = getPickupDate(new Date())
      pickupDateISO = date.toISOString()
      pickupDateLabel = label
    }
  }

  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    userId,
    orderNumber,
    orderNum,
    pickupDate: pickupDateISO,
    pickupDateLabel,
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
