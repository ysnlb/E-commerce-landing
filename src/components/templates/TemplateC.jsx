import { ClosingSection, Headline, IconTile, softText } from './shared'

// Template C — small gadget / accessory.
// Image slots: [0] floating hero shot, [1..2] floating photos in the closing.
export default function TemplateC({ product }) {
  const [hero, ...details] = product.image_urls ?? []
  const features = product.features ?? []

  return (
    <div>
      {/* Header: headline + floating hero on a soft radial glow */}
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
        {hero && (
          <div className="relative mt-12 flex justify-center">
            <div
              aria-hidden
              className="absolute top-1/2 h-[560px] w-[720px] -translate-y-1/2 rounded-full"
              style={{ backgroundImage: 'var(--t-glow)' }}
            />
            <img
              src={hero}
              alt=""
              crossOrigin="anonymous"
              className="relative h-[620px] w-[680px] object-contain drop-shadow-[0_36px_44px_rgba(20,16,10,0.25)]"
            />
          </div>
        )}
      </header>

      {/* Specs: dense grid of frosted callout tiles */}
      {features.length > 0 && (
        <section className="px-16 pb-8 pt-14">
          <h2 className="text-center text-[46px] font-extrabold leading-tight text-[var(--t-ink)] [font-family:var(--t-display)]">
            المواصفات
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-7">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex w-[300px] flex-col items-center gap-4 rounded-[28px] border bg-[var(--t-card)] p-8 text-center shadow-md"
                style={{ borderColor: 'var(--t-card-border)' }}
              >
                <IconTile name={f.icon} size={72} icon={34} />
                <p className="text-[28px] font-extrabold leading-snug text-[var(--t-ink)]">
                  {f.label}
                </p>
                {f.description && (
                  <p className={`-mt-2 text-[22px] font-semibold leading-snug ${softText}`}>
                    {f.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ClosingSection closingLine={product.closing_line} images={details.slice(0, 2)} />
    </div>
  )
}
