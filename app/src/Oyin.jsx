/* eslint-disable react-refresh/only-export-components */
/**
 * ============================================================================
 *  JIZILLASH — maqsad qo'yish o'yini
 *
 *  Anketaning o'sha 4 bosqichi, lekin o'yin tilida:
 *    1. Uchqun  — maqsadni kartalardan yasash, "yurak testi" (jizillash ≥ 7)
 *    2. Qalqon  — 3 ta qadriyat-qalqon, foyda ko'radiganlar, tramplin
 *    3. Yo'l    — 10 tosh: qadam tanlash → zar → bo'ron → qalqon (taymer!)
 *    4. Dalil   — ashyoviy dalillar va KPI "jackpot"i
 *    Final      — qasamyod: tugmani bosib turish, muhr
 *
 *  Natija anketa bilan aynan bir xil ma'lumot tuzilmasiga yoziladi, shuning
 *  uchun pasport, PDF, rasm va Telegramga yuborish o'zgarishsiz ishlaydi.
 * ============================================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Heart, Pencil, RotateCcw, Share2, Star, Volume2, VolumeX } from 'lucide-react'
import { JIZILLASH, QADRIYATLAR, SOHALAR, bugun, sanaFormat, sanaKalit } from './MaqsadQoyish.jsx'

const cx = (...c) => c.filter(Boolean).join(' ')

/* ==========================================================================
 *  1. OVOZ VA TEBRANISH
 *  Fayl yo'q — hammasi WebAudio bilan sintez qilinadi (Telegram'da ham ishlaydi).
 * ========================================================================== */

let audioCtx = null
let ovozYoqilgan = true

function audio() {
  if (!ovozYoqilgan) return null
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function ton(c, f, t0, dur, { tip = 'sine', vol = 0.12, f2 } = {}) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = tip
  o.frequency.setValueAtTime(f, t0)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}

const SADOLAR = {
  tap: (c, t) => ton(c, 620, t, 0.07, { tip: 'triangle', vol: 0.07 }),
  tanla: (c, t) => {
    ton(c, 700, t, 0.08, { tip: 'triangle' })
    ton(c, 1050, t + 0.06, 0.1, { tip: 'triangle' })
  },
  ok: (c, t) => [523, 659, 784].forEach((f, i) => ton(c, f, t + i * 0.07, 0.16, { tip: 'triangle' })),
  xato: (c, t) => ton(c, 190, t, 0.32, { tip: 'sawtooth', vol: 0.07, f2: 80 }),
  zar: (c, t) => {
    for (let i = 0; i < 9; i++) ton(c, 220 + Math.random() * 520, t + i * 0.085, 0.05, { tip: 'square', vol: 0.035 })
  },
  tik: (c, t) => ton(c, 980, t, 0.045, { tip: 'square', vol: 0.05 }),
  yurak: (c, t) => {
    ton(c, 95, t, 0.13, { vol: 0.32, f2: 55 })
    ton(c, 85, t + 0.17, 0.13, { vol: 0.25, f2: 50 })
  },
  muhr: (c, t) => {
    ton(c, 120, t, 0.28, { vol: 0.38, f2: 45 })
    ton(c, 2600, t, 0.05, { tip: 'square', vol: 0.03 })
  },
  fanfara: (c, t) =>
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => ton(c, f, t + i * 0.11, 0.24, { tip: 'triangle', vol: 0.11 })),
  jackpot: (c, t) => {
    for (let i = 0; i < 12; i++) ton(c, 880 + i * 85, t + i * 0.05, 0.08, { tip: 'square', vol: 0.045 })
  },
  boron: (c, t) => {
    ton(c, 300, t, 0.5, { tip: 'sawtooth', vol: 0.05, f2: 70 })
    ton(c, 150, t + 0.05, 0.45, { tip: 'sine', vol: 0.12, f2: 60 })
  },
}

function sfx(nom) {
  const c = audio()
  if (!c || !SADOLAR[nom]) return
  try {
    SADOLAR[nom](c, c.currentTime + 0.01)
  } catch {
    /* audio xatosi o'yinni to'xtatmasin */
  }
}

function hap(tur = 'light') {
  try {
    const h = window.Telegram?.WebApp?.HapticFeedback
    if (h) {
      if (tur === 'error' || tur === 'success' || tur === 'warning') h.notificationOccurred(tur)
      else h.impactOccurred(tur)
      return
    }
    navigator.vibrate?.(tur === 'heavy' ? 40 : tur === 'error' ? [30, 40, 30] : 12)
  } catch {
    /* noop */
  }
}

/* ==========================================================================
 *  2. KONTENT
 * ========================================================================== */

const KALIT = 'maqsad-qoyish:oyin:v1'
const OVOZ_KALIT = 'maqsad-qoyish:oyin:ovoz'
const YIL = new Date().getFullYear()
const TOSHLAR = 10
const BORON_VAQT = 12000
const BOSS_VAQT = 10000
const TEZKOR = 4000

const DARVOZALAR = [
  { n: 1, nom: 'Uchqun', emoji: '🔥', izoh: 'Yurakni jizillatadigan maqsad' },
  { n: 2, nom: 'Qalqon', emoji: '🛡️', izoh: 'Qadriyat va manfaat' },
  { n: 3, nom: 'Yo‘l', emoji: '🎲', izoh: '10 tosh va bo‘ronlar' },
  { n: 4, nom: 'Dalil', emoji: '🏆', izoh: 'O‘lchov va jackpot' },
]

/** Har bir soha — o'z "olami": maqsad shabloni, raqamlar, qadamlar, tramplin */
const OLAM = {
  biznes: {
    emoji: '💼',
    shablon: '{yil}-yilgacha yillik aylanmasi {son} bo‘lgan {narsa} qurish',
    narsalar: ['o‘z kompaniyamni', 'ishlab chiqarish korxonasini', 'savdo tarmog‘ini', 'eksport biznesini'],
    sonlar: ['$100 ming', '$1 mln', '$10 mln', '$100 mln', '$1 mlrd'],
    kpi: { nom: 'Yillik aylanma', birlik: '' },
    tramplin: [
      'Markaziy Osiyoga eksport qiladigan xolding qurish',
      'Yoshlar uchun biznes-inkubator ochish',
      'O‘z sohamda xalqaro brend yaratish',
    ],
    qadamlar: [
      'Biznes-reja va moliyaviy modelni tuzish',
      'Birinchi 10 ta mijozni topish',
      'Ishlab chiqarishni yo‘lga qo‘yish',
      'Bank yoki investordan kapital jalb qilish',
    ],
  },
  karyera: {
    emoji: '🎓',
    shablon: '{yil}-yilgacha {narsa} bo‘lib, oyiga {son} daromad qilish',
    narsalar: ['sohamdagi eng yaxshi mutaxassis', 'xalqaro kompaniyada rahbar', 'tan olingan olim', 'chet elda ishlaydigan muhandis'],
    sonlar: ['$2 000', '$5 000', '$10 000', '$25 000', '$50 000'],
    kpi: { nom: 'Oylik daromad', birlik: '' },
    tramplin: [
      'O‘z konsalting kompaniyamni ochish',
      'Minglab yoshlarga ustozlik qilish',
      'Xalqaro konferensiyada asosiy ma’ruzachi bo‘lish',
    ],
    qadamlar: [
      'Xalqaro sertifikat olish',
      'Ingliz tilini C1 darajaga chiqarish',
      'Portfolio va shaxsiy brend yaratish',
      'Top kompaniyada suhbatdan o‘tish',
    ],
  },
  it: {
    emoji: '🚀',
    shablon: '{yil}-yilgacha {son} foydalanuvchiga xizmat qiladigan {narsa} yaratish',
    narsalar: ['mobil ilova', 'ta’lim platformasi', 'SaaS mahsulot', 'sun’iy intellekt startapi'],
    sonlar: ['10 000', '100 000', '1 000 000', '10 000 000', '100 000 000'],
    kpi: { nom: 'Faol foydalanuvchilar', birlik: 'ta' },
    tramplin: [
      'Markaziy Osiyoning birinchi unicorn startapini qurish',
      'Mahsulotni 20 ta davlatga chiqarish',
      'O‘zbekistonda bepul IT-akademiya ochish',
    ],
    qadamlar: [
      'MVP ni 100 foydalanuvchida sinash',
      'Kuchli texnik hammuassis topish',
      'Birinchi investitsiya raundini yopish',
      'Mahsulotni App Store va Google Playga chiqarish',
    ],
  },
  soglik: {
    emoji: '🏃',
    shablon: '{yil}-yilgacha {narsa} marrasini zabt etish va {son} kun ketma-ket mashq qilish',
    narsalar: ['marafon (42 km)', 'Ironman triatloni', 'Everest bazaviy lageri', 'sport ustasi unvoni'],
    sonlar: ['100', '365', '1 000', '2 000', '3 650'],
    kpi: { nom: 'Ketma-ket mashq kunlari', birlik: 'kun' },
    tramplin: [
      'Yugurish klubini ochib, 1000 kishini sportga jalb qilish',
      'Xalqaro musobaqada O‘zbekiston bayrog‘ini ko‘tarish',
      'Sog‘lom turmush bo‘yicha kitob yozish',
    ],
    qadamlar: [
      'Murabbiy bilan shaxsiy reja tuzish',
      'Ovqatlanish tartibini butunlay o‘zgartirish',
      'Birinchi 10 km musobaqada qatnashish',
      'Tibbiy ko‘rikdan o‘tib, ko‘rsatkichlarni o‘lchash',
    ],
  },
  shaxsiy: {
    emoji: '🧠',
    shablon: '{yil}-yilgacha {son} ta kitob o‘qib, {narsa}',
    narsalar: ['3 ta chet tilini mukammal o‘rganish', 'o‘z kitobimni nashr etish', 'minglab odamlar oldida nutq so‘zlash', 'sohamda tan olingan ekspert bo‘lish'],
    sonlar: ['50', '100', '300', '500', '1 000'],
    kpi: { nom: 'O‘qilgan kitoblar', birlik: 'ta' },
    tramplin: [
      'O‘z bilim maktabimni ochish',
      'Kitobimni 5 tilga tarjima qildirish',
      'Yoshlar uchun bepul kutubxona ochish',
    ],
    qadamlar: [
      'Har kuni 30 bet o‘qish odatini o‘rnatish',
      'Kitob klubiga a’zo bo‘lish',
      'Birinchi ommaviy chiqishni qilish',
      'Har kuni kundalik yozishni boshlash',
    ],
  },
  oila: {
    emoji: '🏡',
    shablon: '{yil}-yilgacha {narsa} va oilam uchun {son} jamg‘arma yaratish',
    narsalar: ['o‘z uyimni qurish', 'barcha qarzlardan xalos bo‘lish', 'farzandlarimga ta’lim fondi ochish', 'ota-onamni Hajga yuborish'],
    sonlar: ['$10 ming', '$50 ming', '$100 ming', '$500 ming', '$1 mln'],
    kpi: { nom: 'Oilaviy jamg‘arma', birlik: '' },
    tramplin: [
      'Avlodlarga qoladigan oilaviy biznes qurish',
      'Mahallada xayriya jamg‘armasi ochish',
      'Farzandlarimni xalqaro universitetlarda o‘qitish',
    ],
    qadamlar: [
      'Oilaviy byudjetni har oy yuritish',
      'Har oy daromadning 20% ini jamg‘arish',
      'Barcha qarzlarni to‘liq yopish',
      'Uy uchun yer yoki loyiha tanlash',
    ],
  },
}

const NEGALAR = [
  'Oilamga munosib hayot berishni xohlayman',
  'Kim ekanimni avvalo o‘zimga isbotlamoqchiman',
  'O‘zbekiston nomini dunyoga tanitmoqchiman',
  'Ota-onamning mehnatini oqlamoqchiman',
  'Farzandlarimga o‘rnak bo‘lmoqchiman',
  '“Imkonsiz” degan gapni yolg‘onga chiqarmoqchiman',
]

const QADRIYAT_EMOJI = {
  Halollik: '🤲',
  'Ozodlik / Erkinlik': '🕊️',
  'Oila farovonligi': '👨‍👩‍👧',
  'Jamiyatga hissa qo‘shish': '🤝',
  'Ilm / Professionalizm': '📚',
  'Moliyaviy mustaqillik': '💎',
  'Qalb xotirjamligi': '🌙',
  'Mas’uliyat': '⚖️',
  Sadoqat: '💍',
  Rivojlanish: '🌱',
}

const ODAMLAR = [
  { id: 'oila', e: '👨‍👩‍👧', nom: 'Oilam', son: 6, ibora: 'oilam farovon va xotirjam hayot kechiradi' },
  { id: 'jamoa', e: '🤝', nom: 'Jamoam', son: 50, ibora: 'jamoam barqaror ish va o‘sish imkoniga ega bo‘ladi' },
  { id: 'mijoz', e: '🛍️', nom: 'Mijozlar', son: 10000, ibora: 'mijozlarim sifatli xizmat va mahsulot oladi' },
  { id: 'mahalla', e: '🏘️', nom: 'Mahallam', son: 500, ibora: 'mahallam yangi imkoniyatlarga ega bo‘ladi' },
  { id: 'yoshlar', e: '🎓', nom: 'Yoshlar', son: 1000, ibora: 'yoshlar men orqali ilhom va ustoz topadi' },
  { id: 'vatan', e: '🇺🇿', nom: 'Vatanim', son: 1000000, ibora: 'Vatanim iqtisodi va obro‘siga hissa qo‘shiladi' },
  { id: 'dunyo', e: '🌍', nom: 'Dunyo', son: 10000000, ibora: 'dunyo O‘zbekistondan chiqqan yechimni ko‘radi' },
]

const UMUMIY_QADAMLAR = [
  'Maqsadni yozib, har kuni ko‘z oldimda tutish',
  'Ustoz topish va har oy maslahat olish',
  'Sohani chuqur o‘rganish (kitob, kurs)',
  'Birinchi kichik natijaga erishish',
  'Kerakli boshlang‘ich mablag‘ni jamg‘arish',
  'Hamfikrlar jamoasini yig‘ish',
  'Kunlik tartib va odatlarni o‘rnatish',
  'Natijani 2 barobar oshirish',
  'Jarayonni tizimlashtirish',
  'Katta hamkor bilan shartnoma imzolash',
  'Maqsadni ommaga e’lon qilish',
  'Natijani o‘lchab, rejani tuzatish',
]

const BORONLAR = [
  { e: '💸', nom: 'Pul tugab qoldi', qalqonlar: ['Xarajatlarni 30% qisqartirib, zaxira fondga o‘taman', 'Investor yoki sherik qidiraman', 'Qo‘shimcha daromad manbaini ochaman'] },
  { e: '🚪', nom: 'Jamoadan asosiy odam ketdi', qalqonlar: ['Bilimlarni oldindan hujjatlashtirib qo‘yaman', 'Zaxira nomzodlar ro‘yxatini tutaman', 'Vazifalarni jamoa bo‘ylab taqsimlayman'] },
  { e: '⚔️', nom: 'Kuchli raqobatchi paydo bo‘ldi', qalqonlar: ['Mijozlarga yaqinroq bo‘lib, xizmatni yaxshilayman', 'Tor segmentga e’tibor qarataman', 'Raqobatchidan o‘rganib, tezroq harakat qilaman'] },
  { e: '🤒', nom: 'Sog‘lig‘im yomonlashdi', qalqonlar: ['Har kuni 30 daqiqa sportni majburiy qilaman', 'Vazifalarni ishonchli odamga topshiraman', 'Yiliga 2 marta tibbiy ko‘rikdan o‘taman'] },
  { e: '⏳', nom: 'Vaqt yetmay qoldi', qalqonlar: ['Eng muhim 3 vazifaga e’tibor qarataman', 'Ortiqcha majburiyatlardan voz kechaman', 'Muddatni qayta rejalab, tezlashaman'] },
  { e: '📉', nom: 'Bozor o‘zgarib ketdi', qalqonlar: ['Mahsulotni yangi talabga moslashtiraman', 'Yangi bozor yoki hududga chiqaman', 'Mijozlar bilan gaplashib, yo‘nalishni tuzataman'] },
  { e: '😞', nom: 'Motivatsiya so‘ndi', qalqonlar: ['Maqsad pasportimni qayta o‘qiyman', 'Ustozim bilan uchrashaman', 'Kichik g‘alabani nishonlab, kuch yig‘aman'] },
  { e: '🧱', nom: 'Ruxsatnoma to‘xtab qoldi', qalqonlar: ['Yurist bilan oldindan maslahatlashaman', 'Parallel ravishda boshqa yo‘lni tayyorlayman', 'Jarayonni har hafta kuzatib boraman'] },
  { e: '👎', nom: 'Yaqinlarim qo‘llab-quvvatlamadi', qalqonlar: ['Maqsadimning ularga foydasini tushuntiraman', 'Hamfikrlar davrasini topaman', 'Gap bilan emas, natija bilan isbotlayman'] },
  { e: '🌪️', nom: 'Kutilmagan inqiroz', qalqonlar: ['6 oylik zaxira fondini oldindan yig‘aman', 'Rejani minimal versiyaga qisqartiraman', 'Inqirozni imkoniyatga aylantirish yo‘lini izlayman'] },
]

const BOSS = {
  e: '🌋',
  nom: 'Katta sinov!',
  izoh: 'Marra oldidan hammasi birdan qiyinlashdi',
  qalqonlar: ['Pasportimni o‘qib, nega boshlaganimni eslayman', 'Butun jamoani bitta maqsadga safarbar qilaman', 'Rejaning eng zaif joyini oldindan mustahkamlayman'],
}

const OMAD = {
  e: '🍀',
  nom: 'Omad kulib boqdi!',
  izoh: 'Bu qadamda bo‘ron chiqmadi · +1 ❤️. Lekin dono odam baribir qalqon tayyorlaydi',
  qalqonlar: ['Har oy rejamni qayta ko‘rib chiqaman', 'Zaxira fondini oldindan yig‘aman', 'Ustozim bilan muntazam maslahatlashaman'],
}

const DALILLAR = [
  { id: 'pul', e: '💰', matn: 'Hisobimda maqsaddagi summa turibdi' },
  { id: 'kalit', e: '🔑', matn: 'O‘z ofisim yoki uyimning kaliti qo‘limda' },
  { id: 'sertifikat', e: '📜', matn: 'Sertifikat yoki diplom qo‘limda' },
  { id: 'shartnoma', e: '✍️', matn: 'Muhim shartnoma imzolangan' },
  { id: 'mahsulot', e: '📱', matn: 'Mahsulotim tayyor, odamlar undan foydalanyapti' },
  { id: 'hisobot', e: '📈', matn: 'Hisobot rejadagi raqamni ko‘rsatmoqda' },
  { id: 'mukofot', e: '🏆', matn: 'Mukofot yoki rasmiy tan olinish qo‘limda' },
  { id: 'surat', e: '📸', matn: 'Marra chizig‘idagi suratim bor' },
]

/* ==========================================================================
 *  3. YORDAMCHILAR
 * ========================================================================== */

const aralash = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const raqamFormat = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** 10 ta tosh muddatlari — bugundan maqsad yilining oxirigacha teng bo'lingan */
function muddatlar(yil) {
  const s = new Date()
  s.setHours(12, 0, 0, 0)
  const e = new Date(yil, 11, 31, 12)
  return Array.from({ length: TOSHLAR }, (_, i) =>
    i === TOSHLAR - 1 ? sanaKalit(e) : sanaKalit(new Date(s.getTime() + ((e - s) * (i + 1)) / TOSHLAR))
  )
}

function maqsadMatni(g1) {
  const o = OLAM[g1.soha]
  if (!o) return ''
  if (g1.ozim) return g1.matn
  return o.shablon
    .replace('{yil}', g1.yil)
    .replace('{son}', o.sonlar[g1.sonIdx])
    .replace('{narsa}', g1.narsa || '___')
}

function tramplinMatni(g2) {
  return (g2.tramplinOzim ? g2.tramplinMatn : g2.tramplin).trim()
}

function qasamyodMatni(h) {
  if (h.fin.tahrir && h.fin.matn.trim()) return h.fin.matn.trim()
  const ism = h.fin.ism.trim() || '…'
  return `Men, ${ism}, ${h.g1.yil}-yilgacha shu maqsadga erishishga so‘z beraman: «${maqsadMatni(h.g1)}». Har kuni kamida bitta qadam tashlayman. Bo‘ron chiqsa — qalqonim tayyor. Chekinmayman.`
}

function statistika(h) {
  const yulduz = h.yiqilish === 0 ? 3 : h.yiqilish <= 2 ? 2 : 1
  const unvon = h.xp >= 1800 ? 'Ustoz' : h.xp >= 1200 ? 'Usta' : 'Shogird'
  return { yulduz, unvon }
}

function hodisaMalumot(hodisa) {
  if (!hodisa) return null
  if (hodisa.tur === 'boss') return BOSS
  if (hodisa.tur === 'omad') return OMAD
  return BORONLAR[hodisa.idx] || BORONLAR[0]
}

const boshHolat = () => ({
  v: 1,
  ekran: 'intro',
  xp: 0,
  yurak: 3,
  yiqilish: 0,
  tezkor: 0,
  kombo: 0,
  engKombo: 0,
  qalqonlar: 0,
  berildi: {},
  g1: { soha: '', narsa: '', sonIdx: 1, yil: YIL + 4, ozim: false, matn: '', jizillash: 5, nega: [] },
  g2: { qadriyatlar: [], odamlar: [], tramplin: '', tramplinOzim: false, tramplinMatn: '' },
  g3: {
    joriy: 0,
    faza: 'qadam',
    qadamlar: Array.from({ length: TOSHLAR }, () => ({ nom: '', a: '', b: '' })),
    navbat: aralash(BORONLAR.map((_, i) => i)),
    navbatIdx: 0,
    omadlar: aralash([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 2),
    koloda: [],
    hodisa: null,
  },
  g4: { belgilar: [], jackpot: false },
  fin: { ism: '', tahrir: false, matn: '', muhr: false },
})

function oyinOqish() {
  try {
    const raw = localStorage.getItem(KALIT)
    if (!raw) return null
    const h = JSON.parse(raw)
    if (h?.v !== 1 || !h.g1 || !h.g2 || !h.g3 || !h.g4 || !h.fin) return null
    return { ...boshHolat(), ...h }
  } catch {
    return null
  }
}

/** O'yin natijasini anketa bilan bir xil ma'lumot tuzilmasiga aylantirish */
export function natijaMalumot(h) {
  const o = OLAM[h.g1.soha]
  const soha = SOHALAR.find((s) => s.id === h.g1.soha)
  const md = muddatlar(h.g1.yil)
  const odamlar = ODAMLAR.filter((x) => h.g2.odamlar.includes(x.id))
  const st = statistika(h)
  const hozir = new Date().toISOString()
  return {
    qadam1: {
      soha: soha?.nom || '',
      maqsad: maqsadMatni(h.g1).trim(),
      jizillash: h.g1.jizillash,
      nega: `${h.g1.nega.join('. ')}.`,
    },
    qadam2: {
      qadriyatlar: [...h.g2.qadriyatlar],
      manfaat: `Bu maqsadga erishsam: ${odamlar.map((x) => x.ibora).join('; ')}.`,
      tramplin: tramplinMatni(h.g2),
    },
    qadam3: {
      qadamlar: h.g3.qadamlar.map((q, i) => ({
        id: `q${i + 1}`,
        raqam: i + 1,
        nom: q.nom,
        muddat: md[i],
        straxovkaA: q.a,
        straxovkaB: q.b,
        bajarildi: false,
      })),
    },
    qadam4: {
      belgilar: DALILLAR.filter((d) => h.g4.belgilar.includes(d.id)).map((d) => ({ id: `b-${d.id}`, matn: d.matn, done: false })),
      kpilar: [{ id: 'k-oyin', nom: o.kpi.nom, qiymat: o.sonlar[h.g1.sonIdx], birlik: o.kpi.birlik, muddat: md[TOSHLAR - 1] }],
      qasamyod: qasamyodMatni(h),
      imzo: h.fin.ism.trim(),
      sana: bugun(),
      tasdiq: true,
    },
    meta: { yaratilgan: hozir, yangilangan: hozir, manba: 'oyin', oyin: { xp: h.xp, yulduz: st.yulduz, unvon: st.unvon } },
  }
}

/* ==========================================================================
 *  4. UI ELEMENTLARI
 * ========================================================================== */

/** Qalin "3D" o'yin tugmasi */
function OyinTugma({ children, onClick, variant = 'oltin', className, disabled, ...rest }) {
  const v = {
    oltin:
      'bg-gradient-to-b from-amber-300 to-orange-500 text-[#1a1033] shadow-[0_6px_0_#9a3412,0_14px_30px_-10px_rgba(251,146,60,.7)] active:translate-y-[4px] active:shadow-[0_2px_0_#9a3412]',
    yashil:
      'bg-gradient-to-b from-emerald-300 to-emerald-500 text-[#06281c] shadow-[0_6px_0_#047857] active:translate-y-[4px] active:shadow-[0_2px_0_#047857]',
    shaffof: 'bg-white/[.08] text-white ring-1 ring-white/15 hover:bg-white/[.12] active:scale-[.97]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'no-tap-highlight inline-flex min-h-[52px] select-none items-center justify-center gap-2 rounded-2xl px-6 text-[15.5px] font-extrabold tracking-wide transition-all',
        v[variant],
        disabled && 'opacity-40',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Tanlanadigan kafel */
function Kafel({ tanlangan, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={tanlangan}
      className={cx(
        'no-tap-highlight relative select-none rounded-2xl p-3 text-left transition-all duration-200 active:scale-[.96]',
        tanlangan
          ? 'bg-amber-300/[.16] ring-2 ring-amber-300 shadow-[0_0_24px_-6px_rgba(252,211,77,.6)]'
          : 'bg-white/[.06] ring-1 ring-white/10 hover:bg-white/[.1]',
        className
      )}
    >
      {children}
      {tanlangan ? (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-300 text-[11px] font-black text-[#1a1033]">
          ✓
        </span>
      ) : null}
    </button>
  )
}

/** Bosqich bo'limi — avvalgisi tugamaguncha qulflangan */
function Bolim({ raqam, sarlavha, izoh, ochiq, bajarildi, innerRef, children }) {
  return (
    <section
      ref={innerRef}
      className={cx(
        'scroll-mt-[calc(var(--safe-top)+76px)] rounded-3xl p-4 ring-1 transition-all duration-500 sm:p-5',
        ochiq ? 'bg-white/[.05] ring-white/10' : 'pointer-events-none bg-white/[.02] opacity-40 ring-white/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cx(
            'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-black',
            bajarildi ? 'bg-emerald-400 text-[#06281c]' : ochiq ? 'bg-amber-300 text-[#1a1033]' : 'bg-white/10 text-white/50'
          )}
        >
          {bajarildi ? '✓' : ochiq ? raqam : '🔒'}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold leading-tight">{sarlavha}</h3>
          {izoh ? <p className="mt-0.5 text-[12.5px] leading-snug text-white/55">{izoh}</p> : null}
        </div>
      </div>
      {ochiq ? children : <p className="text-[12.5px] text-white/50">Avvalgi qismni tugating</p>}
    </section>
  )
}

/** Bo'lim ochilganda unga silliq skroll */
function useOchilishSkroll(ochiq, ref) {
  const oldin = useRef(ochiq)
  useEffect(() => {
    if (ochiq && !oldin.current) {
      const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280)
      oldin.current = ochiq
      return () => clearTimeout(t)
    }
    oldin.current = ochiq
    return undefined
  }, [ochiq, ref])
}

/** Konfetti — 70 ta bo'lakcha */
function Konfetti() {
  const bolaklar = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        i,
        chap: Math.random() * 100,
        rang: ['#fcd34d', '#f472b6', '#818cf8', '#34d399', '#fb923c', '#ffffff'][i % 6],
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 9,
        dur: 1.5 + Math.random() * 1.2,
        delay: Math.random() * 0.35,
        dx: (Math.random() - 0.5) * 180,
        rot: (Math.random() - 0.5) * 1440,
      })),
    []
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden="true">
      {bolaklar.map((b) => (
        <span
          key={b.i}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${b.chap}%`,
            width: b.w,
            height: b.h,
            background: b.rang,
            '--dx': `${b.dx}px`,
            '--rot': `${b.rot}deg`,
            animation: `konfetti ${b.dur}s cubic-bezier(.2,.6,.4,1) ${b.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

/** Urib turuvchi yurak — tezligi jizillashga bog'liq */
function UruvchiYurak({ qiymat }) {
  const issiq = qiymat >= 7
  const davr = Math.max(0.45, 1.5 - qiymat * 0.1)
  const rang = issiq ? ['#fb7185', '#e11d48'] : qiymat >= 4 ? ['#fda4af', '#be7185'] : ['#94a3b8', '#64748b']
  return (
    <svg
      viewBox="0 0 64 58"
      className="h-28 w-28 drop-shadow-[0_10px_30px_rgba(244,63,94,.45)]"
      style={{ animation: `yurakUrish ${davr}s ease-in-out infinite` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="yurakRang" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rang[0]} />
          <stop offset="1" stopColor={rang[1]} />
        </linearGradient>
      </defs>
      <path
        d="M32 56S2 38 2 18C2 8.6 9.4 2 18 2c6 0 11 3.2 14 8 3-4.8 8-8 14-8 8.6 0 16 6.6 16 16 0 20-30 38-30 38z"
        fill="url(#yurakRang)"
      />
      <path d="M14 14c2-4 6-6 10-5" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** Taymer halqasi */
function Taymer({ qolgan, jami }) {
  const r = 22
  const uz = 2 * Math.PI * r
  const ulush = Math.max(0, Math.min(1, qolgan / jami))
  const xavf = qolgan < 3500
  return (
    <div className={cx('relative grid h-14 w-14 place-items-center', xavf && qolgan > 0 && 'animate-[tebranish_.35s_ease-in-out_infinite]')}>
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="5" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={xavf ? '#fb7185' : '#fcd34d'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={uz}
          strokeDashoffset={uz * (1 - ulush)}
          style={{ transition: 'stroke-dashoffset .1s linear' }}
        />
      </svg>
      <span className={cx('font-mono text-[17px] font-bold', xavf ? 'text-rose-300' : 'text-amber-200')}>
        {Math.ceil(qolgan / 1000)}
      </span>
    </div>
  )
}

/** Sanab boruvchi raqam (ta'sir doirasi uchun) */
function useSanoq(qiymat) {
  const [ko, setKo] = useState(qiymat)
  const oldin = useRef(qiymat)
  useEffect(() => {
    const boshi = oldin.current
    oldin.current = qiymat
    if (boshi === qiymat) return undefined
    const t0 = performance.now()
    let id
    const qadam = (t) => {
      const p = Math.min(1, (t - t0) / 700)
      setKo(boshi + (qiymat - boshi) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) id = requestAnimationFrame(qadam)
    }
    id = requestAnimationFrame(qadam)
    return () => cancelAnimationFrame(id)
  }, [qiymat])
  return ko
}

/** Yuqori panel: orqaga, darvozalar, yuraklar, XP */
function Hud({ h, ovoz, onOvoz, onExit, popuplar }) {
  const darvoza = { g1: 1, g2: 2, g3: 3, g4: 4, final: 5, natija: 6 }[h.ekran] || 0
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0a24]/85 pt-[calc(var(--safe-top)+8px)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-xl items-center gap-2 px-3 pb-2.5">
        <button
          type="button"
          onClick={onExit}
          aria-label="Bosh sahifa"
          className="no-tap-highlight grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.08] text-white/80 ring-1 ring-white/10 active:scale-95"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>

        {darvoza > 0 ? (
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {DARVOZALAR.map((d) => (
              <span
                key={d.n}
                title={d.nom}
                className={cx(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12.5px] transition-all',
                  d.n < darvoza && 'bg-amber-300/90',
                  d.n === darvoza && 'bg-white/15 ring-2 ring-amber-300 animate-[porlash_1.8s_infinite]',
                  d.n > darvoza && 'bg-white/[.06] opacity-45'
                )}
              >
                {d.n < darvoza ? '✓' : d.emoji}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex shrink-0 items-center" aria-label={`${h.yurak} ta yurak`}>
          {[0, 1, 2].map((i) => (
            <Heart
              key={`${i}-${h.yurak > i}`}
              className={cx('h-4 w-4 transition-all', h.yurak > i ? 'text-rose-400' : 'text-white/20', h.yurak > i && 'animate-pop')}
              fill="currentColor"
              strokeWidth={0}
            />
          ))}
        </div>

        <div className="relative shrink-0">
          <span className="inline-flex min-w-[58px] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-amber-300/15 px-2 py-1 font-mono text-[12.5px] font-bold text-amber-200 ring-1 ring-amber-300/30">
            ⭐ {h.xp}
          </span>
          <div className="pointer-events-none absolute right-0 top-full mt-3 flex flex-col items-end gap-1">
            {popuplar.map((p) => (
              <span
                key={p.id}
                className={cx(
                  'whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-extrabold',
                  p.yomon ? 'bg-rose-500 text-white' : 'bg-amber-300 text-[#1a1033]'
                )}
                style={{ animation: 'xpUchish 1.15s ease-out forwards' }}
              >
                {p.n ? `+${p.n} ` : ''}
                {p.matn}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onOvoz}
          aria-label={ovoz ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
          className="no-tap-highlight grid h-9 w-7 shrink-0 place-items-center rounded-xl text-white/60 active:scale-95"
        >
          {ovoz ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
 *  5. EKRANLAR
 * ========================================================================== */

function Intro({ mavjudMaqsad, onStart }) {
  return (
    <div className="py-3 text-center">
      <div className="mx-auto mb-2 text-[48px] leading-none animate-floaty">🎯</div>
      <h1
        className="font-display text-[44px] font-semibold leading-none tracking-tight sm:text-[56px]"
        style={{
          backgroundImage: 'linear-gradient(90deg,#fde68a,#fb923c,#f472b6,#fde68a)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'jilo 6s linear infinite',
        }}
      >
        Jizillash
      </h1>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[.28em] text-white/55">Maqsad o‘yini · 4 darvoza · 5 daqiqa</p>

      <ul className="mx-auto mt-5 w-full max-w-sm space-y-2 text-left">
        {[
          ['🔥', 'Uchqun', 'Yurakni jizillatadigan maqsad yasang'],
          ['🛡️', 'Qalqon', 'Qadriyatlaringizni qurol qiling'],
          ['🎲', 'Yo‘l', '10 toshli yo‘lda bo‘ronlardan o‘ting'],
          ['🏆', 'Dalil', 'Jackpotni yutib, qasamyod bilan muhrlang'],
        ].map(([e, nom, izoh], i) => (
          <li
            key={nom}
            className="flex animate-fadeUp items-center gap-3 rounded-2xl bg-white/[.05] px-3 py-2.5 ring-1 ring-white/10"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.08] text-[19px]">{e}</span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-[.2em] text-amber-300/80">
                {i + 1}-darvoza · {nom}
              </span>
              <span className="block text-[14px] font-semibold text-white/90">{izoh}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-4 max-w-sm text-[12.5px] leading-relaxed text-white/60">
        Har bo‘ronda taymer bor — tez o‘ylang! 3 ta ❤️ bilan boshlaysiz. Yakunda —{' '}
        <span className="font-semibold text-amber-200">Strategik maqsad pasportingiz</span> tayyor.
      </p>

      {/* Asosiy tugma pastga yopishgan — kichik ekran va Telegram safe-area'da ham doim ko'rinadi */}
      <div className="sticky bottom-0 -mx-4 mt-5 bg-gradient-to-t from-[#0c0a24] via-[#0c0a24]/95 to-transparent px-4 pb-[calc(var(--safe-bottom)+12px)] pt-6">
        <OyinTugma onClick={onStart} className="mx-auto w-full max-w-sm text-[17px]">
          ▶ O‘YINNI BOSHLASH
        </OyinTugma>
      </div>

      {mavjudMaqsad ? (
        <p className="mx-auto mt-4 max-w-sm text-[11.5px] leading-relaxed text-white/45">
          Diqqat: o‘yin yakunida joriy maqsad pasportingiz yangisi bilan almashtiriladi.
        </p>
      ) : null}
    </div>
  )
}

/** Maqsad gapi — bo'sh joylar ajratib ko'rsatiladi */
function MaqsadGapi({ g1 }) {
  const o = OLAM[g1.soha]
  if (!o) return null
  if (g1.ozim) return <span>{g1.matn || '…'}</span>
  const qiymat = { '{yil}': `${g1.yil}`, '{son}': o.sonlar[g1.sonIdx], '{narsa}': g1.narsa }
  return o.shablon.split(/(\{yil\}|\{son\}|\{narsa\})/).map((b, i) =>
    qiymat[b] !== undefined ? (
      qiymat[b] ? (
        <span key={i} className="rounded-md bg-amber-300/20 px-1 text-amber-200 decoration-amber-300/60 underline-offset-4">
          {qiymat[b]}
        </span>
      ) : (
        <span key={i} className="animate-pulse rounded-md bg-white/10 px-2 text-white/40">
          ? ? ?
        </span>
      )
    ) : (
      <span key={i}>{b}</span>
    )
  )
}

function Darvoza1({ api }) {
  const g = api.h.g1
  const o = OLAM[g.soha]
  const set = (p) => api.set('g1', p)
  const jz = JIZILLASH[Math.min(Math.max(g.jizillash, 1), 10) - 1]
  const refB = useRef(null)
  const refC = useRef(null)
  const refD = useRef(null)

  const aTayyor = !!g.soha
  const bTayyor = aTayyor && (g.ozim ? g.matn.trim().length >= 15 : !!g.narsa)
  const cTayyor = bTayyor && g.jizillash >= 7
  const dTayyor = cTayyor && g.nega.length > 0
  useOchilishSkroll(aTayyor, refB)
  useOchilishSkroll(bTayyor, refC)
  useOchilishSkroll(cTayyor, refD)

  const kattalashtir = () => {
    if (g.sonIdx >= o.sonlar.length - 1) {
      api.ogoh('Bu allaqachon eng katta daraja! 🔥')
      return
    }
    set({ sonIdx: g.sonIdx + 1, jizillash: Math.min(10, g.jizillash + 1), ozim: false })
    api.sfx('yurak')
    api.hap('medium')
    api.xp(15, '×10 kattaroq!', `g1-x10-${g.sonIdx}`)
  }

  return (
    <div className="space-y-4">
      <DarvozaSarlavha n={1} />

      <Bolim raqam={1} sarlavha="Qaysi olamda?" izoh="Maqsadingiz yashaydigan sohani tanlang" ochiq bajarildi={aTayyor}>
        <div className="grid grid-cols-2 gap-2.5">
          {SOHALAR.map((s) => (
            <Kafel
              key={s.id}
              tanlangan={g.soha === s.id}
              onClick={() => {
                set({ soha: s.id, narsa: '', ozim: false, matn: '' })
                api.sfx('tanla')
                api.hap('light')
                api.xp(10, 'Olam tanlandi', 'g1-soha')
              }}
              className="flex items-center gap-2.5"
            >
              <span className="text-[26px] leading-none">{OLAM[s.id].emoji}</span>
              <span className="text-[13.5px] font-bold leading-tight">{s.nom}</span>
            </Kafel>
          ))}
        </div>
      </Bolim>

      <Bolim
        raqam={2}
        innerRef={refB}
        sarlavha="Maqsadingizni yasang"
        izoh="Kartalarni tanlang — gap o‘zi yig‘iladi"
        ochiq={aTayyor}
        bajarildi={bTayyor}
      >
        {o ? (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/15 p-4 ring-1 ring-white/10">
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/50">Mening maqsadim</p>
              <p className="font-display mt-2 text-[20px] font-semibold leading-snug">
                <MaqsadGapi g1={g} />
              </p>
            </div>

            {g.ozim ? (
              <textarea
                value={g.matn}
                onChange={(e) => set({ matn: e.target.value })}
                rows={4}
                maxLength={300}
                className="mt-3 w-full rounded-2xl bg-white/[.07] p-3.5 text-[16px] leading-relaxed text-white outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-2 focus:ring-amber-300"
                placeholder="Maqsadingizni o‘zingiz yozing…"
              />
            ) : (
              <div className="mt-4 space-y-3.5">
                <SlotQator nom="Nima?">
                  {o.narsalar.map((n) => (
                    <Chipcha
                      key={n}
                      faol={g.narsa === n}
                      onClick={() => {
                        set({ narsa: n })
                        api.sfx('tap')
                        api.xp(5, null, 'g1-narsa')
                      }}
                    >
                      {n}
                    </Chipcha>
                  ))}
                </SlotQator>
                <SlotQator nom="Qancha?">
                  {o.sonlar.map((n, i) => (
                    <Chipcha
                      key={n}
                      faol={g.sonIdx === i}
                      onClick={() => {
                        set({ sonIdx: i })
                        api.sfx('tap')
                        api.xp(5, null, 'g1-son')
                      }}
                    >
                      {n}
                    </Chipcha>
                  ))}
                  <button
                    type="button"
                    onClick={kattalashtir}
                    className={cx(
                      'no-tap-highlight rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3.5 py-2 text-[13px] font-black shadow-[0_0_20px_-4px_rgba(244,63,94,.8)] active:scale-95',
                      g.jizillash < 7 && 'animate-[tebranish_.6s_ease-in-out_infinite]'
                    )}
                  >
                    ×10 🔥
                  </button>
                </SlotQator>
                <SlotQator nom="Qachongacha?">
                  {Array.from({ length: 8 }, (_, i) => YIL + 1 + i).map((y) => (
                    <Chipcha
                      key={y}
                      faol={g.yil === y}
                      onClick={() => {
                        set({ yil: y })
                        api.sfx('tap')
                        api.xp(5, null, 'g1-yil')
                      }}
                    >
                      {y}
                    </Chipcha>
                  ))}
                </SlotQator>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                set(g.ozim ? { ozim: false } : { ozim: true, matn: maqsadMatni(g).replace('___', '').trim() })
                api.sfx('tap')
              }}
              className="no-tap-highlight mt-3 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[12.5px] font-semibold text-white/60 active:scale-95"
            >
              <Pencil className="h-3.5 w-3.5" />
              {g.ozim ? 'Kartalarga qaytish' : 'O‘zim yozaman'}
            </button>
          </>
        ) : null}
      </Bolim>

      <Bolim
        raqam={3}
        innerRef={refC}
        sarlavha="Yurak testi"
        izoh="Rostini ayting: bu maqsad yuragingizni qanchalik jizillatadi?"
        ochiq={bTayyor}
        bajarildi={cTayyor}
      >
        <div className="flex flex-col items-center">
          <UruvchiYurak qiymat={g.jizillash} />
          <p className="mt-1 font-mono text-[28px] font-bold">
            {g.jizillash}
            <span className="text-[15px] text-white/40">/10</span>
          </p>
          <p className="text-[13px] font-semibold text-rose-200">
            {jz.emoji} {jz.label}
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={g.jizillash}
            aria-label="Jizillash darajasi"
            onChange={(e) => {
              const v = Number(e.target.value)
              set({ jizillash: v })
              if (v >= 7 && g.jizillash < 7) {
                api.sfx('yurak')
                api.hap('heavy')
                api.xp(20, 'Yurak jizilladi!', 'g1-yurak')
              }
            }}
            className="range-fire mt-4 w-full"
            style={{
              background: `linear-gradient(90deg,#f97316,#e11d48 ${g.jizillash * 10}%,rgba(255,255,255,.15) ${g.jizillash * 10}%)`,
            }}
          />
          <p
            className={cx(
              'mt-3 rounded-xl px-3 py-2 text-center text-[12.5px] leading-relaxed',
              g.jizillash >= 7 ? 'bg-emerald-400/15 text-emerald-200' : 'bg-sky-400/10 text-sky-200'
            )}
          >
            {g.jizillash >= 7
              ? '🔥 Ana shu! Bu maqsad sizni harakatga undaydi.'
              : '❄️ Yurak hali sovuq. Maqsadni ×10 bilan kattalashtiring yoki rostini belgilang — kamida 7 kerak.'}
          </p>
        </div>
      </Bolim>

      <Bolim raqam={4} innerRef={refD} sarlavha="Nega aynan bu?" izoh="1–3 ta sabab — qiyin kunlarda shular ushlab turadi" ochiq={cTayyor} bajarildi={dTayyor}>
        <div className="flex flex-wrap gap-2">
          {NEGALAR.map((n, i) => (
            <Chipcha
              key={n}
              faol={g.nega.includes(n)}
              onClick={() => {
                if (g.nega.includes(n)) set({ nega: g.nega.filter((x) => x !== n) })
                else if (g.nega.length >= 3) api.ogoh('Eng kuchli 3 ta sabab yetarli')
                else {
                  set({ nega: [...g.nega, n] })
                  api.sfx('tanla')
                  api.xp(10, null, `g1-nega-${i}`)
                }
              }}
            >
              {n}
            </Chipcha>
          ))}
        </div>
      </Bolim>

      <OyinTugma onClick={() => api.ochish(1)} className="w-full">
        🔓 1-DARVOZANI OCHISH
      </OyinTugma>
    </div>
  )
}

function SlotQator({ nom, children }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[.2em] text-white/45">{nom}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chipcha({ faol, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={faol}
      className={cx(
        'no-tap-highlight select-none rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95',
        faol ? 'bg-amber-300 text-[#1a1033] shadow-[0_0_18px_-4px_rgba(252,211,77,.8)]' : 'bg-white/[.08] text-white/85 ring-1 ring-white/12'
      )}
    >
      {children}
    </button>
  )
}

function DarvozaSarlavha({ n }) {
  const d = DARVOZALAR[n - 1]
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300/25 to-rose-400/20 text-[30px] ring-1 ring-amber-300/30">
        {d.emoji}
      </span>
      <div>
        <p className="font-mono text-[10.5px] uppercase tracking-[.24em] text-amber-300/80">{n}-darvoza</p>
        <h2 className="font-display text-[26px] font-semibold leading-none">{d.nom}</h2>
        <p className="mt-1 text-[12.5px] text-white/55">{d.izoh}</p>
      </div>
    </div>
  )
}

function Darvoza2({ api }) {
  const g = api.h.g2
  const o = OLAM[api.h.g1.soha]
  const set = (p) => api.set('g2', p)
  const refB = useRef(null)
  const refC = useRef(null)
  const aTayyor = g.qadriyatlar.length === 3
  const bTayyor = aTayyor && g.odamlar.length >= 2
  const cTayyor = bTayyor && tramplinMatni(g).length >= 10
  useOchilishSkroll(aTayyor, refB)
  useOchilishSkroll(bTayyor, refC)
  const tasir = ODAMLAR.filter((x) => g.odamlar.includes(x.id)).reduce((s, x) => s + x.son, 0)
  const tasirKo = useSanoq(tasir)

  return (
    <div className="space-y-4">
      <DarvozaSarlavha n={2} />

      <Bolim
        raqam={1}
        sarlavha={`3 ta qalqon tanlang · ${g.qadriyatlar.length}/3`}
        izoh="Maqsad qaysi qadriyatlaringizni himoya qiladi?"
        ochiq
        bajarildi={aTayyor}
      >
        <div className="grid grid-cols-2 gap-2">
          {QADRIYATLAR.map((q) => {
            const tanlangan = g.qadriyatlar.includes(q)
            return (
              <Kafel
                key={q}
                tanlangan={tanlangan}
                onClick={() => {
                  if (tanlangan) {
                    set({ qadriyatlar: g.qadriyatlar.filter((x) => x !== q) })
                    api.sfx('tap')
                  } else if (g.qadriyatlar.length >= 3) {
                    api.ogoh('Faqat 3 ta qalqon — avval birini qo‘yib yuboring')
                    api.sfx('xato')
                  } else {
                    set({ qadriyatlar: [...g.qadriyatlar, q] })
                    api.sfx('tanla')
                    api.hap('light')
                    api.xp(10, '🛡️', `g2-q-${q}`)
                  }
                }}
                className="flex items-center gap-2"
              >
                <span className="text-[22px] leading-none">{QADRIYAT_EMOJI[q] || '✨'}</span>
                <span className="text-[13px] font-bold leading-tight">{q}</span>
              </Kafel>
            )
          })}
        </div>
      </Bolim>

      <Bolim
        raqam={2}
        innerRef={refB}
        sarlavha="Kim foyda ko‘radi?"
        izoh="Kamida 2 guruh — faqat o‘zing uchun maqsad tez so‘nadi"
        ochiq={aTayyor}
        bajarildi={bTayyor}
      >
        <div className="grid grid-cols-3 gap-2">
          {ODAMLAR.map((x) => {
            const tanlangan = g.odamlar.includes(x.id)
            return (
              <Kafel
                key={x.id}
                tanlangan={tanlangan}
                onClick={() => {
                  set({ odamlar: tanlangan ? g.odamlar.filter((y) => y !== x.id) : [...g.odamlar, x.id] })
                  api.sfx(tanlangan ? 'tap' : 'tanla')
                  if (!tanlangan) api.xp(10, null, `g2-o-${x.id}`)
                }}
                className="flex flex-col items-center gap-1 py-3 text-center"
              >
                <span className="text-[28px] leading-none">{x.e}</span>
                <span className="text-[12px] font-bold">{x.nom}</span>
              </Kafel>
            )
          })}
        </div>
        <div className="mt-3 rounded-2xl bg-white/[.05] p-3 text-center ring-1 ring-white/10">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">Ta’sir doirasi</p>
          <p className="mt-1 font-mono text-[26px] font-bold text-emerald-300">{raqamFormat(tasirKo)}</p>
          <p className="text-[11.5px] text-white/50">kishi hayotiga ta’sir qilasiz</p>
        </div>
      </Bolim>

      <Bolim
        raqam={3}
        innerRef={refC}
        sarlavha="Tramplin — keyingi cho‘qqi"
        izoh="Bu maqsad qaysi undan ham kattaroq maqsadga ko‘prik bo‘ladi?"
        ochiq={bTayyor}
        bajarildi={cTayyor}
      >
        <div className="space-y-2">
          {o?.tramplin.map((t) => (
            <Kafel
              key={t}
              tanlangan={!g.tramplinOzim && g.tramplin === t}
              onClick={() => {
                set({ tramplin: t, tramplinOzim: false })
                api.sfx('tanla')
                api.xp(20, '🚀 Tramplin', 'g2-tramplin')
              }}
              className="flex w-full items-center gap-2.5"
            >
              <span className="text-[20px]">🚀</span>
              <span className="text-[13.5px] font-semibold">{t}</span>
            </Kafel>
          ))}
          {g.tramplinOzim ? (
            <input
              value={g.tramplinMatn}
              onChange={(e) => set({ tramplinMatn: e.target.value })}
              maxLength={160}
              placeholder="Keyingi cho‘qqim…"
              className="w-full rounded-2xl bg-white/[.07] p-3.5 text-[16px] text-white outline-none ring-2 ring-amber-300 placeholder:text-white/35"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                set({ tramplinOzim: true })
                api.xp(20, '🚀 Tramplin', 'g2-tramplin')
              }}
              className="no-tap-highlight inline-flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] font-semibold text-white/60"
            >
              <Pencil className="h-3.5 w-3.5" /> O‘zim yozaman
            </button>
          )}
        </div>
      </Bolim>

      <OyinTugma onClick={() => api.ochish(2)} className="w-full">
        🔓 2-DARVOZANI OCHISH
      </OyinTugma>
    </div>
  )
}

function Darvoza3({ api }) {
  const h = api.h
  const g = h.g3
  const tosh = g.joriy
  const md = useMemo(() => muddatlar(h.g1.yil), [h.g1.yil])
  const [aylanmoqda, setAylanmoqda] = useState(false)
  const [yurish, setYurish] = useState(false)
  const [qolgan, setQolgan] = useState(BORON_VAQT)
  const [vaqtTugadi, setVaqtTugadi] = useState(false)
  const [ozimMatn, setOzimMatn] = useState('')
  const startRef = useRef(0)
  const yolRef = useRef(null)
  const band = useRef(false)

  const hod = hodisaMalumot(g.hodisa)
  const limit = g.hodisa?.tur === 'boss' ? BOSS_VAQT : BORON_VAQT
  const taymerli = g.faza === 'boron' && g.hodisa && g.hodisa.tur !== 'omad' && !vaqtTugadi

  // Joriy toshni ko'rinadigan joyga
  useEffect(() => {
    const el = yolRef.current?.querySelector(`[data-tosh="${Math.min(tosh, TOSHLAR - 1)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [tosh])

  // Bo'ron taymeri
  useEffect(() => {
    if (!taymerli) return undefined
    if (!startRef.current) startRef.current = performance.now()
    let oxirgiSek = null
    const id = setInterval(() => {
      const q = limit - (performance.now() - startRef.current)
      setQolgan(Math.max(0, q))
      const sek = Math.ceil(q / 1000)
      if (sek <= 3 && sek > 0 && sek !== oxirgiSek) {
        oxirgiSek = sek
        sfx('tik')
      }
      if (q <= 0) {
        clearInterval(id)
        setVaqtTugadi(true)
        api.yurakOl()
      }
    }, 100)
    return () => clearInterval(id)
    // api har renderda yangilanadi, lekin ichida faqat funksional yangilanishlar bor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taymerli, limit])

  const takliflar = useMemo(() => {
    const koloda = g.koloda.length ? g.koloda : UMUMIY_QADAMLAR
    const ishlatilgan = new Set(g.qadamlar.map((q) => q.nom))
    return koloda.filter((n) => !ishlatilgan.has(n)).slice(0, 3)
  }, [g.koloda, g.qadamlar])

  const qadamTanla = (nom, ozim) => {
    api.set('g3', (p) => ({ qadamlar: p.qadamlar.map((q, k) => (k === tosh ? { ...q, nom } : q)), faza: 'zar' }))
    api.xp(ozim ? 30 : 20, ozim ? '✍️ O‘z qadamingiz!' : '👣 Qadam', `g3-q-${tosh}`)
    api.sfx('tanla')
    api.hap('light')
    setOzimMatn('')
  }

  const zarTashla = () => {
    if (aylanmoqda) return
    setAylanmoqda(true)
    sfx('zar')
    hap('medium')
    setTimeout(() => {
      let hodisa
      if (tosh === TOSHLAR - 1) hodisa = { tur: 'boss' }
      else if (g.omadlar.includes(tosh)) hodisa = { tur: 'omad' }
      else hodisa = { tur: 'boron', idx: g.navbat[g.navbatIdx % g.navbat.length] }
      startRef.current = 0
      setVaqtTugadi(false)
      setQolgan(hodisa.tur === 'boss' ? BOSS_VAQT : BORON_VAQT)
      api.set('g3', (p) => ({ faza: 'boron', hodisa, navbatIdx: hodisa.tur === 'boron' ? p.navbatIdx + 1 : p.navbatIdx }))
      if (hodisa.tur === 'omad') {
        api.yurakQosh()
        api.xp(40, '🍀 Omad!', `g3-omad-${tosh}`)
        sfx('ok')
        hap('success')
      } else {
        sfx('boron')
        hap('heavy')
      }
      setAylanmoqda(false)
    }, 950)
  }

  const oldinga = () => {
    setYurish(true)
    sfx('tanla')
    setTimeout(() => {
      setYurish(false)
      band.current = false
      const keyingi = tosh + 1
      api.set('g3', { joriy: keyingi, faza: 'qadam', hodisa: null })
      api.xp(10, null, `g3-tosh-${tosh}`)
      if (keyingi === 5) {
        api.portla()
        api.popup('🎉 Yarim yo‘l!')
      }
      if (keyingi === TOSHLAR) api.ochish(3)
    }, 650)
  }

  const qalqonA = (matn) => {
    if (band.current) return
    band.current = true
    const otdi = performance.now() - startRef.current
    const tez = taymerli && otdi < TEZKOR
    if (taymerli) {
      if (tez) {
        const kombo = h.kombo + 1
        const bonus = kombo >= 2 ? 20 * (kombo - 1) : 0
        api.top((p) => ({ tezkor: p.tezkor + 1, kombo, engKombo: Math.max(p.engKombo, kombo) }))
        api.xp(80 + bonus, kombo >= 2 ? `⚡ TEZKOR ×${kombo}!` : '⚡ TEZKOR!', `g3-a-${tosh}`)
      } else {
        api.top({ kombo: 0 })
        api.xp(40, '🛡️ Qalqon!', `g3-a-${tosh}`)
      }
    } else {
      api.xp(g.hodisa?.tur === 'omad' ? 20 : 25, '🛡️ Qalqon', `g3-a-${tosh}`)
    }
    api.top((p) => ({ qalqonlar: p.qalqonlar + 1 }))
    sfx('ok')
    hap('success')
    const omad = g.hodisa?.tur === 'omad'
    api.set('g3', (p) => ({
      qadamlar: p.qadamlar.map((q, k) => (k === tosh ? { ...q, a: matn } : q)),
      faza: omad ? 'yurish' : 'qalqon2',
    }))
    if (omad) oldinga()
    else band.current = false
  }

  const qalqonB = (matn) => {
    if (band.current) return
    band.current = true
    if (matn) {
      api.set('g3', (p) => ({ qadamlar: p.qadamlar.map((q, k) => (k === tosh ? { ...q, b: matn } : q)) }))
      api.top((p) => ({ qalqonlar: p.qalqonlar + 1 }))
      api.xp(30, '🛡️🛡️ Ikki qavat!', `g3-b-${tosh}`)
    }
    oldinga()
  }

  const joriyQadam = g.qadamlar[Math.min(tosh, TOSHLAR - 1)]

  return (
    <div className="space-y-4">
      <DarvozaSarlavha n={3} />

      {/* --- Yo'l: 10 tosh --- */}
      <div className="rounded-3xl bg-white/[.04] p-3 ring-1 ring-white/10">
        <div className="mb-1 flex items-center justify-between px-1 text-[11.5px]">
          <span className="font-mono uppercase tracking-[.18em] text-white/50">
            Tosh {Math.min(tosh + 1, TOSHLAR)}/{TOSHLAR}
          </span>
          {h.kombo >= 2 ? (
            <span className="animate-pop rounded-full bg-orange-500/20 px-2 py-0.5 font-bold text-orange-300">🔥 Kombo ×{h.kombo}</span>
          ) : null}
          <span className="font-mono text-white/50">⏱ {sanaFormat(md[Math.min(tosh, TOSHLAR - 1)])}</span>
        </div>
        <div ref={yolRef} className="thin-scroll -mx-1 overflow-x-auto px-1 pb-1 pt-7">
          <ol className="flex min-w-max items-center">
            {Array.from({ length: TOSHLAR }, (_, i) => {
              const otdi = i < tosh
              const joriy = i === tosh
              return (
                <li key={i} className="flex items-center" data-tosh={i}>
                  {i > 0 ? <span className={cx('h-1 w-5 rounded-full', i <= tosh ? 'bg-amber-300' : 'bg-white/15')} /> : null}
                  <span
                    className={cx(
                      'relative grid h-11 w-11 place-items-center rounded-full text-[14px] font-black transition-all',
                      otdi && 'bg-emerald-400 text-[#06281c]',
                      joriy && 'bg-amber-300 text-[#1a1033] animate-[porlash_1.6s_infinite]',
                      !otdi && !joriy && 'bg-white/[.07] text-white/45 ring-1 ring-white/15',
                      i === TOSHLAR - 1 && !otdi && 'ring-2 ring-rose-400/60'
                    )}
                  >
                    {otdi ? '🛡️' : i === TOSHLAR - 1 ? '🏁' : i + 1}
                    {joriy ? (
                      <span className={cx('absolute -top-7 text-[22px] leading-none', yurish && 'animate-[sakrash_.6s_ease]')}>🧗</span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      {/* --- Faza: qadam tanlash --- */}
      {g.faza === 'qadam' && tosh < TOSHLAR - 1 ? (
        <div key={`q-${tosh}`} className="animate-fadeUp rounded-3xl bg-white/[.05] p-4 ring-1 ring-white/10">
          <p className="font-mono text-[10.5px] uppercase tracking-[.2em] text-amber-300/80">{tosh + 1}-tosh</p>
          <h3 className="mt-1 text-[18px] font-extrabold">👣 Bu toshda nima qilasiz?</h3>
          <div className="mt-3 space-y-2">
            {takliflar.map((n) => (
              <Kafel key={n} tanlangan={false} onClick={() => qadamTanla(n, false)} className="flex w-full items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[15px]">🃏</span>
                <span className="text-[14px] font-semibold">{n}</span>
              </Kafel>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={ozimMatn}
              onChange={(e) => setOzimMatn(e.target.value)}
              maxLength={90}
              placeholder="Yoki o‘z qadamingizni yozing…"
              className="min-w-0 flex-1 rounded-xl bg-white/[.07] px-3.5 py-2.5 text-[16px] text-white outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-2 focus:ring-amber-300"
            />
            <OyinTugma
              variant="shaffof"
              className="!min-h-[46px] !px-4"
              disabled={ozimMatn.trim().length < 4}
              onClick={() => qadamTanla(ozimMatn.trim(), true)}
            >
              +30
            </OyinTugma>
          </div>
        </div>
      ) : null}

      {g.faza === 'qadam' && tosh === TOSHLAR - 1 ? (
        <div className="animate-fadeUp rounded-3xl bg-gradient-to-br from-rose-500/25 to-amber-400/15 p-5 text-center ring-1 ring-rose-300/30">
          <div className="text-[48px] leading-none">🏁</div>
          <h3 className="font-display mt-2 text-[24px] font-semibold">Oxirgi tosh — Marra!</h3>
          <p className="mt-1 text-[13px] text-white/65">Bu yerda maqsadingiz kutib turibdi. Lekin marra oldidan eng katta bo‘ron bor…</p>
          <OyinTugma onClick={() => qadamTanla('Yakuniy marra — maqsadga to‘liq erishish', false)} className="mt-4 w-full">
            MARRAGA QADAM QO‘YISH
          </OyinTugma>
        </div>
      ) : null}

      {/* --- Faza: zar --- */}
      {g.faza === 'zar' ? (
        <div key={`z-${tosh}`} className="animate-fadeUp rounded-3xl bg-white/[.05] p-5 text-center ring-1 ring-white/10">
          <p className="text-[12px] text-white/55">Tanlangan qadam</p>
          <p className="mt-0.5 text-[15px] font-bold">“{joriyQadam.nom}”</p>
          <p className="mt-3 text-[13px] text-white/65">Yo‘lda bo‘ron bo‘lishi mumkin… Zarni tashlang!</p>
          <button
            type="button"
            onClick={zarTashla}
            disabled={aylanmoqda}
            aria-label="Zarni tashlash"
            className={cx(
              'no-tap-highlight mx-auto mt-3 grid h-28 w-28 place-items-center rounded-[28px] bg-gradient-to-b from-white/20 to-white/5 text-[64px] ring-1 ring-white/25 active:scale-95',
              aylanmoqda ? 'animate-[zarAylanish_.95s_ease-in-out]' : 'animate-[tebranish_1.4s_ease-in-out_infinite]'
            )}
          >
            🎲
          </button>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[.2em] text-amber-200/80">
            {aylanmoqda ? 'Aylanmoqda…' : 'Bosing'}
          </p>
        </div>
      ) : null}

      {/* --- Faza: bo'ron --- */}
      {g.faza === 'boron' && hod ? (
        <div
          key={`b-${tosh}`}
          className={cx(
            'rounded-3xl p-4 ring-1',
            g.hodisa.tur === 'omad' && 'bg-gradient-to-br from-emerald-500/25 to-teal-500/10 ring-emerald-300/30',
            g.hodisa.tur === 'boss' && 'bg-gradient-to-br from-rose-600/30 to-orange-500/15 ring-rose-300/40',
            g.hodisa.tur === 'boron' && 'bg-gradient-to-br from-indigo-500/25 to-rose-500/15 ring-white/15'
          )}
          style={{ animation: 'kartaOchilish .5s cubic-bezier(.2,.9,.3,1.1) both' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[46px] leading-none">{hod.e}</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[.22em] text-white/55">
                {g.hodisa.tur === 'omad' ? 'Omad kartasi' : g.hodisa.tur === 'boss' ? 'Final bo‘ron' : 'Bo‘ron!'}
              </p>
              <h3 className="text-[19px] font-extrabold leading-snug">{hod.nom}</h3>
              {hod.izoh ? <p className="mt-0.5 text-[12.5px] leading-snug text-white/65">{hod.izoh}</p> : null}
            </div>
            {g.hodisa.tur !== 'omad' ? <Taymer qolgan={vaqtTugadi ? 0 : qolgan} jami={limit} /> : null}
          </div>

          {vaqtTugadi ? (
            <p className="mt-3 animate-pop rounded-xl bg-rose-500/20 px-3 py-2 text-[12.5px] font-semibold text-rose-200">
              💥 Bo‘ron urildi! −1 ❤️ · Lekin qalqonsiz yo‘l davom etmaydi — tanlang:
            </p>
          ) : (
            <p className="mt-3 text-[13px] font-semibold text-white/80">
              🛡️ {g.hodisa.tur === 'omad' ? 'Ehtiyot qalqonini tanlang:' : 'Qalqoningiz? (tez javob — ×2 XP)'}
            </p>
          )}
          <div className="mt-2 space-y-2">
            {hod.qalqonlar.map((q) => (
              <Kafel key={q} tanlangan={false} onClick={() => qalqonA(q)} className="flex w-full items-center gap-2.5 bg-black/20">
                <span className="text-[18px]">🛡️</span>
                <span className="text-[13.5px] font-semibold leading-snug">{q}</span>
              </Kafel>
            ))}
          </div>
        </div>
      ) : null}

      {/* --- Faza: ikkinchi qalqon --- */}
      {g.faza === 'qalqon2' && hod ? (
        <div key={`b2-${tosh}`} className="animate-fadeUp rounded-3xl bg-white/[.05] p-4 ring-1 ring-white/10">
          <p className="rounded-xl bg-emerald-400/15 px-3 py-2 text-[12.5px] font-semibold text-emerald-200">
            ✓ Qalqon A: {joriyQadam.a}
          </p>
          <h3 className="mt-3 text-[17px] font-extrabold">🛡️🛡️ Ikkinchi qalqon?</h3>
          <p className="text-[12.5px] text-white/60">Agar birinchisi ham ish bermasa — zaxira rejangiz (+30 XP)</p>
          <div className="mt-2.5 space-y-2">
            {hod.qalqonlar
              .filter((q) => q !== joriyQadam.a)
              .map((q) => (
                <Kafel key={q} tanlangan={false} onClick={() => qalqonB(q)} className="flex w-full items-center gap-2.5">
                  <span className="text-[18px]">🛡️</span>
                  <span className="text-[13.5px] font-semibold leading-snug">{q}</span>
                </Kafel>
              ))}
          </div>
          <OyinTugma variant="shaffof" onClick={() => qalqonB(null)} className="mt-3 w-full !min-h-[46px]">
            Shart emas — oldinga →
          </OyinTugma>
        </div>
      ) : null}

      {g.faza === 'yurish' ? (
        <div className="py-8 text-center text-[13px] text-white/60">
          <span className="inline-block animate-[sakrash_.6s_ease_infinite] text-[36px]">🧗</span>
          <p className="mt-2">Keyingi toshga…</p>
        </div>
      ) : null}
    </div>
  )
}

function Darvoza4({ api }) {
  const h = api.h
  const g = h.g4
  const o = OLAM[h.g1.soha]
  const md = useMemo(() => muddatlar(h.g1.yil), [h.g1.yil])
  const set = (p) => api.set('g4', p)
  const [aylanmoqda, setAylanmoqda] = useState(false)
  const [displey, setDispley] = useState(g.jackpot ? o.sonlar[h.g1.sonIdx] : '? ? ?')
  const refB = useRef(null)
  const aTayyor = g.belgilar.length >= 2
  useOchilishSkroll(aTayyor, refB)

  const aylantir = () => {
    if (aylanmoqda || g.jackpot) return
    setAylanmoqda(true)
    hap('medium')
    const maqsad = o.sonlar[h.g1.sonIdx]
    let n = 0
    const id = setInterval(() => {
      n += 1
      const tasodifiy = o.sonlar[Math.floor(Math.random() * o.sonlar.length)]
      setDispley(Math.random() < 0.5 ? tasodifiy : raqamFormat(Math.random() * 9e6))
      sfx('tik')
      if (n >= 22) {
        clearInterval(id)
        setDispley(maqsad)
        setAylanmoqda(false)
        set({ jackpot: true })
        sfx('jackpot')
        hap('success')
        api.portla()
        api.xp(50, '🎰 JACKPOT!', 'g4-jackpot')
      }
    }, 75)
  }

  return (
    <div className="space-y-4">
      <DarvozaSarlavha n={4} />

      <Bolim
        raqam={1}
        sarlavha={`Marra dalillari · ${g.belgilar.length}/4`}
        izoh="Maqsadga yetganingizni qaysi ashyoviy faktdan bilasiz? 2–4 ta"
        ochiq
        bajarildi={aTayyor}
      >
        <div className="grid grid-cols-2 gap-2">
          {DALILLAR.map((d) => {
            const tanlangan = g.belgilar.includes(d.id)
            return (
              <Kafel
                key={d.id}
                tanlangan={tanlangan}
                onClick={() => {
                  if (tanlangan) {
                    set({ belgilar: g.belgilar.filter((x) => x !== d.id) })
                    sfx('tap')
                  } else if (g.belgilar.length >= 4) {
                    api.ogoh('4 ta dalil yetarli 👌')
                  } else {
                    set({ belgilar: [...g.belgilar, d.id] })
                    sfx('tanla')
                    api.xp(15, d.e, `g4-d-${d.id}`)
                  }
                }}
                className="flex flex-col gap-1.5"
              >
                <span className="text-[26px] leading-none">{d.e}</span>
                <span className="text-[12.5px] font-semibold leading-snug">{d.matn}</span>
              </Kafel>
            )
          })}
        </div>
      </Bolim>

      <Bolim
        raqam={2}
        innerRef={refB}
        sarlavha="Jackpot: maqsad raqamga aylansin"
        izoh="O‘lchab bo‘lmaydigan maqsadga erishganingizni hech qachon bilmaysiz"
        ochiq={aTayyor}
        bajarildi={g.jackpot}
      >
        <div className="rounded-3xl bg-gradient-to-b from-[#2a1458] to-[#120a33] p-4 text-center ring-2 ring-amber-300/40">
          <p className="font-mono text-[10.5px] uppercase tracking-[.22em] text-amber-200/80">{o.kpi.nom}</p>
          <div
            className={cx(
              'mx-auto mt-2 rounded-2xl bg-black/40 px-3 py-4 font-mono text-[30px] font-bold tracking-tight ring-1 ring-white/10',
              g.jackpot ? 'text-amber-300' : 'text-white/80'
            )}
          >
            {displey}
            {g.jackpot && o.kpi.birlik ? <span className="ml-1.5 text-[16px] text-amber-200/80">{o.kpi.birlik}</span> : null}
          </div>
          {g.jackpot ? (
            <p className="mt-3 animate-pop text-[13px] font-semibold text-emerald-300">
              🎰 JACKPOT! Muddat: {sanaFormat(md[TOSHLAR - 1])}
            </p>
          ) : (
            <OyinTugma onClick={aylantir} disabled={aylanmoqda} className="mt-4 w-full">
              {aylanmoqda ? 'Aylanmoqda…' : '🎰 AYLANTIRISH'}
            </OyinTugma>
          )}
        </div>
      </Bolim>

      <OyinTugma onClick={() => api.ochish(4)} className="w-full">
        🔓 4-DARVOZANI OCHISH
      </OyinTugma>
    </div>
  )
}

/** Bosib turiladigan qasamyod tugmasi */
function BosibTur({ onDone, onBosh, faol }) {
  const [p, setP] = useState(0)
  const raf = useRef(0)
  const boshi = useRef(0)
  const tugadi = useRef(false)
  const oxirgiTik = useRef(0)
  const DAVOM = 2400

  const toxta = () => {
    cancelAnimationFrame(raf.current)
    if (!tugadi.current) setP(0)
  }
  const bosh = (e) => {
    e.preventDefault()
    if (tugadi.current) return
    if (!faol) {
      onBosh?.()
      return
    }
    boshi.current = performance.now()
    oxirgiTik.current = 0
    const loop = (t) => {
      const q = Math.min(1, (t - boshi.current) / DAVOM)
      setP(q)
      const bosqich = Math.floor(q * 5)
      if (bosqich > oxirgiTik.current) {
        oxirgiTik.current = bosqich
        hap(bosqich >= 4 ? 'heavy' : 'medium')
        sfx('tik')
      }
      if (q >= 1) {
        tugadi.current = true
        onDone()
        return
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const r = 58
  const uz = 2 * Math.PI * r
  return (
    <button
      type="button"
      onPointerDown={bosh}
      onPointerUp={toxta}
      onPointerLeave={toxta}
      onPointerCancel={toxta}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Qasamyod uchun bosib turing"
      className="no-tap-highlight relative mx-auto grid h-40 w-40 select-none place-items-center rounded-full"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      <svg viewBox="0 0 132 132" className="absolute inset-0 -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="url(#qasamRang)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={uz}
          strokeDashoffset={uz * (1 - p)}
        />
        <defs>
          <linearGradient id="qasamRang" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fcd34d" />
            <stop offset="1" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={cx(
          'grid h-28 w-28 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-orange-500 text-[#1a1033] shadow-[0_8px_0_#9a3412]',
          p > 0 && p < 1 && 'scale-95'
        )}
        style={{ transition: 'transform .15s' }}
      >
        <span className="text-center leading-tight">
          <span className="block text-[30px]">✋</span>
          <span className="block text-[11px] font-black uppercase tracking-wider">{p > 0 ? `${Math.round(p * 100)}%` : 'Bosib turing'}</span>
        </span>
      </span>
    </button>
  )
}

function Qasamyod({ api }) {
  const h = api.h
  const f = h.fin
  const set = (p) => api.set('fin', p)
  const matn = qasamyodMatni(h)

  const tugat = () => {
    set({ muhr: true })
    sfx('muhr')
    hap('heavy')
    setTimeout(() => {
      sfx('fanfara')
      hap('success')
      api.portla()
      api.xp(200, '📜 Qasamyod!', 'fin')
    }, 450)
    setTimeout(() => api.yakunla(), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="pt-1 text-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[.24em] text-amber-300/80">Final</p>
        <h2 className="font-display text-[30px] font-semibold leading-none">Qasamyod</h2>
        <p className="mt-1.5 text-[13px] text-white/60">Yozilgan maqsad — o‘zingizga bergan va’da</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.2em] text-white/50">Ismingiz (imzo)</span>
        <input
          value={f.ism}
          onChange={(e) => set({ ism: e.target.value })}
          disabled={f.muhr}
          maxLength={60}
          placeholder="Ism Familiya"
          className="w-full rounded-2xl bg-white/[.07] px-4 py-3 text-[17px] font-semibold text-white outline-none ring-1 ring-white/15 placeholder:text-white/30 focus:ring-2 focus:ring-amber-300"
        />
      </label>

      {/* Pergament */}
      <div className="relative overflow-hidden rounded-3xl bg-[#fbf6e9] p-5 text-slate-800 shadow-[0_20px_50px_-20px_rgba(0,0,0,.7)] sm:p-6">
        <div className="pointer-events-none absolute inset-2 rounded-[18px] border border-dashed border-amber-900/20" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="pt-1 font-mono text-[10px] font-bold uppercase tracking-[.22em] text-amber-900/60">Qasamyod</p>
            {f.muhr ? (
              <div
                className="shrink-0 animate-stampIn rounded-xl border-[3px] border-[#b91c1c]/85 px-3 py-1.5 text-center text-[#b91c1c]"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(185,28,28,.45)' }}
              >
                <p className="text-[11.5px] font-black uppercase leading-none tracking-[.22em]">Tasdiqlangan</p>
                <p className="mt-1 font-mono text-[9px] leading-none tracking-[.16em]">{sanaFormat(bugun())}</p>
              </div>
            ) : null}
          </div>
          {f.tahrir && !f.muhr ? (
            <textarea
              value={f.matn || matn}
              onChange={(e) => set({ matn: e.target.value })}
              rows={6}
              className="font-display mt-3 w-full rounded-xl bg-white/70 p-3 text-[16px] italic leading-relaxed text-slate-800 outline-none ring-1 ring-amber-900/20 focus:ring-2 focus:ring-amber-500"
            />
          ) : (
            <p className="font-display mt-3 text-[17px] italic leading-[1.65]">“{matn}”</p>
          )}
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-[20px] font-semibold leading-none">{f.ism.trim() || ' '}</p>
              <div className="mt-2 h-px w-40 bg-slate-400" />
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[.18em] text-slate-500">Imzo</p>
            </div>
            <p className="font-mono text-[12.5px] font-semibold">{sanaFormat(bugun())}</p>
          </div>
          {!f.muhr ? (
            <button
              type="button"
              onClick={() => set(f.tahrir ? { tahrir: false } : { tahrir: true, matn })}
              className="no-tap-highlight mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-900/60"
            >
              <Pencil className="h-3.5 w-3.5" /> {f.tahrir ? 'Tayyor' : 'Matnni tahrirlash'}
            </button>
          ) : null}
        </div>
      </div>

      {!f.muhr ? (
        <div className="pt-2 text-center">
          <BosibTur
            faol={f.ism.trim().length >= 2}
            onBosh={() => api.ogoh('Avval ismingizni yozing — imzosiz qasamyod bo‘lmaydi')}
            onDone={tugat}
          />
          <p className="mt-3 text-[12.5px] text-white/55">Tugmani 2–3 soniya bosib turing — va’da muhrlanadi</p>
        </div>
      ) : (
        <p className="animate-pop pt-2 text-center text-[15px] font-bold text-amber-200">Muhrlandi! 🎉</p>
      )}
    </div>
  )
}

function Natija({ api, onPasport }) {
  const h = api.h
  const st = statistika(h)
  const ism = h.fin.ism.trim()
  const ulash = () => {
    const matn = `Men «Jizillash» maqsad o‘yinida ${st.unvon} unvonini oldim ${'★'.repeat(st.yulduz)} va Strategik maqsad pasportimni yaratdim! 🎯 Sen ham sinab ko‘r:`
    const havola = `https://t.me/share/url?url=${encodeURIComponent(window.location.href.split('?')[0])}&text=${encodeURIComponent(matn)}`
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(havola)
        return
      }
    } catch {
      /* zaxira yo'lga o'tamiz */
    }
    window.open(havola, '_blank', 'noopener')
  }

  return (
    <div className="py-4 text-center">
      <div className="mx-auto text-[84px] leading-none animate-[sakrash_1.4s_ease-in-out_infinite]">🏆</div>
      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[.24em] text-amber-300/80">O‘yin yakunlandi</p>
      <h2 className="font-display mt-1 text-[30px] font-semibold leading-tight">Tabriklaymiz{ism ? `, ${ism}` : ''}!</h2>

      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <Star
            key={i}
            className={cx('h-11 w-11', i < st.yulduz ? 'text-amber-300' : 'text-white/15')}
            fill="currentColor"
            strokeWidth={0}
            style={{ animation: `pop .45s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.2}s both` }}
          />
        ))}
      </div>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-4 py-1.5 text-[15px] font-black uppercase tracking-wider text-[#1a1033]">
        🎖️ {st.unvon}
      </p>

      <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2.5">
        {[
          ['⭐', h.xp, 'XP'],
          ['❤️', `${h.yurak}/3`, 'Yurak qoldi'],
          ['🛡️', h.qalqonlar, 'Qalqon'],
          ['⚡', h.tezkor, `Tezkor · eng katta kombo ×${h.engKombo}`],
        ].map(([e, q, l]) => (
          <div key={l} className="rounded-2xl bg-white/[.06] p-3 ring-1 ring-white/10">
            <p className="text-[20px] leading-none">{e}</p>
            <p className="mt-1.5 font-mono text-[22px] font-bold">{q}</p>
            <p className="text-[11px] leading-snug text-white/50">{l}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-sm text-[13px] leading-relaxed text-white/60">
        {st.yulduz === 3
          ? 'Birorta bo‘ron sizni yiqitolmadi. Haqiqiy Ustoz darajasi!'
          : 'Bo‘ronlar urildi — lekin siz to‘xtamadingiz. Hayotda ham shunday bo‘ladi.'}{' '}
        Maqsad pasportingiz tayyor.
      </p>

      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
        <OyinTugma onClick={onPasport} className="w-full text-[16px]">
          📜 PASPORTNI OCHISH
        </OyinTugma>
        <OyinTugma variant="shaffof" onClick={ulash} className="w-full">
          <Share2 className="h-[18px] w-[18px]" /> Natijani do‘stlarga yuborish
        </OyinTugma>
        <button
          type="button"
          onClick={api.qaytaOyna}
          className="no-tap-highlight mx-auto mt-1 inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-white/50"
        >
          <RotateCcw className="h-4 w-4" /> Qayta o‘ynash
        </button>
      </div>
    </div>
  )
}

/** Darvoza ochilganda chiqadigan oyna */
function Oraliq({ n, h, onDavom }) {
  const d = DARVOZALAR[n - 1]
  const keyingi = DARVOZALAR[n]
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#05030f]/80 p-5 backdrop-blur-md">
      <div className="w-full max-w-sm animate-pop rounded-[28px] bg-gradient-to-b from-[#2a1458] to-[#120a33] p-6 text-center text-white ring-2 ring-amber-300/40 shadow-[0_30px_80px_-20px_rgba(251,146,60,.5)]">
        <div className="text-[64px] leading-none animate-[sakrash_1s_ease-in-out_infinite]">{d.emoji}</div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[.24em] text-amber-300">🔓 {n}-darvoza ochildi</p>
        <h3 className="font-display mt-1 text-[30px] font-semibold">{d.nom}</h3>
        <p className="mt-2 text-[13px] text-white/60">{d.izoh} — bajarildi!</p>
        <div className="mt-4 flex justify-center gap-3 font-mono text-[14px] font-bold">
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-amber-200">⭐ {h.xp}</span>
          <span className="rounded-full bg-rose-400/15 px-3 py-1 text-rose-200">❤️ {h.yurak}/3</span>
        </div>
        {keyingi ? (
          <p className="mt-4 rounded-2xl bg-white/[.06] p-3 text-[13px] text-white/70">
            Keyingi: <span className="font-bold text-white">{keyingi.emoji} {keyingi.nom}</span> — {keyingi.izoh}
          </p>
        ) : (
          <p className="mt-4 rounded-2xl bg-white/[.06] p-3 text-[13px] text-white/70">
            Keyingi: <span className="font-bold text-white">📜 Qasamyod</span> — va’dani muhrlash
          </p>
        )}
        <OyinTugma onClick={onDavom} className="mt-5 w-full">
          DAVOM ETISH →
        </OyinTugma>
      </div>
    </div>
  )
}

function UstozYordami({ onDavom }) {
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-[#05030f]/85 p-5 backdrop-blur-md">
      <div className="w-full max-w-sm animate-pop rounded-[28px] bg-gradient-to-b from-[#16324a] to-[#0b1a2c] p-6 text-center text-white ring-2 ring-sky-300/40">
        <div className="text-[64px] leading-none">🧙</div>
        <h3 className="font-display mt-3 text-[26px] font-semibold">Ustoz yordamga keldi!</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
          Yuraklar tugadi. Lekin yiqilish — mag‘lubiyat emas. Mag‘lubiyat — turmaslik.
          Ustoz sizga <b className="text-rose-300">1 ❤️</b> qaytardi.
        </p>
        <OyinTugma variant="yashil" onClick={onDavom} className="mt-5 w-full">
          TURIB, DAVOM ETAMAN
        </OyinTugma>
      </div>
    </div>
  )
}

/* ==========================================================================
 *  6. ASOSIY O'YIN KOMPONENTI
 * ========================================================================== */

export default function Oyin({ mavjudMaqsad, onNatija, onPasport, onExit }) {
  const [h, setH] = useState(() => oyinOqish() || boshHolat())
  const hRef = useRef(h)
  hRef.current = h
  const [ovoz, setOvoz] = useState(() => {
    try {
      return localStorage.getItem(OVOZ_KALIT) !== '0'
    } catch {
      return true
    }
  })
  const [popuplar, setPopuplar] = useState([])
  const [konfetti, setKonfetti] = useState(0)
  const [silkin, setSilkin] = useState(false)
  const [ogoh, setOgoh] = useState('')
  const [oraliq, setOraliq] = useState(null)
  const [ustoz, setUstoz] = useState(false)
  const rootRef = useRef(null)
  const ogohTimer = useRef(0)

  ovozYoqilgan = ovoz

  /* --- Saqlash --- */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KALIT, JSON.stringify(h))
      } catch {
        /* noop */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [h])

  useEffect(() => {
    try {
      localStorage.setItem(OVOZ_KALIT, ovoz ? '1' : '0')
    } catch {
      /* noop */
    }
  }, [ovoz])

  /* --- Telegram ranglari: o'yin qorong'i --- */
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    try {
      tg?.setHeaderColor?.('#0c0a24')
      tg?.setBackgroundColor?.('#0c0a24')
      tg?.setBottomBarColor?.('#0c0a24')
    } catch {
      /* noop */
    }
    return () => {
      try {
        tg?.setHeaderColor?.('#ffffff')
        tg?.setBackgroundColor?.('#f8fafc')
        tg?.setBottomBarColor?.('#ffffff')
      } catch {
        /* noop */
      }
    }
  }, [])

  const skrollTepaga = () => {
    const el = rootRef.current?.closest('.app-scroll')
    try {
      el?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      if (el) el.scrollTop = 0
    }
  }

  const popup = (matn, n = 0, yomon = false) => {
    const id = `${Date.now()}-${Math.random()}`
    setPopuplar((p) => [...p.slice(-3), { id, matn, n, yomon }])
    setTimeout(() => setPopuplar((p) => p.filter((x) => x.id !== id)), 1200)
  }

  const api = {
    h,
    set: (k, patch) =>
      setH((p) => ({ ...p, [k]: { ...p[k], ...(typeof patch === 'function' ? patch(p[k]) : patch) } })),
    top: (patch) => setH((p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) })),
    xp: (n, matn, kalit) => {
      if (kalit && hRef.current.berildi[kalit]) return
      if (kalit) hRef.current = { ...hRef.current, berildi: { ...hRef.current.berildi, [kalit]: 1 } }
      setH((p) => ({ ...p, xp: p.xp + n, berildi: kalit ? { ...p.berildi, [kalit]: 1 } : p.berildi }))
      popup(matn || '', n)
    },
    popup: (matn) => popup(matn),
    sfx,
    hap,
    portla: () => setKonfetti((k) => k + 1),
    silkit: () => {
      setSilkin(true)
      setTimeout(() => setSilkin(false), 460)
    },
    ogoh: (matn) => {
      setOgoh(matn)
      clearTimeout(ogohTimer.current)
      ogohTimer.current = setTimeout(() => setOgoh(''), 2600)
    },
    yurakOl: () => {
      const qoldi = hRef.current.yurak - 1
      setH((p) => ({ ...p, yurak: Math.max(0, p.yurak - 1), yiqilish: p.yiqilish + 1, kombo: 0 }))
      sfx('xato')
      hap('error')
      api.silkit()
      popup('−1 ❤️ Bo‘ron urildi!', 0, true)
      if (qoldi <= 0) setTimeout(() => setUstoz(true), 700)
    },
    yurakQosh: () => setH((p) => ({ ...p, yurak: Math.min(3, p.yurak + 1) })),
    ochish: (n) => {
      const x = hRef.current
      const xatolar = []
      if (n === 1) {
        const g = x.g1
        if (!g.soha) xatolar.push('Avval maqsad olamini tanlang 🌍')
        else if (maqsadMatni(g).includes('___') || maqsadMatni(g).trim().length < 15)
          xatolar.push(g.ozim ? 'Maqsad matni juda qisqa' : 'Maqsadning “Nima?” qismini tanlang')
        else if (g.jizillash < 7) xatolar.push('Yurak hali sovuq ❄️ — jizillash kamida 7 bo‘lsin')
        else if (g.nega.length < 1) xatolar.push('Nega bu maqsad muhim? Kamida bitta sabab tanlang')
      }
      if (n === 2) {
        const g = x.g2
        if (g.qadriyatlar.length !== 3) xatolar.push('Aynan 3 ta qadriyat-qalqon tanlang')
        else if (g.odamlar.length < 2) xatolar.push('Kamida 2 guruh foyda ko‘rishi kerak')
        else if (tramplinMatni(g).length < 10) xatolar.push('Tramplinni tanlang: bu maqsad qaysi cho‘qqiga ko‘prik?')
      }
      if (n === 4) {
        const g = x.g4
        if (g.belgilar.length < 2) xatolar.push('Kamida 2 ta dalil tanlang')
        else if (!g.jackpot) xatolar.push('Jackpotni aylantiring — maqsad raqamga aylansin 🎰')
      }
      if (xatolar.length) {
        api.ogoh(xatolar[0])
        api.silkit()
        sfx('xato')
        hap('error')
        return
      }
      if (n === 1) {
        api.set('g3', { koloda: aralash([...OLAM[x.g1.soha].qadamlar, ...UMUMIY_QADAMLAR]) })
      }
      api.xp(100, `${n}-darvoza!`, `darvoza-${n}`)
      sfx('fanfara')
      hap('success')
      api.portla()
      setOraliq(n)
    },
    davom: () => {
      const keyingi = { 1: 'g2', 2: 'g3', 3: 'g4', 4: 'final' }[oraliq]
      setOraliq(null)
      setH((p) => ({ ...p, ekran: keyingi }))
      skrollTepaga()
    },
    yakunla: () => {
      const x = hRef.current
      onNatija(natijaMalumot(x))
      setH((p) => ({ ...p, ekran: 'natija' }))
      skrollTepaga()
    },
    qaytaOyna: () => {
      setH(boshHolat())
      skrollTepaga()
    },
  }

  const boshla = () => {
    audio() // iOS: ovoz konteksti foydalanuvchi bosishida ochiladi
    sfx('ok')
    hap('medium')
    setH((p) => ({ ...p, ekran: 'g1' }))
    skrollTepaga()
  }

  return (
    <div ref={rootRef} className="oyin-osmon relative min-h-full text-white">
      <Hud h={h} ovoz={ovoz} onOvoz={() => setOvoz((v) => !v)} onExit={onExit} popuplar={popuplar} />

      <div
        className={cx('mx-auto w-full max-w-xl px-4 pb-[calc(var(--safe-bottom)+32px)] pt-4')}
        style={silkin ? { animation: 'silkinish .45s ease' } : undefined}
      >
        {h.ekran === 'intro' ? <Intro mavjudMaqsad={mavjudMaqsad} onStart={boshla} /> : null}
        {h.ekran === 'g1' ? <Darvoza1 api={api} /> : null}
        {h.ekran === 'g2' ? <Darvoza2 api={api} /> : null}
        {h.ekran === 'g3' ? <Darvoza3 api={api} /> : null}
        {h.ekran === 'g4' ? <Darvoza4 api={api} /> : null}
        {h.ekran === 'final' ? <Qasamyod api={api} /> : null}
        {h.ekran === 'natija' ? <Natija api={api} onPasport={onPasport} /> : null}
      </div>

      {oraliq ? <Oraliq n={oraliq} h={h} onDavom={api.davom} /> : null}
      {ustoz ? (
        <UstozYordami
          onDavom={() => {
            setUstoz(false)
            api.yurakQosh()
            sfx('ok')
          }}
        />
      ) : null}

      {ogoh ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+22px)] z-[88] flex justify-center px-4">
          <p className="animate-slideDown rounded-2xl bg-rose-500 px-4 py-2.5 text-center text-[13.5px] font-bold text-white shadow-2xl">
            {ogoh}
          </p>
        </div>
      ) : null}

      {konfetti > 0 ? <Konfetti key={konfetti} /> : null}
    </div>
  )
}
