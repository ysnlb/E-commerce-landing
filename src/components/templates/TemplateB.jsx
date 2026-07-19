import { ClosingSection, FeatureRows, Headline, softText } from './shared'

// Template B — wearable / clothing.
// Image slots: [0] lifestyle hero, [1..2] floating variant shots beside the
// fit/details rows, [3] floating photo in the closing.
export default function TemplateB({ product }) {
  const [lifestyle, variantA, variantB, last] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      {/* Header: headline melting into the full-bleed lifestyle photo */}
      <header className="relative">
        <div className="relative z-10 px-16 pt-20 text-center">
          <Headline
            text={product.headline}
            className="text-[64px] font-extrabold leading-[1.3]"
          />
          {product.subheadline && (
            <p className={`mx-auto mt-5 max-w-4xl text-[30px] font-semibold leading-relaxed ${softText}`}>
              {product.subheadline}
            </p>
          )}
        </div>
        {lifestyle && (
          <div className="relative mt-6">
            <img
              src={lifestyle}
              alt=""
              crossOrigin="anonymous"
              className="h-[860px] w-full object-cover"
            />
            <div
              className="absolute inset-x-0 top-0 h-44"
              style={{ backgroundImage: 'linear-gradient(to bottom, var(--t-canvas), transparent)' }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-44"
              style={{ backgroundImage: 'linear-gradient(to top, var(--t-canvas), transparent)' }}
            />
          </div>
        )}
      </header>

      {/* Fit & details: compact rows + overlapping variant shots */}
      {features.length > 0 && (
        <section className="px-16 pb-10 pt-8">
          <div className="flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <h2 className="text-[46px] font-extrabold leading-tight text-[var(--t-ink)] [font-family:var(--t-display)]">
                المقاسات والتفاصيل
              </h2>
              <FeatureRows features={features} tile={76} icon={36} className="mt-10" />
            </div>
            {variantA && (
              <div className="relative shrink-0" style={{ width: 400, height: 560 }}>
                <img
                  src={variantA}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-full w-full rotate-1 rounded-[36px] object-cover shadow-2xl"
                />
                {variantB && (
                  <img
                    src={variantB}
                    alt=""
                    crossOrigin="anonymous"
                    className="absolute -bottom-8 -start-8 h-[230px] w-[230px] -rotate-3 rounded-3xl border-[6px] border-white object-cover shadow-xl"
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <ClosingSection
        closingLine={product.closing_line}
        images={last ? [last] : []}
      />
    </div>
  )
}
