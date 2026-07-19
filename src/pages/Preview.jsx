import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ScaledPreview from '../components/ScaledPreview'
import TemplateCanvas from '../components/templates/TemplateCanvas'

export default function Preview() {
  const { productId } = useParams()
  const [state, setState] = useState({ status: 'loading' })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900">{product.name}</h1>
          <p className="mt-1 text-sm text-charcoal-500">
            معاينة القالب — التصدير يأتي في مرحلة قادمة.
          </p>
        </div>
        <span className="rounded-lg bg-leather-600 px-3 py-1 text-sm font-bold text-white">
          قالب {product.template_id}
        </span>
      </div>
      <div className="rounded-2xl border border-cream-200 bg-white p-3 sm:p-4">
        <ScaledPreview>
          <TemplateCanvas product={product} />
        </ScaledPreview>
      </div>
    </div>
  )
}
