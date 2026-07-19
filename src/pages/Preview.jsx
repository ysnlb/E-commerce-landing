import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toCanvas } from 'html-to-image'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ScaledPreview from '../components/ScaledPreview'
import TemplateCanvas from '../components/templates/TemplateCanvas'

const FORMATS = {
  webp: { mime: 'image/webp', ext: 'webp' },
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
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

  async function handleExport() {
    if (!canvasRef.current || exporting) return
    setExporting(true)
    setExportError(null)
    try {
      // toCanvas (html-to-image) captures the full-res node; pixelRatio 2
      // renders 2160px wide for crisp text. canvas.toBlob then encodes the
      // chosen format — the one uniform path that also supports webp.
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
          <code
            dir="ltr"
            className="mt-2 inline-block rounded bg-red-50 px-2 py-1 text-xs text-red-700"
          >
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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900">{product.name}</h1>
          <p className="mt-1 text-sm text-charcoal-500">
            الصورة تُصدَّر بعرض 1080px بدقة مضاعفة (2x).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-leather-600 px-3 py-1 text-sm font-bold text-white">
            قالب {product.template_id}
          </span>
          <div className="flex overflow-hidden rounded-lg border border-cream-300">
            {Object.keys(FORMATS).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                  format === f
                    ? 'bg-charcoal-900 text-white'
                    : 'bg-white text-charcoal-600 hover:bg-cream-100'
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
          فشل التصدير —{' '}
          <code dir="ltr" className="text-xs">
            {exportError}
          </code>
        </div>
      )}

      <div className="rounded-2xl border border-cream-200 bg-white p-3 sm:p-4">
        <ScaledPreview>
          <TemplateCanvas product={product} ref={canvasRef} />
        </ScaledPreview>
      </div>
    </div>
  )
}
