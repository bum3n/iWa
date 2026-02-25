import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ChatLayout } from './components/layout/ChatLayout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ChatPage } from './pages/Chat'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { chatsApi } from './services/api'
import { Spinner } from './components/ui/Spinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DefaultChat() {
  const navigate = useNavigate()
  useEffect(() => {
    chatsApi.list()
      .then(res => {
        const first = res.data.chats[0]
        if (first) navigate(`/chat/${first.id}`, { replace: true })
      })
      .catch(() => {})
  }, [])
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to iWa</h2>
        <p className="text-gray-400">Select a chat or start a new conversation</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/chat"
        element={<ProtectedRoute><ChatLayout /></ProtectedRoute>}
      >
        <Route index element={<DefaultChat />} />
        <Route path=":id" element={<ChatPage />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
