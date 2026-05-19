interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Sil', danger = true }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-150 mx-4">
        <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white border border-red-500'
                : 'bg-foreground hover:opacity-90 text-background border border-foreground'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
