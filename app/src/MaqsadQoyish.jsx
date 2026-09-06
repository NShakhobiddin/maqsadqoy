/* eslint-disable react-refresh/only-export-components */
/**
 * ============================================================================
 *  MAQSAD QO'YISH — "Ustoz-shogird" metodologiyasidagi 4 bosqichli maqsad filtri
 *  (Dilshod Mannopov uslubi)
 *
 *  Bitta faylda ishlaydigan React komponenti.
 *  • React + Tailwind CSS + lucide-react
 *  • localStorage'ga avtomatik saqlash
 *  • "Strategik maqsad pasporti" dashboardi
 *  • PDF / PNG / Chop etish orqali eksport (Telegram Mini App uchun moslashgan)
 * ============================================================================
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Fingerprint,
  Flag,
  Flame,
  GraduationCap,
  Hash,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Link2,
  ListChecks,
  Loader2,
  Milestone,
  PenLine,
  Plus,
  Printer,
  Quote,
  RotateCcw,
  Rocket,
  Ruler,
  Save,
  ScrollText,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'

/* ==========================================================================
 *  1. KONSTANTALAR
 * ========================================================================== */

const STORAGE_KEY = 'maqsad-qoyish:v1'
const QADAMLAR_SONI = 10

/** Progress stepper uchun bosqichlar */
const BOSQICHLAR = [
  {
    id: 1,
    nom: 'Yurakni jizillatuvchi maqsad',
    qisqa: 'Maqsad',
    tavsif: 'Erishish imkonsizdek tuyuladigan, lekin sizni to‘lqinlantiradigan bitta ulkan maqsad.',
    Icon: Flame,
    rang: 'from-orange-500 to-rose-500',
  },
  {
    id: 2,
    nom: 'Qadriyat va manfaat',
    qisqa: 'Qadriyat',
    tavsif: 'Maqsad ortidagi haqiqiy sabab, qadriyatlaringiz va atrofdagilarga keladigan foyda.',
    Icon: Heart,
    rang: 'from-rose-500 to-fuchsia-500',
  },
  {
    id: 3,
    nom: '10 ta qadam va straxovka',
    qisqa: 'Reja',
    tavsif: 'Maqsadni 10 ta aniq qadamga bo‘lish va har biri uchun zaxira reja belgilash.',
    Icon: ShieldCheck,
    rang: 'from-indigo-500 to-violet-500',
  },
  {
    id: 4,
    nom: 'O‘lchov va aniq parametrlar',
    qisqa: 'O‘lchov',
    tavsif: 'Maqsadga erishilganini isbotlaydigan ashyoviy faktlar va raqamli mezonlar.',
    Icon: Ruler,
    rang: 'from-emerald-500 to-teal-500',
  },
]

/** 1-qadam: soha tanlash chiplari */
const SOHALAR = [
  { id: 'biznes', nom: 'Biznes & Moliya', Icon: TrendingUp },
  { id: 'karyera', nom: 'Karyera & Ta’lim', Icon: GraduationCap },
  { id: 'it', nom: 'IT & Startap', Icon: Code2 },
  { id: 'soglik', nom: 'Sog‘lik & Sport', Icon: Activity },
  { id: 'shaxsiy', nom: 'Shaxsiy rivojlanish', Icon: Brain },
  { id: 'oila', nom: 'Oila', Icon: Home },
]

/** 1-qadam: maqsad matni uchun namuna boshlanishlar */
const MAQSAD_NAMUNALAR = [
  'O‘z sohamda O‘zbekistondagi eng yaxshi 10 mutaxassis qatoriga kirish',
  '3 yil ichida yillik aylanmasi $1 mln bo‘lgan kompaniya qurish',
  '100 000 foydalanuvchiga xizmat qiladigan mahsulot ishlab chiqish',
  'Oilam uchun o‘z uyimni qurish va qarzsiz yashash',
  'Xalqaro miqyosdagi sertifikat olib, chet elda ishlash',
]

/** 2-qadam: qadriyat teglari */
const QADRIYATLAR = [
  'Halollik',
  'Ozodlik / Erkinlik',
  'Oila farovonligi',
  'Jamiyatga hissa qo‘shish',
  'Ilm / Professionalizm',
  'Moliyaviy mustaqillik',
  'Qalb xotirjamligi',
  'Mas’uliyat',
  'Sadoqat',
  'Rivojlanish',
]

/** 3-qadam: qadamlar uchun tez to‘ldirish namunalari */
const QADAM_NAMUNALARI = [
  'Bozorni va raqobatchilarni o‘rganish',
  'Ustoz / mentor topish',
  'Kerakli bilim va ko‘nikmani egallash',
  'Boshlang‘ich resurs (kapital, jamoa) yig‘ish',
  'Birinchi minimal natijani yaratish',
  'Birinchi mijoz / birinchi sotuvni amalga oshirish',
  'Jarayonni tizimlashtirish',
  'Jamoani kengaytirish',
  'Miqyosni oshirish (masshtablash)',
  'Natijani mustahkamlash va yangi cho‘qqi belgilash',
]

/** 4-qadam: erishilganlik belgilari uchun tayyor variantlar */
const BELGI_NAMUNALARI = [
  'Bank hisobimda kerakli summa turibdi',
  'Mahsulot ishlab chiqarildi va qo‘limda turibdi',
  'Yangi ofis kaliti cho‘ntagimda',
  'Shartnoma imzolangan va nusxasi menda',
  'Sertifikat / diplom qo‘limda',
  'Mijozlarim soni belgilangan raqamdan oshdi',
  'Jamoamda kerakli mutaxassislar ishlayapti',
  'Tahlil paneli (dashboard) rejadagi raqamni ko‘rsatmoqda',
]

/** 4-qadam: KPI namunalari */
const KPI_NAMUNALARI = [
  { nom: 'Oylik daromad', qiymat: '', birlik: 'so‘m' },
  { nom: 'Mijozlar soni', qiymat: '', birlik: 'ta' },
  { nom: 'Jamoa a’zolari', qiymat: '', birlik: 'kishi' },
  { nom: 'Foydalanuvchilar', qiymat: '', birlik: 'ta' },
]

/** Har bir bosqich uchun ilhomlantiruvchi iqtibos */
const IQTIBOSLAR = [
  {
    matn: 'Agar maqsading seni qo‘rqitmasa va yuragingni jizillatmasa — u maqsad emas, shunchaki reja.',
    muallif: 'Ustoz-shogird metodologiyasi',
  },
  {
    matn: 'Faqat o‘zing uchun qo‘yilgan maqsad tez so‘nadi. Boshqalarga manfaati bor maqsad seni oxirigacha olib boradi.',
    muallif: 'Ustoz-shogird metodologiyasi',
  },
  {
    matn: 'Rejasi bo‘lmagan maqsad — orzu. Straxovkasi bo‘lmagan reja — umid.',
    muallif: 'Ustoz-shogird metodologiyasi',
  },
  {
    matn: 'O‘lchab bo‘lmaydigan maqsadga erishganingni hech qachon bilmaysan.',
    muallif: 'Ustoz-shogird metodologiyasi',
  },
  {
    matn: 'Yozilgan maqsad — bu o‘zingga bergan va’da. Uni saqlash esa xarakter masalasi.',
    muallif: 'Ustoz-shogird metodologiyasi',
  },
]

/** Har bir bosqich uchun maslahatlar */
const MASLAHATLAR = [
  [
    'Maqsad "biroz katta" emas, "imkonsizdek katta" bo‘lsin — shunda ichingizdagi kuch uyg‘onadi.',
    'Uni yozganingizda qo‘rquv va hayajon birga kelsa — to‘g‘ri maqsadni topgansiz.',
    'Boshqalarning emas, aynan o‘zingizning maqsadingizni yozing.',
  ],
  [
    'Maqsad qadriyatlaringizga zid bo‘lsa, siz unga yetolmaysiz — yetsangiz ham baxtli bo‘lmaysiz.',
    'Maqsadingizdan kamida 3 kishi manfaat ko‘rsa — u sizni oxirigacha tortadi.',
    'Har bir katta maqsad undan ham kattaroq maqsadga tramplin bo‘lishi kerak.',
  ],
  [
    '10 ta qadam — bu "yo‘l xaritasi". Ularsiz maqsad shunchaki xohishligicha qoladi.',
    'Straxovkasiz qadam — bu eng zaif bo‘g‘in. To‘siq albatta chiqadi, savol faqat "qachon?"',
    'Har bir qadamga aniq muddat qo‘ying: muddatsiz qadam hech qachon bajarilmaydi.',
  ],
  [
    'Agar maqsadga erishganingizni fotosuratga olib bo‘lmasa — u yetarlicha aniq emas.',
    'Raqam, sana va ashyoviy dalil — maqsadning uch ustuni.',
    'Qasamyod ovoz chiqarib o‘qilganda kuchga kiradi.',
  ],
]

/* ==========================================================================
 *  2. YORDAMCHI FUNKSIYALAR
 * ========================================================================== */

const cx = (...c) => c.filter(Boolean).join(' ')

const uid = () => Math.random().toString(36).slice(2, 10)

const notBosh = (v) => typeof v === 'string' && v.trim().length > 0

/* --------------------------------------------------------------------------
 *  SANALAR
 *
 *  Barcha sanalar "YYYY-MM-DD" ko'rinishida saqlanadi — bu <input type="date">
 *  ning formati. Ular kalendar sanasi (mahalliy), vaqt nuqtasi emas.
 *
 *  Shuning uchun bu yerda Date obyekti ataylab ishlatilmaydi:
 *    • new Date().toISOString() — UTC beradi. Toshkentda (UTC+5) tunda
 *      soat 00:00–05:00 orasida u KECHAGI sanani qaytaradi.
 *    • new Date('2026-05-11') — UTC yarim tuni sifatida o'qiladi, keyin
 *      getDate() mahalliy vaqtga o'giradi. Manfiy mintaqalarda (masalan
 *      Amerika) natija bir kun oldinga suriladi: "10-may".
 * -------------------------------------------------------------------------- */

const OYLAR = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

/** Sana chegaralari — klaviaturadan kiritilgan xato yilning oldini oladi */
const ENG_ERTA = '2000-01-01'
const ENG_KECH = '2100-12-31'

/** Mahalliy kalendar sanasi "YYYY-MM-DD" ko'rinishida */
const sanaKalit = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const bugun = () => sanaKalit()

/**
 * "YYYY-MM-DD" ni qismlarga ajratadi va haqiqiy sana ekanini tekshiradi.
 * Mavjud bo'lmagan sana (masalan 2026-02-31) uchun null qaytaradi —
 * Date bo'lsa uni jimgina 3-martga aylantirib yuborardi.
 */
const sanaQismlari = (iso) => {
  if (!notBosh(iso)) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const yil = Number(m[1])
  const oy = Number(m[2])
  const kun = Number(m[3])
  if (oy < 1 || oy > 12 || kun < 1) return null
  // Oydagi oxirgi kun (kabisa yili ham to'g'ri hisoblanadi)
  const oxirgiKun = new Date(Date.UTC(yil, oy, 0)).getUTCDate()
  if (kun > oxirgiKun) return null
  return { yil, oy, kun }
}

const sanaFormat = (iso) => {
  const q = sanaQismlari(iso)
  if (!q) return notBosh(iso) ? iso : '—'
  return `${q.kun}-${OYLAR[q.oy - 1]}, ${q.yil}`
}

/**
 * Muddat o'tib ketganmi?
 * "YYYY-MM-DD" satrlarini oddiy solishtirish to'g'ri ishlaydi va
 * vaqt mintaqasiga bog'liq emas.
 */
const muddatOtgan = (iso) => {
  const q = sanaQismlari(iso)
  return q ? iso.trim() < bugun() : false
}

/** His-tuyg'u darajasi uchun emoji va izoh */
const JIZILLASH = [
  { emoji: '😐', label: 'Befarq' },
  { emoji: '🙂', label: 'Qiziq' },
  { emoji: '😊', label: 'Yoqimli' },
  { emoji: '😀', label: 'Ilhomlantiruvchi' },
  { emoji: '😃', label: 'Kuchli' },
  { emoji: '🤩', label: 'Hayajonli' },
  { emoji: '😤', label: 'Jangovar' },
  { emoji: '🔥', label: 'Yurak jizillayapti' },
  { emoji: '⚡', label: 'Tunda uxlatmaydi' },
  { emoji: '💥', label: 'Butun hayotimni o‘zgartiradi' },
]

/** Bo'sh (dastlabki) ma'lumotlar tuzilmasi */
const boshMalumot = () => ({
  qadam1: {
    soha: '',
    maqsad: '',
    jizillash: 7,
    nega: '',
  },
  qadam2: {
    qadriyatlar: [],
    manfaat: '',
    tramplin: '',
  },
  qadam3: {
    qadamlar: Array.from({ length: QADAMLAR_SONI }, (_, i) => ({
      id: `q${i + 1}`,
      raqam: i + 1,
      nom: '',
      muddat: '',
      straxovkaA: '',
      straxovkaB: '',
      bajarildi: false,
    })),
  },
  qadam4: {
    belgilar: [],
    kpilar: [],
    qasamyod: '',
    imzo: '',
    sana: bugun(),
    tasdiq: false,
  },
  meta: {
    yaratilgan: new Date().toISOString(),
    yangilangan: new Date().toISOString(),
  },
})

/** localStorage'dan o'qish (buzilgan ma'lumotlarga chidamli) */
const oqish = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const bosh = boshMalumot()
    // Sxema o'zgarsa ham eski ma'lumot yo'qolmasligi uchun chuqur birlashtirish
    const data = {
      qadam1: { ...bosh.qadam1, ...(parsed.data?.qadam1 || {}) },
      qadam2: { ...bosh.qadam2, ...(parsed.data?.qadam2 || {}) },
      qadam3: {
        qadamlar: bosh.qadam3.qadamlar.map((q, i) => ({
          ...q,
          ...((parsed.data?.qadam3?.qadamlar || [])[i] || {}),
          id: q.id,
          raqam: q.raqam,
        })),
      },
      qadam4: { ...bosh.qadam4, ...(parsed.data?.qadam4 || {}) },
      meta: { ...bosh.meta, ...(parsed.data?.meta || {}) },
    }
    const b = Number(parsed.bosqich)
    return { data, bosqich: Number.isInteger(b) && b >= 0 && b <= 5 ? b : 1 }
  } catch {
    return null
  }
}

/* ==========================================================================
 *  3. VALIDATSIYA VA PROGRESS
 * ========================================================================== */

/** Har bir bosqich uchun to'ldirilganlik foizi (0..100) */
function bosqichFoizi(data, bosqich) {
  if (bosqich === 1) {
    const d = data.qadam1
    const items = [notBosh(d.soha), d.maqsad.trim().length >= 15, d.jizillash >= 1, d.nega.trim().length >= 15]
    return Math.round((items.filter(Boolean).length / items.length) * 100)
  }
  if (bosqich === 2) {
    const d = data.qadam2
    const items = [d.qadriyatlar.length >= 2, d.manfaat.trim().length >= 15, d.tramplin.trim().length >= 10]
    return Math.round((items.filter(Boolean).length / items.length) * 100)
  }
  if (bosqich === 3) {
    const qs = data.qadam3.qadamlar
    const ball = qs.reduce((acc, q) => {
      let b = 0
      if (notBosh(q.nom)) b += 0.5
      if (notBosh(q.muddat)) b += 0.2
      if (notBosh(q.straxovkaA)) b += 0.2
      if (notBosh(q.straxovkaB)) b += 0.1
      return acc + b
    }, 0)
    return Math.round((ball / qs.length) * 100)
  }
  const d = data.qadam4
  const items = [
    d.belgilar.filter((b) => notBosh(b.matn)).length >= 2,
    d.kpilar.filter((k) => notBosh(k.nom) && notBosh(k.qiymat)).length >= 1,
    d.qasamyod.trim().length >= 20,
    d.tasdiq === true,
  ]
  return Math.round((items.filter(Boolean).length / items.length) * 100)
}

/** Bosqichni validatsiya qilish → xatolar ro'yxati */
function bosqichniTekshir(data, bosqich) {
  const x = []
  if (bosqich === 1) {
    const d = data.qadam1
    if (!notBosh(d.soha)) x.push('Maqsadingiz qaysi sohaga tegishli ekanini tanlang.')
    if (d.maqsad.trim().length < 15)
      x.push('Asosiy maqsadni kamida 15 ta belgidan iborat qilib, aniq yozing.')
    if (d.nega.trim().length < 15)
      x.push('“Nima uchun aynan shu maqsad?” savoliga batafsil javob yozing.')
  }
  if (bosqich === 2) {
    const d = data.qadam2
    if (d.qadriyatlar.length < 2) x.push('Kamida 2 ta qadriyatni tanlang yoki o‘zingiznikini qo‘shing.')
    if (d.manfaat.trim().length < 15)
      x.push('Bu maqsaddan kimlar va qanday manfaat ko‘rishini yozing.')
    if (d.tramplin.trim().length < 10)
      x.push('Tramplin effektini yozing: bu maqsad qaysi kattaroq maqsadga ko‘prik bo‘ladi?')
  }
  if (bosqich === 3) {
    const qs = data.qadam3.qadamlar
    const toliq = qs.filter((q) => notBosh(q.nom) && notBosh(q.straxovkaA))
    if (toliq.length < 3)
      x.push('Kamida 3 ta qadamni nomi va “Straxovka A”si bilan to‘ldiring.')
    const nomliAmmoStraxovkasiz = qs.filter((q) => notBosh(q.nom) && !notBosh(q.straxovkaA))
    if (nomliAmmoStraxovkasiz.length > 0)
      x.push(
        `Quyidagi qadamlarda “Straxovka A” yo‘q: ${nomliAmmoStraxovkasiz
          .map((q) => q.raqam)
          .join(', ')}-qadam.`
      )
  }
  if (bosqich === 4) {
    const d = data.qadam4
    if (d.belgilar.filter((b) => notBosh(b.matn)).length < 2)
      x.push('Kamida 2 ta “erishilganlik belgisi”ni qo‘shing.')
    if (d.kpilar.filter((k) => notBosh(k.nom) && notBosh(k.qiymat)).length < 1)
      x.push('Kamida 1 ta aniq KPI (raqamli mezon) kiriting.')
    if (d.qasamyod.trim().length < 20) x.push('Qasamyod matnini kamida 20 ta belgi bilan yozing.')
    if (!d.tasdiq) x.push('Qasamyodni tasdiqlash katakchasini belgilang.')
  }
  return x
}

/* ==========================================================================
 *  4. KICHIK UI KOMPONENTLARI
 *  (Modul darajasida e'lon qilingan — input fokusi yo'qolmasligi uchun)
 * ========================================================================== */

/** Bo'lim sarlavhasi */
function BolimSarlavha({ Icon, sarlavha, izoh, majburiy }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h3 className="text-[15px] font-bold leading-snug text-slate-900 sm:text-base">
          {sarlavha}
          {majburiy ? <span className="ml-1 text-rose-500">*</span> : null}
        </h3>
      </div>
      {izoh ? <p className="mt-1.5 pl-0 text-[13px] leading-relaxed text-slate-500 sm:pl-9">{izoh}</p> : null}
    </div>
  )
}

/** Katta matn maydoni + belgi hisoblagichi */
function MatnMaydoni({ value, onChange, placeholder, rows = 4, min = 0, maxLength = 1200 }) {
  const uzunlik = (value || '').trim().length
  const yetarli = min === 0 || uzunlik >= min
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cx(
          'w-full rounded-2xl border bg-white/90 px-4 py-3 text-[15px] leading-relaxed text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400',
          'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
          uzunlik === 0 ? 'border-slate-200' : yetarli ? 'border-emerald-200' : 'border-amber-200'
        )}
      />
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span>
          {min > 0 && !yetarli ? (
            <span className="text-amber-600">Yana {min - uzunlik} ta belgi yozing</span>
          ) : uzunlik > 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <Check className="h-3 w-3" /> Yetarli
            </span>
          ) : (
            'Erkin yozing — keyin tahrirlashingiz mumkin'
          )}
        </span>
        <span className="tabular-nums">{uzunlik}/{maxLength}</span>
      </div>
    </div>
  )
}

/** Bir qatorli input */
function Kirit({ value, onChange, placeholder, type = 'text', Icon, className, ...rest }) {
  return (
    <div className={cx('relative', className)}>
      {Icon ? (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      ) : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(
          'w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 text-[15px] text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400',
          'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100',
          Icon ? 'pl-10 pr-3.5' : 'px-3.5'
        )}
        {...rest}
      />
    </div>
  )
}

/** Tanlanadigan chip / teg */
function Chip({ faol, onClick, children, Icon, size = 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'no-tap-highlight inline-flex select-none items-center gap-1.5 rounded-full border font-medium transition-all active:scale-[.96]',
        size === 'md' ? 'px-3.5 py-2 text-[13.5px]' : 'px-3 py-1.5 text-[12.5px]',
        faol
          ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
          : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700'
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {faol ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  )
}

/** "Tip" — Dilshod Mannopov uslubidagi maslahat bloki */
function Maslahat({ matnlar }) {
  const [idx, setIdx] = useState(0)
  const matn = matnlar[idx % matnlar.length]
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Ustoz maslahati</p>
          <p key={idx} className="mt-1 animate-fadeIn text-[13.5px] leading-relaxed text-amber-950/90">
            {matn}
          </p>
        </div>
        {matnlar.length > 1 ? (
          <button
            type="button"
            onClick={() => setIdx((i) => i + 1)}
            aria-label="Keyingi maslahat"
            className="no-tap-highlight shrink-0 rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-100 active:scale-90"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Iqtibos paneli */
function Iqtibos({ iqtibos }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 text-white">
      <Quote className="absolute -right-3 -top-3 h-20 w-20 text-white/5" />
      <p className="relative text-[14.5px] font-medium italic leading-relaxed text-slate-100">
        “{iqtibos.matn}”
      </p>
      <p className="relative mt-2.5 text-[12px] font-semibold uppercase tracking-wider text-indigo-300">
        {iqtibos.muallif}
      </p>
    </div>
  )
}

/** Karta (bo'lim konteyner) */
function Karta({ children, className }) {
  return (
    <div
      className={cx(
        'rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-card backdrop-blur-sm sm:p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Asosiy tugma */
function Tugma({ children, onClick, variant = 'primary', Icon, disabled, className, type = 'button', spin, ...rest }) {
  const uslublar = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow hover:from-indigo-500 hover:to-violet-500',
    ghost: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    danger: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'no-tap-highlight inline-flex min-h-[46px] select-none items-center justify-center gap-2 rounded-2xl px-5 text-[14.5px] font-semibold transition-all active:scale-[.97]',
        uslublar[variant],
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...rest}
    >
      {Icon ? <Icon className={cx('h-[18px] w-[18px]', spin && 'animate-spin')} /> : null}
      {children}
    </button>
  )
}

/** Toast / ogohlantirish oynasi */
function Ogohlantirish({ xatolar, onClose }) {
  if (!xatolar || xatolar.length === 0) return null
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-2.5 sm:px-6">
      <div className="animate-slideDown rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-[3px] h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-rose-900">Bu bosqich hali to‘liq emas</p>
            {/* Ro'yxat balandligi cheklangan — panel ekranni bosib qolmasligi uchun */}
            <ul className="thin-scroll mt-1 max-h-[22vh] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
              {xatolar.map((x, i) => (
                <li key={i} className="flex gap-1.5 text-[12px] leading-snug text-rose-800/85">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="no-tap-highlight -mr-1 shrink-0 rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-100 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Qisqa xabar (saqlandi, nusxalandi...) */
function Xabar({ matn }) {
  if (!matn) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+12px)] z-[60] flex justify-center px-4">
      <div className="animate-pop rounded-full bg-slate-900/95 px-4 py-2 text-[13px] font-semibold text-white shadow-2xl backdrop-blur">
        {matn}
      </div>
    </div>
  )
}

/* ==========================================================================
 *  5. HEADER + PROGRESS STEPPER
 * ========================================================================== */

function Stepper({ bosqich, foizlar, onSelect, tugallangan }) {
  return (
    <nav aria-label="Bosqichlar" className="thin-scroll -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
      <ol className="flex min-w-max items-stretch gap-2 sm:min-w-0 sm:gap-3">
        {BOSQICHLAR.map((b) => {
          const foiz = foizlar[b.id - 1]
          const tugadi = tugallangan.includes(b.id)
          const faol = bosqich === b.id
          return (
            <li key={b.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                className={cx(
                  'no-tap-highlight group relative flex h-full w-[168px] flex-col justify-between gap-2 overflow-hidden rounded-2xl border p-3 text-left transition-all active:scale-[.98] sm:w-full',
                  faol
                    ? 'border-indigo-300 bg-white shadow-card ring-2 ring-indigo-500/15'
                    : 'border-slate-200/80 bg-white/70 hover:border-indigo-200 hover:bg-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold transition-colors',
                      tugadi
                        ? 'bg-emerald-500 text-white'
                        : faol
                          ? `bg-gradient-to-br ${b.rang} text-white`
                          : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {tugadi ? <Check className="h-4 w-4" /> : b.id}
                  </span>
                  <span
                    className={cx(
                      'truncate text-[12.5px] font-bold',
                      faol ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {b.qisqa}
                  </span>
                </div>
                <p
                  className={cx(
                    'line-clamp-2 text-[11.5px] leading-snug',
                    faol ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {b.nom}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cx(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      foiz === 100 ? 'bg-emerald-500' : `bg-gradient-to-r ${b.rang}`
                    )}
                    style={{ width: `${foiz}%` }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Header({ umumiyFoiz, saqlanganVaqt, onHome, boshSahifada, malumotBor = true }) {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Brend — bosilsa bosh sahifaga qaytadi */}
          <button
            type="button"
            onClick={onHome}
            aria-label="Bosh sahifaga qaytish"
            className="no-tap-highlight flex min-w-0 items-center gap-3 rounded-2xl text-left transition active:scale-[.98]"
          >
            <span className="grid h-11 w-11 shrink-0 animate-floaty place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-glow">
              <Target className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-[19px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                Maqsad qo‘yish
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500 sm:text-[13.5px]">
                Yurakni jizillatadigan buyuk maqsadlar sari <span className="font-semibold text-indigo-600">4 qadam</span>
              </span>
            </span>
          </button>

          {!boshSahifada ? (
            <button
              type="button"
              onClick={onHome}
              aria-label="Bosh sahifa"
              title="Bosh sahifa"
              className="no-tap-highlight ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-soft backdrop-blur transition hover:border-indigo-300 hover:text-indigo-600 active:scale-95"
            >
              <Home className="h-[18px] w-[18px]" />
            </button>
          ) : null}
        </div>

        {/* Hali hech narsa kiritilmagan bo'lsa, "6% · Saqlandi" chalg'itadi — ko'rsatmaymiz */}
        {malumotBor ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-soft backdrop-blur">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(umumiyFoiz / 100) * 97.4} 97.4`}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-[10.5px] font-extrabold tabular-nums text-slate-700">
              {umumiyFoiz}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-slate-800">Umumiy tayyorlik</p>
            <p className="flex items-center gap-1 text-[11.5px] text-slate-400">
              <Save className="h-3 w-3" />
              {saqlanganVaqt ? `Saqlandi ${saqlanganVaqt}` : 'Avtomatik saqlanadi'}
            </p>
          </div>
        </div>
        ) : null}
      </div>
    </header>
  )
}

/* ==========================================================================
 *  6. 1-QADAM — Yurakni jizillatuvchi maqsadni tanlash
 * ========================================================================== */

function Qadam1({ d, set }) {
  const jz = JIZILLASH[Math.min(Math.max(d.jizillash, 1), 10) - 1]

  return (
    <div className="space-y-4 sm:space-y-5">
      <Iqtibos iqtibos={IQTIBOSLAR[0]} />

      {/* Soha tanlash */}
      <Karta>
        <BolimSarlavha
          Icon={Rocket}
          sarlavha="Maqsadingiz qaysi sohaga tegishli?"
          izoh="Bitta asosiy sohani tanlang. Bu maqsadingizni yanada aniqroq shakllantirishga yordam beradi."
          majburiy
        />
        <div className="flex flex-wrap gap-2">
          {SOHALAR.map((s) => (
            <Chip
              key={s.id}
              Icon={s.Icon}
              faol={d.soha === s.nom}
              onClick={() => set({ soha: d.soha === s.nom ? '' : s.nom })}
            >
              {s.nom}
            </Chip>
          ))}
        </div>
      </Karta>

      {/* Maqsad matni */}
      <Karta>
        <BolimSarlavha
          Icon={Flame}
          sarlavha="Yurakni jizillatuvchi asosiy maqsadingiz"
          izoh="Erishish imkonsizdek tuyuladigan, lekin sizni chin dildan to‘lqinlantiradigan BITTA maqsadni yozing. Iloji boricha aniq bo‘lsin."
          majburiy
        />
        <MatnMaydoni
          value={d.maqsad}
          onChange={(v) => set({ maqsad: v })}
          min={15}
          rows={4}
          placeholder="Masalan: 2028-yilning 31-dekabriga qadar O‘zbekistonda 500 kishiga ish beradigan, yillik aylanmasi $5 mln bo‘lgan ishlab chiqarish korxonasini qurish."
        />
        <div className="mt-3">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
            Ilhom uchun namunalar (bosing va tahrirlang)
          </p>
          <div className="flex flex-wrap gap-2">
            {MAQSAD_NAMUNALAR.map((n) => (
              <Chip key={n} size="sm" faol={false} onClick={() => set({ maqsad: n })}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </Karta>

      {/* His-tuyg'u tekshiruvi */}
      <Karta className="bg-gradient-to-br from-white to-orange-50/40">
        <BolimSarlavha
          Icon={Heart}
          sarlavha="Bu maqsad yuragingizni qanchalik jizillatmoqda?"
          izoh="Rostgo‘y bo‘ling. Agar baho 7 dan past bo‘lsa — bu maqsad hali “sizniki” emas, uni kattalashtiring."
          majburiy
        />

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span key={jz.emoji} className="animate-pop text-5xl leading-none sm:text-6xl">
              {jz.emoji}
            </span>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tabular-nums text-slate-900">{d.jizillash}</span>
                <span className="text-base font-bold text-slate-400">/10</span>
              </div>
              <p className="text-[13px] font-semibold text-indigo-600">{jz.label}</p>
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={d.jizillash}
            onChange={(e) => set({ jizillash: Number(e.target.value) })}
            className="range-fire"
            style={{
              background: `linear-gradient(90deg, #f97316 0%, #ef4444 ${(d.jizillash / 10) * 100}%, #e2e8f0 ${
                (d.jizillash / 10) * 100
              }%, #e2e8f0 100%)`,
            }}
            aria-label="His-tuyg'u darajasi"
          />

          <div className="mt-3 flex justify-between px-0.5">
            {JIZILLASH.map((j, i) => (
              <button
                key={i}
                type="button"
                onClick={() => set({ jizillash: i + 1 })}
                aria-label={`${i + 1} — ${j.label}`}
                className={cx(
                  'no-tap-highlight rounded-lg text-lg transition-all active:scale-90 sm:text-xl',
                  d.jizillash === i + 1 ? 'scale-125 opacity-100' : 'opacity-30 hover:opacity-70'
                )}
              >
                {j.emoji}
              </button>
            ))}
          </div>

          {d.jizillash < 7 ? (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Baho past. Maqsadni kattalashtiring yoki chinakam xohishingizni toping — “sovuq” maqsad sizni
              qiyinchilikda tashlab ketadi.
            </p>
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[12.5px] leading-relaxed text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Ajoyib! Bu maqsad sizni harakatga undaydigan darajada kuchli.
            </p>
          )}
        </div>
      </Karta>

      {/* Nega aynan shu maqsad */}
      <Karta>
        <BolimSarlavha
          Icon={Sparkles}
          sarlavha="Nima uchun aynan shu maqsad hozir siz uchun o‘ta muhim?"
          izoh="Ichki sababingizni yozing. Mana shu javob qiyin kunlarda sizni oyoqqa turg‘izadi."
          majburiy
        />
        <MatnMaydoni
          value={d.nega}
          onChange={(v) => set({ nega: v })}
          min={15}
          rows={4}
          placeholder="Masalan: Chunki men ota-onamning mehnatini oqlamoqchiman va farzandlarim menga qaraganda kuchliroq startdan boshlashini xohlayman..."
        />
      </Karta>

      <Maslahat matnlar={MASLAHATLAR[0]} />
    </div>
  )
}

/* ==========================================================================
 *  7. 2-QADAM — Qadriyat va manfaat (filtr)
 * ========================================================================== */

function Qadam2({ d, set }) {
  const [yangiQadriyat, setYangiQadriyat] = useState('')

  const almashtir = (q) =>
    set({
      qadriyatlar: d.qadriyatlar.includes(q)
        ? d.qadriyatlar.filter((x) => x !== q)
        : [...d.qadriyatlar, q],
    })

  const qoshish = () => {
    const v = yangiQadriyat.trim()
    if (!v) return
    if (!d.qadriyatlar.includes(v)) set({ qadriyatlar: [...d.qadriyatlar, v] })
    setYangiQadriyat('')
  }

  const qoshimchalar = d.qadriyatlar.filter((q) => !QADRIYATLAR.includes(q))

  return (
    <div className="space-y-4 sm:space-y-5">
      <Iqtibos iqtibos={IQTIBOSLAR[1]} />

      {/* Qadriyatlar */}
      <Karta>
        <BolimSarlavha
          Icon={Shield}
          sarlavha="Bu maqsad qaysi qadriyatlaringizga xizmat qiladi?"
          izoh="Kamida 2 tasini tanlang. Qadriyatlaringizga zid maqsad sizni baxtli qilmaydi."
          majburiy
        />
        <div className="flex flex-wrap gap-2">
          {QADRIYATLAR.map((q) => (
            <Chip key={q} faol={d.qadriyatlar.includes(q)} onClick={() => almashtir(q)}>
              {q}
            </Chip>
          ))}
          {qoshimchalar.map((q) => (
            <span
              key={q}
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-[13.5px] font-medium text-white shadow-sm"
            >
              {q}
              <button
                type="button"
                onClick={() => almashtir(q)}
                aria-label={`${q} ni olib tashlash`}
                className="no-tap-highlight rounded-full p-0.5 transition hover:bg-white/20 active:scale-90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Kirit
            value={yangiQadriyat}
            onChange={setYangiQadriyat}
            placeholder="O‘z qadriyatingizni qo‘shing..."
            Icon={Plus}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                qoshish()
              }
            }}
          />
          <Tugma variant="soft" Icon={Plus} onClick={qoshish} disabled={!yangiQadriyat.trim()}>
            Qo‘shish
          </Tugma>
        </div>

        {d.qadriyatlar.length > 0 ? (
          <p className="mt-3 text-[12.5px] text-slate-500">
            Tanlangan: <span className="font-bold text-indigo-600">{d.qadriyatlar.length}</span> ta qadriyat
          </p>
        ) : null}
      </Karta>

      {/* Boshqalarga manfaat */}
      <Karta>
        <BolimSarlavha
          Icon={Users}
          sarlavha="Siz bu maqsadga erishsangiz, kimlar va qanday yaxshilik ko‘radi?"
          izoh="Oilangiz, jamoangiz, mijozlaringiz, mahallangiz, sohangiz... Iloji boricha aniq ism va raqamlar bilan yozing."
          majburiy
        />
        <MatnMaydoni
          value={d.manfaat}
          onChange={(v) => set({ manfaat: v })}
          min={15}
          rows={5}
          placeholder="Masalan: 1) Oilam — moliyaviy xavotirdan xalos bo‘ladi. 2) 50 ta yosh mutaxassis — barqaror ish o‘rniga ega bo‘ladi. 3) Mijozlarim — arzonroq va sifatliroq mahsulot oladi..."
        />
      </Karta>

      {/* Tramplin */}
      <Karta className="bg-gradient-to-br from-white to-indigo-50/40">
        <BolimSarlavha
          Icon={Link2}
          sarlavha="Tramplin effekti"
          izoh="Bu maqsad kelajakdagi qaysi undan ham KATTAROQ maqsadingiz uchun ko‘prik bo‘ladi?"
          majburiy
        />
        <MatnMaydoni
          value={d.tramplin}
          onChange={(v) => set({ tramplin: v })}
          min={10}
          rows={4}
          placeholder="Masalan: Bu korxona menga ishlab chiqarish tajribasi va kapital beradi — keyin butun mintaqaga eksport qiladigan xolding qurish uchun asos bo‘ladi."
        />
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50/80 p-3 text-[12.5px] leading-relaxed text-indigo-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          Har bir maqsad — pog‘ona. Agar bu maqsad hech qayerga olib bormasa, u sizning yo‘lingizdagi
          to‘xtash bo‘lib qoladi.
        </div>
      </Karta>

      <Maslahat matnlar={MASLAHATLAR[1]} />
    </div>
  )
}

/* ==========================================================================
 *  8. 3-QADAM — 10 ta qadam va "Straxovka"
 * ========================================================================== */

function QadamKarta({ q, ochiq, onToggle, onChange, onKeyingi }) {
  const toliq = notBosh(q.nom) && notBosh(q.straxovkaA)
  const qisman = notBosh(q.nom) && !toliq
  // Bajarilmagan qadamning muddati o'tib ketgan bo'lsa — ogohlantiramiz
  const kechikkan = !q.bajarildi && muddatOtgan(q.muddat)

  return (
    <div
      className={cx(
        'overflow-hidden rounded-2xl border transition-all',
        ochiq
          ? 'border-indigo-300 bg-white shadow-card ring-2 ring-indigo-500/10'
          : 'border-slate-200/80 bg-white/70 hover:border-indigo-200'
      )}
    >
      {/* Sarlavha qatori */}
      <button
        type="button"
        onClick={onToggle}
        className="no-tap-highlight flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[.995] sm:p-4"
      >
        <span
          className={cx(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold transition-colors',
            toliq
              ? 'bg-emerald-500 text-white'
              : qisman
                ? 'bg-amber-400 text-white'
                : ochiq
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                  : 'bg-slate-100 text-slate-500'
          )}
        >
          {toliq ? <Check className="h-4 w-4" /> : q.raqam}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cx(
              'block truncate text-[14px] font-semibold',
              notBosh(q.nom) ? 'text-slate-900' : 'text-slate-400'
            )}
          >
            {notBosh(q.nom) ? q.nom : `${q.raqam}-qadam nomini kiriting...`}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-slate-400">
            {notBosh(q.muddat) ? (
              <span
                className={cx(
                  'inline-flex items-center gap-1',
                  kechikkan && 'font-semibold text-rose-500'
                )}
              >
                <Calendar className="h-3 w-3" />
                {sanaFormat(q.muddat)}
                {kechikkan ? ' · muddat o‘tdi' : ''}
              </span>
            ) : null}
            {notBosh(q.straxovkaA) ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Shield className="h-3 w-3" /> Straxovka A
              </span>
            ) : null}
            {notBosh(q.straxovkaB) ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Shield className="h-3 w-3" /> B
              </span>
            ) : null}
          </span>
        </span>

        <ChevronDown
          className={cx(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300',
            ochiq && 'rotate-180'
          )}
        />
      </button>

      {/* Ochiladigan tana */}
      {ochiq ? (
        <div className="animate-slideDown space-y-4 border-t border-slate-100 p-3.5 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-slate-600">
                Qadam nomi <span className="text-rose-500">*</span>
              </label>
              <Kirit
                value={q.nom}
                onChange={(v) => onChange({ nom: v })}
                placeholder={`Masalan: ${QADAM_NAMUNALARI[q.raqam - 1]}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-slate-600">Bajarish muddati</label>
              <Kirit
                type="date"
                value={q.muddat}
                onChange={(v) => onChange({ muddat: v })}
                Icon={Calendar}
                min={ENG_ERTA}
                max={ENG_KECH}
              />
              {kechikkan ? (
                <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-rose-600">
                  <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                  Muddat o‘tib ketgan — sanani yangilang yoki qadamni bajarilgan deb belgilang.
                </p>
              ) : null}
            </div>
          </div>

          {!notBosh(q.nom) ? (
            <button
              type="button"
              onClick={() => onChange({ nom: QADAM_NAMUNALARI[q.raqam - 1] })}
              className="no-tap-highlight inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Namunani qo‘yish: “{QADAM_NAMUNALARI[q.raqam - 1]}”
            </button>
          ) : null}

          {/* Straxovka A */}
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <p className="text-[12.5px] font-bold text-indigo-900">
                Straxovka A <span className="text-rose-500">*</span>
              </p>
            </div>
            <p className="mb-2 text-[12px] leading-relaxed text-indigo-800/70">
              Agar ushbu qadamda kutilmagan to‘siq chiqsa, nima qilaman?
            </p>
            <textarea
              value={q.straxovkaA}
              onChange={(e) => onChange({ straxovkaA: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="Masalan: Agar investor topilmasa, o‘z jamg‘armamdan 30% ni ishga solaman va sherik qidiraman."
              className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {/* Straxovka B */}
          <div className="rounded-2xl border border-violet-200/70 bg-violet-50/50 p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <p className="text-[12.5px] font-bold text-violet-900">Straxovka B</p>
            </div>
            <p className="mb-2 text-[12px] leading-relaxed text-violet-800/70">
              Agar birinchi yechim ham ish bermasa, ikkinchi zaxira rejam qanday?
            </p>
            <textarea
              value={q.straxovkaB}
              onChange={(e) => onChange({ straxovkaB: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="Masalan: Loyihani kichikroq formatda ishga tushiraman va birinchi foydadan qayta investitsiya qilaman."
              className="w-full rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="no-tap-highlight inline-flex cursor-pointer select-none items-center gap-2 text-[12.5px] font-medium text-slate-600">
              <input
                type="checkbox"
                checked={q.bajarildi}
                onChange={(e) => onChange({ bajarildi: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Bu qadam allaqachon bajarilgan
            </label>
            {q.raqam < QADAMLAR_SONI ? (
              <Tugma variant="soft" Icon={ArrowRight} onClick={onKeyingi} className="!min-h-[40px] !px-4 !text-[13px]">
                Keyingi qadam
              </Tugma>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Qadam3({ d, set }) {
  const [ochiq, setOchiq] = useState('q1')

  const yangila = (id, patch) =>
    set({ qadamlar: d.qadamlar.map((q) => (q.id === id ? { ...q, ...patch } : q)) })

  const toliqlar = d.qadamlar.filter((q) => notBosh(q.nom) && notBosh(q.straxovkaA)).length
  const nomlilar = d.qadamlar.filter((q) => notBosh(q.nom)).length

  return (
    <div className="space-y-4 sm:space-y-5">
      <Iqtibos iqtibos={IQTIBOSLAR[2]} />

      {/* Yig'ma holat */}
      <Karta className="bg-gradient-to-br from-white to-violet-50/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900">Yo‘l xaritangiz</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Maqsadni {QADAMLAR_SONI} ta aniq qadamga bo‘ling. Har biriga muddat va straxovka qo‘ying.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold tabular-nums text-indigo-600">{nomlilar}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Yozilgan</p>
            </div>
            <div className="h-9 w-px bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-extrabold tabular-nums text-emerald-600">{toliqlar}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Straxovkali</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5">
          {d.qadamlar.map((q) => {
            const toliq = notBosh(q.nom) && notBosh(q.straxovkaA)
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setOchiq(q.id)}
                aria-label={`${q.raqam}-qadamga o'tish`}
                className={cx(
                  'no-tap-highlight h-2 flex-1 rounded-full transition-all active:scale-90',
                  toliq
                    ? 'bg-emerald-500'
                    : notBosh(q.nom)
                      ? 'bg-amber-400'
                      : ochiq === q.id
                        ? 'bg-indigo-400'
                        : 'bg-slate-200'
                )}
              />
            )
          })}
        </div>
      </Karta>

      {/* Qadamlar ro'yxati */}
      <div className="space-y-2.5">
        {d.qadamlar.map((q) => (
          <QadamKarta
            key={q.id}
            q={q}
            ochiq={ochiq === q.id}
            onToggle={() => setOchiq(ochiq === q.id ? '' : q.id)}
            onChange={(patch) => yangila(q.id, patch)}
            onKeyingi={() => setOchiq(`q${q.raqam + 1}`)}
          />
        ))}
      </div>

      <Maslahat matnlar={MASLAHATLAR[2]} />
    </div>
  )
}

/* ==========================================================================
 *  9. 4-QADAM — O'lchov va aniq parametrlar
 * ========================================================================== */

function Qadam4({ d, set }) {
  const [yangiBelgi, setYangiBelgi] = useState('')

  const belgiQosh = (matn) => {
    const v = (matn ?? yangiBelgi).trim()
    if (!v) return
    set({ belgilar: [...d.belgilar, { id: uid(), matn: v, done: false }] })
    if (matn === undefined) setYangiBelgi('')
  }

  const belgiOchir = (id) => set({ belgilar: d.belgilar.filter((b) => b.id !== id) })

  const belgiAlmash = (id) =>
    set({ belgilar: d.belgilar.map((b) => (b.id === id ? { ...b, done: !b.done } : b)) })

  const kpiQosh = (namuna) =>
    set({
      kpilar: [
        ...d.kpilar,
        { id: uid(), nom: namuna?.nom || '', qiymat: '', birlik: namuna?.birlik || '', muddat: '' },
      ],
    })

  const kpiYangila = (id, patch) =>
    set({ kpilar: d.kpilar.map((k) => (k.id === id ? { ...k, ...patch } : k)) })

  const kpiOchir = (id) => set({ kpilar: d.kpilar.filter((k) => k.id !== id) })

  const tanlanmaganNamunalar = BELGI_NAMUNALARI.filter(
    (n) => !d.belgilar.some((b) => b.matn === n)
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <Iqtibos iqtibos={IQTIBOSLAR[3]} />

      {/* Erishilganlik belgilari */}
      <Karta>
        <BolimSarlavha
          Icon={ListChecks}
          sarlavha="Maqsad amalga oshganini qaysi aniq faktdan bilasiz?"
          izoh="Ashyoviy, ko‘rish va ushlash mumkin bo‘lgan dalillarni yozing. Kamida 2 ta belgi qo‘shing."
          majburiy
        />

        {d.belgilar.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {d.belgilar.map((b) => (
              <li
                key={b.id}
                className={cx(
                  'flex animate-fadeUp items-start gap-3 rounded-2xl border p-3 transition-colors',
                  b.done ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'
                )}
              >
                <button
                  type="button"
                  onClick={() => belgiAlmash(b.id)}
                  aria-label="Belgilash"
                  className={cx(
                    'no-tap-highlight mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all active:scale-90',
                    b.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                  )}
                >
                  {b.done ? <Check className="h-4 w-4" /> : null}
                </button>
                <span
                  className={cx(
                    'min-w-0 flex-1 text-[14px] leading-relaxed',
                    b.done ? 'text-emerald-900' : 'text-slate-700'
                  )}
                >
                  {b.matn}
                </span>
                <button
                  type="button"
                  onClick={() => belgiOchir(b.id)}
                  aria-label="O'chirish"
                  className="no-tap-highlight shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Kirit
            value={yangiBelgi}
            onChange={setYangiBelgi}
            placeholder="Masalan: Bank hisobimda 500 mln so‘m turibdi"
            Icon={BadgeCheck}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                belgiQosh()
              }
            }}
          />
          <Tugma variant="soft" Icon={Plus} onClick={() => belgiQosh()} disabled={!yangiBelgi.trim()}>
            Qo‘shish
          </Tugma>
        </div>

        {tanlanmaganNamunalar.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Tayyor variantlar
            </p>
            <div className="flex flex-wrap gap-2">
              {tanlanmaganNamunalar.map((n) => (
                <Chip key={n} size="sm" faol={false} Icon={Plus} onClick={() => belgiQosh(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </Karta>

      {/* KPI / Metrikalar */}
      <Karta>
        <BolimSarlavha
          Icon={Ruler}
          sarlavha="Aniq KPI va o‘lchanadigan mezonlar"
          izoh="Raqamlar, muddatlar va mezonlar. “Ko‘p pul” emas — “oyiga 120 mln so‘m, 2027-yil dekabrigacha”."
          majburiy
        />

        {d.kpilar.length > 0 ? (
          <div className="mb-4 space-y-2.5">
            {d.kpilar.map((k, i) => (
              <div
                key={k.id}
                className="animate-fadeUp rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    <TrendingUp className="h-3 w-3" /> KPI {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => kpiOchir(k.id)}
                    aria-label="O'chirish"
                    className="no-tap-highlight rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Kirit
                    value={k.nom}
                    onChange={(v) => kpiYangila(k.id, { nom: v })}
                    placeholder="Metrika nomi (masalan: Oylik daromad)"
                  />
                  <div className="grid grid-cols-[1fr_110px] gap-2.5">
                    <Kirit
                      value={k.qiymat}
                      onChange={(v) => kpiYangila(k.id, { qiymat: v })}
                      placeholder="Maqsad qiymati"
                      inputMode="numeric"
                    />
                    <Kirit
                      value={k.birlik}
                      onChange={(v) => kpiYangila(k.id, { birlik: v })}
                      placeholder="birlik"
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <Kirit
                    type="date"
                    value={k.muddat}
                    onChange={(v) => kpiYangila(k.id, { muddat: v })}
                    Icon={Calendar}
                    min={ENG_ERTA}
                    max={ENG_KECH}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Tugma variant="soft" Icon={Plus} onClick={() => kpiQosh()} className="!min-h-[42px] !px-4 !text-[13px]">
            Bo‘sh KPI qo‘shish
          </Tugma>
          {KPI_NAMUNALARI.filter((n) => !d.kpilar.some((k) => k.nom === n.nom)).map((n) => (
            <Chip key={n.nom} size="sm" faol={false} Icon={Plus} onClick={() => kpiQosh(n)}>
              {n.nom}
            </Chip>
          ))}
        </div>
      </Karta>

      {/* Qasamyod */}
      <Karta className="bg-gradient-to-br from-white to-emerald-50/40">
        <BolimSarlavha
          Icon={Award}
          sarlavha="Qasamyod — o‘zingizga bergan va’dangiz"
          izoh="Ovoz chiqarib o‘qing va yozing. Bu — maqsadning muhri."
          majburiy
        />

        <MatnMaydoni
          value={d.qasamyod}
          onChange={(v) => set({ qasamyod: v })}
          min={20}
          rows={5}
          placeholder="Men, ........, ushbu maqsadni qo‘yar ekanman, o‘zimga so‘z beraman: qanday to‘siq bo‘lmasin, chekinmayman. Har kuni kamida bitta qadam tashlayman va oyiga bir marta natijamni tekshiraman..."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-slate-600">Ism-familiya (imzo)</label>
            <Kirit
              value={d.imzo}
              onChange={(v) => set({ imzo: v })}
              placeholder="Ism Familiya"
              Icon={PenLine}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-slate-600">Sana</label>
            {/* Qasamyod bugun yoki undan oldin imzolanadi — kelajak sanasi xato */}
            <Kirit
              type="date"
              value={d.sana}
              onChange={(v) => set({ sana: v })}
              Icon={Calendar}
              min={ENG_ERTA}
              max={bugun()}
            />
          </div>
        </div>

        <label
          className={cx(
            'no-tap-highlight mt-4 flex cursor-pointer select-none items-start gap-3 rounded-2xl border p-4 transition-all active:scale-[.99]',
            d.tasdiq
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 bg-white hover:border-emerald-200'
          )}
        >
          <input
            type="checkbox"
            checked={d.tasdiq}
            onChange={(e) => set({ tasdiq: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span
            className={cx(
              'text-[13.5px] font-semibold leading-relaxed',
              d.tasdiq ? 'text-emerald-900' : 'text-slate-700'
            )}
          >
            Men ushbu maqsadni chin dildan qabul qilaman va unga erishish uchun mas’uliyatni to‘liq
            o‘z zimmamga olaman.
          </span>
        </label>
      </Karta>

      <Maslahat matnlar={MASLAHATLAR[3]} />
    </div>
  )
}

/* ==========================================================================
 *  10. 5-BOSQICH — "Strategik maqsad pasporti"
 *
 *  Dizayn tili: haqiqiy pasport. Muqova (to'q ko'k + oltin gerb), ma'lumot
 *  sahifasi, mashina o'qiydigan qator (MRZ) va tasdiq muhri. Har bir element
 *  haqiqiy ma'lumotni kodlaydi — bezak uchun emas:
 *    • Pasport № — yaratilgan vaqtdan, shuning uchun hech qachon o'zgarmaydi
 *    • MRZ — soha, yil, qadamlar soni, jizillash va KPI soni
 *    • Muhr — faqat qasamyod tasdiqlangan bo'lsa bosiladi
 * ========================================================================== */

/** Pasport raqami — yaratilgan vaqtdan olinadi, shuning uchun barqaror */
function pasportRaqami(meta) {
  const d = new Date(meta?.yaratilgan || Date.now())
  if (Number.isNaN(d.getTime())) return 'MQ-000000-0000'
  const p2 = (n) => String(n).padStart(2, '0')
  return `MQ-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(
    d.getHours()
  )}${p2(d.getMinutes())}`
}

/** Eng kech muddat — qadamlar va KPI'lar orasidan ("YYYY-MM-DD" tartiblanadi) */
function yakuniyMuddat(data) {
  const sanalar = [
    ...data.qadam3.qadamlar.map((q) => q.muddat),
    ...data.qadam4.kpilar.map((k) => k.muddat),
  ].filter((s) => sanaQismlari(s))
  return sanalar.length ? sanalar.sort()[sanalar.length - 1] : ''
}

/** Mashina o'qiydigan qator: faqat A–Z, 0–9; qolgani "<" bilan to'ldiriladi */
function mrzMatn(s, uzunlik) {
  const t = String(s || '')
    .toUpperCase()
    .replace(/[‘’'`ʻʼ]/g, '')
    .replace(/[^A-Z0-9<]+/g, '<')
  return (t + '<'.repeat(uzunlik)).slice(0, uzunlik)
}

/** Oltin gerb — muqova belgisi */
function Gerb({ size = 46 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 30% 28%, #f6e3a6 0%, #d4a853 52%, #a8792f 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,.14), 0 10px 26px -10px rgba(212,168,83,.8)',
      }}
    >
      <span
        className="grid place-items-center rounded-full"
        style={{ width: size - 9, height: size - 9, border: '1.5px solid rgba(30,27,75,.38)' }}
      >
        <Target style={{ width: size * 0.46, height: size * 0.46 }} className="text-[#1e1b4b]" strokeWidth={2.3} />
      </span>
    </span>
  )
}

/** Muqovadagi ma'lumot katagi */
function MuqovaMaydon({ Icon, label, value, mono }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[.18em] text-[#e8c97a]/85">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className={cx('mt-1 truncate text-[13px] font-semibold text-white', mono && 'font-mono tracking-wide')}>
        {value}
      </dd>
    </div>
  )
}

/** Muqova — hujjatning yuzi */
function PasportMuqova({ data, jz, qadamlar, kpilar, raqam, muddat }) {
  const d1 = data.qadam1
  const d4 = data.qadam4
  const yil = (sanaQismlari(d4.sana) || sanaQismlari(bugun())).yil
  const mrz1 = mrzMatn(`P<UZB<MAQSAD<<${d1.soha}`, 36)
  const mrz2 = mrzMatn(
    `${raqam.replace(/-/g, '')}<${yil}<${qadamlar.length}QADAM<${d1.jizillash}<10<${kpilar.length}KPI`,
    36
  )

  return (
    <section
      className="relative overflow-hidden rounded-[28px] text-white shadow-card"
      style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #2e1065 58%, #1e1b4b 100%)' }}
    >
      {/* Oltin nur */}
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full opacity-[.28] blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #d4a853, transparent)' }}
      />
      {/* Gilyosh naqshi — pasport qog'ozidagi konsentrik halqalar */}
      <svg
        className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 opacity-[.07]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="#fff"
        strokeWidth=".6"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx="100" cy="100" r={14 + i * 6.5} />
        ))}
      </svg>

      <div className="relative p-5 sm:p-7">
        <div className="flex items-center gap-3.5">
          <Gerb />
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[.26em] text-[#e8c97a]">
              O‘zbekiston · Ustoz-shogird
            </p>
            <p className="mt-1 text-[12.5px] font-bold uppercase tracking-[.14em] text-white/90">
              Strategik maqsad pasporti
            </p>
          </div>
        </div>

        {/* Maqsad — hujjatning yuragi */}
        <h2 className="font-display mt-6 text-[24px] font-semibold leading-[1.22] tracking-[-.01em] text-white sm:text-[31px]">
          {notBosh(d1.maqsad) ? d1.maqsad : 'Maqsad hali yozilmagan'}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {notBosh(d1.soha) ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold">
              {d1.soha}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold">
            <span className="text-[14px] leading-none">{jz.emoji}</span>
            {d1.jizillash}/10 · {jz.label}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-white/10 pt-4 sm:grid-cols-4">
          <MuqovaMaydon Icon={Hash} label="Pasport №" value={raqam} mono />
          <MuqovaMaydon Icon={Fingerprint} label="Egasi" value={notBosh(d4.imzo) ? d4.imzo : '—'} />
          <MuqovaMaydon Icon={Calendar} label="Berilgan" value={sanaFormat(d4.sana)} />
          <MuqovaMaydon Icon={Flag} label="Yakuniy muddat" value={muddat ? sanaFormat(muddat) : '—'} />
        </dl>

        {/* MRZ — mashina o'qiydigan qator */}
        <div
          className="mt-5 overflow-hidden whitespace-nowrap rounded-lg bg-black/25 px-3 py-2 font-mono text-[9.5px] leading-[1.65] tracking-[.13em] text-white/55"
          aria-hidden="true"
        >
          <div>{mrz1}</div>
          <div>{mrz2}</div>
        </div>
      </div>
    </section>
  )
}

/** "Bir qarashda" — to'rtta asosiy raqam */
function Kartacha({ Icon, rang, qiymat, label, izoh, foiz }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-soft">
      <span className={cx('grid h-8 w-8 place-items-center rounded-xl', rang)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2.5 font-mono text-[21px] font-bold leading-none tracking-tight text-slate-900">{qiymat}</p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p>
      {typeof foiz === 'number' ? (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${foiz}%` }} />
        </div>
      ) : izoh ? (
        <p className="mt-1 truncate text-[11.5px] text-slate-500">{izoh}</p>
      ) : null}
    </div>
  )
}

function BirQarashda({ jz, jizillash, qadamlar, bajarilgan, kpilar, muddat }) {
  const foiz = qadamlar.length ? Math.round((bajarilgan / qadamlar.length) * 100) : 0
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <Kartacha Icon={Flame} rang="bg-orange-50 text-orange-600" qiymat={`${jizillash}/10`} label="Jizillash" izoh={jz.label} />
      <Kartacha
        Icon={Milestone}
        rang="bg-emerald-50 text-emerald-600"
        qiymat={`${bajarilgan}/${qadamlar.length || QADAMLAR_SONI}`}
        label="Qadam bajarildi"
        foiz={foiz}
      />
      <Kartacha Icon={Ruler} rang="bg-sky-50 text-sky-600" qiymat={String(kpilar.length)} label="KPI mezoni" izoh="o‘lchanadigan" />
      <Kartacha
        Icon={Flag}
        rang="bg-violet-50 text-violet-600"
        qiymat={muddat ? String(sanaQismlari(muddat).yil) : '—'}
        label="Yakuniy muddat"
        izoh={muddat ? sanaFormat(muddat) : 'belgilanmagan'}
      />
    </div>
  )
}

/** Pasport bo'limi — ikonka, kichik sarlavha, tahrirlash */
function Bolim({ Icon, rang, eyebrow, sarlavha, onEdit, children, className }) {
  return (
    <section className={cx('rounded-3xl border border-slate-200/80 bg-white shadow-card', className)}>
      <header className="flex items-center gap-3 px-5 pt-5">
        <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', rang)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{eyebrow}</p>
          <h3 className="text-[16px] font-extrabold leading-snug text-slate-900">{sarlavha}</h3>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Tahrirlash"
            className="no-tap-highlight grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 active:scale-95"
          >
            <PenLine className="h-4 w-4" />
          </button>
        ) : null}
      </header>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  )
}

/** Bo'lim ichidagi kichik maydon */
function Qator({ Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-[.14em] text-slate-400">{label}</p>
        <div className="mt-1 text-[14px] leading-relaxed text-slate-800">{children}</div>
      </div>
    </div>
  )
}

const bosh = (v, alt = 'To‘ldirilmagan') =>
  notBosh(v) ? <span className="whitespace-pre-wrap">{v}</span> : <span className="italic text-slate-400">{alt}</span>

/** Tasdiq muhri */
function Muhr({ sana }) {
  return (
    <div
      aria-label="Tasdiqlangan"
      className="pointer-events-none shrink-0 origin-center select-none rounded-xl border-[3px] border-[#b91c1c]/80 px-3 py-1.5 text-center text-[#b91c1c] motion-safe:animate-stampIn motion-reduce:rotate-[-9deg]"
      style={{ boxShadow: 'inset 0 0 0 1.5px rgba(185,28,28,.45)', mixBlendMode: 'multiply' }}
    >
      <p className="text-[11.5px] font-black uppercase leading-none tracking-[.22em]">Tasdiqlangan</p>
      <p className="mt-1 font-mono text-[9px] leading-none tracking-[.16em]">{sana}</p>
    </div>
  )
}

/** Yo'l xaritasi — vaqt chizig'i */
function YolXaritasi({ qadamlar }) {
  if (qadamlar.length === 0) {
    return <p className="text-[14px] italic text-slate-400">Hali birorta qadam yozilmagan.</p>
  }
  return (
    <ol className="relative ml-4 border-l-2 border-slate-200 pl-6">
      {qadamlar.map((q) => {
        const kechikkan = !q.bajarildi && muddatOtgan(q.muddat)
        return (
          <li key={q.id} className="relative pb-5 last:pb-0">
            <span
              className={cx(
                'absolute -left-[41px] top-0 grid h-8 w-8 place-items-center rounded-full border-2 text-[12px] font-extrabold',
                q.bajarildi
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : kechikkan
                    ? 'border-rose-300 bg-white text-rose-600'
                    : 'border-indigo-200 bg-white text-indigo-700'
              )}
            >
              {q.bajarildi ? <Check className="h-4 w-4" strokeWidth={3} /> : q.raqam}
            </span>
            <p className={cx('text-[14.5px] font-bold leading-snug', q.bajarildi ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900')}>
              {q.nom}
            </p>
            {notBosh(q.muddat) ? (
              <p className={cx('mt-1 inline-flex items-center gap-1 font-mono text-[11.5px]', kechikkan ? 'font-bold text-rose-500' : 'text-slate-500')}>
                <Calendar className="h-3 w-3" />
                {sanaFormat(q.muddat)}
                {kechikkan ? ' · muddat o‘tdi' : ''}
              </p>
            ) : null}
            {notBosh(q.straxovkaA) || notBosh(q.straxovkaB) ? (
              <div className="mt-2 space-y-1.5">
                {notBosh(q.straxovkaA) ? (
                  <p className="flex gap-2 rounded-lg bg-indigo-50/80 px-2.5 py-2 text-[12.5px] leading-relaxed text-indigo-950">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    <span><b className="font-bold">A:</b> {q.straxovkaA}</span>
                  </p>
                ) : null}
                {notBosh(q.straxovkaB) ? (
                  <p className="flex gap-2 rounded-lg bg-violet-50/80 px-2.5 py-2 text-[12.5px] leading-relaxed text-violet-950">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span><b className="font-bold">B:</b> {q.straxovkaB}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function Pasport({
  data,
  onEdit,
  onQayta,
  onPdf,
  onPng,
  onPrint,
  onCopy,
  onTelegram,
  yuklanmoqda,
  telegram,
}) {
  const d1 = data.qadam1
  const d2 = data.qadam2
  const d3 = data.qadam3
  const d4 = data.qadam4
  const jz = JIZILLASH[Math.min(Math.max(d1.jizillash, 1), 10) - 1]
  const qadamlar = d3.qadamlar.filter((q) => notBosh(q.nom))
  const bajarilgan = qadamlar.filter((q) => q.bajarildi).length
  const belgilar = d4.belgilar.filter((b) => notBosh(b.matn))
  const kpilar = d4.kpilar.filter((k) => notBosh(k.nom))
  const raqam = pasportRaqami(data.meta)
  const muddat = yakuniyMuddat(data)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PasportMuqova data={data} jz={jz} qadamlar={qadamlar} kpilar={kpilar} raqam={raqam} muddat={muddat} />

      <BirQarashda jz={jz} jizillash={d1.jizillash} qadamlar={qadamlar} bajarilgan={bajarilgan} kpilar={kpilar} muddat={muddat} />

      {/* Eksport paneli */}
      <div className="no-print rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-card backdrop-blur sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-indigo-600" />
          <p className="text-[13.5px] font-bold text-slate-900">Pasportni saqlash va ulashish</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Tugma
            variant="primary"
            Icon={yuklanmoqda === 'pdf' ? Loader2 : Download}
            spin={yuklanmoqda === 'pdf'}
            onClick={onPdf}
            disabled={!!yuklanmoqda}
          >
            {yuklanmoqda === 'pdf' ? 'Tayyorlanmoqda...' : 'PDF yuklab olish'}
          </Tugma>
          <Tugma
            variant="dark"
            Icon={yuklanmoqda === 'png' ? Loader2 : Send}
            spin={yuklanmoqda === 'png'}
            onClick={onTelegram}
            disabled={!!yuklanmoqda}
          >
            {yuklanmoqda === 'png' ? 'Tayyorlanmoqda...' : 'Telegramga yuborish'}
          </Tugma>
          <Tugma variant="ghost" Icon={ImageIcon} onClick={onPng} disabled={!!yuklanmoqda}>
            Rasm sifatida saqlash
          </Tugma>
          <Tugma variant="ghost" Icon={Printer} onClick={onPrint} disabled={!!yuklanmoqda}>
            Chop etish
          </Tugma>
          <Tugma variant="ghost" Icon={Copy} onClick={onCopy} disabled={!!yuklanmoqda} className="sm:col-span-2">
            Matnni nusxalash
          </Tugma>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-[12.5px] leading-relaxed text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <span>
            {telegram ? (
              <>
                Siz Telegram ichida ochgansiz. Telegram ba’zan PDF yuklashni bloklaydi — bunday holatda
                pasport <span className="font-bold">avtomatik ravishda rasmga aylantiriladi</span>. Uni
                galereyaga saqlash yoki to‘g‘ridan-to‘g‘ri chatga yuborish mumkin.
              </>
            ) : (
              <>
                <span className="font-bold">“Telegramga yuborish”</span> pasportni rasm qilib tayyorlaydi
                va uni istalgan chatga jo‘natish imkonini beradi. PDF yuklanmagan taqdirda ham rasm
                varianti doim ishlaydi.
              </>
            )}
          </span>
        </p>
      </div>

      {/* 1 — Nima uchun */}
      <Bolim Icon={Flame} rang="bg-orange-50 text-orange-600" eyebrow="1-bosqich · Yurak" sarlavha="Nima uchun aynan shu maqsad?" onEdit={() => onEdit(1)}>
        <blockquote className="relative rounded-2xl bg-gradient-to-br from-orange-50/90 to-rose-50/50 py-4 pl-10 pr-4">
          <Quote className="absolute left-3.5 top-3.5 h-4 w-4 text-orange-300" />
          <p className="font-display text-[17px] leading-[1.6] text-slate-800">
            {notBosh(d1.nega) ? d1.nega : <span className="italic text-slate-400">To‘ldirilmagan</span>}
          </p>
        </blockquote>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl leading-none">{jz.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
              <span>Yurak jizillashi</span>
              <span className="font-mono text-slate-700">{d1.jizillash}/10</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${d1.jizillash * 10}%` }} />
            </div>
          </div>
        </div>
      </Bolim>

      {/* 2 — Qadriyat va manfaat */}
      <Bolim Icon={Heart} rang="bg-rose-50 text-rose-600" eyebrow="2-bosqich · Filtr" sarlavha="Qadriyat va manfaat" onEdit={() => onEdit(2)}>
        <div className="space-y-4">
          <Qator Icon={Heart} label="Qadriyatlar">
            {d2.qadriyatlar.length ? (
              <div className="flex flex-wrap gap-1.5">
                {d2.qadriyatlar.map((q) => (
                  <span key={q} className="rounded-full bg-rose-50 px-3 py-1 text-[12.5px] font-semibold text-rose-700 ring-1 ring-rose-100">
                    {q}
                  </span>
                ))}
              </div>
            ) : (
              bosh('')
            )}
          </Qator>
          <Qator Icon={Users} label="Kimlar manfaat ko‘radi">{bosh(d2.manfaat)}</Qator>
          <Qator Icon={Rocket} label="Tramplin — keyingi cho‘qqi">{bosh(d2.tramplin)}</Qator>
        </div>
      </Bolim>

      {/* 3 — Yo'l xaritasi */}
      <Bolim
        Icon={Milestone}
        rang="bg-indigo-50 text-indigo-600"
        eyebrow={`3-bosqich · ${bajarilgan}/${qadamlar.length || QADAMLAR_SONI} bajarildi`}
        sarlavha="Yo‘l xaritasi va straxovka"
        onEdit={() => onEdit(3)}
      >
        <YolXaritasi qadamlar={qadamlar} />
      </Bolim>

      {/* 4 — O'lchov */}
      <Bolim Icon={Ruler} rang="bg-emerald-50 text-emerald-600" eyebrow="4-bosqich · Dalil" sarlavha="Qanday bilaman — erishildi?" onEdit={() => onEdit(4)}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.14em] text-slate-400">
              <ListChecks className="h-3.5 w-3.5" /> Ashyoviy belgilar
            </p>
            {belgilar.length ? (
              <ul className="space-y-1.5">
                {belgilar.map((b) => (
                  <li key={b.id} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-slate-800">
                    <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md', b.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white text-transparent')}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className={b.done ? 'text-slate-500 line-through decoration-slate-300' : ''}>{b.matn}</span>
                  </li>
                ))}
              </ul>
            ) : (
              bosh('')
            )}
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.14em] text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" /> KPI mezonlari
            </p>
            {kpilar.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {kpilar.map((k) => (
                  <div key={k.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                    <p className="text-[12px] font-semibold text-emerald-900/70">{k.nom}</p>
                    <p className="mt-1 font-mono text-[22px] font-bold leading-none tracking-tight text-emerald-900">
                      {notBosh(k.qiymat) ? k.qiymat : '—'}
                      {notBosh(k.birlik) ? <span className="ml-1 text-[13px] font-semibold text-emerald-700/80">{k.birlik}</span> : null}
                    </p>
                    {notBosh(k.muddat) ? (
                      <p className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-emerald-800/70">
                        <Calendar className="h-3 w-3" /> {sanaFormat(k.muddat)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              bosh('')
            )}
          </div>
        </div>
      </Bolim>

      {/* Qasamyod — sertifikat */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-emerald-200/80 bg-white shadow-card">
        <div className="pointer-events-none absolute inset-2 rounded-[20px] border border-dashed border-emerald-200/80" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 pt-1 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-700">
              <ScrollText className="h-3.5 w-3.5" /> Qasamyod
            </p>
            {d4.tasdiq ? <Muhr sana={sanaFormat(d4.sana)} /> : null}
          </div>
          <p className="font-display mt-4 text-[18px] italic leading-[1.65] text-slate-800 sm:text-[20px]">
            {notBosh(d4.qasamyod) ? `“${d4.qasamyod}”` : <span className="not-italic text-slate-400">To‘ldirilmagan</span>}
          </p>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-[21px] font-semibold leading-none text-slate-900">{notBosh(d4.imzo) ? d4.imzo : ' '}</p>
              <div className="mt-2 h-px w-44 bg-slate-300" />
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Imzo</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[14px] font-semibold text-slate-800">{sanaFormat(d4.sana)}</p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Sana</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onEdit(4)}
              className="no-tap-highlight inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 transition hover:text-indigo-600"
            >
              <PenLine className="h-3.5 w-3.5" /> Tahrirlash
            </button>
            <span className="ml-auto font-mono text-[10px] tracking-[.14em] text-slate-300">{raqam}</span>
          </div>
        </div>
      </section>

      {/* Pastki amallar */}
      <div className="no-print flex flex-col gap-2.5 pb-2 sm:flex-row">
        <Tugma variant="ghost" Icon={PenLine} onClick={() => onEdit(1)} className="flex-1">
          Boshidan tahrirlash
        </Tugma>
        <Tugma variant="danger" Icon={RotateCcw} onClick={onQayta} className="flex-1">
          Yangi maqsad boshlash
        </Tugma>
      </div>
    </div>
  )
}

/* ==========================================================================
 *  11. PDF / RASM / CHOP ETISH SHABLONI (A4)
 *  Ekrandagi pasport bilan bir xil dizayn tili. Barcha uslublar inline —
 *  html2canvas uchun eng ishonchli yo'l (Tailwind sinflari klonlanmaydi).
 * ========================================================================== */

const NAVY = '#1e1b4b'
const OLTIN = '#d4a853'
const OLTIN_MATN = '#e8c97a'
const MUHR = '#b91c1c'

const F_DISPLAY = "Fraunces, Georgia, 'Times New Roman', serif"
const F_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

const P = {
  sheet: {
    width: '794px',
    minHeight: '1123px',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#0f172a',
    fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
    padding: '30px 34px 36px',
  },
  eyebrow: {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    margin: 0,
  },
  label: {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    margin: '0 0 4px',
  },
  matn: { fontSize: '12.5px', lineHeight: 1.65, color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' },
  bolim: {
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '16px 18px',
    marginBottom: '14px',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    background: '#ffffff',
  },
  teg: {
    display: 'inline-block',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '999px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#be123c',
    margin: '0 5px 5px 0',
  },
}

/** Bo'lim sarlavhasi: ikonka + eyebrow + nom */
function PdfBolimSarlavha({ Icon, rang, fon, eyebrow, nom }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: fon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={rang} strokeWidth={2.2} />
      </span>
      <div>
        <p style={P.eyebrow}>{eyebrow}</p>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{nom}</p>
      </div>
    </div>
  )
}

function PdfQator({ Icon, label, children, oxirgi }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: oxirgi ? 0 : '12px' }}>
      <span
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <Icon size={12} color="#64748b" strokeWidth={2.2} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={P.label}>{label}</p>
        {children}
      </div>
    </div>
  )
}

function PdfKartacha({ Icon, rang, fon, qiymat, label, izoh }) {
  return (
    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '14px', padding: '11px 12px', background: '#fff' }}>
      <span
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '8px',
          background: fon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={13} color={rang} strokeWidth={2.2} />
      </span>
      <p style={{ fontFamily: F_MONO, fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: '8px 0 0', lineHeight: 1 }}>
        {qiymat}
      </p>
      <p style={{ ...P.label, margin: '6px 0 0' }}>{label}</p>
      {izoh ? <p style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 0' }}>{izoh}</p> : null}
    </div>
  )
}

function PdfHujjat({ data, innerRef }) {
  const d1 = data.qadam1
  const d2 = data.qadam2
  const d3 = data.qadam3
  const d4 = data.qadam4
  const jz = JIZILLASH[Math.min(Math.max(d1.jizillash, 1), 10) - 1]
  const qadamlar = d3.qadamlar.filter((q) => notBosh(q.nom))
  const bajarilgan = qadamlar.filter((q) => q.bajarildi).length
  const belgilar = d4.belgilar.filter((b) => notBosh(b.matn))
  const kpilar = d4.kpilar.filter((k) => notBosh(k.nom))
  const raqam = pasportRaqami(data.meta)
  const muddat = yakuniyMuddat(data)
  const yil = (sanaQismlari(d4.sana) || sanaQismlari(bugun())).yil
  const mrz1 = mrzMatn(`P<UZB<MAQSAD<<${d1.soha}`, 44)
  const mrz2 = mrzMatn(
    `${raqam.replace(/-/g, '')}<${yil}<${qadamlar.length}QADAM<${d1.jizillash}<10<${kpilar.length}KPI`,
    44
  )

  const muqovaMaydon = (Icon, label, value, mono) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ ...P.label, color: OLTIN_MATN, display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 4px' }}>
        <Icon size={10} color={OLTIN_MATN} /> {label}
      </p>
      <p
        style={{
          fontFamily: mono ? F_MONO : undefined,
          fontSize: '12px',
          fontWeight: 600,
          color: '#fff',
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </p>
    </div>
  )

  return (
    <div ref={innerRef} className="pdf-sheet" aria-hidden="true" style={P.sheet}>
      {/* ---------------- MUQOVA ---------------- */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '22px',
          padding: '24px 26px',
          color: '#fff',
          background: `linear-gradient(160deg, ${NAVY} 0%, #2e1065 58%, ${NAVY} 100%)`,
          marginBottom: '14px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-90px',
            top: '-110px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${OLTIN}, transparent)`,
            opacity: 0.26,
          }}
        />
        <svg
          style={{ position: 'absolute', left: '-70px', bottom: '-90px', width: '280px', height: '280px', opacity: 0.07 }}
          viewBox="0 0 200 200"
          fill="none"
          stroke="#fff"
          strokeWidth=".6"
        >
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx="100" cy="100" r={14 + i * 6.5} />
          ))}
        </svg>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 28%, #f6e3a6 0%, #d4a853 52%, #a8792f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(30,27,75,.38)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={20} color={NAVY} strokeWidth={2.3} />
              </span>
            </span>
            <div>
              <p style={{ fontFamily: F_MONO, fontSize: '9.5px', letterSpacing: '.26em', textTransform: 'uppercase', color: OLTIN_MATN, margin: 0 }}>
                O‘zbekiston · Ustoz-shogird
              </p>
              <p style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.9)', margin: '4px 0 0' }}>
                Strategik maqsad pasporti
              </p>
            </div>
          </div>

          <h1 style={{ fontFamily: F_DISPLAY, fontSize: '27px', fontWeight: 600, lineHeight: 1.22, letterSpacing: '-.01em', margin: '20px 0 0', color: '#fff' }}>
            {notBosh(d1.maqsad) ? d1.maqsad : 'Maqsad kiritilmagan'}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
            {notBosh(d1.soha) ? (
              <span style={{ border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.1)', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>
                {d1.soha}
              </span>
            ) : null}
            <span style={{ border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.1)', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>
              Jizillash {d1.jizillash}/10 · {jz.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '14px', marginTop: '18px' }}>
            {muqovaMaydon(Hash, 'Pasport №', raqam, true)}
            {muqovaMaydon(Fingerprint, 'Egasi', notBosh(d4.imzo) ? d4.imzo : '—')}
            {muqovaMaydon(Calendar, 'Berilgan', sanaFormat(d4.sana))}
            {muqovaMaydon(Flag, 'Yakuniy muddat', muddat ? sanaFormat(muddat) : '—')}
          </div>

          <div
            style={{
              marginTop: '16px',
              background: 'rgba(0,0,0,.25)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontFamily: F_MONO,
              fontSize: '9.5px',
              lineHeight: 1.65,
              letterSpacing: '.13em',
              color: 'rgba(255,255,255,.55)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <div>{mrz1}</div>
            <div>{mrz2}</div>
          </div>
        </div>
      </div>

      {/* ---------------- BIR QARASHDA ---------------- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <PdfKartacha Icon={Flame} rang="#ea580c" fon="#fff7ed" qiymat={`${d1.jizillash}/10`} label="Jizillash" izoh={jz.label} />
        <PdfKartacha Icon={Milestone} rang="#059669" fon="#ecfdf5" qiymat={`${bajarilgan}/${qadamlar.length || QADAMLAR_SONI}`} label="Qadam bajarildi" izoh="yo‘l xaritasi" />
        <PdfKartacha Icon={Ruler} rang="#0284c7" fon="#f0f9ff" qiymat={String(kpilar.length)} label="KPI mezoni" izoh="o‘lchanadigan" />
        <PdfKartacha Icon={Flag} rang="#7c3aed" fon="#f5f3ff" qiymat={muddat ? String(sanaQismlari(muddat).yil) : '—'} label="Yakuniy muddat" izoh={muddat ? sanaFormat(muddat) : 'belgilanmagan'} />
      </div>

      {/* ---------------- 1. NIMA UCHUN ---------------- */}
      <div style={P.bolim}>
        <PdfBolimSarlavha Icon={Flame} rang="#ea580c" fon="#fff7ed" eyebrow="1-bosqich · Yurak" nom="Nima uchun aynan shu maqsad?" />
        <div style={{ position: 'relative', background: 'linear-gradient(135deg,#fff7ed,#fff1f2)', borderRadius: '14px', padding: '14px 16px 14px 36px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '12px' }}>
            <Quote size={14} color="#fdba74" />
          </span>
          <p style={{ fontFamily: F_DISPLAY, fontSize: '14.5px', lineHeight: 1.6, color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' }}>
            {d1.nega || '—'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{jz.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...P.label, margin: 0 }}>
              <span>Yurak jizillashi</span>
              <span style={{ fontFamily: F_MONO, color: '#334155' }}>{d1.jizillash}/10</span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginTop: '5px' }}>
              <div style={{ height: '6px', width: `${d1.jizillash * 10}%`, background: 'linear-gradient(90deg,#f97316,#ef4444)', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 2. QADRIYAT ---------------- */}
      <div style={P.bolim}>
        <PdfBolimSarlavha Icon={Heart} rang="#e11d48" fon="#fff1f2" eyebrow="2-bosqich · Filtr" nom="Qadriyat va manfaat" />
        <PdfQator Icon={Heart} label="Qadriyatlar">
          <div>
            {d2.qadriyatlar.length ? (
              d2.qadriyatlar.map((q) => (
                <span key={q} style={P.teg}>
                  {q}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>—</span>
            )}
          </div>
        </PdfQator>
        <PdfQator Icon={Users} label="Kimlar manfaat ko‘radi">
          <p style={P.matn}>{d2.manfaat || '—'}</p>
        </PdfQator>
        <PdfQator Icon={Rocket} label="Tramplin — keyingi cho‘qqi" oxirgi>
          <p style={P.matn}>{d2.tramplin || '—'}</p>
        </PdfQator>
      </div>

      {/* ---------------- 3. YO'L XARITASI ---------------- */}
      <div style={{ ...P.bolim, breakInside: 'auto', pageBreakInside: 'auto' }}>
        <PdfBolimSarlavha
          Icon={Milestone}
          rang="#4f46e5"
          fon="#eef2ff"
          eyebrow={`3-bosqich · ${bajarilgan}/${qadamlar.length || QADAMLAR_SONI} bajarildi`}
          nom="Yo‘l xaritasi va straxovka"
        />
        {qadamlar.length === 0 ? (
          <p style={{ ...P.matn, color: '#94a3b8' }}>—</p>
        ) : (
          <div style={{ marginLeft: '14px', borderLeft: '2px solid #e2e8f0', paddingLeft: '22px' }}>
            {qadamlar.map((q, i) => {
              const kechikkan = !q.bajarildi && muddatOtgan(q.muddat)
              return (
                <div key={q.id} style={{ position: 'relative', paddingBottom: i === qadamlar.length - 1 ? 0 : '14px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '-37px',
                      top: 0,
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: `2px solid ${q.bajarildi ? '#10b981' : kechikkan ? '#fda4af' : '#c7d2fe'}`,
                      background: q.bajarildi ? '#10b981' : '#fff',
                      color: q.bajarildi ? '#fff' : kechikkan ? '#e11d48' : '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    {q.bajarildi ? <Check size={13} color="#fff" strokeWidth={3} /> : q.raqam}
                  </span>
                  <p style={{ fontSize: '12.5px', fontWeight: 700, color: q.bajarildi ? '#64748b' : '#0f172a', margin: 0 }}>
                    {q.nom}
                  </p>
                  {notBosh(q.muddat) ? (
                    <p style={{ fontFamily: F_MONO, fontSize: '10px', color: kechikkan ? '#e11d48' : '#64748b', margin: '3px 0 0', fontWeight: kechikkan ? 700 : 500 }}>
                      {sanaFormat(q.muddat)}
                      {kechikkan ? ' · muddat o‘tdi' : ''}
                    </p>
                  ) : null}
                  {notBosh(q.straxovkaA) ? (
                    <p style={{ fontSize: '11px', lineHeight: 1.55, color: '#1e1b4b', background: '#eef2ff', borderRadius: '7px', padding: '5px 9px', margin: '6px 0 0' }}>
                      <b>Straxovka A:</b> {q.straxovkaA}
                    </p>
                  ) : null}
                  {notBosh(q.straxovkaB) ? (
                    <p style={{ fontSize: '11px', lineHeight: 1.55, color: '#2e1065', background: '#f5f3ff', borderRadius: '7px', padding: '5px 9px', margin: '5px 0 0' }}>
                      <b>Straxovka B:</b> {q.straxovkaB}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ---------------- 4. O'LCHOV ---------------- */}
      <div style={{ ...P.bolim, breakInside: 'auto', pageBreakInside: 'auto' }}>
        <PdfBolimSarlavha Icon={Ruler} rang="#059669" fon="#ecfdf5" eyebrow="4-bosqich · Dalil" nom="Qanday bilaman — erishildi?" />

        <p style={{ ...P.label, display: 'flex', alignItems: 'center', gap: '5px', margin: '0 0 8px' }}>
          <ListChecks size={11} color="#94a3b8" /> Ashyoviy belgilar
        </p>
        <div style={{ marginBottom: '14px' }}>
          {belgilar.length ? (
            belgilar.map((b) => (
              <div key={b.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '5px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    flexShrink: 0,
                    marginTop: '1px',
                    background: b.done ? '#10b981' : '#fff',
                    border: b.done ? 'none' : '2px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {b.done ? <Check size={11} color="#fff" strokeWidth={3} /> : null}
                </span>
                <span style={{ fontSize: '12.5px', lineHeight: 1.5, color: b.done ? '#64748b' : '#1e293b' }}>
                  {b.matn}
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>—</span>
          )}
        </div>

        <p style={{ ...P.label, display: 'flex', alignItems: 'center', gap: '5px', margin: '0 0 8px' }}>
          <TrendingUp size={11} color="#94a3b8" /> KPI mezonlari
        </p>
        {kpilar.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {kpilar.map((k) => (
              <div key={k.id} style={{ width: 'calc(50% - 4px)', boxSizing: 'border-box', border: '1px solid #d1fae5', background: '#f0fdf4', borderRadius: '12px', padding: '10px 12px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(6,78,59,.7)', margin: 0 }}>{k.nom}</p>
                <p style={{ fontFamily: F_MONO, fontSize: '18px', fontWeight: 700, color: '#064e3b', margin: '4px 0 0', lineHeight: 1 }}>
                  {notBosh(k.qiymat) ? k.qiymat : '—'}
                  {notBosh(k.birlik) ? <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(4,120,87,.85)', marginLeft: '4px' }}>{k.birlik}</span> : null}
                </p>
                {notBosh(k.muddat) ? (
                  <p style={{ fontFamily: F_MONO, fontSize: '10px', color: 'rgba(6,95,70,.7)', margin: '6px 0 0' }}>{sanaFormat(k.muddat)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>—</span>
        )}
      </div>

      {/* ---------------- QASAMYOD ---------------- */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #a7f3d0',
          borderRadius: '18px',
          padding: '22px 24px',
          background: '#fff',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ position: 'absolute', inset: '7px', borderRadius: '13px', border: '1px dashed #a7f3d0', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <p style={{ ...P.label, color: '#047857', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '.2em', paddingTop: '4px' }}>
            <ScrollText size={11} color="#047857" /> Qasamyod
          </p>
        {d4.tasdiq ? (
          <div
            style={{
              flexShrink: 0,
              transform: 'rotate(-7deg)',
              border: `3px solid ${MUHR}`,
              boxShadow: `inset 0 0 0 1.5px ${MUHR}`,
              borderRadius: '10px',
              padding: '6px 11px',
              color: MUHR,
              textAlign: 'center',
              opacity: 0.85,
            }}
          >
            <p style={{ fontSize: '10.5px', fontWeight: 900, letterSpacing: '.22em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Tasdiqlangan</p>
            <p style={{ fontFamily: F_MONO, fontSize: '8.5px', letterSpacing: '.16em', margin: '4px 0 0', lineHeight: 1 }}>{sanaFormat(d4.sana)}</p>
          </div>
        ) : null}
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: F_DISPLAY, fontStyle: 'italic', fontSize: '15.5px', lineHeight: 1.65, color: '#1e293b', margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>
            {notBosh(d4.qasamyod) ? `“${d4.qasamyod}”` : '—'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '22px' }}>
            <div>
              <p style={{ fontFamily: F_DISPLAY, fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1 }}>{d4.imzo || ' '}</p>
              <div style={{ height: '1px', width: '170px', background: '#cbd5e1', marginTop: '8px' }} />
              <p style={{ ...P.label, margin: '5px 0 0' }}>Imzo</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: F_MONO, fontSize: '12.5px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{sanaFormat(d4.sana)}</p>
              <p style={{ ...P.label, margin: '5px 0 0' }}>Sana</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- KOLONTITUL ---------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '9px', color: '#94a3b8' }}>
        <span>Maqsad qo‘yish · «Ustoz-shogird» metodologiyasi (Dilshod Mannopov)</span>
        <span style={{ fontFamily: F_MONO, letterSpacing: '.14em' }}>{raqam}</span>
      </div>
    </div>
  )
}

/** Pasportni oddiy matnga aylantirish (nusxalash / ulashish uchun) */
function matnGa(data) {
  const d1 = data.qadam1
  const d2 = data.qadam2
  const d3 = data.qadam3
  const d4 = data.qadam4
  const jz = JIZILLASH[Math.min(Math.max(d1.jizillash, 1), 10) - 1]
  const L = []
  L.push('🎯 STRATEGIK MAQSAD PASPORTI')
  L.push('«Ustoz-shogird» metodologiyasi · 4 bosqichli filtr')
  L.push('')
  L.push('━━━ 1. YURAKNI JIZILLATUVCHI MAQSAD ━━━')
  L.push(`Soha: ${d1.soha || '—'}`)
  L.push(`Maqsad: ${d1.maqsad || '—'}`)
  L.push(`His-tuyg'u: ${d1.jizillash}/10 ${jz.emoji} (${jz.label})`)
  L.push(`Nima uchun: ${d1.nega || '—'}`)
  L.push('')
  L.push('━━━ 2. QADRIYAT VA MANFAAT ━━━')
  L.push(`Qadriyatlar: ${d2.qadriyatlar.join(', ') || '—'}`)
  L.push(`Boshqalarga manfaati: ${d2.manfaat || '—'}`)
  L.push(`Tramplin effekti: ${d2.tramplin || '—'}`)
  L.push('')
  L.push('━━━ 3. QADAMLAR VA STRAXOVKA ━━━')
  const qs = d3.qadamlar.filter((q) => notBosh(q.nom))
  if (qs.length === 0) L.push('—')
  qs.forEach((q) => {
    L.push(`${q.raqam}. ${q.nom}${q.bajarildi ? ' ✓' : ''}${q.muddat ? ` (${sanaFormat(q.muddat)})` : ''}`)
    if (notBosh(q.straxovkaA)) L.push(`   🛡️ A: ${q.straxovkaA}`)
    if (notBosh(q.straxovkaB)) L.push(`   🛡️ B: ${q.straxovkaB}`)
  })
  L.push('')
  L.push('━━━ 4. O‘LCHOV VA PARAMETRLAR ━━━')
  L.push('Erishilganlik belgilari:')
  const bs = d4.belgilar.filter((b) => notBosh(b.matn))
  if (bs.length === 0) L.push('  —')
  bs.forEach((b) => L.push(`  ${b.done ? '☑' : '☐'} ${b.matn}`))
  L.push('KPI:')
  const ks = d4.kpilar.filter((k) => notBosh(k.nom))
  if (ks.length === 0) L.push('  —')
  ks.forEach((k) =>
    L.push(
      `  • ${k.nom}: ${k.qiymat || '—'} ${k.birlik || ''}${k.muddat ? ` — ${sanaFormat(k.muddat)}` : ''}`.trimEnd()
    )
  )
  L.push('')
  L.push(`Qasamyod: ${d4.qasamyod || '—'}`)
  L.push(`${d4.imzo || '—'} · ${sanaFormat(d4.sana)}${d4.tasdiq ? ' ✓ tasdiqlangan' : ''}`)
  return L.join('\n')
}

/** Telegram xabari uchun qisqartirilgan ulashish matni */
function ulashMatni(data) {
  const matn = matnGa(data)
  // t.me/share/url ning "text" parametri uzun bo'lsa Telegram xabarni kesadi
  return matn.length > 3000 ? `${matn.slice(0, 2980)}\n\n…(to'liq versiyasi PDF/rasmda)` : matn
}

/** data:URL dan ulashishga yaroqli File obyektini yasash */
async function dataUrlDanFayl(dataUrl, nom) {
  const javob = await fetch(dataUrl)
  const blob = await javob.blob()
  return { blob, fayl: new File([blob], nom, { type: 'image/png' }) }
}

/* ==========================================================================
 *  11.5 BOSH SAHIFA (asosiy oyna)
 *  Saqlangan maqsad bo'lsa — davom etish / pasport / yangi maqsad.
 *  Bo'lmasa — metodika bilan tanishtirish va "Boshlash".
 * ========================================================================== */

/** Foydalanuvchi biror narsa kiritganmi? (boshlang'ich jizillash hisobga olinmaydi) */
function malumotBormi(data) {
  const d1 = data.qadam1
  const d2 = data.qadam2
  const d4 = data.qadam4
  return (
    notBosh(d1.soha) ||
    notBosh(d1.maqsad) ||
    notBosh(d1.nega) ||
    d2.qadriyatlar.length > 0 ||
    notBosh(d2.manfaat) ||
    notBosh(d2.tramplin) ||
    data.qadam3.qadamlar.some((q) => notBosh(q.nom)) ||
    d4.belgilar.length > 0 ||
    d4.kpilar.length > 0 ||
    notBosh(d4.qasamyod) ||
    notBosh(d4.imzo)
  )
}

function BoshSahifa({ data, foizlar, umumiyFoiz, tugallangan, davomBosqich, onDavom, onPasport, onQadam, onYangi }) {
  const bor = malumotBormi(data)
  const d1 = data.qadam1
  const jz = JIZILLASH[Math.min(Math.max(d1.jizillash, 1), 10) - 1]
  const hammasi = tugallangan.length === 4

  return (
    <div className="space-y-4 sm:space-y-5">
      {bor ? (
        /* ---- Joriy maqsad kartasi ---- */
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-glow sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-[10.5px] font-bold uppercase tracking-[.2em] text-white/70">
              Joriy maqsad · {umumiyFoiz}% tayyor
            </p>
            <h2 className="font-display mt-3 text-[22px] font-semibold leading-[1.25] sm:text-[28px]">
              {notBosh(d1.maqsad) ? d1.maqsad : 'Maqsad hali yozilmagan'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {notBosh(d1.soha) ? (
                <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/20">{d1.soha}</span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold ring-1 ring-white/20">
                <span className="text-[13px] leading-none">{jz.emoji}</span> {d1.jizillash}/10
              </span>
            </div>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${umumiyFoiz}%` }} />
            </div>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={onDavom}
                className="no-tap-highlight inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[14.5px] font-bold text-indigo-700 shadow-lg transition active:scale-[.97]"
              >
                {hammasi ? <Award className="h-[18px] w-[18px]" /> : <ArrowRight className="h-[18px] w-[18px]" />}
                {hammasi ? 'Pasportni ochish' : `${davomBosqich}-qadamdan davom etish`}
              </button>
              {!hammasi ? (
                <button
                  type="button"
                  onClick={onPasport}
                  className="no-tap-highlight inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 text-[14.5px] font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20 active:scale-[.97]"
                >
                  <Award className="h-[18px] w-[18px]" /> Pasportni ko‘rish
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        /* ---- Yangi foydalanuvchi uchun kirish ---- */
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-6 text-white shadow-card sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative">
            <p className="text-[10.5px] font-bold uppercase tracking-[.2em] text-indigo-300">Ustoz-shogird metodologiyasi</p>
            <h2 className="font-display mt-3 text-[26px] font-semibold leading-[1.2] sm:text-[34px]">
              Yurakni jizillatadigan maqsadingizni 4 qadamda pasportga aylantiring.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-slate-300">
              Bitta ulkan maqsad → qadriyat filtri → 10 ta qadam va straxovka → o‘lchanadigan dalillar.
              Yakunda chop etish va ulashish uchun tayyor “Strategik maqsad pasporti”.
            </p>
            <button
              type="button"
              onClick={() => onQadam(1)}
              className="no-tap-highlight mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 text-[15px] font-bold text-white shadow-glow transition active:scale-[.97]"
            >
              Boshlash <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </section>
      )}

      {/* ---- 4 bosqich xaritasi ---- */}
      <Karta>
        <BolimSarlavha Icon={Compass} sarlavha="4 bosqichli filtr" izoh="Istalgan bosqichga bosib o‘ting. Har biri saqlanadi — keyin davom ettirish mumkin." />
        <ol className="space-y-2">
          {BOSQICHLAR.map((b) => {
            const foiz = foizlar[b.id - 1]
            const tugadi = tugallangan.includes(b.id)
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onQadam(b.id)}
                  className="no-tap-highlight flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-soft active:scale-[.99]"
                >
                  <span
                    className={cx(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white',
                      tugadi ? 'bg-emerald-500' : `bg-gradient-to-br ${b.rang}`
                    )}
                  >
                    {tugadi ? <Check className="h-5 w-5" strokeWidth={3} /> : <b.Icon className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-[.14em] text-slate-400">{b.id}-qadam</span>
                      {bor ? (
                        <span className={cx('rounded-full px-2 py-0.5 text-[10.5px] font-bold', tugadi ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {foiz}%
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[14.5px] font-bold leading-snug text-slate-900">{b.nom}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-slate-500">{b.tavsif}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              </li>
            )
          })}
        </ol>
      </Karta>

      {bor ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onYangi}
            className="no-tap-highlight inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" /> Yangi maqsad boshlash
          </button>
        </div>
      ) : null}

      <Iqtibos iqtibos={IQTIBOSLAR[4]} />
    </div>
  )
}

/* ==========================================================================
 *  12. TELEGRAM MINI APP INTEGRATSIYASI
 * ========================================================================== */

function tgApp() {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

/** Telegram in-app brauzeri (yoki Mini App) ichida ochilganini aniqlash */
function telegramdaMi() {
  if (typeof window === 'undefined') return false
  const tg = tgApp()
  if (tg && tg.initData !== undefined && (tg.platform || '') !== 'unknown') return true
  return /Telegram/i.test(navigator.userAgent || '')
}

/**
 * Telegram (va oddiy mobil brauzer) uchun barqaror viewport.
 *
 * Muammolar va yechimlar:
 *  • Mini App "compact" holatda ochiladi  → expand() va viewportChanged'da
 *    qayta expand().
 *  • 100dvh Telegram webview'da noto'g'ri  → balandlik --app-h o'zgaruvchisi
 *    orqali visualViewport / viewportStableHeight dan olinadi.
 *  • Klaviatura ochilganda sahifa sakraydi → faqat "resize" hodisasi
 *    tinglanadi ("scroll" emas), shuning uchun skroll paytida jitter yo'q.
 *  • iPhone "челка" va pastki chiziq     → Telegram safeAreaInset,
 *    bo'lmasa CSS env() qiymatlari.
 */
function useTelegramViewport() {
  useEffect(() => {
    const root = document.documentElement
    let ramka = 0

    const olchamniYangila = () => {
      cancelAnimationFrame(ramka)
      ramka = requestAnimationFrame(() => {
        const tg = tgApp()
        const vv = window.visualViewport
        // Ustuvorlik: visualViewport (klaviaturani ham hisobga oladi) →
        // Telegram barqaror balandligi → oddiy innerHeight
        const nomzodlar = [vv?.height, tg?.viewportStableHeight, tg?.viewportHeight, window.innerHeight]
        const h = nomzodlar.find((v) => typeof v === 'number' && v > 200)
        if (h) root.style.setProperty('--app-h', `${Math.round(h)}px`)
      })
    }

    const insetlarniYangila = () => {
      const tg = tgApp()
      if (!tg) return
      const yuqori = (tg.safeAreaInset?.top || 0) + (tg.contentSafeAreaInset?.top || 0)
      const past = (tg.safeAreaInset?.bottom || 0) + (tg.contentSafeAreaInset?.bottom || 0)
      // Faqat Telegram haqiqiy qiymat bergandagina CSS env() ni almashtiramiz
      if (yuqori > 0) root.style.setProperty('--safe-top', `${yuqori}px`)
      if (past > 0) root.style.setProperty('--safe-bottom', `${past}px`)
    }

    const kengaytir = () => {
      const tg = tgApp()
      if (!tg) return
      try {
        if (!tg.isExpanded) tg.expand()
      } catch {
        /* eski Telegram versiyasi */
      }
    }

    const viewportOzgardi = () => {
      kengaytir()
      olchamniYangila()
      insetlarniYangila()
    }

    olchamniYangila()
    insetlarniYangila()

    // DIQQAT: visualViewport'ning "scroll" hodisasi tinglanmaydi —
    // aynan u iOS'da skroll paytida balandlikni tebratib yuboradi.
    window.visualViewport?.addEventListener('resize', olchamniYangila)
    window.addEventListener('resize', olchamniYangila)
    window.addEventListener('orientationchange', viewportOzgardi)

    const tg = tgApp()
    try {
      tg?.onEvent?.('viewportChanged', viewportOzgardi)
      tg?.onEvent?.('safeAreaChanged', insetlarniYangila)
      tg?.onEvent?.('contentSafeAreaChanged', insetlarniYangila)
    } catch {
      /* hodisa qo'llab-quvvatlanmasa — e'tiborsiz */
    }

    // Telegram ba'zan birinchi kadrda noto'g'ri balandlik beradi
    const kechikkan = [
      setTimeout(viewportOzgardi, 120),
      setTimeout(viewportOzgardi, 500),
      setTimeout(viewportOzgardi, 1200),
    ]

    return () => {
      cancelAnimationFrame(ramka)
      kechikkan.forEach(clearTimeout)
      window.visualViewport?.removeEventListener('resize', olchamniYangila)
      window.removeEventListener('resize', olchamniYangila)
      window.removeEventListener('orientationchange', viewportOzgardi)
      try {
        tg?.offEvent?.('viewportChanged', viewportOzgardi)
        tg?.offEvent?.('safeAreaChanged', insetlarniYangila)
        tg?.offEvent?.('contentSafeAreaChanged', insetlarniYangila)
      } catch {
        /* noop */
      }
    }
  }, [])
}

/* ==========================================================================
 *  13. ASOSIY KOMPONENT
 * ========================================================================== */

export default function MaqsadQoyish() {
  const saqlangan = useMemo(() => oqish(), [])
  const [data, setData] = useState(() => saqlangan?.data || boshMalumot())
  const [bosqich, setBosqich] = useState(() => (saqlangan ? saqlangan.bosqich : 0))
  const [xatolar, setXatolar] = useState([])
  const [xabar, setXabar] = useState('')
  const [saqlanganVaqt, setSaqlanganVaqt] = useState('')
  const [yuklanmoqda, setYuklanmoqda] = useState('')
  const [pngUrl, setPngUrl] = useState('')        // <img> uchun (data:URL — eng mos)
  const [pngFayl, setPngFayl] = useState(null)   // Web Share uchun File
  const [pngYuklabUrl, setPngYuklabUrl] = useState('') // <a download> uchun blob:URL
  const [rasmOyna, setRasmOyna] = useState(false)
  const [qaytaSoraw, setQaytaSoraw] = useState(false)
  const [telegram, setTelegram] = useState(false)

  const pdfRef = useRef(null)
  const blobRef = useRef('')
  const skrollRef = useRef(null)
  const xabarTimer = useRef(null)

  /* ---------- Telegram uchun barqaror viewport ---------- */
  useTelegramViewport()

  /* ---------- Telegram sozlamalari ---------- */
  useEffect(() => {
    setTelegram(telegramdaMi())
    const tg = tgApp()
    if (!tg) return
    try {
      tg.ready()
      // To'liq balandlikda ochilishi uchun (compact rejimdan chiqarish)
      tg.expand()
      // Pastga tortganda ilova yopilib ketmasligi uchun — asosiy "qimirlash"
      // manbalaridan biri (yangi versiyalarda mavjud)
      tg.disableVerticalSwipes?.()
      tg.setHeaderColor?.('#ffffff')
      tg.setBackgroundColor?.('#f8fafc')
      tg.setBottomBarColor?.('#ffffff')
    } catch {
      /* eski Telegram versiyalari — e'tiborsiz qoldiramiz */
    }
  }, [])

  /* ---------- Telegram "Orqaga" tugmasi ---------- */
  useEffect(() => {
    const tg = tgApp()
    if (!tg?.BackButton) return
    const orqaga = () => orqagaRef.current?.()
    if (bosqich > 0) {
      tg.BackButton.show()
      tg.BackButton.onClick(orqaga)
    } else {
      tg.BackButton.hide()
    }
    return () => {
      try {
        tg.BackButton.offClick(orqaga)
      } catch {
        /* noop */
      }
    }
  }, [bosqich])

  /* ---------- Avtomatik saqlash ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data: { ...data, meta: { ...data.meta, yangilangan: new Date().toISOString() } },
            bosqich,
          })
        )
        setSaqlanganVaqt(
          new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        )
      } catch {
        /* saqlash imkoni bo'lmasa (private rejim) — jim o'tamiz */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [data, bosqich])

  /* ---------- Rasm keshi (ma'lumot o'zgarsa — eskiradi) ---------- */
  const rasmniTozala = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = ''
    }
    setPngUrl('')
    setPngFayl(null)
    setPngYuklabUrl('')
  }, [])

  useEffect(() => {
    rasmniTozala()
  }, [data, rasmniTozala])

  /* ---------- Ogohlantirish avtomatik yo'qoladi ---------- */
  useEffect(() => {
    if (xatolar.length === 0) return undefined
    const t = setTimeout(() => setXatolar([]), 7000)
    return () => clearTimeout(t)
  }, [xatolar])

  /* ---------- Yordamchilar ---------- */
  const xabarBer = useCallback((matn) => {
    setXabar(matn)
    clearTimeout(xabarTimer.current)
    xabarTimer.current = setTimeout(() => setXabar(''), 2200)
  }, [])

  const titra = useCallback((tur = 'light') => {
    try {
      tgApp()?.HapticFeedback?.impactOccurred?.(tur)
    } catch {
      /* noop */
    }
  }, [])

  const yuqoriga = useCallback(() => {
    const el = skrollRef.current
    if (!el) return
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      el.scrollTop = 0
    }
  }, [])

  const set1 = useCallback((patch) => setData((p) => ({ ...p, qadam1: { ...p.qadam1, ...patch } })), [])
  const set2 = useCallback((patch) => setData((p) => ({ ...p, qadam2: { ...p.qadam2, ...patch } })), [])
  const set3 = useCallback((patch) => setData((p) => ({ ...p, qadam3: { ...p.qadam3, ...patch } })), [])
  const set4 = useCallback((patch) => setData((p) => ({ ...p, qadam4: { ...p.qadam4, ...patch } })), [])

  /* ---------- Progress ---------- */
  const foizlar = useMemo(() => [1, 2, 3, 4].map((b) => bosqichFoizi(data, b)), [data])
  const umumiyFoiz = useMemo(
    () => Math.round(foizlar.reduce((a, b) => a + b, 0) / foizlar.length),
    [foizlar]
  )
  const tugallangan = useMemo(
    () => [1, 2, 3, 4].filter((b) => bosqichniTekshir(data, b).length === 0),
    [data]
  )

  /* ------------------------------------------------------------------
   *  Navigatsiya
   *  Bosqichlar: 0 — bosh sahifa, 1–4 — qadamlar, 5 — pasport.
   *  Har bir o'tish brauzer tarixiga yoziladi: qurilmaning "orqaga"
   *  tugmasi (Android, brauzer) ilovani yopmasdan oldingi oynaga qaytaradi.
   * ------------------------------------------------------------------ */
  const oting = useCallback(
    (b, { tarix = true } = {}) => {
      setXatolar([])
      setBosqich(b)
      if (tarix) {
        try {
          window.history.pushState({ bosqich: b }, '')
        } catch {
          /* tarix mavjud bo'lmagan muhit */
        }
      }
      yuqoriga()
    },
    [yuqoriga]
  )

  useEffect(() => {
    try {
      window.history.replaceState({ bosqich }, '')
    } catch {
      /* noop */
    }
    const qaytish = (e) => {
      const b = e.state?.bosqich
      if (Number.isInteger(b) && b >= 0 && b <= 5) {
        setXatolar([])
        setBosqich(b)
        yuqoriga()
      }
    }
    window.addEventListener('popstate', qaytish)
    return () => window.removeEventListener('popstate', qaytish)
    // faqat bir marta: boshlang'ich holatni belgilash va tinglovchi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const keyingi = () => {
    const x = bosqichniTekshir(data, bosqich)
    if (x.length > 0) {
      setXatolar(x)
      titra('rigid')
      try {
        tgApp()?.HapticFeedback?.notificationOccurred?.('error')
      } catch {
        /* noop */
      }
      return
    }
    titra()
    oting(Math.min(5, bosqich + 1))
  }

  /** Orqaga: pasport → 4-qadam, 1-qadam → bosh sahifa, qolganida bir qadam */
  const orqaga = () => {
    titra()
    oting(Math.max(0, bosqich - 1))
  }
  const orqagaRef = useRef(orqaga)
  orqagaRef.current = orqaga

  const bosqichgaOt = (b) => oting(b)
  const boshSahifaga = () => oting(0)

  /* ---------- Qayta boshlash ---------- */
  const qaytaBoshla = () => {
    setData(boshMalumot())
    setQaytaSoraw(false)
    oting(1)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
    xabarBer('Forma tozalandi — yangi maqsad!')
    yuqoriga()
  }

  /* ---------- Eksport: fayl nomi ---------- */
  const faylNomi = useMemo(() => {
    const asos = (data.qadam1.maqsad || '')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join('-')
      .toLowerCase()
    return `maqsad-pasporti-${asos || 'hujjat'}-${bugun()}`
  }, [data.qadam1.maqsad])

  /* ---------- Eksport: PDF ---------- */
  const pdfYukla = async () => {
    if (!pdfRef.current) return
    setYuklanmoqda('pdf')
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = mod.default || mod
      await html2pdf()
        .set({
          // Hoshiya 0 — A4 kengligi (210mm ≈ 794px) varaq kengligiga mos keladi,
          // hoshiyani varaqning o'z paddingi beradi.
          margin: 0,
          filename: `${faylNomi}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 794,
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(pdfRef.current)
        .save()
      xabarBer('PDF tayyor ✓')
      titra('medium')
      setYuklanmoqda('')
    } catch (e) {
      console.error('PDF xatosi:', e)
      setYuklanmoqda('')
      // PDF chiqmadi — avtomatik ravishda rasm ko'rinishiga o'tamiz
      xabarBer('PDF ishlamadi — rasm tayyorlanmoqda...')
      await pngYarat()
    }
  }

  /* ------------------------------------------------------------------
   *  Eksport: PNG rasm
   *  Rasm keshlanadi: Web Share (navigator.share) faylni faqat
   *  foydalanuvchi bosishi paytida qabul qiladi, shuning uchun rasm
   *  oldindan tayyorlanib, ulashish alohida bosishda amalga oshiriladi.
   * ------------------------------------------------------------------ */
  const rasmTayyorla = useCallback(async () => {
    if (pngUrl && pngFayl) return { url: pngUrl, fayl: pngFayl }
    if (!pdfRef.current) throw new Error('Hujjat topilmadi')

    const mod = await import('html2canvas')
    const html2canvas = mod.default || mod
    const canvas = await html2canvas(pdfRef.current, {
      scale: window.devicePixelRatio > 1 ? 2 : 1.6,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    })

    const url = canvas.toDataURL('image/png')
    let fayl = null
    let yuklabUrl = url
    try {
      const { blob, fayl: f } = await dataUrlDanFayl(url, `${faylNomi}.png`)
      fayl = f
      // blob:URL — data:URL ga qaraganda yuklab olish uchun ancha ishonchli
      yuklabUrl = URL.createObjectURL(blob)
      blobRef.current = yuklabUrl
    } catch {
      /* File API cheklangan bo'lsa — data:URL bilan davom etamiz */
    }

    setPngUrl(url)
    setPngFayl(fayl)
    setPngYuklabUrl(yuklabUrl)
    return { url, fayl }
  }, [pngUrl, pngFayl, faylNomi])

  const pngYarat = async () => {
    setYuklanmoqda('png')
    try {
      await rasmTayyorla()
      setRasmOyna(true)
      titra('medium')
    } catch (e) {
      console.error('PNG xatosi:', e)
      xabarBer('Rasm yaratilmadi. Chop etishni sinab ko‘ring.')
    } finally {
      setYuklanmoqda('')
    }
  }

  /* ---------- Eksport: nusxalash ---------- */
  const nusxala = async () => {
    const matn = matnGa(data)
    try {
      await navigator.clipboard.writeText(matn)
      xabarBer('Matn nusxalandi ✓')
      titra('light')
      return
    } catch {
      /* clipboard API ishlamadi — zaxira usul */
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = matn
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      xabarBer('Matn nusxalandi ✓')
    } catch {
      xabarBer('Nusxalash imkoni bo‘lmadi')
    }
  }

  /* ------------------------------------------------------------------
   *  Telegramga matn ko'rinishida yuborish (zaxira yo'l).
   *  t.me/share/url barcha platformalarda ishlaydi va chat tanlash
   *  oynasini ochadi.
   * ------------------------------------------------------------------ */
  const telegramgaMatn = useCallback(async () => {
    const matn = ulashMatni(data)
    const havola = `https://t.me/share/url?url=${encodeURIComponent(
      window.location.href
    )}&text=${encodeURIComponent(matn)}`

    const tg = tgApp()
    try {
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(havola)
        return
      }
    } catch {
      /* eski Telegram versiyasi — quyidagi zaxira yo'llar bilan davom etamiz */
    }

    const oyna = window.open(havola, '_blank', 'noopener')
    if (oyna) return

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Strategik maqsad pasporti', text: matn })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    await nusxala()
    xabarBer('Matn nusxalandi — Telegramga qo‘ying')
  }, [data, nusxala, xabarBer])

  /* ------------------------------------------------------------------
   *  Pasportni RASM sifatida Telegramga (yoki boshqa ilovaga) yuborish.
   *  Rasm hali tayyor bo'lmasa — avval tayyorlab, oynani ochamiz:
   *  Web Share faylni faqat "toza" bosish paytida qabul qiladi.
   * ------------------------------------------------------------------ */
  const rasmniUlash = async () => {
    let fayl = pngFayl

    if (!fayl) {
      setYuklanmoqda('png')
      try {
        const natija = await rasmTayyorla()
        fayl = natija.fayl
        setRasmOyna(true)
      } catch (e) {
        console.error('Rasm xatosi:', e)
        setYuklanmoqda('')
        // Rasm chiqmadi — hech bo'lmaganda matnni yuboramiz
        await telegramgaMatn()
        return
      }
      setYuklanmoqda('')
      if (fayl) {
        xabarBer('Rasm tayyor — “Telegramga yuborish”ni bosing')
        return
      }
    }

    const yuk = {
      files: [fayl],
      title: 'Strategik maqsad pasporti',
      text: data.qadam1.maqsad || 'Strategik maqsad pasporti',
    }

    if (navigator.canShare?.(yuk) && navigator.share) {
      try {
        await navigator.share(yuk)
        titra('medium')
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
        console.error('Ulashish xatosi:', e)
      }
    }

    // Rasmni ulashib bo'lmadi — matn ko'rinishida yuboramiz
    await telegramgaMatn()
  }

  /* ---------- Rasm oynasini yopish ---------- */
  const rasmOynaniYop = () => setRasmOyna(false)

  /* ---------- Brauzerda ochish (Telegram) ---------- */
  const brauzerdaOch = () => {
    const tg = tgApp()
    try {
      if (tg?.openLink) tg.openLink(window.location.href, { try_instant_view: false })
      else window.open(window.location.href, '_blank', 'noopener')
    } catch {
      window.open(window.location.href, '_blank', 'noopener')
    }
  }

  const joriy = BOSQICHLAR[Math.min(Math.max(bosqich, 1), 4) - 1]
  const boshSahifada = bosqich === 0
  const pasportda = bosqich === 5
  const davomBosqich = [1, 2, 3, 4].find((b) => !tugallangan.includes(b)) ?? 5

  return (
    <>
    <div className="app-shell bg-slate-50">
      {/* Fon dekoratsiyasi */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-indigo-200/25 blur-[110px]" />
        <div className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-200/25 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-sky-200/20 blur-[110px]" />
      </div>

      <Xabar matn={xabar} />

      {/* ---- Skroll qilinadigan yagona hudud ---- */}
      <div ref={skrollRef} className="app-scroll thin-scroll relative">
      <div className="mx-auto w-full max-w-3xl px-4 pt-[calc(var(--safe-top)+18px)] sm:px-6 sm:pt-8">
        <Header umumiyFoiz={umumiyFoiz} saqlanganVaqt={saqlanganVaqt} onHome={boshSahifaga} boshSahifada={boshSahifada} malumotBor={malumotBormi(data)} />

        {/* Stepper — bosh sahifada o'zining 4 bosqich xaritasi bor */}
        {!boshSahifada ? (
          <div className="no-print mt-5 sm:mt-6">
            <Stepper
              bosqich={Math.min(bosqich, 4)}
              foizlar={foizlar}
              tugallangan={tugallangan}
              onSelect={bosqichgaOt}
            />
          </div>
        ) : null}

        {/* Joriy bosqich sarlavhasi */}
        {!pasportda && !boshSahifada ? (
          <div className="mt-5 flex items-start gap-3 sm:mt-6">
            <span
              className={cx(
                'grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft',
                joriy.rang
              )}
            >
              <joriy.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">
                {bosqich}-qadam / 4
              </p>
              <h2 className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl">
                {joriy.nom}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{joriy.tavsif}</p>
            </div>
          </div>
        ) : null}

        {/* Kontent */}
        <main key={bosqich} className="mt-5 animate-fadeUp sm:mt-6">
          {bosqich === 0 ? (
            <BoshSahifa
              data={data}
              foizlar={foizlar}
              umumiyFoiz={umumiyFoiz}
              tugallangan={tugallangan}
              davomBosqich={davomBosqich}
              onDavom={() => oting(davomBosqich)}
              onPasport={() => oting(5)}
              onQadam={(b) => oting(b)}
              onYangi={() => setQaytaSoraw(true)}
            />
          ) : null}
          {bosqich === 1 ? <Qadam1 d={data.qadam1} set={set1} /> : null}
          {bosqich === 2 ? <Qadam2 d={data.qadam2} set={set2} /> : null}
          {bosqich === 3 ? <Qadam3 d={data.qadam3} set={set3} /> : null}
          {bosqich === 4 ? <Qadam4 d={data.qadam4} set={set4} /> : null}
          {bosqich === 5 ? (
            <Pasport
              data={data}
              telegram={telegram}
              yuklanmoqda={yuklanmoqda}
              onEdit={bosqichgaOt}
              onQayta={() => setQaytaSoraw(true)}
              onPdf={pdfYukla}
              onPng={pngYarat}
              onTelegram={rasmniUlash}
              onPrint={() => window.print()}
              onCopy={nusxala}
            />
          ) : null}
        </main>

        {/* Pastki matn */}
        <footer className="no-print pb-[calc(var(--safe-bottom)+20px)] pt-8 text-center">
          <p className="text-[11.5px] leading-relaxed text-slate-400">
            «Ustoz-shogird» metodologiyasi asosida · Ma’lumotlar faqat shu qurilmada saqlanadi
          </p>
        </footer>
      </div>
      </div>
      {/* ---- Skroll hududi tugadi ---- */}

      {/*
        Pastki navigatsiya — position:fixed EMAS, balki qobiqning oxirgi
        flex elementi. Aynan shu tufayli u klaviatura ochilganda yoki
        skroll paytida sakramaydi.
      */}
      {pasportda ? (
        <div className="no-print shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-4 pb-[calc(var(--safe-bottom)+12px)] pt-3 sm:px-6">
            <Tugma variant="ghost" Icon={ArrowLeft} onClick={orqaga} className="!px-4" aria-label="4-qadamga qaytish">
              <span className="hidden sm:inline">Orqaga</span>
            </Tugma>
            <p className="min-w-0 flex-1 truncate text-center text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">
              Strategik maqsad pasporti
            </p>
            <Tugma variant="primary" Icon={Home} onClick={boshSahifaga}>
              Bosh sahifa
            </Tugma>
          </div>
        </div>
      ) : null}

      {!pasportda && !boshSahifada ? (
        <div className="no-print shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl">
          {/* Validatsiya ogohlantirishi — tugmalar ustida, siljishlarsiz */}
          <Ogohlantirish xatolar={xatolar} onClose={() => setXatolar([])} />

          <div className="mx-auto flex w-full max-w-3xl items-center gap-2.5 px-4 pb-[calc(var(--safe-bottom)+12px)] pt-3 sm:px-6">
            {/* 1-qadamda "Orqaga" bosh sahifaga olib boradi */}
            <Tugma
              variant="ghost"
              Icon={bosqich === 1 ? Home : ArrowLeft}
              onClick={orqaga}
              className="!px-4"
              aria-label={bosqich === 1 ? 'Bosh sahifa' : 'Orqaga'}
            >
              <span className="hidden sm:inline">{bosqich === 1 ? 'Bosh sahifa' : 'Orqaga'}</span>
            </Tugma>

            <div className="min-w-0 flex-1 px-1">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{joriy.qisqa}</span>
                <span className="tabular-nums">{foizlar[bosqich - 1]}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cx(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    foizlar[bosqich - 1] === 100 ? 'bg-emerald-500' : `bg-gradient-to-r ${joriy.rang}`
                  )}
                  style={{ width: `${foizlar[bosqich - 1]}%` }}
                />
              </div>
            </div>

            <Tugma variant="primary" Icon={bosqich === 4 ? Award : ArrowRight} onClick={keyingi}>
              {bosqich === 4 ? 'Pasportni ko‘rish' : 'Keyingi'}
            </Tugma>
          </div>
        </div>
      ) : null}

      {/* PNG modal (Telegramda saqlash uchun) */}
      {rasmOyna && pngUrl ? (
        <div className="no-print fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="flex max-h-[calc(var(--app-h,100dvh)-24px)] w-full max-w-lg animate-slideDown flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-slate-900">Pasport rasmi tayyor</p>
                <p className="text-[12px] leading-relaxed text-slate-500">
                  Chatga yuboring, yuklab oling yoki rasmni{' '}
                  <span className="font-semibold">bosib turib</span> galereyaga saqlang.
                </p>
              </div>
              <button
                type="button"
                onClick={rasmOynaniYop}
                aria-label="Yopish"
                className="no-tap-highlight shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="thin-scroll flex-1 overflow-auto bg-slate-100 p-3">
              <img
                src={pngUrl}
                alt="Strategik maqsad pasporti"
                className="w-full rounded-xl border border-slate-200 shadow-sm"
              />
            </div>

            <div className="space-y-2.5 border-t border-slate-100 p-4 pb-[calc(var(--safe-bottom)+16px)]">
              <Tugma variant="primary" Icon={Send} onClick={rasmniUlash} className="w-full">
                Telegramga yuborish
              </Tugma>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={pngYuklabUrl || pngUrl}
                  download={`${faylNomi}.png`}
                  className="no-tap-highlight inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[.97]"
                >
                  <Download className="h-[18px] w-[18px]" />
                  Rasmni yuklab olish
                </a>
                {telegram ? (
                  <Tugma variant="ghost" Icon={ExternalLink} onClick={brauzerdaOch} className="flex-1">
                    Brauzerda ochish
                  </Tugma>
                ) : null}
              </div>

              <p className="pt-0.5 text-center text-[11.5px] leading-relaxed text-slate-400">
                Yuklash bloklansa — rasmni barmoq bilan bosib turing va “Rasmni saqlash”ni tanlang.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Qayta boshlash tasdiqlash oynasi */}
      {qaytaSoraw ? (
        <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-pop rounded-3xl bg-white p-6 shadow-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-[17px] font-extrabold text-slate-900">Yangi maqsad boshlansinmi?</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
              Barcha 4 bosqichdagi ma’lumotlaringiz butunlay o‘chiriladi. Avval pasportni PDF yoki rasm
              qilib saqlab olishni maslahat beramiz.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Tugma variant="ghost" onClick={() => setQaytaSoraw(false)} className="flex-1">
                Bekor qilish
              </Tugma>
              <Tugma variant="danger" Icon={Trash2} onClick={qaytaBoshla} className="flex-1">
                Ha, o‘chirilsin
              </Tugma>
            </div>
          </div>
        </div>
      ) : null}

    </div>

    {/*
      Chop etish / PDF uchun A4 hujjat.
      U haqiqatan ham sahifada render qilinadi (aks holda html2canvas uni
      suratga ololmaydi), lekin manfiy z-index tufayli ilovaning shaffof
      bo'lmagan foni ortida turadi. Chop etishda .pdf-wrap oddiy oqimga qaytadi.
    */}
    <div
      className="pdf-wrap"
      style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, pointerEvents: 'none' }}
    >
      <PdfHujjat data={data} innerRef={pdfRef} />
    </div>
    </>
  )
}
