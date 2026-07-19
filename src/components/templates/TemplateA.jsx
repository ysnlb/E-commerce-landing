import { ClosingSection, Headline, IconCircle } from './shared'

// Template A — container / home item: product photo on a soft card,
// three feature rows with a close-up photo to the side, shared closing.
export default function TemplateA({ product }) {
  const [main, closeUp, ...rest] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      <header className="bg-cream-100 px-16 pb-16 pt-20 text-center">
        <Headline
          text={product.headline}
          className="text-6xl font-black leading-snug text-charcoal-900"
        />
        {product.subheadline && (
          <p className="mx-auto mt-6 max-w-3xl text-3xl leading-relaxed text-charcoal-600">
            {product.subheadline}
          </p>
        )}
        {main && (
          <div className="mt-12 rounded-3xl bg-cream-200 p-10">
            <img
              src={main}
              alt=""
              crossOrigin="anonymous"
              className="h-[560px] w-full rounded-2xl object-cover"
            />
          </div>
        )}
      </header>

      {features.length > 0 && (
        <section className="bg-white px-16 py-16">
          <h2 className="text-center text-4xl font-extrabold text-charcoal-900">
            أهم المميزات
          </h2>
          <div className="mt-12 flex gap-10">
            <div className="flex-1 space-y-10 self-center">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-6">
                  <IconCircle name={f.icon} />
                  <div>
                    <p className="text-3xl font-bold text-charcoal-900">{f.label}</p>
                    {f.description && (
                      <p className="mt-1.5 text-2xl leading-relaxed text-charcoal-500">
                        {f.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {closeUp && (
              <img
                src={closeUp}
                alt=""
                crossOrigin="anonymous"
                className="w-[380px] rounded-3xl object-cover"
              />
            )}
          </div>
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={rest.slice(0, 3)} />
    </div>
  )
}
