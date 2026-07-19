import { HandCoins, Star } from 'lucide-react'
import { FEATURE_ICONS } from '../../lib/icons'

// Renders a headline where a word wrapped in tildes gets a strikethrough,
// for the "before" price/complaint effect: "وداعاً للفوضى ~وللغلاء~".
// Headlines without tildes render unchanged.
export function Headline({ text, className = '' }) {
  const parts = String(text ?? '').split(/~([^~]+)~/g)
  return (
    <h1 className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="text-charcoal-500 line-through decoration-leather-600 decoration-8"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </h1>
  )
}

// Circular feature icon; falls back to a star if the stored key is unknown.
export function IconCircle({ name, circle = 80, icon = 36 }) {
  const Icon = FEATURE_ICONS[name] ?? Star
  return (
    <div
      style={{ width: circle, height: circle }}
      className="flex shrink-0 items-center justify-center rounded-full bg-leather-600 text-white"
    >
      <Icon size={icon} />
    </div>
  )
}

// Small circular "Cash on Delivery" stamp.
export function CodBadge({ className = '' }) {
  return (
    <div
      className={`relative flex size-44 flex-col items-center justify-center gap-1.5 rounded-full bg-cod-600 text-white shadow-lg ${className}`}
    >
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/50" />
      <HandCoins size={44} />
      <p className="text-2xl font-extrabold leading-tight">
        الدفع عند
        <br />
        الاستلام
      </p>
    </div>
  )
}

// Closing section shared by all three templates: COD badge, fixed bold
// closing headline, optional supporting line, optional photo grid.
export function ClosingSection({ closingLine, images = [], tight = false }) {
  return (
    <section className="bg-cream-200 px-16 py-16 text-center">
      <CodBadge className="mx-auto" />
      <h2 className="mt-8 text-5xl font-black leading-snug text-charcoal-900">
        اطلب الآن!
      </h2>
      {closingLine && (
        <p className="mt-4 text-3xl font-semibold text-cod-700">{closingLine}</p>
      )}
      {images.length > 0 && (
        <div className={`mt-10 flex justify-center ${tight ? 'gap-4' : 'gap-6'}`}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              crossOrigin="anonymous"
              className={`rounded-2xl object-cover ${tight ? 'size-48' : 'size-64'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
