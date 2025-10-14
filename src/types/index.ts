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