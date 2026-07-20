import {
  AnnouncementBar, BadgePill, BulletList, CtaBlock, Headline, Para, PhotoBand,
  PhotoGrid, PricePill, SectionTitle, SpecsTable, StepsSection, Testimonials,
  TrustStrip, splitParagraphs,
} from './shared'

// Template A — «متجر أنيق» (refs: smartwatch / ultrasonic cleaner).
// Dark hero + bestseller badge + price pill + bullet features beside a photo
// + ink callout band + trust strip + testimonials. Every section collapses
// when its data is missing.
export default function TemplateA({ product }) {
  const imgs = product.image_urls ?? []
  const features = product.features ?? []
  const paras = splitParagraphs(product.description)

  return (
    <div className="pb-16">
      <AnnouncementBar text={product.announcement} />

      {/* Dark hero */}
      <header className="bg-[var(--t-ink)] px-12 pb-14 pt-14 text-center">
        <Headline
          text={product.headline}
          className="!text-[var(--t-canvas)] text-[52px] font-extrabold leading-[1.3]"
        />
        {product.subheadline && (
          <p className="mx-auto mt-4 max-w-[600px] text-[24px] font-semibold leading-relaxed text-[var(--t-canvas)] opacity-75">
            {product.subheadline}
          </p>
        )}
        {imgs[0] && (
          <img
            src={imgs[0]}
            alt=""
            crossOrigin="anonymous"
            className="mx-auto mt-10 h-[500px] w-full rounded-3xl object-cover shadow-2xl"
          />
        )}
      </header>

      <BadgePill text={product.badge} className="mt-10 px-12" />
      <PricePill price={product.price} oldPrice={product.old_price} className="mt-7 px-12" />

      <PhotoBand src={imgs[1]} h={480} className="mt-12" />

      {/* Features: bullets beside a photo */}
      {features.length > 0 && (
        <section className="mt-12 px-12">
          <SectionTitle>مميزات المنتج</SectionTitle>
          <div className="mt-10 flex items-center gap-8">
            <BulletList features={features.slice(0, 3)} className="min-w-0 flex-1" />
            {imgs[2] && (
              <img
                src={imgs[2]}
                alt=""
                crossOrigin="anonymous"
                className="h-[400px] w-[290px] shrink-0 rounded-3xl object-cover shadow-xl"
              />
            )}
          </div>
        </section>
      )}

      {/* Ink callout band */}
      {paras[0] && (
        <section className="mt-14 bg-[var(--t-ink)] px-12 py-12 text-center">
          <p className="mx-auto max-w-[640px] text-[25px] font-bold leading-[1.85] text-[var(--t-canvas)] opacity-90">
            {paras[0]}
          </p>
        </section>
      )}

      {/* Extra features */}
      {features.length > 3 && (
        <section className="mt-14 px-12">
          <SectionTitle>مميزات أخرى</SectionTitle>
          <BulletList features={features.slice(3, 6)} className="mt-9" />
        </section>
      )}

      <PhotoGrid images={imgs.slice(3, 7)} className="mt-12 px-12" />

      {paras[1] && <Para className="mt-12 px-12 text-center">{paras[1]}</Para>}

      <StepsSection stepsText={product.usage_steps} className="mt-14 px-12" />
      <SpecsTable specs={product.specs} className="mt-14 px-12" />
      <TrustStrip className="mt-16 px-12" />
      <Testimonials reviews={product.reviews} className="mt-14 px-12" />
      <CtaBlock
        closingLine={product.closing_line}
        price={product.price}
        oldPrice={product.old_price}
        className="mt-16 px-12"
      />
    </div>
  )
}
