// ─────────────────────────────────────────────────────────────
// Food At Door — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────
import { Timestamp } from 'firebase/firestore'

// ── User & Auth ──────────────────────────────────────────────
export type UserRole = 'customer' | 'restaurant_owner' | 'admin'

export interface Address {
  id: string
  label: string          // "Home" | "Work" | "Other"
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
}

export interface User {
  uid: string
  name: string
  phone: string
  email?: string
  photoURL?: string
  role: UserRole
  addresses: Address[]
  defaultAddressId?: string
  createdAt: Timestamp
}

// ── Restaurant ───────────────────────────────────────────────
export type RestaurantStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface BankDetails {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
}

export interface Restaurant {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  phone: string
  email: string
  address: Address
  lat: number
  lng: number
  cuisine: string[]
  rating: number
  totalRatings: number
  isOpen: boolean
  status: RestaurantStatus
  coverImage: string
  logo: string
  deliveryTime: number      // minutes
  minOrder: number          // INR
  deliveryFee: number       // INR
  commissionRate: number    // percentage
  bankDetails?: BankDetails
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Menu ─────────────────────────────────────────────────────
export interface MenuCategory {
  id: string
  restaurantId: string
  name: string
  order: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  restaurantId: string
  categoryId: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  isVeg: boolean
  isAvailable: boolean
  tags: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Cart ─────────────────────────────────────────────────────
export interface CartItem {
  item: MenuItem
  quantity: number
}

export interface Cart {
  restaurantId: string
  restaurantName: string
  items: CartItem[]
}

// ── Order ─────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
  image: string
  isVeg: boolean
}

export interface PaymentDetails {
  method: 'razorpay' | 'cod'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paidAt?: Timestamp
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  restaurantId: string
  restaurantName: string
  items: OrderItem[]
  deliveryAddress: Address
  subtotal: number
  deliveryFee: number
  platformFee: number
  total: number
  status: OrderStatus
  payment: PaymentDetails
  rating?: number
  review?: string
  estimatedDeliveryTime?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Analytics ─────────────────────────────────────────────────
export interface DailyAnalytics {
  date: string              // YYYY-MM-DD
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  newUsers: number
  newRestaurants: number
  cancelledOrders: number
}

export interface RestaurantAnalytics {
  restaurantId: string
  period: 'today' | 'week' | 'month'
  totalOrders: number
  totalRevenue: number
  commission: number
  netRevenue: number
  avgOrderValue: number
  topItems: { name: string; count: number }[]
}

// ── Cuisine ───────────────────────────────────────────────────
export const CUISINE_TYPES = [
  'Biryani', 'South Indian', 'North Indian', 'Chinese', 'Pizza',
  'Burgers', 'Rolls & Wraps', 'Desserts', 'Beverages', 'Snacks',
  'Seafood', 'Kebabs', 'Healthy', 'Fast Food', 'Thali',
] as const

export type CuisineType = typeof CUISINE_TYPES[number]

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
