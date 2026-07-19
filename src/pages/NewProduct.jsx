import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FEATURE_ICONS, FEATURE_ICON_LABELS } from '../lib/icons'
import ImageUploader from '../components/ImageUploader'

const TEMPLATES = [
  { value: 'A', label: 'A — Container/Home' },
  { value: 'B', label: 'B — Wearable/Clothing' },
  { value: 'C', label: 'C — Small gadget' },
]

const INITIAL_FEATURES = [
  { icon: 'package', label: '', description: '' },
  { icon: 'shield-check', label: '', description: '' },
  { icon: 'truck', label: '', description: '' },
]

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-cream-50 px-3 py-2 text-charcoal-900 outline-none transition focus:border-leather-500 ${
    hasError ? 'border-red-400' : 'border-cream-300'
  }`

export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    price: '',
    template_id: 'A',
    headline: '',
    subheadline: '',
    description: '',
    closing_line: '',
  })
  const [features, setFeatures] = useState(INITIAL_FEATURES)
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Revoke preview object URLs when leaving the page.
  const imagesRef = useRef(images)
  imagesRef.current = images
  useEffect(
    () => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)),
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

    // The id is generated client-side so the storage path can use it
    // before the row exists: product-images/{product_id}/{n}-{ts}.{ext}
    const id = crypto.randomUUID()
    const uploadedPaths = []
    try {
      const urls = []
      for (const [i, img] of images.entries()) {
        const parts = img.file.name.split('.')
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
        const path = `${id}/${i + 1}-${Date.now()}.${ext}`
        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, img.file)
        if (error) throw error
        uploadedPaths.push(path)
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

      const { error: insertError } = await supabase.from('products').insert({
        id,
        name: form.name.trim(),
        price: form.price === '' ? null : Number(form.price),
        template_id: form.template_id,
        headline: form.headline.trim(),
        subheadline: form.subheadline.trim() || null,
        description: form.description.trim() || null,
        features: filledFeatures.length ? filledFeatures : null,
        closing_line: form.closing_line.trim() || null,
        image_urls: urls,
      })
      if (insertError) throw insertError

      navigate('/')
    } catch (err) {
      // Best-effort cleanup so a failed save leaves no orphan files.
      if (uploadedPaths.length) {
        await supabase.storage
          .from('product-images')
          .remove(uploadedPaths)
          .catch(() => {})
      }
      setSubmitError(err.message || 'خطأ غير متوقع')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <h1 className="text-2xl font-extrabold text-charcoal-900">منتج جديد</h1>

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
        {saving ? '...جاري الحفظ' : 'حفظ المنتج'}
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
