import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function Login() {
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/chat')
    } catch (err: any) {
      setError(err.response?.data?.error || t.errors.invalidCredentials)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-400 mb-2">iWa</h1>
          <p className="text-gray-400">{t.auth.loginTitle}</p>
        </div>

        <div className="bg-dark-800 rounded-2xl p-8 shadow-2xl border border-dark-700">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t.auth.email}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              fullWidth
              required
            />
            <Input
              label={t.auth.password}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              fullWidth
              required
            />
            {error && <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</div>}
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {t.auth.signIn}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
