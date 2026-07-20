import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { THEMES } from '../lib/themes'
import { removeImagesByUrls } from '../lib/storage'

export default function Dashboard() {
  const [status, setStatus] = useState('loading')
  const [products, setProducts] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, template_id, theme_id, image_urls, created_at')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
      } else {
        setProducts(data)
        setStatus('ready')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDelete(product) {
    setDeletingId(product.id)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      setErrorMsg(error.message)
    } else {
      await removeImagesByUrls(product.image_urls)
      setProducts((list) => list.filter((p) => p.id !== product.id))
      setErrorMsg(null)
    }
    setDeletingId(null)
    setConfirmingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-charcoal-900">المنتجات</h1>
        {status === 'ready' && products.length > 0 && (
          <span className="text-sm text-charcoal-500">{products.length} منتج</span>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          خطأ —{' '}
          <code dir="ltr" className="text-xs">
            {errorMsg}
          </code>
        </div>
      )}

      {status === 'loading' && (
        <p className="py-16 text-center text-charcoal-500">...جاري التحميل</p>
      )}

      {status === 'ready' && products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-100 p-12 text-center">
          <p className="text-charcoal-600">لا توجد منتجات بعد.</p>
          <Link
            to="/new"
            className="mt-4 inline-block rounded-lg bg-leather-600 px-5 py-2 font-bold text-white transition hover:bg-leather-700"
          >
            أضف أول منتج
          </Link>
        </div>
      )}

      {status === 'ready' && products.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-cream-200 bg-white"
            >
              <Link to={`/preview/${p.id}`} className="block">
                {p.image_urls?.[0] ? (
                  <img
                    src={p.image_urls[0]}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-cream-100 text-sm text-charcoal-500">
                    بدون صورة
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/preview/${p.id}`}
                    className="font-extrabold text-charcoal-900 transition hover:text-leather-700"
                  >
                    {p.name}
                  </Link>
                  <span className="shrink-0 rounded bg-leather-600 px-2 py-0.5 text-xs font-bold text-white">
                    {p.template_id} · {THEMES[p.theme_id]?.label ?? 'دافئ'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-charcoal-500">
                  {p.price != null && (
                    <span className="font-bold text-charcoal-700">
                      {Number(p.price).toLocaleString('ar-DZ')} دج ·{' '}
                    </span>
                  )}
                  {new Date(p.created_at).toLocaleDateString('ar-DZ', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {confirmingId === p.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === p.id ? '...جاري الحذف' : 'تأكيد الحذف'}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        disabled={deletingId === p.id}
                        className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-bold text-charcoal-600 transition hover:bg-cream-100"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/edit/${p.id}`}
                        className="flex items-center gap-1 rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-bold text-charcoal-700 transition hover:border-leather-400 hover:text-leather-700"
                      >
                        <Pencil size={13} />
                        تعديل
                      </Link>
                      <button
                        onClick={() => setConfirmingId(p.id)}
                        className="flex items-center gap-1 rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-bold text-charcoal-700 transition hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
