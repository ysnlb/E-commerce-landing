import { resolveTheme, themeVars } from '../../lib/themes'
import TemplateA from './TemplateA'
import TemplateB from './TemplateB'
import TemplateC from './TemplateC'

const TEMPLATES = { A: TemplateA, B: TemplateB, C: TemplateC }

// Fixed-width (1080px) ad canvas rendered at full resolution.
// Wrap in ScaledPreview for on-screen display; the export captures this
// node 1:1 via the ref (React 19 ref-as-prop), unaffected by the preview
// scale transform on the wrapper. The theme (product.theme_id) is injected
// as CSS custom properties here, so the node is fully self-contained.
export default function TemplateCanvas({ product, ref }) {
  const Template = TEMPLATES[product.template_id] ?? TemplateA
  const theme = resolveTheme(product.theme_id)
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      style={themeVars(theme)}
      className="w-[1080px] antialiased"
    >
      <Template product={product} />
    </div>
  )
}
