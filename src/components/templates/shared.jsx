import { HandCoins, Headphones, ShieldCheck, Star, Truck } from 'lucide-react'
import { FEATURE_ICONS } from '../../lib/icons'

// Shared section kit for the 800px landing templates. All colors/fonts come
// from the theme CSS variables injected by TemplateCanvas (src/lib/themes.js).
// Gradients, SVG fills and shadows use inline styles for export safety.
// Every component renders nothing when its data is missing, so pages
// shorten smartly with sparse content.

/* ---------- text ---------- */

// Headline with the colored, slightly-rotated strikethrough on ~word~.
export function Headline({ text, as = 'h1', className = '' }) {
  const Tag = as
  const parts = String(text ?? '').split(/~([^~]+)~/g)
  return (
    <Tag className={`[font-family:var(--t-display)] text-[var(--t-ink)] ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="relative inline-block whitespace-nowrap">
            {part}
            <span
              aria-hidden
              className="absolute -left-[4%] -right-[4%] top-[54%] h-[0.085em] -rotate-3 rounded-full bg-[var(--t-strike)]"
            />
          </span>
        ) : (
          part
        ),
      )}
    </Tag>
  )
}

export const softText = 'text-[var(--t-ink-soft)]'

export function Para({ children, className = '' }) {
  if (!children) return null
  return (
    <p className={`text-[23px] font-semibold leading-[1.85] ${softText} ${className}`}>
      {children}
    </p>
  )
}

// Splits the description field into paragraphs (blank lines or newlines).
export function splitParagraphs(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/* ---------- headings ---------- */

// Solid pill section title (refs: yellow/blue pill headings).
export function SectionTitle({ children, className = '' }) {
  if (!children) return null
  return (
    <div className={`text-center ${className}`}>
      <span className="inline-block rounded-full bg-[var(--t-tile)] px-9 py-2.5 text-[29px] font-extrabold text-white [font-family:var(--t-display)]">
        {children}
      </span>
    </div>
  )
}

// Ribbon heading with side lines (catalog style, ref 2).
export function Ribbon({ children, className = '' }) {
  if (!children) return null
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <span className="h-[3px] flex-1 rounded-full bg-[var(--t-tile)] opacity-60" />
      <span className="shrink-0 text-[30px] font-extrabold text-[var(--t-ink)] [font-family:var(--t-display)]">
        {children}
      </span>
      <span className="h-[3px] flex-1 rounded-full bg-[var(--t-tile)] opacity-60" />
    </div>
  )
}

/* ---------- top / commerce ---------- */

export function AnnouncementBar({ text }) {
  if (!text) return null
  return (
    <div className="bg-[var(--t-ink)] px-8 py-3.5 text-center text-[21px] font-extrabold text-[var(--t-canvas)]">
      {text}
    </div>
  )
}

export function BadgePill({ text, className = '' }) {
  if (!text) return null
  return (
    <div className={`text-center ${className}`}>
      <span className="inline-block rounded-xl border-2 border-[var(--t-tile)] bg-[var(--t-card)] px-7 py-2.5 text-[23px] font-extrabold text-[var(--t-ink)]">
        {text}
      </span>
    </div>
  )
}

const fmt = (n) => Number(n).toLocaleString('ar-DZ')

// "ثمن اليوم X دج عوض Y دج" pill (strikethrough old price).
export function PricePill({ price, oldPrice, className = '' }) {
  if (price == null) return null
  return (
    <div className={`text-center ${className}`}>
      <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border-[3px] border-[var(--t-tile)] bg-[var(--t-card)] px-9 py-3.5">
        <span className="text-[23px] font-extrabold text-[var(--t-ink)]">ثمن اليوم</span>
        <span className="text-[34px] font-extrabold leading-none text-[var(--t-tile)] [font-family:var(--t-display)]">
          {fmt(price)} دج
        </span>
        {oldPrice != null && Number(oldPrice) > Number(price) && (
          <>
            <span className={`text-[21px] font-bold ${softText}`}>عوض</span>
            <span className="relative text-[24px] font-extrabold text-[var(--t-ink-soft)]">
              {fmt(oldPrice)} دج
              <span
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-[3px] -rotate-6 rounded-full bg-[var(--t-strike)]"
              />
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Round discount badge ("-30%") derived from price/old_price.
export function DiscountBadge({ price, oldPrice, className = '' }) {
  if (price == null || oldPrice == null || Number(oldPrice) <= Number(price)) return null
  const pct = Math.round((1 - Number(price) / Number(oldPrice)) * 100)
  if (pct < 5) return null
  return (
    <div
      className={`flex h-[110px] w-[110px] rotate-6 flex-col items-center justify-center rounded-full text-white shadow-lg ${className}`}
      style={{ backgroundImage: 'linear-gradient(to bottom, var(--t-cta-from), var(--t-cta-to))' }}
    >
      <span className="text-[34px] font-extrabold leading-none [font-family:var(--t-display)]">
        {pct}%-
      </span>
      <span className="text-[19px] font-bold">تخفيض</span>
    </div>
  )
}

/* ---------- icons / features ---------- */

export function IconTile({ name, size = 76, icon = 36 }) {
  const Icon = FEATURE_ICONS[name] ?? Star
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-2xl bg-[var(--t-tile)] text-white shadow-md"
    >
      <Icon size={icon} strokeWidth={2.2} />
    </div>
  )
}

// Outline circle icon grid, 2 columns (refs 1 and 6).
export function IconCircleGrid({ features, className = '' }) {
  if (!features?.length) return null
  return (
    <div className={`grid grid-cols-2 gap-x-8 gap-y-10 ${className}`}>
      {features.map((f, i) => {
        const Icon = FEATURE_ICONS[f.icon] ?? Star
        return (
          <div key={i} className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-[150px] w-[150px] items-center justify-center rounded-full border-[5px] border-[var(--t-tile)] text-[var(--t-tile)]">
              <Icon size={66} strokeWidth={1.8} />
            </div>
            <p className="text-[24px] font-extrabold leading-snug text-[var(--t-ink)]">{f.label}</p>
            {f.description && (
              <p className={`-mt-2 text-[20px] font-semibold leading-snug ${softText}`}>
                {f.description}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact tile icon row (ref 7): wraps, 3 per row.
export function IconRow({ features, className = '' }) {
  if (!features?.length) return null
  return (
    <div className={`flex flex-wrap justify-center gap-x-10 gap-y-8 ${className}`}>
      {features.map((f, i) => (
        <div key={i} className="flex w-[190px] flex-col items-center gap-3 text-center">
          <IconTile name={f.icon} size={72} icon={34} />
          <p className="text-[21px] font-extrabold leading-snug text-[var(--t-ink)]">{f.label}</p>
        </div>
      ))}
    </div>
  )
}

// Bold bullet list (refs 3 and 5).
export function BulletList({ features, className = '' }) {
  if (!features?.length) return null
  return (
    <ul className={`space-y-5 ${className}`}>
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-4">
          <span className="mt-[14px] h-[12px] w-[12px] shrink-0 rounded-full bg-[var(--t-tile)]" />
          <div>
            <p className="text-[25px] font-extrabold leading-snug text-[var(--t-ink)]">{f.label}</p>
            {f.description && (
              <p className={`text-[21px] font-semibold leading-snug ${softText}`}>{f.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// Numbered feature list (ref 8's "6 مميزات").
export function NumberedList({ features, className = '' }) {
  if (!features?.length) return null
  return (
    <div className={`space-y-5 ${className}`}>
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-5">
          <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-[var(--t-tile)] text-[30px] font-extrabold text-white [font-family:var(--t-display)]">
            {i + 1}
          </div>
          <div
            className="flex-1 rounded-2xl border bg-[var(--t-card)] px-6 py-4"
            style={{ borderColor: 'var(--t-card-border)' }}
          >
            <p className="text-[23px] font-extrabold leading-snug text-[var(--t-ink)]">{f.label}</p>
            {f.description && (
              <p className={`text-[20px] font-semibold leading-snug ${softText}`}>{f.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- photos ---------- */

export function PhotoBand({ src, h = 520, wash = true, className = '' }) {
  if (!src) return null
  return (
    <div className={`relative ${className}`}>
      <img src={src} alt="" crossOrigin="anonymous" style={{ height: h }} className="w-full object-cover" />
      {wash && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{ backgroundImage: 'linear-gradient(to bottom, var(--t-canvas), transparent)' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24"
            style={{ backgroundImage: 'linear-gradient(to top, var(--t-canvas), transparent)' }}
          />
        </>
      )}
    </div>
  )
}

// 2-column photo grid; optional check overlay (refs 8/10 result grids).
export function PhotoGrid({ images, h = 330, check = false, className = '' }) {
  if (!images?.length) return null
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {images.map((src, i) => (
        <div key={i} className="relative">
          <img
            src={src}
            alt=""
            crossOrigin="anonymous"
            style={{ height: h }}
            className="w-full rounded-3xl object-cover shadow-md"
          />
          {check && (
            <div
              className="absolute bottom-3 right-3 flex h-[52px] w-[52px] items-center justify-center rounded-full text-white shadow"
              style={{ backgroundImage: 'linear-gradient(to bottom, var(--t-cta-from), var(--t-cta-to))' }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Collage: one large photo + up to two small ones (ref 2 header).
export function PhotoCollage({ images, className = '' }) {
  const [big, s1, s2] = images ?? []
  if (!big) return null
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <img src={big} alt="" crossOrigin="anonymous" className={`${s1 ? 'col-span-2' : 'col-span-3'} h-[480px] w-full rounded-3xl object-cover shadow-md`} />
      {s1 && (
        <div className="flex flex-col gap-4">
          <img src={s1} alt="" crossOrigin="anonymous" className={`${s2 ? 'h-[232px]' : 'h-[480px]'} w-full rounded-3xl object-cover shadow-md`} />
          {s2 && <img src={s2} alt="" crossOrigin="anonymous" className="h-[232px] w-full rounded-3xl object-cover shadow-md" />}
        </div>
      )}
    </div>
  )
}

/* ---------- structured sections ---------- */

// Numbered how-to steps from the usage_steps text field (one step per line).
export function StepsSection({ stepsText, title = 'طريقة الاستعمال', className = '' }) {
  const steps = String(stepsText ?? '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!steps.length) return null
  return (
    <section className={className}>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-9 space-y-5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-5">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border-[4px] border-[var(--t-tile)] text-[26px] font-extrabold text-[var(--t-tile)] [font-family:var(--t-display)]">
              {i + 1}
            </div>
            <p className="flex-1 text-[23px] font-bold leading-relaxed text-[var(--t-ink)]">{step}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// Key/value specs table (ref 2's المحتويات).
export function SpecsTable({ specs, title = 'المواصفات', className = '' }) {
  const rows = (specs ?? []).filter((s) => s?.label && s?.value)
  if (!rows.length) return null
  return (
    <section className={className}>
      <Ribbon>{title}</Ribbon>
      <div
        className="mt-9 overflow-hidden rounded-3xl border-2"
        style={{ borderColor: 'var(--t-tile)' }}
      >
        {rows.map((s, i) => (
          <div key={i} className="flex" style={i > 0 ? { borderTop: '2px solid var(--t-tile)' } : undefined}>
            <div className="w-[240px] shrink-0 bg-[var(--t-tile)] px-6 py-4 text-[23px] font-extrabold text-white">
              {s.label}
            </div>
            <div className="flex-1 bg-[var(--t-card)] px-6 py-4 text-[23px] font-bold text-[var(--t-ink)]">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Trust strip: COD + delivery + quality + support (ref 8).
const TRUST_ITEMS = [
  { icon: HandCoins, label: 'الدفع عند الاستلام' },
  { icon: Truck, label: 'توصيل لكل الولايات' },
  { icon: ShieldCheck, label: 'ضمان الجودة' },
  { icon: Headphones, label: 'خدمة الزبائن' },
]

export function TrustStrip({ className = '' }) {
  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {TRUST_ITEMS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[var(--t-tile)] text-white shadow-md">
            <Icon size={36} strokeWidth={2} />
          </div>
          <p className="text-[18px] font-extrabold leading-tight text-[var(--t-ink)]">{label}</p>
        </div>
      ))}
    </div>
  )
}

// Testimonials with initial avatars and a star row (refs 3/5/8/10).
export function Testimonials({ reviews, title = 'آراء الزبائن', className = '' }) {
  const rows = (reviews ?? []).filter((r) => r?.text)
  if (!rows.length) return null
  return (
    <section className={className}>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-5 flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={30} className="text-[var(--t-tile)]" fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <div className="mt-8 space-y-5">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-5 rounded-3xl border bg-[var(--t-card)] p-6"
            style={{ borderColor: 'var(--t-card-border)' }}
          >
            <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-[var(--t-tile)] text-[28px] font-extrabold text-white">
              {(r.name ?? 'ز').trim().charAt(0) || 'ز'}
            </div>
            <div className="min-w-0">
              <p className="text-[22px] font-bold leading-relaxed text-[var(--t-ink)]">{r.text}</p>
              {r.name && <p className={`mt-1.5 text-[19px] font-extrabold ${softText}`}>— {r.name}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- closing ---------- */

const SEAL_PATH = (() => {
  const n = 12
  const R = 64
  const c = 80
  const r = 20
  let d = ''
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    const x = (c + R * Math.cos(a)).toFixed(2)
    const y = (c + R * Math.sin(a)).toFixed(2)
    d += i === 0 ? `M ${x} ${y}` : ` A ${r} ${r} 0 0 1 ${x} ${y}`
  }
  return `${d} Z`
})()

export function CodSeal({ className = '' }) {
  return (
    <div className={`relative h-[130px] w-[130px] drop-shadow-md ${className}`}>
      <svg viewBox="0 0 160 160" className="h-full w-full">
        <path d={SEAL_PATH} style={{ fill: 'var(--t-seal)' }} />
        <path
          d={SEAL_PATH}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.4"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          transform="translate(80 80) scale(0.82) translate(-80 -80)"
        />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center text-center text-[18px] font-extrabold leading-[1.35] text-white">
        الدفع
        <br />
        عند
        <br />
        الاستلام
      </p>
    </div>
  )
}

export function CtaPill({ label = 'اطلب الآن', className = '' }) {
  return (
    <div
      className={`inline-block rounded-2xl px-14 py-4.5 text-[28px] font-extrabold text-white ${className}`}
      style={{
        backgroundImage: 'linear-gradient(to bottom, var(--t-cta-from), var(--t-cta-to))',
        boxShadow: 'var(--t-cta-shadow)',
        paddingTop: 18,
        paddingBottom: 18,
      }}
    >
      {label}
    </div>
  )
}

// Closing block: seal + closing headline + price recap + CTA.
export function CtaBlock({ closingLine, price, oldPrice, className = '' }) {
  return (
    <section className={`text-center ${className}`}>
      <CodSeal className="mx-auto -rotate-6" />
      <h2 className="mx-auto mt-7 max-w-[620px] text-[42px] font-extrabold leading-[1.35] text-[var(--t-ink)] [font-family:var(--t-display)]">
        {closingLine || 'اطلب الآن وريّح راسك!'}
      </h2>
      {price != null && <PricePill price={price} oldPrice={oldPrice} className="mt-7" />}
      <div className="mt-9">
        <CtaPill />
      </div>
    </section>
  )
}
