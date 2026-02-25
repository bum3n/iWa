import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { usersApi } from '../services/api'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Profile() {
  const { user, updateUser } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: user?.display_name ?? '', bio: user?.bio ?? '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await usersApi.updateProfile(form)
      updateUser(res.data.user)
      setEditing(false)
    } catch (e: any) {
      setError(e.response?.data?.error || t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const res = await usersApi.uploadAvatar(file)
      updateUser(res.data.user)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800 rounded-2xl p-8 shadow-2xl border border-dark-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t.profile.profile}</h2>
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar src={user?.avatar_url} name={user?.display_name} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 rounded-full p-1.5 transition-colors"
              title={t.profile.changeAvatar}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="mt-2 text-sm text-gray-400">@{user?.username}</p>
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            <Input label={t.auth.displayName} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} fullWidth />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">{t.profile.bio}</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                placeholder="Tell about yourself..."
              />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>{t.profile.cancel}</Button>
              <Button fullWidth loading={loading} onClick={handleSave}>{t.profile.save}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.auth.displayName}</div>
              <div className="text-white font-medium">{user?.display_name}</div>
            </div>
            {user?.bio && (
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.profile.bio}</div>
                <div className="text-gray-300 text-sm">{user.bio}</div>
              </div>
            )}
            <Button onClick={() => setEditing(true)} variant="secondary" fullWidth className="mt-2">
              {t.profile.editProfile}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
