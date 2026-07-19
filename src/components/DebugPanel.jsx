// Temporary Phase 1 panel: verifies the Supabase connection with a live read
// and an insert-then-delete against `products`. Remove in Phase 2.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DebugPanel() {
  const [readResult, setReadResult] = useState({ state: 'loading' })
  const [writeResult, setWriteResult] = useState({ state: 'idle' })

  useEffect(() => {
    async function testRead() {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      if (error) setReadResult({ state: 'error', message: error.message })
      else setReadResult({ state: 'ok', count })
    }
    testRead()
  }, [])

  async function testWrite() {
    setWriteResult({ state: 'loading' })
    const { data, error: insertError } = await supabase
      .from('products')
      .insert({ name: '__debug_write_test__' })
      .select('id')
      .single()
    if (insertError) {
      setWriteResult({ state: 'error', message: insertError.message })
      return
    }
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', data.id)
    if (deleteError) setWriteResult({ state: 'error', message: deleteError.message })
    else setWriteResult({ state: 'ok' })
  }

  return (
    <section className="rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-extrabold text-charcoal-900">فحص الاتصال بـ Supabase</h2>
      <p className="mt-0.5 text-xs text-charcoal-500">
        لوحة مؤقتة للمرحلة الأولى — تُحذف لاحقًا.
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">القراءة:</span>
          {readResult.state === 'loading' && (
            <span className="text-charcoal-500">...جاري الفحص</span>
          )}
          {readResult.state === 'ok' && (
            <span className="font-semibold text-cod-600">
              متصل ✓ — عدد المنتجات: {readResult.count}
            </span>
          )}
          {readResult.state === 'error' && <ErrorMessage message={readResult.message} />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">الكتابة:</span>
          {(writeResult.state === 'idle' || writeResult.state === 'error') && (
            <button
              onClick={testWrite}
              className="rounded-lg bg-cod-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-cod-700"
            >
              اختبار إضافة + حذف
            </button>
          )}
          {writeResult.state === 'loading' && (
            <span className="text-charcoal-500">...جاري الاختبار</span>
          )}
          {writeResult.state === 'ok' && (
            <span className="font-semibold text-cod-600">الإضافة والحذف نجحا ✓</span>
          )}
          {writeResult.state === 'error' && <ErrorMessage message={writeResult.message} />}
        </div>
      </div>
    </section>
  )
}

function ErrorMessage({ message }) {
  return (
    <code dir="ltr" className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
      {message}
    </code>
  )
}
