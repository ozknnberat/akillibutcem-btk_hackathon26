import React, { useState, useRef } from 'react'
import { useTransactionModal } from '@/store/use-transaction-modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth-core/use-auth'
import { X, Pencil, GripVertical, Check, Plus } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
type Cat = { id: string; label: string; emoji: string }
type StoredCats = { expense: Cat[]; income: Cat[] }

// ─── Default categories (seeded on first use) ─────────────────────
const DEFAULT_CATEGORIES: StoredCats = {
  expense: [
    { id: 'food', label: 'Yiyecek', emoji: '🍔' },
    { id: 'transport', label: 'Ulaşım', emoji: '🚌' },
    { id: 'entertainment', label: 'Eğlence', emoji: '🎮' },
    { id: 'bills', label: 'Faturalar', emoji: '🏠' },
    { id: 'health', label: 'Sağlık', emoji: '💊' },
    { id: 'other', label: 'Diğer', emoji: '➕' },
  ],
  income: [
    { id: 'salary', label: 'Maaş', emoji: '💰' },
    { id: 'other', label: 'Diğer', emoji: '➕' },
  ]
}

const STORAGE_KEY = 'all_categories_v2'

function loadCategories(): StoredCats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
    // First time: seed with defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES))
    return DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

function saveCategories(data: StoredCats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let sessionLastSelectedDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone

// ─── Component ───────────────────────────────────────────────────
export function TransactionModal({ onTransactionAdded }: { onTransactionAdded?: () => void }) {
  const { isOpen, closeModal, defaultType } = useTransactionModal()
  const { user } = useAuth()

  const [type, setType] = useState<'income' | 'expense'>(defaultType)
  const [amount, setAmount] = useState('')
  const [selectedCatId, setSelectedCatId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(sessionLastSelectedDate)
  const [loading, setLoading] = useState(false)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editingCat, setEditingCat] = useState<Cat | null>(null)
  const [editEmoji, setEditEmoji] = useState('')
  const [editLabel, setEditLabel] = useState('')

  // Add new
  const [showAddNew, setShowAddNew] = useState(false)
  const [newEmoji, setNewEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')

  // Categories state (from localStorage)
  const [cats, setCats] = useState<StoredCats>(loadCategories)

  // Drag
  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType)
      setAmount('')
      setSelectedCatId('')
      setDescription('')
      setDate(sessionLastSelectedDate)
      setEditMode(false)
      setEditingCat(null)
      setShowAddNew(false)
      setNewEmoji('')
      setNewLabel('')
      setCats(loadCategories())
    }
  }, [isOpen, defaultType])

  if (!isOpen) return null

  const refresh = () => setCats(loadCategories())

  // ─── Handlers ────────────────────────────────────────────────
  const handleDeleteCat = (id: string) => {
    const updated = { ...cats }
    updated[type] = updated[type].filter(c => c.id !== id)
    saveCategories(updated)
    if (selectedCatId === id) setSelectedCatId('')
    refresh()
  }

  const startEdit = (cat: Cat) => {
    setEditingCat(cat)
    setEditEmoji(cat.emoji)
    setEditLabel(cat.label)
  }

  const saveEdit = () => {
    if (!editingCat || !editLabel.trim()) return
    const updated = { ...cats }
    const idx = updated[type].findIndex(c => c.id === editingCat.id)
    if (idx !== -1) {
      updated[type][idx] = { ...updated[type][idx], emoji: editEmoji || '🏷️', label: editLabel.trim() }
      saveCategories(updated)
      refresh()
    }
    setEditingCat(null)
  }

  const cancelEdit = () => setEditingCat(null)

  const handleAddNew = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const updated = { ...cats }
    if (updated[type].some(c => c.label.toLowerCase() === trimmed.toLowerCase())) return
    updated[type].push({ id: `cat_${Date.now()}`, label: trimmed, emoji: newEmoji || '🏷️' })
    saveCategories(updated)
    refresh()
    setNewEmoji('')
    setNewLabel('')
    setShowAddNew(false)
  }

  // Drag & Drop
  const handleDragStart = (id: string) => { dragId.current = id }
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id) }
  const handleDrop = (targetId: string) => {
    const fromId = dragId.current
    if (!fromId || fromId === targetId) { setDragOverId(null); return }
    const updated = { ...cats }
    const list = [...updated[type]]
    const fromIdx = list.findIndex(c => c.id === fromId)
    const toIdx = list.findIndex(c => c.id === targetId)
    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = list.splice(fromIdx, 1)
      list.splice(toIdx, 0, moved)
      updated[type] = list
      saveCategories(updated)
      refresh()
    }
    dragId.current = null
    setDragOverId(null)
  }
  const handleDragEnd = () => { dragId.current = null; setDragOverId(null) }

  const handleSave = async () => {
    if (!amount || !selectedCatId) return
    setLoading(true)

    const catLabel = cats[type].find(c => c.id === selectedCatId)?.label || 'Diğer'

    const { error } = await supabase.from('transactions').insert({
      user_id: user?.id,
      amount: parseFloat(amount),
      description: description || catLabel,
      type,
      category: catLabel,
      created_at: (() => {
        // Combine user-selected date with current time so same-day transactions
        // are ordered by actual insertion time (newest = top)
        const d = new Date(date)
        const now = new Date()
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
        return d.toISOString()
      })()
    })

    setLoading(false)
    if (!error) {
      if (onTransactionAdded) onTransactionAdded()
      closeModal()
    }
  }

  const currentCats = cats[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">İşlem Ekle</h2>
          <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 flex-1 overflow-y-auto space-y-5 py-5">

          {/* Type Tabs */}
          <div className="flex bg-muted p-1 rounded-xl">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  type === t ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => { setType(t); setSelectedCatId(''); setEditMode(false); setEditingCat(null) }}
              >
                {t === 'expense' ? 'Gider' : 'Gelir'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tutar (₺)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground font-medium">Kategori</label>
              <button
                onClick={() => { setEditMode(!editMode); setEditingCat(null); setShowAddNew(false) }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  editMode
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {editMode ? '✓ Bitti' : 'Düzenle'}
              </button>
            </div>

            {editMode && (
              <p className="text-[11px] text-muted-foreground px-0.5">
                Sürükle → sırala &nbsp;·&nbsp; ✏️ → düzenle &nbsp;·&nbsp; ✕ → sil
              </p>
            )}

            {/* Category Grid */}
            <div className="grid grid-cols-4 gap-2">
              {currentCats.map(cat => (
                <div
                  key={cat.id}
                  draggable={editMode}
                  onDragStart={() => handleDragStart(cat.id)}
                  onDragOver={e => handleDragOver(e, cat.id)}
                  onDrop={() => handleDrop(cat.id)}
                  onDragEnd={handleDragEnd}
                  className={`relative transition-all duration-150 ${dragOverId === cat.id && editMode ? 'scale-105 opacity-60' : ''}`}
                >
                  {/* Inline Edit Form */}
                  {editMode && editingCat?.id === cat.id ? (
                    <div className="bg-muted rounded-xl border-2 border-foreground p-2 space-y-1.5">
                      <input
                        type="text"
                        value={editEmoji}
                        onChange={e => setEditEmoji(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1 text-center text-lg focus:outline-none"
                        placeholder="😀"
                        maxLength={2}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none"
                        placeholder="İsim"
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      />
                      <div className="flex gap-1">
                        <button onClick={cancelEdit} className="flex-1 bg-muted border border-border rounded-lg py-1 text-[11px] text-muted-foreground">İptal</button>
                        <button onClick={saveEdit} className="flex-1 bg-foreground text-background rounded-lg py-1 text-[11px] font-medium flex items-center justify-center gap-0.5">
                          <Check className="w-3 h-3" /> Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (!editMode) setSelectedCatId(cat.id) }}
                      className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        selectedCatId === cat.id && !editMode
                          ? 'bg-background text-foreground border-foreground'
                          : 'bg-muted border-transparent hover:border-border text-foreground'
                      } ${editMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      {editMode && (
                        <GripVertical className="absolute top-1.5 left-1 w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-xl mb-1">{cat.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight text-center line-clamp-1">{cat.label}</span>

                      {/* Edit/Delete badges */}
                      {editMode && (
                        <div className="absolute -top-2 -right-1 flex gap-0.5 z-10">
                          <button
                            onClick={e => { e.stopPropagation(); startEdit(cat) }}
                            className="w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center shadow"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteCat(cat.id) }}
                            className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              ))}

              {/* Add New Button */}
              {!editMode && (
                <button
                  onClick={() => setShowAddNew(!showAddNew)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-muted-foreground hover:text-foreground ${
                    showAddNew ? 'border-foreground bg-background text-foreground' : 'border-dashed border-border hover:border-foreground/40'
                  }`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium leading-tight text-center">Yeni</span>
                </button>
              )}
            </div>

            {/* Add New Form */}
            {showAddNew && !editMode && (
              <div className="bg-muted rounded-xl border border-border p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-foreground">Yeni Kategori</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value)}
                    className="w-14 bg-background border border-border rounded-lg px-2 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="😀"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Kategori adı..."
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleAddNew() }}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddNew(false)} className="flex-1 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</button>
                  <button onClick={handleAddNew} disabled={!newLabel.trim()} className="flex-1 py-2 bg-foreground text-background rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-80">Ekle</button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Açıklama (isteğe bağlı)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ne için?"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={e => {
                const val = e.target.value
                setDate(val)
                sessionLastSelectedDate = val
              }}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border shrink-0">
          <button
            onClick={handleSave}
            disabled={loading || !amount || !selectedCatId || editMode}
            className="w-full bg-background text-foreground border border-foreground hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed font-medium py-3 rounded-xl transition-opacity"
          >
            {loading ? 'Kaydediliyor...' : editMode ? 'Düzenleme modundan çık' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
