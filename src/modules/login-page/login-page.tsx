import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, X, Info } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const usernameRegex = /^[a-zA-Z0-9_.]{3,21}$/
    if (!usernameRegex.test(username)) {
      setError("Kullanıcı adı sadece İngilizce harfler, rakamlar, alt tire (_) ve nokta (.) içerebilir. 3-21 karakter uzunluğunda olmalıdır.")
      setLoading(false)
      return
    }

    const dummyEmail = `${username.toLowerCase()}@akillibutcem.com`
    
    let { error } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password,
    })

    // Eski kullanıcılar için (.local uzantılı olanlar) fallback
    if (error && error.message.includes('Invalid login credentials')) {
      const fallback = await supabase.auth.signInWithPassword({
        email: `${username.toLowerCase()}@akillibutcem.local`,
        password,
      })
      if (!fallback.error) error = null
    }

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError("Kullanıcı adı veya şifre hatalı.")
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
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
          <CardTitle className="text-3xl font-bold tracking-tight">Akıllı Bütçem</CardTitle>
          <CardDescription>
            Finansal asistanınıza giriş yapın
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="ornek_kullanici" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
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
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>

            {/* Şifremi Unuttum */}
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Şifremi unuttum
            </button>

            <div className="text-sm text-center text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Kayıt Ol
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Şifremi Unuttum Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Şifremi Unuttum</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Bu uygulama e-posta adresi yerine <span className="font-medium text-foreground">kullanıcı adı</span> ile giriş yapmaktadır.
                Bu nedenle otomatik şifre sıfırlama bağlantısı gönderilememektedir.
              </p>
              <p>
                Şifrenizi unuttuysanız, <span className="font-medium text-foreground">uygulama yöneticisi</span> ile iletişime geçin.
                Yönetici hesabınızı doğruladıktan sonra şifrenizi geçici bir şifreyle sıfırlayacak;
                giriş yapıp <span className="font-medium text-foreground">Ayarlar</span> sayfasından istediğiniz yeni şifreyi belirleyebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2.5 bg-background text-foreground border border-foreground rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
