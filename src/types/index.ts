export type Category =
  | "cafe-grano"
  | "cafe-molido"
  | "capsulas"
  | "instantaneo"
  | string

export interface Product {
  id: string
  name: string
  price: number
  image: string
  description?: string
  stock?: number
  category?: Category
}

export interface CartItem extends Product {
  id: string
  name: string
  image: string
  price: number
  pack: string
  quantity: number
  stock: number
}

export interface Pack {
  label: string
  price: string
}

export interface User {
  id: string
  email: string
  name: string
  lastName?: string
  phone?: string
  role: "user" | "admin"
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export * from "./chat"
