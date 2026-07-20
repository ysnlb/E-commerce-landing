import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toCanvas } from 'html-to-image'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { THEMES } from '../lib/themes'
import ScaledPreview from '../components/ScaledPreview'
import TemplateCanvas, { CANVAS_MAX_HEIGHT } from '../components/templates/TemplateCanvas'

const FORMATS = {
  webp: { mime: 'image/webp', ext: 'webp' },
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
}

const TEMPLATE_LABELS = {
  A: 'A — متجر أنيق',
  B: 'B — قصة إقناع',
  C: 'C — كتالوج فاخر',
  D: 'D — عرض ترويجي',
}

// Keeps Arabic/latin letters and digits for the download filename.
function slugify(text) {
  return String(text ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export default function Preview() {
  const { productId } = useParams()
  const canvasRef = useRef(null)
  const [state, setState] = useState({ status: 'loading' })
  const [format, setFormat] = useState('webp')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [size, setSize] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      if (cancelled) return
      if (error || !data) setState({ status: 'error', message: error?.message })
      else setState({ status: 'ready', product: data })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [productId])

  // Live canvas height indicator (content vs the 7000px cap).
  useEffect(() => {
    if (state.status !== 'ready') return
    const node = canvasRef.current
    if (!node) return
    const update = () => setSize({ shown: node.offsetHeight, content: node.scrollHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [state.status, state.product?.template_id, state.product?.theme_id])

  // Switch template/theme live and persist so exports and the form match.
  async function persistField(patch) {
    setState((s) => ({ ...s, product: { ...s.product, ...patch } }))
    const { error } = await supabase.from('products').update(patch).eq('id', productId)
    if (error) setExportError(error.message)
  }

  async function handleExport() {
    if (!canvasRef.current || exporting) return
    setExporting(true)
    setExportError(null)
    try {
      const canvas = await toCanvas(canvasRef.current, { pixelRatio: 2 })
      const { mime, ext } = FORMATS[format]
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error(`encoding to ${mime} failed`))),
          mime,
          0.92,
        ),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slugify(state.product.name) || state.product.id.slice(0, 8)}-ad.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err.message || String(err))
    } finally {
      setExporting(false)
    }
  }

  if (state.status === 'loading') {
    return <p className="py-20 text-center text-charcoal-500">...جاري تحميل المنتج</p>
  }

  if (state.status === 'error') {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-charcoal-800">تعذر العثور على المنتج.</p>
        {state.message && (
          <code dir="ltr" className="mt-2 inline-block rounded bg-red-50 px-2 py-1 text-xs text-red-700">
            {state.message}
          </code>
        )}
        <p className="mt-4">
          <Link to="/" className="font-semibold text-leather-600 hover:text-leather-700">
            العودة إلى لوحة التحكم
          </Link>
        </p>
      </div>
    )
  }

  const { product } = state
  const clipped = size && size.content > CANVAS_MAX_HEIGHT
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900">{product.name}</h1>
          <p className="mt-1 text-sm text-charcoal-500">
            تُصدَّر الصورة بعرض 800px بدقة مضاعفة (2x)
            {size && (
              <span className="ms-2 rounded bg-cream-200 px-2 py-0.5 text-xs font-bold text-charcoal-700" dir="ltr">
                800 × {Math.round(size.shown).toLocaleString('en-US')}px
              </span>
            )}
            {clipped && (
              <span className="ms-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                المحتوى أطول من 7000px — سيتم قصّه
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={product.template_id ?? 'A'}
            onChange={(e) => persistField({ template_id: e.target.value })}
            className="rounded-lg border border-cream-300 bg-white px-2 py-1.5 text-xs font-bold text-charcoal-700 outline-none focus:border-leather-500"
          >
            {Object.entries(TEMPLATE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={product.theme_id ?? 'warm'}
            onChange={(e) => persistField({ theme_id: e.target.value })}
            className="rounded-lg border border-cream-300 bg-white px-2 py-1.5 text-xs font-bold text-charcoal-700 outline-none focus:border-leather-500"
          >
            {Object.entries(THEMES).map(([id, t]) => (
              <option key={id} value={id}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-lg border border-cream-300">
            {Object.keys(FORMATS).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                  format === f ? 'bg-charcoal-900 text-white' : 'bg-white text-charcoal-600 hover:bg-cream-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-cod-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-cod-700 disabled:opacity-60"
          >
            <Download size={16} />
            {exporting ? '...جاري إنشاء الصورة' : 'تصدير'}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          خطأ —{' '}
          <code dir="ltr" className="text-xs">
            {exportError}
          </code>
        </div>
      )}

      <div className="rounded-2xl border border-cream-200 bg-white p-3 sm:p-4">
        <ScaledPreview width={800}>
          <TemplateCanvas product={product} ref={canvasRef} />
        </ScaledPreview>
      </div>
    </div>
  )
}
