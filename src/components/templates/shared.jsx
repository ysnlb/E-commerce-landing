import { Star } from 'lucide-react'
import { FEATURE_ICONS } from '../../lib/icons'

// Renders a headline where a word wrapped in tildes gets a red,
// slightly-rotated strikethrough bar (the "before" effect):
// "عيت من ~الروينة~ في خزانتك؟". Plain headlines render unchanged.
export function Headline({ text, className = '' }) {
  const parts = String(text ?? '').split(/~([^~]+)~/g)
  return (
    <h1 className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="relative inline-block whitespace-nowrap">
            {part}
            <span
              aria-hidden
              className="absolute -left-[4%] -right-[4%] top-[54%] h-[0.085em] -rotate-3 rounded-full bg-red-600/90"
            />
          </span>
        ) : (
          part
        ),
      )}
    </h1>
  )
}

// Rounded-square tan icon tile; unknown keys fall back to a star.
export function IconTile({ name, size = 88, icon = 42 }) {
  const Icon = FEATURE_ICONS[name] ?? Star
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-2xl bg-sand-400 text-white shadow-md"
    >
      <Icon size={icon} strokeWidth={2.2} />
    </div>
  )
}

// Feature rows in the reference style: icon tiles first (right side in RTL)
// joined by a vertical dashed connector, bold espresso labels beside them.
export function FeatureRows({ features, tile = 88, icon = 42, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {features.length > 1 && (
        <div
          aria-hidden
          className="absolute bottom-12 top-12 border-s-2 border-dashed border-sand-400/70"
          style={{ insetInlineStart: tile / 2 }}
        />
      )}
      <div className="space-y-12">
        {features.map((f, i) => (
          <div key={i} className="relative flex items-center gap-7">
            <IconTile name={f.icon} size={tile} icon={icon} />
            <div>
              <p className="text-[34px] font-extrabold leading-snug text-espresso-800">
                {f.label}
              </p>
              {f.description && (
                <p className="mt-1 text-[27px] font-semibold leading-snug text-espresso-800/60">
                  {f.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Scalloped wax-seal path: 12 outward arcs around a circle (viewBox 160).
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

// Wax-seal style "Cash on Delivery" badge (inline SVG — export-safe).
export function CodSeal({ className = '' }) {
  return (
    <div className={`relative h-[150px] w-[150px] drop-shadow-md ${className}`}>
      <svg viewBox="0 0 160 160" className="h-full w-full">
        <path d={SEAL_PATH} fill="#48693c" />
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
      <p className="absolute inset-0 flex items-center justify-center text-center text-[21px] font-extrabold leading-[1.35] text-white">
        الدفع
        <br />
        عند
        <br />
        الاستلام
      </p>
    </div>
  )
}

// Painted CTA pill — decorative only, the exported image is static.
export function CtaPill({ label = 'اطلب الآن' }) {
  return (
    <div className="inline-block rounded-2xl bg-gradient-to-b from-cod-500 to-cod-600 px-16 py-5 text-[32px] font-extrabold text-white shadow-[0_12px_28px_rgba(22,163,74,0.35)]">
      {label}
    </div>
  )
}

// Closing in the reference style: wax seal, bold closing headline
// (products.closing_line), painted CTA, and 0-2 floating photos beside.
export function ClosingSection({ closingLine, images = [] }) {
  const [first, second] = images
  return (
    <section className="relative px-16 pb-24 pt-16">
      <div className="flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <CodSeal className="-rotate-6" />
          <h2 className="mt-8 font-display text-[54px] font-extrabold leading-[1.3] text-espresso-900">
            {closingLine || 'اطلب الآن وريّح راسك!'}
          </h2>
          <div className="mt-12">
            <CtaPill />
          </div>
        </div>
        {first && (
          <div className="relative shrink-0" style={{ width: 430, height: 520 }}>
            <img
              src={first}
              alt=""
              crossOrigin="anonymous"
              className="h-full w-full rotate-2 rounded-[32px] object-cover shadow-2xl"
            />
            {second && (
              <img
                src={second}
                alt=""
                crossOrigin="anonymous"
                className="absolute -bottom-8 -end-8 h-[240px] w-[240px] -rotate-3 rounded-3xl border-[6px] border-white object-cover shadow-xl"
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
