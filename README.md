# 🎯 Maqsad qo'yish

> Yurakni jizillatadigan buyuk maqsadlar sari **4 qadam**

Dilshod Mannopovning **«Ustoz-shogird»** metodologiyasidagi 4 bosqichli maqsad
filtri asosida qurilgan interaktiv veb-dastur. Foydalanuvchi 4 ta bosqichdan
o'tib, yakunda **«Strategik maqsad pasporti»**ni oladi va uni PDF / PNG
ko'rinishida yuklab olishi mumkin.

---

## ✨ Imkoniyatlar

| | |
|---|---|
| 🔥 **1-qadam** | Yurakni jizillatuvchi maqsadni tanlash — soha chiplari, maqsad matni, 1–10 his-tuyg'u o'lchagichi (emoji slider), «nima uchun?» savoli |
| ❤️ **2-qadam** | Qadriyat va manfaat filtri — ko'p tanlovli qadriyat teglari (+ o'z variantini qo'shish), boshqalarga manfaat, tramplin effekti |
| 🛡️ **3-qadam** | 10 ta qadam va straxovka — akkordeon kartalar, muddat (deadline), **Straxovka A** va **Straxovka B** zaxira rejalari |
| 📏 **4-qadam** | O'lchov va aniq parametrlar — erishilganlik belgilari (checklist), KPI jadvali, qasamyod va imzo bloki |
| 📄 **Pasport** | Barcha ma'lumotlar jamlangan vizual dashboard + PDF / PNG / chop etish / matn nusxalash |

Qo'shimcha:

- 💾 **Avtomatik saqlash** — barcha kiritilgan ma'lumot `localStorage`da saqlanadi,
  sahifa yangilanganda yo'qolmaydi.
- ✅ **Validatsiya** — bosqichni bo'sh qoldirib keyingisiga o'tib bo'lmaydi,
  aniq ogohlantirishlar chiqadi.
- 📊 **Progress stepper** — har bir bosqichning to'ldirilganlik foizi va holati
  (tugallangan / faol / kutilmoqda).
- 💡 **Ustoz maslahatlari** va har bosqichda ilhomlantiruvchi iqtiboslar.
- 📱 **To'liq responsive** + **Telegram Mini App**ga moslashtirilgan.

---

## 🛠 Texnologiyalar

- **React 18** — butun ilova bitta komponent faylida: [`src/MaqsadQoyish.jsx`](src/MaqsadQoyish.jsx)
- **Tailwind CSS 3** — minimalistik premium SaaS uslubi (slate / indigo / violet)
- **lucide-react** — piktogrammalar
- **html2pdf.js** + **html2canvas** — PDF va PNG eksport
- **Vite** — dev-server va build

---

## 🚀 Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # natija: dist/
npm run preview    # build'ni lokal tekshirish
```

`dist/` papkasi statik — uni istalgan hostingga (Netlify, Vercel, GitHub Pages,
Cloudflare Pages, oddiy nginx) qo'yish mumkin. `vite.config.js` da
`base: './'` turgani uchun sayt ham domen ildizida, ham pastki papkada
(`/maqsadqoy/`) bir xil ishlaydi.

### 🌐 Internetga chiqarish (GitHub Pages)

Repozitoriyda tayyor workflow bor: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Uni ishga tushirish uchun **bir marta** sozlash kerak:

1. GitHub'da repozitoriyni oching → **Settings** → **Pages**
2. **Build and deployment** → **Source**: `GitHub Actions` ni tanlang
3. Tayyor. Har bir push'dan keyin sayt avtomatik yangilanadi:

```
https://<foydalanuvchi-nomi>.github.io/maqsadqoy/
```

Muqobil (eng tez yo'l): `npm run build` dan keyin `dist/` papkasini
[app.netlify.com/drop](https://app.netlify.com/drop) sahifasiga
sudrab tashlang — bir necha soniyada tayyor HTTPS manzil beradi.

> ⚠️ Telegram Mini App **faqat HTTPS** manzil bilan ishlaydi —
> `localhost` yoki `file://` orqali ochilmaydi.

---

## 📱 Telegram Mini App / Telegram ichida ochish

Dastur Telegram'ning ichki brauzerida ishlashga alohida moslashtirilgan:

- `telegram-web-app.js` SDK ulangan — Telegram tashqarisida ham xatosiz ishlaydi.
- **To'liq ochilish**: `expand()` ishga tushishda va har bir `viewportChanged`
  hodisasida chaqiriladi — ilova hech qachon «compact» holatda qolib ketmaydi.
- Telegram'ning **BackButton** tugmasi bosqichlar bo'ylab orqaga qaytaradi.
- **HapticFeedback** — tugmalar bosilganda tebranish.
- Input'lar 16px shriftda + `user-scalable=no` — iOS'da avtomatik zoom yo'q.
- **Safe-area**: Telegram `safeAreaInset` / `contentSafeAreaInset` qiymatlari,
  ular bo'lmasa CSS `env(safe-area-inset-*)` (iPhone «челка» va pastki chiziq).

### 🧱 Barqarorlik: nega interfeys «qimirlamaydi»

Telegram webview'da sahifalar odatda uch sababdan sakraydi: hujjat darajasidagi
skroll + iOS rubber-band, `position: fixed` pastki panel, va klaviatura
ochilganda viewport o'zgarishi. Uchalasi ham quyidagicha yopilgan:

| Muammo | Yechim |
|---|---|
| iOS rubber-band, pastga tortganda ilova yopilishi | `html, body { overflow: hidden; overscroll-behavior: none }` + `disableVerticalSwipes()` |
| Skroll/klaviaturada pastki panel sakrashi | Panel **`position: fixed` emas** — u `.app-shell` flex ustunining oxirgi elementi |
| `100dvh` Telegram'da noto'g'ri | Balandlik `--app-h` o'zgaruvchisidan: `visualViewport.height` → `viewportStableHeight` → `innerHeight` |
| Skroll paytida balandlik tebranishi | `visualViewport`ning faqat **`resize`** hodisasi tinglanadi, `scroll` emas; yangilanish `requestAnimationFrame` bilan |
| Kontent sakrashi | Skroll faqat bitta `.app-scroll` konteynerida, `overscroll-behavior: contain` bilan |

Natijada tuzilma quyidagicha:

```
.app-shell   (position: fixed, height: var(--app-h), flex column)
├── .app-scroll   (flex: 1, yagona skroll hududi)
│   └── header · stepper · bosqich kontenti · footer
└── pastki panel  (shrink-0 — oqimda, hech qachon sakramaydi)
```

O'lchangan natija (Telegram simulyatsiyasi, iPhone 13): hujjat skrolli **0px**,
pastki panel 1200px skrolldan keyin ham **0px siljiydi**, input fokusida ham
**0px siljish**.

### Saqlash va yuborish

Telegram'ning ichki brauzeri ba'zan fayl yuklashni bloklaydi, shuning uchun
pasportni saqlashning **5 xil yo'li** berilgan:

1. 📥 **PDF yuklab olish** — asosiy yo'l (A4, ko'p sahifali).
   **Agar PDF chiqmasa — dastur avtomatik ravishda rasm tayyorlashga o'tadi.**
2. 📤 **Telegramga yuborish** — pasportni PNG rasmga aylantiradi va uni
   to'g'ridan-to'g'ri chatga jo'natish oynasini ochadi.
3. 🖼 **Rasm sifatida saqlash** — rasm oynada ochiladi: yuklab olish yoki
   **bosib turib** galereyaga saqlash mumkin. Telegram'da eng ishonchli usul.
4. 🖨 **Chop etish** — brauzerning print oynasi (u yerdan ham «Save as PDF»).
5. 📋 **Matnni nusxalash** — pasportni matn ko'rinishida clipboard'ga oladi.

**«Telegramga yuborish» qanday ishlaydi.** Bosqichma-bosqich zaxira zanjiri
qurilgan, shuning uchun u har qanday qurilmada natija beradi:

| Navbat | Usul | Natija |
|---|---|---|
| 1 | `navigator.share({ files })` | **Rasmning o'zi** Telegramga (yoki boshqa ilovaga) yuboriladi |
| 2 | `Telegram.WebApp.openTelegramLink` | Telegram ichida chat tanlash oynasi ochiladi |
| 3 | `t.me/share/url` | Brauzerdan Telegram share sahifasi ochiladi |
| 4 | Clipboard | Matn nusxalanadi — qo'lda joylash mumkin |

> ⚙️ Rasm oldindan tayyorlanib **keshlanadi**. Buning sababi: Web Share API
> faylni faqat foydalanuvchining «toza» bosishi paytida qabul qiladi, rasm
> generatsiyasi esa bir necha soniya oladi. Shuning uchun birinchi bosishda
> rasm tayyorlanadi va oyna ochiladi, ikkinchi bosishda esa darhol yuboriladi.
> Ma'lumot tahrirlansa — kesh avtomatik yangilanadi.

Agar PDF baribir yuklanmasa, rasm oynasidagi **«Brauzerda ochish»** tugmasi
sahifani tizim brauzerida ochadi.

Mini App sifatida ulash uchun **@BotFather** → `/newapp` → hosting URL'ini
kiriting.

---

## 🗂 Loyiha tuzilishi

```
├── index.html                 # Telegram SDK, Inter shrifti, meta teglar
├── src/
│   ├── MaqsadQoyish.jsx       # butun ilova — yagona komponent fayli
│   ├── main.jsx               # React kirish nuqtasi
│   └── index.css              # Tailwind + slider, print (A4) uslublari
├── tailwind.config.js         # ranglar, soyalar, mikro-animatsiyalar
└── vite.config.js
```

`MaqsadQoyish.jsx` ichidagi bo'limlar tartibi:

1. Konstantalar (sohalar, qadriyatlar, iqtiboslar, maslahatlar)
2. Yordamchi funksiyalar va `localStorage` bilan ishlash
3. Validatsiya va progress hisoblash
4. Kichik UI komponentlari
5. Header va progress stepper
6. 1–4 qadam ekranlari
7. «Strategik maqsad pasporti» dashboardi
8. PDF/print uchun A4 hujjat shabloni
9. Telegram integratsiyasi va asosiy komponent

---

## 🎨 Dizayn tamoyillari

- Slate fon, indigo→violet gradient urg'u, nozik soyalar va `backdrop-blur`.
- Mikro-animatsiyalar: `fadeUp`, `pop`, `slideDown`, `floaty`.
- Barcha bosiladigan elementlar kamida 44–46px balandlikda (mobil uchun).
- Butun interfeys **to'liq o'zbek tilida**.

---

## 🔒 Maxfiylik

Hech qanday server yo'q. Barcha ma'lumot faqat foydalanuvchining
brauzerida (`localStorage`) saqlanadi va hech qayerga yuborilmaydi.
