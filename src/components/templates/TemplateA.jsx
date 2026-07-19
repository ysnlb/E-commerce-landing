import { ClosingSection, FeatureRows, Headline, softText } from './shared'

// Template A — container / home item.
// Image slots: [0] hero, [1] close-up beside the feature rows,
// [2..3] floating photos in the closing.
export default function TemplateA({ product }) {
  const [main, closeUp, ...rest] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      {/* Header: headline block melting into a full-bleed hero photo */}
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
        {main && (
          <div className="relative mt-6">
            <img
              src={main}
              alt=""
              crossOrigin="anonymous"
              className="h-[740px] w-full object-cover"
            />
            {/* canvas-colored washes melt the photo into the background */}
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

      {/* Features: rows with icon tiles (right) + floating close-up (left) */}
      {features.length > 0 && (
        <section className="px-16 pb-10 pt-8">
          <div className="flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <h2 className="text-[46px] font-extrabold leading-tight text-[var(--t-ink)] [font-family:var(--t-display)]">
                كاليتي متينة وتصميم هبال!
              </h2>
              <FeatureRows features={features} className="mt-12" />
            </div>
            {closeUp && (
              <img
                src={closeUp}
                alt=""
                crossOrigin="anonymous"
                className="h-[600px] w-[420px] shrink-0 -rotate-1 rounded-[36px] object-cover shadow-2xl"
              />
            )}
          </div>
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={rest.slice(0, 2)} />
    </div>
  )
}
