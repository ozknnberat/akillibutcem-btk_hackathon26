# 💸 Akıllı Bütçem

Akıllı Bütçem, **BTK Hackathon 26** için özel olarak geliştirilmiş; kullanıcıların gelir-gider takibini kolaylaştıran ve yapay zeka desteğiyle kişiselleştirilmiş finansal tavsiyeler sunan modern bir bütçe yönetim uygulamasıdır.

## 🚀 Özellikler

*   **📊 Detaylı Finansal Analiz:** Gelir ve giderlerinizi kategorize ederek etkileşimli grafiklerle aylık bütçenizi kolayca takip edin.
*   **🤖 Yapay Zeka Finans Danışmanı:** Google Gemini AI entegrasyonu sayesinde harcama alışkanlıklarınıza göre kişiselleştirilmiş tasarruf tavsiyeleri alın.
*   **☁️ Bulut Tabanlı ve Güvenli:** Supabase altyapısı ile verileriniz güvenle saklanır, dilediğiniz zaman dilediğiniz cihazdan erişebilirsiniz.
*   **🎨 Modern ve Responsive Arayüz:** Kullanıcı deneyimi odaklı, şık, hızlı ve tamamen mobil uyumlu (responsive) tasarım.
*   **🌙 Gelişmiş Tema Seçenekleri:** Göz yormayan Dark/Light mod seçenekleriyle konforlu bir kullanım.

## 🛠️ Kullanılan Teknolojiler

*   **Frontend:** React (Vite), TypeScript, Tailwind CSS
*   **Backend & Veritabanı:** Supabase (PostgreSQL, Auth)
*   **Yapay Zeka:** Google Gemini API
*   **Durum Yönetimi (State):** Zustand / Custom React Hooks
*   **İkonlar:** Lucide React

## 💻 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyebilirsiniz:

1. **Projeyi Klonlayın:**
   ```bash
   git clone https://github.com/ozknnberat/akillibutcem-btk_hackathon26.git
   cd akillibutcem-btk_hackathon26
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre Değişkenlerini Ayarlayın:**
   Proje kök dizininde bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri kendi API anahtarlarınız ile doldurun:
   ```env
   VITE_SUPABASE_URL=sizin_supabase_url_adresiniz
   VITE_SUPABASE_ANON_KEY=sizin_supabase_anon_key_degeriniz
   VITE_GEMINI_API_KEY=sizin_gemini_api_anahtariniz
   ```

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```

## 👥 Geliştirici
* **Berat Özkan** - [GitHub Profili](https://github.com/ozknnberat)

---

*Bu proje BTK Hackathon 26 kapsamında geliştirilmiştir.*
