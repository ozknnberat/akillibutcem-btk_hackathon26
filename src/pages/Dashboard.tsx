import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth-core/use-auth'
import { Transaction } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Wallet, Sparkles, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTransactionModal } from '@/store/use-transaction-modal'
import { chatWithAssistant } from '@/lib/gemini'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const CATEGORY_COLORS: Record<string, string> = {
  'Yiyecek': '#EF4444',
  'Ulaşım': '#F59E0B',
  'Eğlence': '#8B5CF6',
  'Faturalar': '#EF4444',
  'Sağlık': '#10B981',
  'Maaş': '#10B981',
  'Diğer': '#6B7280',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Yiyecek': '🍔',
  'Ulaşım': '🚌',
  'Eğlence': '🎮',
  'Faturalar': '🏠',
  'Sağlık': '💊',
  'Maaş': '💰',
  'Diğer': '➕',
}

// Custom Pie tooltip
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
      }}>
        <p style={{ color: 'hsl(var(--foreground))', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>
          {item.name}
        </p>
        <p style={{ color: item.payload.color, fontWeight: 700, fontSize: '14px' }}>
          ₺{Number(item.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const currentUsername = user?.email?.split('@')[0] || ''
  
  const { isOpen } = useTransactionModal()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', content: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const hasFetchedAdvice = useRef(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Supabase error:", error)
      if (!hasFetchedAdvice.current) {
        hasFetchedAdvice.current = true
        setChatMessages([{ role: 'model', content: "Veritabanına bağlanırken bir sorun oluştu." }])
      }
      return
    }

    if (data) {
      setTransactions(data)
      
      if (!hasFetchedAdvice.current) {
        hasFetchedAdvice.current = true
        setChatMessages([{ role: 'model', content: "Merhaba, ben Akıllı Bütçem. Size nasıl yardımcı olabilirim?" }])
      }
    }
  }, [user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions, isOpen])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isTyping])

  const handleDelete = (id: string) => setConfirmId(id)

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isTyping) return
    
    const userMessage = chatInput
    setChatInput('')
    
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMessage }]
    setChatMessages(newHistory)
    setIsTyping(true)
    
    try {
      const apiHistory = chatMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
      const response = await chatWithAssistant(userMessage, apiHistory, transactions, balance)
      setChatMessages([...newHistory, { role: 'model' as const, content: response }])
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setChatMessages([...newHistory, { role: 'model' as const, content: `Hata: ${errorMessage}` }])
    } finally {
      setIsTyping(false)
    }
  }

  // Compute stats
  const { income: totalIncome, expense: totalExpense, balance } = useMemo(() => {
    let incomeAll = 0
    let expenseAll = 0
    transactions.forEach(t => {
      if (t.type === 'income') incomeAll += t.amount
      else expenseAll += t.amount
    })
    return { income: incomeAll, expense: expenseAll, balance: incomeAll - expenseAll }
  }, [transactions])

  // Memoize expensive calculations
  const pieData = useMemo(() => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

    return Object.keys(expensesByCategory).map(key => ({
      name: key,
      value: expensesByCategory[key],
      color: CATEGORY_COLORS[key] || '#6B7280'
    })).sort((a, b) => b.value - a.value)
  }, [transactions])

  const incomePieData = useMemo(() => {
    const incomesByCategory = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

    return Object.keys(incomesByCategory).map(key => ({
      name: key,
      value: incomesByCategory[key],
      color: CATEGORY_COLORS[key] || '#10B981'
    })).sort((a, b) => b.value - a.value)
  }, [transactions])

  const sortedTransactions = useMemo(() => 
    [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [transactions]
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pt-4">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          Merhaba, {currentUsername}
        </h2>
        <p className="text-muted-foreground text-sm">Bugün finansal durumun nasıl?</p>
      </div>

      {/* Toplam Bakiye Card */}
      <div className="bg-background text-foreground border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Wallet className="w-24 h-24" />
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">Toplam Bakiye</span>
        </div>
        <div className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          ₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-3">
            <div className="flex items-center space-x-1 text-muted-foreground mb-1 text-xs font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>Toplam Gelir</span>
            </div>
            <div className="text-[#22C55E] font-bold">₺{totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-muted rounded-xl p-3">
            <div className="flex items-center space-x-1 text-muted-foreground mb-1 text-xs font-medium">
              <ArrowDownRight className="w-3 h-3" />
              <span>Toplam Gider</span>
            </div>
            <div className="text-[#EF4444] font-bold">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col" style={{ height: '340px' }}>
        <div className="flex items-center space-x-2 mb-4 shrink-0">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Akıllı Bütçem ile konuşun</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3" ref={chatContainerRef}>
          {chatMessages.length === 0 ? (
            <div className="text-muted-foreground text-sm italic">Bağlanıyor...</div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-muted text-foreground rounded-br-none' 
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-none px-3 py-2 text-sm">
                <span className="animate-pulse">Yazıyor...</span>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="relative shrink-0">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Finansal bir soru sor..." 
            disabled={isTyping || chatMessages.length === 0}
            className="w-full bg-muted border border-border rounded-xl py-2.5 pl-4 pr-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!chatInput.trim() || isTyping || chatMessages.length === 0}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gider Dağılımı */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-5">Gider Dağılımı</h3>
          
          {pieData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Henüz gider kaydı yok
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="w-44 h-44 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full space-y-3">
                {pieData.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{CATEGORY_EMOJIS[item.name] || '🏷️'}</span>
                        <span className="text-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[#EF4444] font-medium">₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-muted-foreground text-xs w-8 text-right">%{(item.value / totalExpense * 100).toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${(item.value / totalExpense * 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gelir Dağılımı */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-5">Gelir Dağılımı</h3>
          
          {incomePieData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Henüz gelir kaydı yok
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="w-44 h-44 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full space-y-3">
                {incomePieData.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{CATEGORY_EMOJIS[item.name] || '🏷️'}</span>
                        <span className="text-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[#22C55E] font-medium">₺{item.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-muted-foreground text-xs w-8 text-right">%{(item.value / totalIncome * 100).toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${(item.value / totalIncome * 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Son İşlemler */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Son İşlemler</h3>
          <Link to="/history" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Tümünü Gör
          </Link>
        </div>
        
        <div className="space-y-2">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Henüz işlem yok. İlk işlemini ekle!
            </div>
          ) : (
            sortedTransactions.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-xl">
                    {CATEGORY_EMOJIS[t.category] || '🏷️'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.description}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`font-bold text-sm ${t.type === 'income' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
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
            ))
          )}
        </div>
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
