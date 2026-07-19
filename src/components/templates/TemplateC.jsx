import { ClosingSection, Headline, IconTile, softText } from './shared'

// Template C — small gadget / accessory. Split "sticker" layout: header is
// a side-by-side row (start-aligned text + hero in a thick white frame on a
// tilted accent block), specs render as a dense 2-column card grid.
// Image slots: [0] hero, [1..2] floating photos in the closing.
export default function TemplateC({ product }) {
  const [hero, ...details] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      {/* Header: split text + framed hero */}
      <header className="px-16 pt-20">
        <div className="flex items-center gap-14">
          <div className="min-w-0 flex-1 text-start">
            <Headline
              text={product.headline}
              className="text-[58px] font-extrabold leading-[1.32]"
            />
            {product.subheadline && (
              <p className={`mt-5 text-[29px] font-semibold leading-relaxed ${softText}`}>
                {product.subheadline}
              </p>
            )}
          </div>
          {hero && (
            <div className="relative shrink-0">
              {/* tilted accent block behind the framed photo */}
              <div
                aria-hidden
                className="absolute -bottom-6 -start-6 h-full w-full rotate-3 rounded-[44px] bg-[var(--t-tile)] opacity-80"
              />
              <img
                src={hero}
                alt=""
                crossOrigin="anonymous"
                className="relative h-[540px] w-[430px] -rotate-1 rounded-[40px] border-[10px] border-white object-cover shadow-2xl"
              />
            </div>
          )}
        </div>
      </header>

      {/* Specs: dense 2-column card grid */}
      {features.length > 0 && (
        <section className="px-16 pb-6 pt-16">
          <h2 className="text-center text-[46px] font-extrabold leading-tight text-[var(--t-ink)] [font-family:var(--t-display)]">
            المواصفات
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-5 rounded-[24px] border bg-[var(--t-card)] p-6 shadow-sm"
                style={{ borderColor: 'var(--t-card-border)' }}
              >
                <IconTile name={f.icon} size={64} icon={30} />
                <div className="min-w-0">
                  <p className="text-[26px] font-extrabold leading-snug text-[var(--t-ink)]">
                    {f.label}
                  </p>
                  {f.description && (
                    <p className={`mt-0.5 text-[21px] font-semibold leading-snug ${softText}`}>
                      {f.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={details.slice(0, 2)} />
    </div>
  )
}
