import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, addDoc,
  serverTimestamp, Timestamp, DocumentData, QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type {
  User, Restaurant, MenuItem, MenuCategory, Order,
  OrderStatus, RestaurantStatus,
} from '@/types'

// ── Users ────────────────────────────────────────────────────
export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as User) : null
}

export async function createUser(uid: string, data: Omit<User, 'uid' | 'createdAt'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
  })
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...data })
}

// ── Restaurants ───────────────────────────────────────────────
export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const snap = await getDoc(doc(db, 'restaurants', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Restaurant) : null
}

export async function getApprovedRestaurants(cuisineFilter?: string): Promise<Restaurant[]> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'approved'),
    orderBy('rating', 'desc'),
  ]
  if (cuisineFilter) constraints.push(where('cuisine', 'array-contains', cuisineFilter))
  const q = query(collection(db, 'restaurants'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant))
}

export async function getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
  const q = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant))
}

export async function createRestaurant(data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'restaurants'), {
    ...data,
    status: 'pending',
    rating: 0,
    totalRatings: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
  await updateDoc(doc(db, 'restaurants', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getAllRestaurantsAdmin(): Promise<Restaurant[]> {
  const snap = await getDocs(collection(db, 'restaurants'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant))
}

export async function updateRestaurantStatus(id: string, status: RestaurantStatus): Promise<void> {
  await updateDoc(doc(db, 'restaurants', id), { status, updatedAt: serverTimestamp() })
}

// ── Menu Categories ───────────────────────────────────────────
export async function getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
  const q = query(
    collection(db, 'restaurants', restaurantId, 'menuCategories'),
    orderBy('order', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuCategory))
}

export async function addMenuCategory(restaurantId: string, data: Omit<MenuCategory, 'id' | 'restaurantId'>): Promise<string> {
  const ref = await addDoc(collection(db, 'restaurants', restaurantId, 'menuCategories'), {
    ...data, restaurantId,
  })
  return ref.id
}

export async function updateMenuCategory(restaurantId: string, categoryId: string, data: Partial<MenuCategory>): Promise<void> {
  await updateDoc(doc(db, 'restaurants', restaurantId, 'menuCategories', categoryId), data)
}

export async function deleteMenuCategory(restaurantId: string, categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuCategories', categoryId))
}

// ── Menu Items ────────────────────────────────────────────────
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const q = query(
    collection(db, 'restaurants', restaurantId, 'menuItems'),
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem))
}

export async function addMenuItem(restaurantId: string, data: Omit<MenuItem, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'restaurants', restaurantId, 'menuItems'), {
    ...data, restaurantId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMenuItem(restaurantId: string, itemId: string, data: Partial<MenuItem>): Promise<void> {
  await updateDoc(doc(db, 'restaurants', restaurantId, 'menuItems', itemId), {
    ...data, updatedAt: serverTimestamp(),
  })
}

export async function deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', itemId))
}

// ── Orders ────────────────────────────────────────────────────
export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function getOrdersByRestaurant(restaurantId: string, statusFilter?: OrderStatus): Promise<Order[]> {
  const constraints: QueryConstraint[] = [
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
  ]
  if (statusFilter) constraints.push(where('status', '==', statusFilter))
  const q = query(collection(db, 'orders'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status, updatedAt: serverTimestamp(),
  })
}

export async function getAllOrdersAdmin(statusFilter?: OrderStatus): Promise<Order[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(200)]
  if (statusFilter) constraints.push(where('status', '==', statusFilter))
  const q = query(collection(db, 'orders'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function getAllUsersAdmin(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => d.data() as User)
}
