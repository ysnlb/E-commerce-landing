import {
  AnnouncementBar, CtaBlock, Headline, IconRow, Para, PhotoBand, PhotoCollage,
  PricePill, Ribbon, SpecsTable, StepsSection, Testimonials, TrustStrip,
  splitParagraphs,
} from './shared'

// Template C — «كتالوج فاخر» (refs: makeup bag / mini projector).
// Ribbon headings with side lines, photo collage, inline icon row,
// alternating paragraph/photo bands, and a key/value specs table.
export default function TemplateC({ product }) {
  const imgs = product.image_urls ?? []
  const features = product.features ?? []
  const paras = splitParagraphs(product.description)

  // Story bands: paragraphs 1..3 alternate with photos 3..5.
  const bands = paras.slice(1, 4)

  return (
    <div className="pb-16">
      <AnnouncementBar text={product.announcement} />

      <header className="px-12 pt-12 text-center">
        <Ribbon>{product.name}</Ribbon>
        <Headline
          text={product.headline}
          className="mt-9 text-[48px] font-extrabold leading-[1.35]"
        />
        {product.subheadline && (
          <p className="mx-auto mt-4 max-w-[620px] text-[25px] font-semibold leading-relaxed text-[var(--t-ink-soft)]">
            {product.subheadline}
          </p>
        )}
      </header>

      <PhotoCollage images={imgs.slice(0, 3)} className="mt-10 px-12" />

      <PricePill price={product.price} oldPrice={product.old_price} className="mt-10 px-12" />

      {paras[0] && (
        <section className="mt-12 px-12">
          <Ribbon>واش يميّزو؟</Ribbon>
          <Para className="mt-8 text-center">{paras[0]}</Para>
        </section>
      )}

      <IconRow features={features} className="mt-12 px-12" />

      {bands.map((text, i) => (
        <section key={i} className="mt-14">
          <Para className="px-12 text-center">{text}</Para>
          <PhotoBand src={imgs[3 + i]} h={460} className="mt-9" />
        </section>
      ))}

      {/* leftover photos, if any */}
      {imgs.length > 3 + bands.length && (
        <PhotoBand src={imgs[3 + bands.length]} h={460} className="mt-12" />
      )}

      <SpecsTable specs={product.specs} title="المحتويات" className="mt-14 px-12" />
      <StepsSection stepsText={product.usage_steps} className="mt-14 px-12" />
      <Testimonials reviews={product.reviews} className="mt-14 px-12" />
      <TrustStrip className="mt-16 px-12" />
      <CtaBlock
        closingLine={product.closing_line}
        price={product.price}
        oldPrice={product.old_price}
        className="mt-16 px-12"
      />
    </div>
  )
}
