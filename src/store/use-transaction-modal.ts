import { create } from 'zustand'

interface TransactionModalStore {
  isOpen: boolean
  defaultType: 'income' | 'expense'
  openModal: (type?: 'income' | 'expense') => void
  closeModal: () => void
}

export const useTransactionModal = create<TransactionModalStore>((set) => ({
  isOpen: false,
  defaultType: 'expense',
  openModal: (type = 'expense') => set({ isOpen: true, defaultType: type }),
  closeModal: () => set({ isOpen: false }),
}))
