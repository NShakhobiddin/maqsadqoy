/**
 * Qurilgan saytni (dist/) repozitoriya root'iga ko'chiradi.
 *
 * Nima uchun kerak: GitHub Pages "Deploy from a branch → /(root)" rejimida
 * branch root'idagi fayllarni qanday bo'lsa shundayligicha tarqatadi.
 * Root'da qurilgan index.html va assets/ turgani uchun sayt hech qanday
 * qo'shimcha sozlamasiz ochiladi.
 *
 * Manba kod app/ papkasida — shuning uchun to'qnashuv yo'q.
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ildiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(ildiz, 'dist')

if (!existsSync(dist)) {
  console.error('✗ dist/ topilmadi — avval "vite build" ishga tushirilishi kerak.')
  process.exit(1)
}

// Eski assets/ ni tozalaymiz, aks holda hash'li fayllar to'planib qoladi.
const assets = join(ildiz, 'assets')
if (existsSync(assets)) {
  const st = await stat(assets)
  if (!st.isDirectory()) {
    console.error('✗ root/assets papka emas — to‘xtatildi.')
    process.exit(1)
  }
  await rm(assets, { recursive: true, force: true })
}
await mkdir(assets, { recursive: true })

// dist ichidagi hamma narsani root'ga ko'chiramiz.
for (const nom of await readdir(dist)) {
  await cp(join(dist, nom), join(ildiz, nom), { recursive: true })
}

console.log('✓ Qurilgan sayt root\'ga ko‘chirildi (index.html + assets/)')
