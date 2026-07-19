import { ClosingSection, Headline, IconCircle } from './shared'

// Template B — wearable / clothing: large lifestyle photo header,
// compact fit/material rows, shared closing with variant photos.
export default function TemplateB({ product }) {
  const [lifestyle, ...variants] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      <header className="bg-cream-100 pt-20 text-center">
        <div className="px-16">
          <Headline
            text={product.headline}
            className="text-6xl font-black leading-snug text-charcoal-900"
          />
          {product.subheadline && (
            <p className="mx-auto mt-6 max-w-3xl text-3xl leading-relaxed text-charcoal-600">
              {product.subheadline}
            </p>
          )}
        </div>
        {lifestyle && (
          <img
            src={lifestyle}
            alt=""
            crossOrigin="anonymous"
            className="mt-12 h-[820px] w-full object-cover"
          />
        )}
      </header>

      {features.length > 0 && (
        <section className="bg-white px-16 py-16">
          <h2 className="text-center text-4xl font-extrabold text-charcoal-900">
            المقاسات والتفاصيل
          </h2>
          <div className="mx-auto mt-8 max-w-4xl divide-y divide-cream-200">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-6 py-6">
                <IconCircle name={f.icon} circle={64} icon={30} />
                <p className="w-56 shrink-0 text-3xl font-bold text-charcoal-900">
                  {f.label}
                </p>
                {f.description && (
                  <p className="text-2xl leading-relaxed text-charcoal-500">
                    {f.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={variants.slice(0, 3)} />
    </div>
  )
}
