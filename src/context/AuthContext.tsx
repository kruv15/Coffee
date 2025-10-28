"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, useContext, useEffect, useReducer } from "react"
import type { AuthState, User } from "../types"

interface AuthContextType {
  state: AuthState
  login: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  checkAuthState: () => Promise<void>
  loginWithApi: (email: string, password: string) => Promise<boolean>
  loginWithToken: (token: string, userData: any) => Promise<boolean>
  forceRefresh: () => void
  loginAsAdmin: () => Promise<void>
}

type AuthAction =
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: { user: User; token: string } }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
    case "RESTORE_SESSION":
      return {
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      }
    case "LOGOUT":
      return {
        isAuthenticated: false,
        user: null,
        token: null,
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const forceRefresh = () => {
    console.log("🔄 Forcing app refresh...")
    dispatch({ type: "LOGOUT" })
  }

  const login = async (user: User, token: string) => {
    try {
      await AsyncStorage.setItem("userToken", token)
      await AsyncStorage.setItem("userData", JSON.stringify(user))

      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } })

      console.log("✅ User logged in successfully:", user)
    } catch (error) {
      console.error("❌ Error saving login data:", error)
    }
  }

  const logout = async () => {
    try {
      console.log("🔄 Starting logout process...")
      console.log("🔍 Current state before logout:", state)

      await AsyncStorage.clear()
      console.log("✅ All AsyncStorage cleared")

      dispatch({ type: "LOGOUT" })
      console.log("✅ State updated - User logged out")

      const allKeys = await AsyncStorage.getAllKeys()
      console.log("🔍 Remaining storage keys:", allKeys)

      setTimeout(() => {
        console.log("🔄 Forcing state refresh...")
        dispatch({ type: "LOGOUT" })
      }, 100)

      console.log("✅ Logout completed successfully")
    } catch (error) {
      console.error("❌ Error during logout:", error)
      dispatch({ type: "LOGOUT" })
    }
  }

  const checkAuthState = async () => {
    try {
      console.log("🔍 Checking auth state...")
      const token = await AsyncStorage.getItem("userToken")
      const userData = await AsyncStorage.getItem("userData")

      console.log("📋 Storage contents:", {
        hasToken: !!token,
        hasUserData: !!userData,
        tokenPreview: token ? token.substring(0, 10) + "..." : "null",
        userEmail: userData ? JSON.parse(userData).email : "null",
      })

      if (token && userData) {
        const user = JSON.parse(userData)
        dispatch({ type: "RESTORE_SESSION", payload: { user, token } })
        console.log("✅ Session restored for user:", user.email)
      } else {
        console.log("❌ No valid session found in storage")
        dispatch({ type: "LOGOUT" })
      }
    } catch (error) {
      console.error("❌ Error checking auth state:", error)
      dispatch({ type: "LOGOUT" })
    }
  }

  const loginWithToken = async (token: string, userData: any): Promise<boolean> => {
    try {
      // Use consistent storage keys
      await AsyncStorage.setItem("userToken", token)
      await AsyncStorage.setItem("userData", JSON.stringify(userData))

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: userData,
          token: token,
        },
      })

      console.log("✅ Login with token successful")
      return true
    } catch (error) {
      console.error("❌ Error saving token:", error)
      return false
    }
  }

  const loginWithApi = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔑 Attempting login with:", { emailUsr: email })

      const response = await fetch("https://back-coffee.onrender.com/api/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailUsr: email.toLowerCase().trim(),
          contraseña: password,
        }),
      })

      const data = await response.json()
      console.log("📡 Full API Response:", JSON.stringify(data, null, 2))
      console.log("📊 Response status:", response.status)

      if (response.ok && (data.success || data.token || data.usuario)) {
        // Log the exact structure we're receiving
        console.log("🔍 Analyzing API response structure:")
        console.log("- data.usuario:", data.usuario)
        console.log("- data.data?.usuario:", data.data?.usuario)

        // Extract user data from API response - try multiple possible structures
        let apiUser = null

        if (data.usuario) {
          apiUser = data.usuario
          console.log("✅ Found user in data.usuario")
        } else if (data.data?.usuario) {
          apiUser = data.data.usuario
          console.log("✅ Found user in data.data.usuario")
        } else if (data.user) {
          apiUser = data.user
          console.log("✅ Found user in data.user")
        } else {
          console.log("⚠️ No user object found in standard locations")
          apiUser = data // Sometimes the user data is at the root level
        }

        console.log("👤 Extracted user data:", JSON.stringify(apiUser, null, 2))
        console.log("🔑 roleUsr field value:", apiUser?.roleUsr, "Type:", typeof apiUser?.roleUsr)

        // Determine role based on roleUsr field
        let userRole: "admin" | "user" = "user" // Default to user

        if (apiUser?.roleUsr === true) {
          userRole = "admin"
          console.log("✅ User is ADMIN (roleUsr: true)")
        } else if (apiUser?.roleUsr === false) {
          userRole = "user"
          console.log("✅ User is REGULAR USER (roleUsr: false)")
        } else {
          console.log("⚠️ roleUsr field not found or invalid, defaulting to user")
          console.log("Available fields in apiUser:", Object.keys(apiUser || {}))
        }

        const user: User = {
          id: apiUser?.id || apiUser?._id || "1",
          email: apiUser?.emailUsr || email,
          name: apiUser?.nombreUsr || email.split("@")[0],
          lastName: apiUser?.apellidoUsr || "",
          phone: apiUser?.celUsr || "",
          role: userRole,
        }

        const token = data.token || data.data?.token || "login-token-" + Date.now()

        console.log("🎯 Final user object:", JSON.stringify(user, null, 2))
        console.log("🔐 Token:", token.substring(0, 20) + "...")

        await login(user, token)
        return true
      } else {
        console.error("❌ Login failed:", data)
        return false
      }
    } catch (error) {
      console.error("❌ API login error:", error)
      return false
    }
  }

  const loginAsAdmin = async (): Promise<void> => {
    try {
      console.log("🔑 Starting admin login...")

      const adminUser: User = {
        id: "admin-001",
        email: "admin@gmail.com",
        name: "Administrator",
        lastName: "System",
        phone: "",
        role: "admin",
      }

      const adminToken = "admin-token-" + Date.now()
      await login(adminUser, adminToken)

      console.log("✅ Admin login successful with role:", adminUser.role)
      console.log("📋 Admin user data:", adminUser)
    } catch (error) {
      console.error("❌ Error in admin login:", error)
      throw error
    }
  }

  useEffect(() => {
    checkAuthState()
  }, [])

  const value = {
    state,
    login,
    loginWithApi,
    loginWithToken,
    logout,
    forceRefresh,
    checkAuthState,
    loginAsAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
