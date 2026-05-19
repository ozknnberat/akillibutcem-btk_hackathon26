export interface User {
  id: string
  email: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  created_at: string
}
