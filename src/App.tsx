import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './modules/auth-core/use-auth'
import { Wallet, History, Plus, Moon, Sun, LogOut, Settings } from 'lucide-react'
import { TransactionModal } from '@/components/TransactionModal'
import { useTransactionModal } from '@/store/use-transaction-modal'
import { useTheme } from '@/store/use-theme'

export default function App() {
  const { user, isLoading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { openModal } = useTransactionModal()
  const { theme, toggleTheme } = useTheme()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse flex flex-col items-center">
          <Wallet className="h-10 w-10 mb-3" />
          <span className="text-lg font-bold">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  
  if (!user && !isAuthRoute) return <Navigate to="/login" replace />
  if (user && (isAuthRoute || location.pathname === '/')) return <Navigate to="/dashboard" replace />
  if (isAuthRoute) return <Outlet />

  const isDashboard = location.pathname === '/dashboard'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {isDashboard && (
        <header className="w-full border-b border-border sticky top-0 z-40 bg-background">
          <div className="container flex items-center justify-between px-4 md:px-8 max-w-4xl mx-auto h-16">
            {/* Logo */}
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">Akıllı Bütçem</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Paranı akıllıca yönet</p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Tüm Geçmiş */}
              <button 
                onClick={() => navigate('/history')}
                className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border h-9 px-3 rounded-lg text-sm font-medium transition-colors text-foreground"
              >
                <History className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Tüm Geçmiş</span>
              </button>
              
              {/* Yeni İşlem */}
              <button 
                onClick={() => openModal('expense')}
                className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border h-9 px-3 rounded-lg text-sm font-medium transition-colors text-foreground"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Yeni İşlem</span>
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-border mx-1" />
              
              {/* Tema Toggle */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Ayarlar */}
              <button
                onClick={() => navigate('/settings')}
                title="Ayarlar"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {/* Çıkış */}
              <button 
                onClick={signOut}
                title="Çıkış Yap"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted hover:bg-red-500/10 border border-border hover:border-red-500/30 transition-colors text-muted-foreground hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 container pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        <Outlet />
      </main>
      
      <TransactionModal />
    </div>
  )
}
