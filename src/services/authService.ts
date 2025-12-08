import AsyncStorage from "@react-native-async-storage/async-storage"
import type { User } from "../types"
import { ENV } from "../config/env"

const API_BASE_URL = ENV.API_BASE_URL

export interface LoginRequest {
  emailUsr: string
  contraseña: string
}

export interface RegisterRequest {
  nombreUsr: string
  apellidoUsr: string
  celUsr: string
  emailUsr: string
  contraseña: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  usuario?: User
  data?: any
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
          token: data.data?.token || data.token,
          usuario: data.data?.usuario || data.usuario,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error en el login",
        }
      }
    } catch (error) {
      console.error("AuthService: Login error:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
          token: data.data?.token || data.token,
          usuario: data.data?.usuario || data.usuario,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error en el registro",
        }
      }
    } catch (error) {
      console.error("AuthService: Register error:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async saveUserData(user: User, token: string): Promise<void> {
    try {
      await AsyncStorage.setItem("userToken", token)
      await AsyncStorage.setItem("userData", JSON.stringify(user))
    } catch (error) {
      console.error("AuthService: Error saving user data:", error)
    }
  },

  async getUserData(): Promise<{ user: User | null; token: string | null }> {
    try {
      const token = await AsyncStorage.getItem("userToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        const user = JSON.parse(userData)
        return { user, token }
      }

      return { user: null, token: null }
    } catch (error) {
      console.error("AuthService: Error getting user data:", error)
      return { user: null, token: null }
    }
  },

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["userToken", "userData"])
    } catch (error) {
      console.error("AuthService: Error clearing user data:", error)
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      return response.ok
    } catch (error) {
      console.error("AuthService: Token validation error:", error)
      return false
    }
  },
}
