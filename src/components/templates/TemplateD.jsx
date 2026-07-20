import {
  AnnouncementBar, BadgePill, CtaBlock, CtaPill, DiscountBadge, Headline,
  NumberedList, Para, PhotoBand, PhotoGrid, PricePill, SectionTitle, SpecsTable,
  StepsSection, Testimonials, TrustStrip, splitParagraphs,
} from './shared'

// Template D — «عرض ترويجي» (refs: window cleaner / ginger spray).
// Discount-first: hero with -X% badge, early price + CTA, results grid with
// check overlays, numbered feature list, how-to steps, trust strip, reviews.
export default function TemplateD({ product }) {
  const imgs = product.image_urls ?? []
  const features = product.features ?? []
  const paras = splitParagraphs(product.description)

  return (
    <div className="pb-16">
      <AnnouncementBar text={product.announcement} />

      {/* Hero with discount badge */}
      <header className="relative px-12 pt-14 text-center">
        <Headline
          text={product.headline}
          className="text-[50px] font-extrabold leading-[1.35]"
        />
        {product.subheadline && (
          <p className="mx-auto mt-4 max-w-[620px] text-[25px] font-semibold leading-relaxed text-[var(--t-ink-soft)]">
            {product.subheadline}
          </p>
        )}
        {imgs[0] && (
          <div className="relative mt-9">
            <img
              src={imgs[0]}
              alt=""
              crossOrigin="anonymous"
              className="h-[520px] w-full rounded-3xl object-cover shadow-xl"
            />
            <DiscountBadge
              price={product.price}
              oldPrice={product.old_price}
              className="absolute -top-6 left-2"
            />
          </div>
        )}
      </header>

      {/* Early price + CTA */}
      <PricePill price={product.price} oldPrice={product.old_price} className="mt-10 px-12" />
      <div className="mt-6 text-center">
        <CtaPill />
      </div>
      <BadgePill text={product.badge} className="mt-8 px-12" />

      {paras[0] && <Para className="mt-12 px-12 text-center">{paras[0]}</Para>}

      {/* Results grid with check overlays */}
      {imgs.length > 1 && (
        <section className="mt-12 px-12">
          <SectionTitle>نتائج حقيقية</SectionTitle>
          <PhotoGrid images={imgs.slice(1, 5)} check className="mt-9" />
        </section>
      )}

      {/* Numbered features */}
      {features.length > 0 && (
        <section className="mt-14 px-12">
          <SectionTitle>{features.length} مميزات باش تحبو</SectionTitle>
          <NumberedList features={features} className="mt-9" />
        </section>
      )}

      <StepsSection stepsText={product.usage_steps} className="mt-14 px-12" />

      {paras[1] && <Para className="mt-12 px-12 text-center">{paras[1]}</Para>}
      <PhotoBand src={imgs[5]} h={480} className="mt-10" />

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
