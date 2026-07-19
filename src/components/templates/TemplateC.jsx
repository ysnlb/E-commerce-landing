import { ClosingSection, Headline, IconTile } from './shared'

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
          className="font-display text-[64px] font-extrabold leading-[1.3] text-espresso-900"
        />
        {product.subheadline && (
          <p className="mx-auto mt-5 max-w-4xl text-[30px] font-semibold leading-relaxed text-espresso-800/75">
            {product.subheadline}
          </p>
        )}
        {hero && (
          <div className="relative mt-12 flex justify-center">
            <div
              aria-hidden
              className="absolute top-1/2 h-[560px] w-[720px] -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, #f1e7d2 0%, rgba(241,231,210,0.55) 55%, transparent 100%)',
              }}
            />
            <img
              src={hero}
              alt=""
              crossOrigin="anonymous"
              className="relative h-[620px] w-[680px] object-contain drop-shadow-[0_36px_44px_rgba(59,42,29,0.22)]"
            />
          </div>
        )}
      </header>

      {/* Specs: dense grid of frosted callout tiles */}
      {features.length > 0 && (
        <section className="px-16 pb-8 pt-14">
          <h2 className="text-center font-display text-[46px] font-extrabold leading-tight text-espresso-900">
            المواصفات
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-7">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex w-[300px] flex-col items-center gap-4 rounded-[28px] border border-cream-200 bg-white/85 p-8 text-center shadow-md"
              >
                <IconTile name={f.icon} size={72} icon={34} />
                <p className="text-[28px] font-extrabold leading-snug text-espresso-800">
                  {f.label}
                </p>
                {f.description && (
                  <p className="-mt-2 text-[22px] font-semibold leading-snug text-espresso-800/60">
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
