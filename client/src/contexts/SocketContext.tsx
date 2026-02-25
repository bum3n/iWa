import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextValue {
  socket: Socket | null
}

export const SocketContext = createContext<SocketContextValue>({ socket: null })

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const s = io(window.location.origin, {
      auth: { token },
      transports: ['websocket'],
      path: '/socket.io',
    })

    setSocket(s)
    return () => { s.disconnect() }
  }, [])

  // Reconnect when token changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token')
      if (token && (!socket || !socket.connected)) {
        const s = io(window.location.origin, {
          auth: { token },
          transports: ['websocket'],
        })
        setSocket(s)
      } else if (!token && socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [socket])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
