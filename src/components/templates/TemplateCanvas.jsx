import TemplateA from './TemplateA'
import TemplateB from './TemplateB'
import TemplateC from './TemplateC'

const TEMPLATES = { A: TemplateA, B: TemplateB, C: TemplateC }

// Fixed-width (1080px) ad canvas rendered at full resolution.
// Wrap in ScaledPreview for on-screen display; the export captures this
// node 1:1 via the ref (React 19 ref-as-prop), unaffected by the preview
// scale transform on the wrapper. dir/lang/colors are set here explicitly
// so the node is self-contained.
export default function TemplateCanvas({ product, ref }) {
  const Template = TEMPLATES[product.template_id] ?? TemplateA
  return (
    <div ref={ref} dir="rtl" lang="ar" className="w-[1080px] bg-cream-50 font-sans text-charcoal-800">
      <Template product={product} />
    </div>
  )
}
