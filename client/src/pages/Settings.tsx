import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import api from '../services/api'

export function Settings() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    if (pwForm.next.length < 6) { setPwError(t.errors.passwordTooShort); return }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      setPwSuccess(t.common.success)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e: any) {
      setPwError(e.response?.data?.error || t.common.error)
    } finally {
      setPwLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-950 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">{t.settings.settings}</h1>
        </div>

        {/* Profile */}
        <div className="bg-dark-800 rounded-2xl p-6 mb-4 border border-dark-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.profile.profile}</h2>
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.display_name} size="lg" />
            <div>
              <div className="text-white font-semibold">{user?.display_name}</div>
              <div className="text-gray-400 text-sm">@{user?.username}</div>
            </div>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => navigate('/profile')}>
              {t.profile.editProfile}
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-dark-800 rounded-2xl p-6 mb-4 border border-dark-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.settings.appearance}</h2>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">{theme === 'dark' ? t.settings.darkTheme : t.settings.lightTheme}</span>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-400'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-dark-800 rounded-2xl p-6 mb-4 border border-dark-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.settings.language}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setLang('ru')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${lang === 'ru' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
            >
              🇷🇺 {t.settings.russian}
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${lang === 'en' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
            >
              🇬🇧 {t.settings.english}
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="bg-dark-800 rounded-2xl p-6 mb-4 border border-dark-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.settings.account}</h2>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            <input
              type="password"
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              placeholder={t.settings.currentPassword}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <input
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder={t.settings.newPassword}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder={t.settings.confirmPassword}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            {pwError && <div className="text-xs text-red-400">{pwError}</div>}
            {pwSuccess && <div className="text-xs text-green-400">{pwSuccess}</div>}
            <Button type="submit" variant="secondary" size="sm" loading={pwLoading}>{t.settings.changePassword}</Button>
          </form>
        </div>

        <Button variant="danger" fullWidth onClick={logout}>{t.auth.logout}</Button>
      </div>
    </div>
  )
}
