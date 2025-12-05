import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const API_BASE_URL = 'https://back-coffee.onrender.com/api';

export interface LoginRequest {
  emailUsr: string;
  contraseña: string;
}

export interface RegisterRequest {
  nombreUsr: string;
  apellidoUsr: string;
  celUsr: string;
  emailUsr: string;
  contraseña: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  usuario?: any;
  data?: any;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error en el login'
        };
      }
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting registration for:', userData.emailUsr);
      
      const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error en el registro'
        };
      }
    } catch (error) {
      console.error('AuthService: Register error:', error);
      return {
        success: false,
        message: 'Error de conexión'
      };
    }
  },

  async saveUserData(user: User, token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      console.log('AuthService: User data saved');
    } catch (error) {
      console.error('AuthService: Error saving user data:', error);
    }
  },

  async getUserData(): Promise<{ user: User | null; token: string | null }> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        return { user, token };
      }
      
      return { user: null, token: null };
    } catch (error) {
      console.error('AuthService: Error getting user data:', error);
      return { user: null, token: null };
    }
  },

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      console.log('AuthService: User data cleared');
    } catch (error) {
      console.error('AuthService: Error clearing user data:', error);
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('AuthService: Token validation error:', error);
      return false;
    }
  }
};
