import {
  AnnouncementBar, CtaBlock, Headline, IconCircleGrid, Para, PhotoBand,
  PhotoGrid, SectionTitle, SpecsTable, StepsSection, Testimonials, TrustStrip,
  splitParagraphs,
} from './shared'

// Template B — «قصة إقناع» (refs: fuel saver / joint cream).
// Pain-question headline + big circle photo + colored answer + outline icon
// grid + alternating paragraph/photo story. Sections collapse without data.
export default function TemplateB({ product }) {
  const imgs = product.image_urls ?? []
  const features = product.features ?? []
  const paras = splitParagraphs(product.description)

  return (
    <div className="pb-16">
      <AnnouncementBar text={product.announcement} />

      {/* Pain question + circle photo */}
      <header className="px-12 pt-14 text-center">
        <Headline
          text={product.headline}
          className="text-[50px] font-extrabold leading-[1.35]"
        />
        {imgs[0] && (
          <img
            src={imgs[0]}
            alt=""
            crossOrigin="anonymous"
            className="mx-auto mt-10 h-[500px] w-[500px] rounded-full border-[10px] border-[var(--t-card)] object-cover shadow-2xl"
          />
        )}
      </header>

      {/* The answer */}
      {(product.subheadline || paras[0]) && (
        <section className="mt-12 px-12 text-center">
          {product.subheadline && (
            <h2 className="text-[36px] font-extrabold leading-snug text-[var(--t-tile)] [font-family:var(--t-display)]">
              {product.subheadline}
            </h2>
          )}
          {paras[0] && <Para className="mx-auto mt-5 max-w-[620px]">{paras[0]}</Para>}
        </section>
      )}

      <PhotoBand src={imgs[1]} h={500} className="mt-12" />

      {/* Why you need it: outline icon circles */}
      {features.length > 0 && (
        <section className="mt-12 px-12">
          <SectionTitle>علاش تحتاجو؟</SectionTitle>
          <IconCircleGrid features={features.slice(0, 4)} className="mt-12" />
        </section>
      )}

      {paras[1] && <Para className="mt-14 px-12 text-center">{paras[1]}</Para>}

      <PhotoGrid images={imgs.slice(2, 6)} className="mt-10 px-12" />

      {paras[2] && <Para className="mt-12 px-12 text-center">{paras[2]}</Para>}

      <PhotoBand src={imgs[6]} h={480} className="mt-12" />

      <StepsSection stepsText={product.usage_steps} className="mt-14 px-12" />
      <SpecsTable specs={product.specs} className="mt-14 px-12" />
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
