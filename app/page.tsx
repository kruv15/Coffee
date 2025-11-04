// Este archivo es para compatibilidad con Next.js
// El proyecto principal usa React Native con Expo Router
// La pantalla principal está en app/index.tsx
import React from "react"

export default function Page() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Amber Infusion - Coffee App</h1>
      <p style={{ fontSize: "16px", color: "#666", textAlign: "center", maxWidth: "600px" }}>
        Esta es una aplicación React Native con Expo Router. Para ejecutar la aplicación, usa:
      </p>
      <pre
        style={{
          backgroundColor: "#f5f5f5",
          padding: "16px",
          borderRadius: "8px",
          marginTop: "16px",
          fontSize: "14px",
        }}
      >
        npx expo start
      </pre>
      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>Sistema de Chat Implementado</h2>
        <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
          <li>Chat en vivo con WebSocket</li>
          <li>Pantalla de chat para clientes (app/chat.tsx)</li>
          <li>Pantalla de chat para administradores (app/admin-chat.tsx)</li>
          <li>Integración con backend en Render.com</li>
          <li>Soporte para ventas y atención al cliente</li>
        </ul>
      </div>
    </div>
  )
}
