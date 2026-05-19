import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const usernameRegex = /^[a-zA-Z0-9_.]{3,21}$/
    if (!usernameRegex.test(username)) {
      setError("Kullanıcı adı geçersiz! Sadece İngilizce karakter, rakam, alt tire (_) ve nokta (.) kullanabilirsiniz. Min 3, maks 21 karakter olmalıdır.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.")
      setLoading(false)
      return
    }

    const dummyEmail = `${username.toLowerCase()}@akillibutcem.com`
    
    const { error } = await supabase.auth.signUp({
      email: dummyEmail,
      password,
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError("Bu kullanıcı adı zaten alınmış. Lütfen başka bir isim deneyin.")
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // Log username to profiles table for admin visibility
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user?.id) {
        await supabase.from('profiles').upsert({
          id: sessionData.session.user.id,
          username: username.toLowerCase()
        })
      }
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Kayıt Ol</CardTitle>
          <CardDescription>
            Yeni bir Akıllı Bütçem hesabı oluşturun
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="ornek_isim123" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Sadece İngilizce harfler, rakam, '_' ve '.' (3-21 karakter)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
