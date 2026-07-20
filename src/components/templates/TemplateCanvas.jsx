import { resolveTheme, themeVars } from '../../lib/themes'
import TemplateA from './TemplateA'
import TemplateB from './TemplateB'
import TemplateC from './TemplateC'
import TemplateD from './TemplateD'

const TEMPLATES = { A: TemplateA, B: TemplateB, C: TemplateC, D: TemplateD }

export const CANVAS_WIDTH = 800
export const CANVAS_MAX_HEIGHT = 7000

// Fixed-width (800px) landing-ad canvas, capped at 7000px tall — content
// shortens naturally because every section collapses when its data is
// missing. Wrap in ScaledPreview for on-screen display; the export captures
// this node 1:1 via the ref. The theme (product.theme_id) is injected as
// CSS custom properties, so the node is fully self-contained.
export default function TemplateCanvas({ product, ref }) {
  const Template = TEMPLATES[product.template_id] ?? TEMPLATES.A
  const theme = resolveTheme(product.theme_id)
  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      style={{ ...themeVars(theme), maxHeight: CANVAS_MAX_HEIGHT, overflow: 'hidden' }}
      className="w-[800px] antialiased"
    >
      <Template product={product} />
    </div>
  )
}
