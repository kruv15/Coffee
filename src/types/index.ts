export type Category = {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
}

export interface Size {
  nombre: string
  precio: number
}

export interface Product {
  _id: string
  nomProd: string
  descripcionProd: string
  precioProd: number
  imagen: string
  categoria: string | Category
  stock: number
  tamanos?: Size[]
  createdAt?: string
  updatedAt?: string
}

export interface CartItem {
  _id: string
  nomProd: string
  imagen: string
  precioProd: number
  tamano?: string
  cantidad: number
  stock: number
  categoria?: string | Category
}

export interface User {
  _id: string
  nombreUsr: string
  apellidoUsr: string
  emailUsr: string
  celUsr?: string
  rol: "user" | "admin"
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface PedidoProducto {
  productoId: {
    _id: string
    nomProd: string
    imagen: string
    precioProd: number
  }
  cantidad: number
  precio: number
  tamano?: string
}

export interface Pedido {
  _id: string
  userId: User
  productos: PedidoProducto[]
  total: number
  status: "pendiente" | "confirmado" | "preparando" | "listo" | "entregado" | "cancelado"
  direccionEntrega: string
  infoAdicional?: string
  createdAt: string
  updatedAt?: string
}

export interface Pack {
  label: string
  price: string
}

export * from "./chat"
