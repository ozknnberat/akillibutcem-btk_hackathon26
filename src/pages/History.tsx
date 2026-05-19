import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth-core/use-auth'
import { Transaction } from '@/types'
import { ArrowLeft, Filter, Search, Trash2, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const CATEGORY_EMOJIS: Record<string, string> = {
  'Yiyecek': '🍔',
  'Ulaşım': '🚌',
  'Eğlence': '🎮',
  'Faturalar': '🏠',
  'Sağlık': '💊',
  'Maaş': '💰',
  'Diğer': '➕',
}

export default function History() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const fetchTransactions = () => {
    if (user) {
      setLoading(true)
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setTransactions(data)
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const handleDelete = (id: string) => {
    setConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    const { error } = await supabase.from('transactions').delete().eq('id', confirmId)
    setConfirmId(null)
    if (error) {
      console.error('Delete error:', error)
    } else {
      fetchTransactions()
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' ? true : t.type === filterType
    return matchesSearch && matchesType
  })

  const totalIncome = filteredTransactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0)
  const totalExpense = filteredTransactions.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.amount : acc, 0)

  return (
    <div className="animate-in fade-in duration-500 pt-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">İşlem Geçmişi</h1>
            <p className="text-sm text-muted-foreground">{filteredTransactions.length} işlem</p>
          </div>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className={`w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center transition-colors ${filterType !== 'all' ? 'text-foreground border-foreground/40' : 'text-muted-foreground hover:text-foreground'}`}>
              <Filter className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] bg-card border border-border rounded-xl p-2 shadow-lg" align="end" sideOffset={8}>
              <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Filtrele</DropdownMenu.Label>
              <DropdownMenu.Separator className="h-px bg-border my-1" />
              
              <DropdownMenu.Item 
                className="flex items-center justify-between px-2 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none"
                onClick={() => setFilterType('all')}
              >
                <span>Tümü</span>
                {filterType === 'all' && <Check className="w-4 h-4" />}
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                className="flex items-center justify-between px-2 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none"
                onClick={() => setFilterType('income')}
              >
                <span className="text-[#22C55E]">Sadece Gelirler</span>
                {filterType === 'income' && <Check className="w-4 h-4" />}
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                className="flex items-center justify-between px-2 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none"
                onClick={() => setFilterType('expense')}
              >
                <span className="text-[#EF4444]">Sadece Giderler</span>
                {filterType === 'expense' && <Check className="w-4 h-4" />}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İşlem veya kategori ara..." 
          className="w-full bg-muted border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium mb-1">Toplam Gelir</span>
          <span className="text-[#22C55E] text-lg font-bold">+₺{totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium mb-1">Toplam Gider</span>
          <span className="text-[#EF4444] text-lg font-bold">-₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-muted-foreground text-sm">İşlemler yükleniyor...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">Kayıtlı işlem bulunamadı.</p>
        ) : (
          <div className="divide-y divide-border">
            {filteredTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center text-xl">
                    {CATEGORY_EMOJIS[t.category] || '🏷️'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.description}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.type === 'income' ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'}`}>
                        {t.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-sm font-bold ${t.type === 'income' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmId}
        title="İşlemi Sil"
        message="Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
