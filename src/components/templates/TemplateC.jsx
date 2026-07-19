import { ClosingSection, Headline, IconCircle } from './shared'

// Template C — small gadget / accessory: clean close-up hero,
// dense spec callout grid, shared closing with tight detail photos.
export default function TemplateC({ product }) {
  const [hero, ...details] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      <header className="bg-white px-16 pb-16 pt-20 text-center">
        <Headline
          text={product.headline}
          className="text-6xl font-black leading-snug text-charcoal-900"
        />
        {product.subheadline && (
          <p className="mx-auto mt-6 max-w-3xl text-3xl leading-relaxed text-charcoal-600">
            {product.subheadline}
          </p>
        )}
        {hero && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-cream-200 bg-cream-50 p-12">
            <img
              src={hero}
              alt=""
              crossOrigin="anonymous"
              className="mx-auto h-[520px] w-full rounded-2xl object-contain"
            />
          </div>
        )}
      </header>

      {features.length > 0 && (
        <section className="bg-cream-100 px-16 py-16">
          <h2 className="text-center text-4xl font-extrabold text-charcoal-900">
            المواصفات
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex w-[300px] flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm"
              >
                <IconCircle name={f.icon} circle={64} icon={30} />
                <p className="text-2xl font-bold leading-snug text-charcoal-900">
                  {f.label}
                </p>
                {f.description && (
                  <p className="text-xl leading-relaxed text-charcoal-500">
                    {f.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ClosingSection
        closingLine={product.closing_line}
        images={details.slice(0, 3)}
        tight
      />
    </div>
  )
}
