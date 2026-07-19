import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { removeImagesByUrls } from '../lib/storage'
import { FEATURE_ICONS, FEATURE_ICON_LABELS } from '../lib/icons'
import ImageUploader from '../components/ImageUploader'

const TEMPLATES = [
  { value: 'A', label: 'A — Container/Home' },
  { value: 'B', label: 'B — Wearable/Clothing' },
  { value: 'C', label: 'C — Small gadget' },
]

const DEFAULT_ICONS = ['package', 'shield-check', 'truck']

const emptyFeatures = () =>
  DEFAULT_ICONS.map((icon) => ({ icon, label: '', description: '' }))

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-cream-50 px-3 py-2 text-charcoal-900 outline-none transition focus:border-leather-500 ${
    hasError ? 'border-red-400' : 'border-cream-300'
  }`

// Create + edit form: /new inserts, /edit/:productId prefills and updates.
export default function ProductForm() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isEdit = Boolean(productId)

  const [loadState, setLoadState] = useState({ status: isEdit ? 'loading' : 'ready' })
  const [original, setOriginal] = useState(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    template_id: 'A',
    headline: '',
    subheadline: '',
    description: '',
    closing_line: '',
  })
  const [features, setFeatures] = useState(emptyFeatures)
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Prefill when editing.
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      if (cancelled) return
      if (error || !data) {
        setLoadState({ status: 'error', message: error?.message })
        return
      }
      setOriginal(data)
      setForm({
        name: data.name ?? '',
        price: data.price == null ? '' : String(data.price),
        template_id: data.template_id ?? 'A',
        headline: data.headline ?? '',
        subheadline: data.subheadline ?? '',
        description: data.description ?? '',
        closing_line: data.closing_line ?? '',
      })
      const rows = (data.features ?? []).slice(0, 3).map((f, i) => ({
        icon: f.icon || DEFAULT_ICONS[i],
        label: f.label || '',
        description: f.description || '',
      }))
      while (rows.length < 3) {
        rows.push({ icon: DEFAULT_ICONS[rows.length], label: '', description: '' })
      }
      setFeatures(rows)
      setImages(
        (data.image_urls ?? []).map((url) => ({
          key: crypto.randomUUID(),
          url,
          preview: url,
        })),
      )
      setLoadState({ status: 'ready' })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isEdit, productId])

  // Revoke local object URLs (new files only) when leaving the page.
  const imagesRef = useRef(images)
  imagesRef.current = images
  useEffect(
    () => () =>
      imagesRef.current.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.preview)
      }),
    [],
  )

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setFeature(index, key, value) {
    setFeatures((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    )
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'أدخل اسم المنتج.'
    if (!form.headline.trim()) next.headline = 'أدخل العنوان الرئيسي.'
    if (images.length === 0) next.images = 'أضف صورة واحدة على الأقل.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving || !validate()) return
    setSaving(true)
    setSubmitError(null)

    const id = productId ?? crypto.randomUUID()
    const newPaths = []
    try {
      // Existing images keep their URL; only new files are uploaded.
      const urls = []
      for (const [i, img] of images.entries()) {
        if (img.url) {
          urls.push(img.url)
          continue
        }
        const parts = img.file.name.split('.')
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
        const path = `${id}/${Date.now()}-${i + 1}.${ext}`
        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, img.file)
        if (error) throw error
        newPaths.push(path)
        urls.push(
          supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl,
        )
      }

      const filledFeatures = features
        .filter((f) => f.label.trim())
        .map((f) => ({
          icon: f.icon,
          label: f.label.trim(),
          description: f.description.trim(),
        }))

      const row = {
        name: form.name.trim(),
        price: form.price === '' ? null : Number(form.price),
        template_id: form.template_id,
        headline: form.headline.trim(),
        subheadline: form.subheadline.trim() || null,
        description: form.description.trim() || null,
        features: filledFeatures.length ? filledFeatures : null,
        closing_line: form.closing_line.trim() || null,
        image_urls: urls,
      }

      if (isEdit) {
        const { error } = await supabase.from('products').update(row).eq('id', id)
        if (error) throw error
        // Clean up storage files for images removed from the product.
        const removed = (original?.image_urls ?? []).filter((u) => !urls.includes(u))
        await removeImagesByUrls(removed)
      } else {
        const { error } = await supabase.from('products').insert({ id, ...row })
        if (error) throw error
      }

      navigate('/')
    } catch (err) {
      // Best-effort cleanup so a failed save leaves no orphan files.
      if (newPaths.length) {
        await supabase.storage
          .from('product-images')
          .remove(newPaths)
          .catch(() => {})
      }
      setSubmitError(err.message || 'خطأ غير متوقع')
      setSaving(false)
    }
  }

  if (loadState.status === 'loading') {
    return <p className="py-20 text-center text-charcoal-500">...جاري تحميل المنتج</p>
  }

  if (loadState.status === 'error') {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-charcoal-800">تعذر العثور على المنتج.</p>
        {loadState.message && (
          <code
            dir="ltr"
            className="mt-2 inline-block rounded bg-red-50 px-2 py-1 text-xs text-red-700"
          >
            {loadState.message}
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <h1 className="text-2xl font-extrabold text-charcoal-900">
        {isEdit ? 'تعديل المنتج' : 'منتج جديد'}
      </h1>

      <Section title="معلومات أساسية">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المنتج *" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputClass(errors.name)}
            />
          </Field>
          <Field label="السعر (دج)">
            <input
              type="number"
              min="0"
              step="any"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
              className={inputClass(false)}
            />
          </Field>
        </div>
        <Field label="القالب">
          <select
            value={form.template_id}
            onChange={(e) => setField('template_id', e.target.value)}
            className={inputClass(false)}
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="نصوص الإعلان">
        <Field label="العنوان الرئيسي *" error={errors.headline}>
          <input
            value={form.headline}
            onChange={(e) => setField('headline', e.target.value)}
            className={inputClass(errors.headline)}
          />
        </Field>
        <Field label="العنوان الفرعي">
          <input
            value={form.subheadline}
            onChange={(e) => setField('subheadline', e.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <Field label="الوصف">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <Field label="جملة الختام (قسم الطلب)">
          <input
            value={form.closing_line}
            onChange={(e) => setField('closing_line', e.target.value)}
            placeholder="الطلبية متوفرة الآن"
            className={inputClass(false)}
          />
        </Field>
      </Section>

      <Section title="المميزات">
        <div className="space-y-4">
          {features.map((row, i) => (
            <FeatureRow key={i} index={i} row={row} onChange={setFeature} />
          ))}
        </div>
      </Section>

      <Section title="الصور *">
        <ImageUploader images={images} onChange={setImages} />
        {errors.images && (
          <p className="text-sm font-semibold text-red-600">{errors.images}</p>
        )}
      </Section>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          فشل الحفظ —{' '}
          <code dir="ltr" className="text-xs">
            {submitError}
          </code>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-charcoal-900 py-3 font-bold text-white transition hover:bg-charcoal-800 disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {saving ? '...جاري الحفظ' : isEdit ? 'حفظ التعديلات' : 'حفظ المنتج'}
      </button>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-extrabold text-charcoal-900">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-sm font-semibold text-red-600">{error}</span>
      )}
    </label>
  )
}

function FeatureRow({ index, row, onChange }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
      <p className="mb-2 text-sm font-bold text-charcoal-600">الميزة {index + 1}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Object.entries(FEATURE_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            title={FEATURE_ICON_LABELS[key]}
            onClick={() => onChange(index, 'icon', key)}
            className={`rounded-lg border p-2 transition ${
              row.icon === key
                ? 'border-leather-600 bg-leather-600 text-white'
                : 'border-cream-300 bg-white text-charcoal-600 hover:border-leather-400'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={row.label}
          onChange={(e) => onChange(index, 'label', e.target.value)}
          placeholder="عنوان الميزة"
          className={inputClass(false)}
        />
        <input
          value={row.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="وصف قصير"
          className={inputClass(false)}
        />
      </div>
    </div>
  )
}
