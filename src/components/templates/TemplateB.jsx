import { ClosingSection, Headline, IconTile, softText } from './shared'

// Template B — wearable / clothing. Editorial layout: the headline is
// OVERLAID on the full-bleed lifestyle photo (dark bottom gradient),
// features render as full-width pill cards, variants as a thumb strip.
// Image slots: [0] lifestyle hero, [1..2] variant thumbs, [3] closing photo.
export default function TemplateB({ product }) {
  const [lifestyle, variantA, variantB, last] = product.image_urls ?? []
  const variants = [variantA, variantB].filter(Boolean)
  const features = product.features ?? []

  return (
    <div>
      {/* Header: magazine-style text-on-photo */}
      {lifestyle ? (
        <header className="relative">
          <img
            src={lifestyle}
            alt=""
            crossOrigin="anonymous"
            className="h-[1020px] w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 34%, transparent 60%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 px-16 pb-16 text-start">
            <Headline
              text={product.headline}
              className="!text-white text-[62px] font-extrabold leading-[1.3] drop-shadow-md"
            />
            {product.subheadline && (
              <p className="mt-4 max-w-4xl text-[29px] font-semibold leading-relaxed text-white/85">
                {product.subheadline}
              </p>
            )}
          </div>
        </header>
      ) : (
        <header className="px-16 pt-20 text-center">
          <Headline
            text={product.headline}
            className="text-[64px] font-extrabold leading-[1.3]"
          />
          {product.subheadline && (
            <p className={`mx-auto mt-5 max-w-4xl text-[30px] font-semibold leading-relaxed ${softText}`}>
              {product.subheadline}
            </p>
          )}
        </header>
      )}

      {/* Fit & details: full-width pill cards + variant thumb strip */}
      {(features.length > 0 || variants.length > 0) && (
        <section className="px-16 pb-6 pt-16">
          <h2 className="text-[46px] font-extrabold leading-tight text-[var(--t-ink)] [font-family:var(--t-display)]">
            المقاسات والتفاصيل
          </h2>
          {features.length > 0 && (
            <div className="mt-10 space-y-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-7 rounded-[28px] border bg-[var(--t-card)] px-8 py-6 shadow-sm"
                  style={{ borderColor: 'var(--t-card-border)' }}
                >
                  <IconTile name={f.icon} size={72} icon={34} />
                  <div className="min-w-0">
                    <p className="text-[32px] font-extrabold leading-snug text-[var(--t-ink)]">
                      {f.label}
                    </p>
                    {f.description && (
                      <p className={`mt-0.5 text-[25px] font-semibold leading-snug ${softText}`}>
                        {f.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {variants.length > 0 && (
            <div className="mt-10 flex gap-6">
              {variants.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-[300px] min-w-0 flex-1 rounded-[28px] object-cover shadow-lg"
                />
              ))}
            </div>
          )}
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={last ? [last] : []} />
    </div>
  )
}
