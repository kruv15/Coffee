export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  stock?: number;
  category?: string;
}

export interface CartItem extends Product {
  pack: string;
  quantity: number;
}

export interface Pack {
  label: string;
  price: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
