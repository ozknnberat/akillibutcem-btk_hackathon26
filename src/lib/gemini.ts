import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

const SYSTEM_PROMPT = `Sen "Akıllı Bütçem" uygulamasının finans asistanısın. Görevin yalnızca kullanıcının kişisel bütçe ve harcama verilerini analiz etmek ve finansal tavsiyelerde bulunmaktır.

KURALLARIN:
1. YALNIZCA bütçe, harcama, tasarruf, borç yönetimi ve kullanıcının uygulamadaki işlemleriyle ilgili sorulara yanıt ver.
2. Finansla alakasız sorulara (kod yazma, tarih, genel bilgi, haberler vb.) ASLA yanıt verme. Kibarca "Bu konuda yardım edemem, yalnızca finansal sorularında yanınızdayım." de.
3. Yanıtların KISA ve NET olsun. Maksimum 3-4 cümle. Uzun listeler yapma.
4. Kesinlikle markdown kullanma: yıldız (*), çift yıldız (**), diyez (#), tire (-) listesi YASAK. Düz metin yaz.
5. Türkçe konuş.
6. Samimi ve sıcak bir dil kullan ama gereksiz şişirilmiş cümleler kurma.`

export async function getBudgetAdvice(transactions: any[], currentBalance: number) {
  if (transactions.length === 0) return "Merhaba, ben Akıllı Bütçem. İlk işlemini ekleyerek başlayabilirsin."

  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-lite-latest",
    systemInstruction: SYSTEM_PROMPT
  })

  const prompt = `Kullanıcının mevcut bakiyesi: ${currentBalance} TL. Son işlemleri: ${JSON.stringify(transactions.slice(0, 5))}. Tek cümlelik kısa bir karşılama mesajı yaz, ardından 1-2 cümle analiz ekle.`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error("Gemini AI Error:", error)
    return "Merhaba, ben Akıllı Bütçem. Size nasıl yardımcı olabilirim?"
  }
}

export async function chatWithAssistant(message: string, history: {role: string, parts: {text: string}[]}[], transactions: any[], currentBalance: number) {
  const contextInstruction = `${SYSTEM_PROMPT}

Kullanıcının mevcut bakiyesi: ${currentBalance} TL.
Son 10 işlemi: ${JSON.stringify(transactions.slice(0, 10))}`

  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-lite-latest",
    systemInstruction: contextInstruction
  })
  
  try {
    const validHistory = [
      { role: 'user', parts: [{ text: "Merhaba" }] },
      ...history
    ]

    const chat = model.startChat({
      history: validHistory,
    })

    const result = await chat.sendMessage(message)
    return result.response.text()
  } catch (error: any) {
    console.error("Gemini AI Chat Error:", error)
    const errorMsg = error?.message || error?.toString() || "Bilinmeyen hata"
    throw new Error(`Gemini API Hatası: ${errorMsg}`)
  }
}
