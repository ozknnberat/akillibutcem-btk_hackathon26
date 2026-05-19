import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth-core/use-auth'
import { ArrowLeft, User, Lock, Check, AlertCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

type ActionType = 'password' | 'delete_account' | null

export default function Settings() {
  const { user } = useAuth()
  const currentUsername = user?.email?.split('@')[0] || ''

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  // Confirmation popup
  const [pendingAction, setPendingAction] = useState<ActionType>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  // ─── Validate & open popup ─────────────────────────────────
  const requestPasswordChange = () => {
    if (newPassword.length < 6) { setPasswordError('Şifre en az 6 karakter olmalı.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Şifreler eşleşmiyor.'); return }
    setPasswordError('')
    setPasswordStatus('idle')
    openConfirm('password')
  }

  const requestDeleteAccount = () => {
    openConfirm('delete_account')
  }

  // ─── Confirmation popup ────────────────────────────────────
  const openConfirm = (action: ActionType) => {
    setCurrentPassword('')
    setConfirmError('')
    setPendingAction(action)
  }

  const closeConfirm = () => {
    setPendingAction(null)
    setCurrentPassword('')
    setConfirmError('')
  }

  const handleConfirm = async () => {
    if (!currentPassword) { setConfirmError('Mevcut şifrenizi girin.'); return }
    setConfirmLoading(true)
    setConfirmError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || `${currentUsername}@akillibutcem.com`,
      password: currentPassword
    })

    if (signInError) {
      setConfirmError('Mevcut şifreniz yanlış.')
      setConfirmLoading(false)
      return
    }

    if (pendingAction === 'password') {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setConfirmError('Şifre güncellenemedi.')
      } else {
        setPasswordStatus('success')
        setNewPassword('')
        setConfirmPassword('')
        closeConfirm()
      }
    } else if (pendingAction === 'delete_account') {
      if (user?.id) {
        // Delete all user data
        await supabase.from('transactions').delete().eq('user_id', user.id)
        await supabase.from('username_history').delete().eq('user_id', user.id)
        await supabase.from('profiles').delete().eq('id', user.id)
        
        // Log out user
        await supabase.auth.signOut()
        window.location.href = '/'
        return // Stop execution here
      }
    }

    setConfirmLoading(false)
  }

  return (
    <div className="animate-in fade-in duration-500 pt-8 pb-12 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/dashboard"
          className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Ayarlar</h1>
          <p className="text-sm text-muted-foreground">Hesap bilgilerini düzenle</p>
        </div>
      </div>

      {/* Current user info */}
      <div className="bg-muted border border-border rounded-2xl p-4 flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">@{currentUsername}</p>
          <p className="text-xs text-muted-foreground">Mevcut kullanıcı adın</p>
        </div>
      </div>

      {/* 1. Şifreyi Değiştir */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Şifreyi Değiştir</span>
        </div>

        <input
          type="password"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setPasswordStatus('idle'); setPasswordError('') }}
          placeholder="Yeni şifre (min. 6 karakter)"
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setPasswordStatus('idle'); setPasswordError('') }}
          placeholder="Yeni şifreyi tekrar gir"
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {passwordError && (
          <div className="flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}
        {passwordStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-500 text-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Şifre başarıyla güncellendi!</span>
          </div>
        )}

        <button
          onClick={requestPasswordChange}
          disabled={!newPassword || !confirmPassword}
          className="w-full bg-background text-foreground border border-foreground hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed font-medium py-2.5 rounded-xl text-sm transition-opacity"
        >
          Şifreyi Güncelle
        </button>
      </div>

      {/* 2. Hesabı Sil */}
      <div className="bg-card border border-border border-red-500/20 rounded-2xl p-5 mb-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-500">Hesabı Sil</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Bu işlem tüm gelir, gider verilerini ve hesabını kalıcı olarak siler. Geri alınamaz.
        </p>
        <button
          onClick={requestDeleteAccount}
          className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          Hesabımı Kalıcı Olarak Sil
        </button>
      </div>

      {/* Confirmation Popup */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {pendingAction === 'password' ? 'Şifre Değişikliğini Onayla' : 'Hesabı Silmeyi Onayla'}
              </h3>
              <button onClick={closeConfirm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Güvenliğin için mevcut şifreni gir.
            </p>

            <input
              type="password"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setConfirmError('') }}
              placeholder="Mevcut şifren"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
            />

            {confirmError && (
              <div className="flex items-center gap-2 text-red-500 text-xs mb-3">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmLoading || !currentPassword}
                className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                {confirmLoading ? 'Bekleniyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
