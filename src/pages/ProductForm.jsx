import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { removeImagesByUrls } from '../lib/storage'
import { FEATURE_ICONS, FEATURE_ICON_LABELS } from '../lib/icons'
import { DEFAULT_THEME_ID, THEMES } from '../lib/themes'
import { enhanceImage, generateCopy, selectTemplate } from '../lib/aiHooks'
import ImageUploader from '../components/ImageUploader'

const TEMPLATES = [
  { value: 'A', label: 'متجر أنيق', desc: 'هيرو داكن، سعر بارز، مميزات وآراء' },
  { value: 'B', label: 'قصة إقناع', desc: 'مشكل ← حل، صورة دائرية وأيقونات' },
  { value: 'C', label: 'كتالوج فاخر', desc: 'عناوين بأشرطة وجدول مواصفات' },
  { value: 'D', label: 'عرض ترويجي', desc: 'تخفيض، قائمة مرقمة وخطوات' },
]

const MAX_FEATURES = 6
const MAX_SPECS = 6
const MAX_REVIEWS = 3
const MAX_IMAGES = 10

const DEFAULT_ICONS = ['package', 'shield-check', 'truck', 'star', 'zap', 'sparkles']
const emptyFeature = (i = 0) => ({ icon: DEFAULT_ICONS[i % DEFAULT_ICONS.length], label: '', description: '' })

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-cream-50 px-3 py-2 text-charcoal-900 outline-none transition focus:border-leather-500 ${
    hasError ? 'border-red-400' : 'border-cream-300'
  }`

const aiButtonClass =
  'flex shrink-0 items-center gap-1.5 rounded-lg border border-leather-400 px-3 py-1.5 text-xs font-bold text-leather-700 transition hover:bg-leather-600 hover:text-white disabled:opacity-50'

const addButtonClass =
  'flex items-center gap-1 rounded-lg border border-dashed border-cream-300 px-3 py-1.5 text-xs font-bold text-charcoal-500 transition hover:border-leather-400 hover:text-leather-700 disabled:opacity-40'

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
    old_price: '',
    template_id: 'A',
    theme_id: DEFAULT_THEME_ID,
    announcement: '',
    badge: '',
    headline: '',
    subheadline: '',
    description: '',
    usage_steps: '',
    closing_line: '',
  })
  const [features, setFeatures] = useState(() => [emptyFeature(0), emptyFeature(1), emptyFeature(2)])
  const [specs, setSpecs] = useState([])
  const [reviews, setReviews] = useState([])
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [aiBusy, setAiBusy] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

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
        old_price: data.old_price == null ? '' : String(data.old_price),
        template_id: data.template_id ?? 'A',
        theme_id: data.theme_id ?? DEFAULT_THEME_ID,
        announcement: data.announcement ?? '',
        badge: data.badge ?? '',
        headline: data.headline ?? '',
        subheadline: data.subheadline ?? '',
        description: data.description ?? '',
        usage_steps: data.usage_steps ?? '',
        closing_line: data.closing_line ?? '',
      })
      setFeatures(
        (data.features ?? []).slice(0, MAX_FEATURES).map((f, i) => ({
          icon: f.icon || DEFAULT_ICONS[i % DEFAULT_ICONS.length],
          label: f.label || '',
          description: f.description || '',
        })),
      )
      setSpecs((data.specs ?? []).slice(0, MAX_SPECS).map((s) => ({ label: s.label || '', value: s.value || '' })))
      setReviews((data.reviews ?? []).slice(0, MAX_REVIEWS).map((r) => ({ name: r.name || '', text: r.text || '' })))
      setImages(
        (data.image_urls ?? []).map((url) => ({ key: crypto.randomUUID(), url, preview: url })),
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

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setRow = (setter) => (index, key, value) =>
    setter((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  const removeRow = (setter) => (index) => setter((rows) => rows.filter((_, i) => i !== index))

  const setFeature = setRow(setFeatures)
  const setSpec = setRow(setSpecs)
  const setReview = setRow(setReviews)

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'أدخل اسم المنتج.'
    if (!form.headline.trim()) next.headline = 'أدخل العنوان الرئيسي.'
    if (images.length === 0) next.images = 'أضف صورة واحدة على الأقل.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  /* ---- AI wiring (hooks live in src/lib/aiHooks.js) ---- */

  async function handleSuggestCopy() {
    setAiBusy('copy')
    try {
      const copy = await generateCopy({ ...form, features })
      setForm((f) => ({
        ...f,
        headline: copy.headline ?? f.headline,
        subheadline: copy.subheadline ?? f.subheadline,
        description: copy.description ?? f.description,
        closing_line: copy.closing_line ?? f.closing_line,
        announcement: copy.announcement ?? f.announcement,
        badge: copy.badge ?? f.badge,
        usage_steps: copy.usage_steps ?? f.usage_steps,
      }))
      if (Array.isArray(copy.features) && copy.features.length) {
        setFeatures(
          copy.features.slice(0, MAX_FEATURES).map((feat, i) => ({
            icon: feat.icon || DEFAULT_ICONS[i % DEFAULT_ICONS.length],
            label: feat.label || '',
            description: feat.description || '',
          })),
        )
      }
      setToast({ text: 'تم اقتراح النصوص ✓' })
    } catch (err) {
      setToast({ text: 'فشل اقتراح النصوص.', detail: err.message })
    } finally {
      setAiBusy(null)
    }
  }

  async function handleEnhanceImage(image) {
    setAiBusy(image.key)
    try {
      const enhanced = await enhanceImage(image.file ?? image.url)
      if (image.file) URL.revokeObjectURL(image.preview)
      setImages((list) =>
        list.map((img) =>
          img.key === image.key
            ? { key: img.key, file: enhanced, preview: URL.createObjectURL(enhanced) }
            : img,
        ),
      )
      setToast({ text: 'تم تحسين الصورة ✓' })
    } catch (err) {
      setToast({ text: 'فشل تحسين الصورة.', detail: err.message })
    } finally {
      setAiBusy(null)
    }
  }

  async function handleAutoTemplate() {
    setAiBusy('template')
    try {
      const res = await selectTemplate({
        ...form,
        features,
        image_urls: images.map((img) => img.url).filter(Boolean),
      })
      const templateId = typeof res === 'string' ? res : res?.template_id
      if (!templateId) throw new Error('الرد ما فيهش قالب — أعد المحاولة.')
      setField('template_id', templateId)
      const theme = res?.theme_id && THEMES[res.theme_id] ? THEMES[res.theme_id] : null
      if (theme) setField('theme_id', res.theme_id)
      setToast({ text: `تم الاختيار: قالب ${templateId}${theme ? ` + ثيم «${theme.label}»` : ''} ✓` })
    } catch (err) {
      setToast({ text: 'فشل الاختيار التلقائي للقالب.', detail: err.message })
    } finally {
      setAiBusy(null)
    }
  }

  /* ---- save ---- */

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving || !validate()) return
    setSaving(true)
    setSubmitError(null)

    const id = productId ?? crypto.randomUUID()
    const newPaths = []
    try {
      // Uploads are stored under {user_id}/{product_id}/ — storage RLS only
      // allows writing inside your own folder.
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) throw new Error('انتهت الجلسة — سجّل الدخول من جديد.')
      const uid = userData.user.id

      const urls = []
      for (const [i, img] of images.entries()) {
        if (img.url) {
          urls.push(img.url)
          continue
        }
        const parts = img.file.name.split('.')
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
        const path = `${uid}/${id}/${Date.now()}-${i + 1}.${ext}`
        const { error } = await supabase.storage.from('product-images').upload(path, img.file)
        if (error) throw error
        newPaths.push(path)
        urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }

      const filledFeatures = features
        .filter((f) => f.label.trim())
        .map((f) => ({ icon: f.icon, label: f.label.trim(), description: f.description.trim() }))
      const filledSpecs = specs
        .filter((s) => s.label.trim() && s.value.trim())
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      const filledReviews = reviews
        .filter((r) => r.text.trim())
        .map((r) => ({ name: r.name.trim(), text: r.text.trim() }))

      const row = {
        name: form.name.trim(),
        price: form.price === '' ? null : Number(form.price),
        old_price: form.old_price === '' ? null : Number(form.old_price),
        template_id: form.template_id,
        theme_id: form.theme_id,
        announcement: form.announcement.trim() || null,
        badge: form.badge.trim() || null,
        headline: form.headline.trim(),
        subheadline: form.subheadline.trim() || null,
        description: form.description.trim() || null,
        features: filledFeatures.length ? filledFeatures : null,
        usage_steps: form.usage_steps.trim() || null,
        specs: filledSpecs.length ? filledSpecs : null,
        reviews: filledReviews.length ? filledReviews : null,
        closing_line: form.closing_line.trim() || null,
        image_urls: urls,
      }

      if (isEdit) {
        const { error } = await supabase.from('products').update(row).eq('id', id)
        if (error) throw error
        const removed = (original?.image_urls ?? []).filter((u) => !urls.includes(u))
        await removeImagesByUrls(removed)
      } else {
        const { error } = await supabase.from('products').insert({ id, user_id: uid, ...row })
        if (error) throw error
      }

      navigate('/')
    } catch (err) {
      if (newPaths.length) {
        await supabase.storage.from('product-images').remove(newPaths).catch(() => {})
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
          <code dir="ltr" className="mt-2 inline-block rounded bg-red-50 px-2 py-1 text-xs text-red-700">
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="اسم المنتج *" error={errors.name}>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputClass(errors.name)} />
          </Field>
          <Field label="السعر (دج)">
            <input type="number" min="0" step="any" value={form.price} onChange={(e) => setField('price', e.target.value)} className={inputClass(false)} />
          </Field>
          <Field label="السعر القديم (اختياري)">
            <input type="number" min="0" step="any" value={form.old_price} onChange={(e) => setField('old_price', e.target.value)} className={inputClass(false)} />
          </Field>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold">القالب</span>
            <button type="button" onClick={handleAutoTemplate} disabled={aiBusy === 'template'} className={aiButtonClass}>
              <Sparkles size={14} />
              اختيار تلقائي (AI)
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setField('template_id', t.value)}
                className={`rounded-xl border p-3 text-start transition ${
                  form.template_id === t.value
                    ? 'border-leather-600 bg-leather-600/10'
                    : 'border-cream-300 bg-white hover:border-leather-400'
                }`}
              >
                <p className="text-sm font-extrabold text-charcoal-900">
                  {t.value} — {t.label}
                </p>
                <p className="mt-0.5 text-xs text-charcoal-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold">الثيم (الألوان والخطوط)</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(THEMES).map(([id, t]) => (
              <button
                key={id}
                type="button"
                onClick={() => setField('theme_id', id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                  form.theme_id === id
                    ? 'border-leather-600 bg-leather-600/10 text-leather-700'
                    : 'border-cream-300 bg-white text-charcoal-600 hover:border-leather-400'
                }`}
              >
                <span className="flex items-center">
                  {t.dots.map((c, i) => (
                    <span key={i} className="-me-1.5 inline-block h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </span>
                <span className="ms-1.5">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="نصوص الإعلان"
        action={
          <button type="button" onClick={handleSuggestCopy} disabled={aiBusy === 'copy'} className={aiButtonClass}>
            <Sparkles size={14} />
            اقتراح النصوص (AI)
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="شريط الإعلان (أعلى الصفحة)">
            <input value={form.announcement} onChange={(e) => setField('announcement', e.target.value)} placeholder="تخفيض 30% وتوصيل مجاني وسريع" className={inputClass(false)} />
          </Field>
          <Field label="شارة الثقة">
            <input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="الأكثر مبيعا في الجزائر" className={inputClass(false)} />
          </Field>
        </div>
        <Field label="العنوان الرئيسي *" error={errors.headline}>
          <input value={form.headline} onChange={(e) => setField('headline', e.target.value)} placeholder="عيت من ~الروينة~ في خزانتك؟" className={inputClass(errors.headline)} />
        </Field>
        <Field label="العنوان الفرعي">
          <input value={form.subheadline} onChange={(e) => setField('subheadline', e.target.value)} className={inputClass(false)} />
        </Field>
        <Field label="الوصف (كل فقرة في سطر — تتوزع الفقرات بين الصور)">
          <textarea rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} className={inputClass(false)} />
        </Field>
        <Field label="جملة الختام (فوق زر الطلب)">
          <input value={form.closing_line} onChange={(e) => setField('closing_line', e.target.value)} placeholder="خزانتك تولي تبرق ومفرزة!" className={inputClass(false)} />
        </Field>
      </Section>

      <Section
        title={`المميزات (${features.length}/${MAX_FEATURES})`}
        action={
          <button type="button" onClick={() => setFeatures((r) => [...r, emptyFeature(r.length)])} disabled={features.length >= MAX_FEATURES} className={addButtonClass}>
            <Plus size={14} />
            إضافة ميزة
          </button>
        }
      >
        {features.length === 0 && <p className="text-sm text-charcoal-500">لا مميزات — أضف ميزة أو استعمل اقتراح النصوص.</p>}
        <div className="space-y-4">
          {features.map((row, i) => (
            <div key={i} className="rounded-xl border border-cream-200 bg-cream-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-charcoal-600">الميزة {i + 1}</p>
                <button type="button" onClick={() => removeRow(setFeatures)(i)} aria-label="حذف الميزة" className="rounded-full p-1 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Object.entries(FEATURE_ICONS).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    title={FEATURE_ICON_LABELS[key]}
                    onClick={() => setFeature(i, 'icon', key)}
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
                <input value={row.label} onChange={(e) => setFeature(i, 'label', e.target.value)} placeholder="عنوان الميزة" className={inputClass(false)} />
                <input value={row.description} onChange={(e) => setFeature(i, 'description', e.target.value)} placeholder="وصف قصير" className={inputClass(false)} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="طريقة الاستعمال (اختياري)">
        <Field label="خطوة في كل سطر — تظهر كقائمة مرقمة">
          <textarea rows={3} value={form.usage_steps} onChange={(e) => setField('usage_steps', e.target.value)} placeholder={'بلّل الاسفنجة بالماء\nثبّت القطعتين على الزجاج\nحرّك الممسحة ببطء'} className={inputClass(false)} />
        </Field>
      </Section>

      <Section
        title={`جدول المواصفات (${specs.length}/${MAX_SPECS})`}
        action={
          <button type="button" onClick={() => setSpecs((r) => [...r, { label: '', value: '' }])} disabled={specs.length >= MAX_SPECS} className={addButtonClass}>
            <Plus size={14} />
            إضافة سطر
          </button>
        }
      >
        {specs.length === 0 && <p className="text-sm text-charcoal-500">اختياري — مثال: المادة / جلد PU، الوزن / 250غ.</p>}
        <div className="space-y-3">
          {specs.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <input value={row.label} onChange={(e) => setSpec(i, 'label', e.target.value)} placeholder="الخاصية (المادة)" className={inputClass(false)} />
              <input value={row.value} onChange={(e) => setSpec(i, 'value', e.target.value)} placeholder="القيمة (جلد PU)" className={inputClass(false)} />
              <button type="button" onClick={() => removeRow(setSpecs)(i)} aria-label="حذف السطر" className="shrink-0 rounded-full p-1 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={`آراء الزبائن (${reviews.length}/${MAX_REVIEWS})`}
        action={
          <button type="button" onClick={() => setReviews((r) => [...r, { name: '', text: '' }])} disabled={reviews.length >= MAX_REVIEWS} className={addButtonClass}>
            <Plus size={14} />
            إضافة رأي
          </button>
        }
      >
        {reviews.length === 0 && <p className="text-sm text-charcoal-500">اختياري — آراء حقيقية من زبائنك تظهر في قسم الشهادات.</p>}
        <div className="space-y-3">
          {reviews.map((row, i) => (
            <div key={i} className="flex items-start gap-3">
              <input value={row.name} onChange={(e) => setReview(i, 'name', e.target.value)} placeholder="الاسم" className={`${inputClass(false)} !w-40 shrink-0`} />
              <textarea rows={2} value={row.text} onChange={(e) => setReview(i, 'text', e.target.value)} placeholder="نص الرأي" className={inputClass(false)} />
              <button type="button" onClick={() => removeRow(setReviews)(i)} aria-label="حذف الرأي" className="mt-2 shrink-0 rounded-full p-1 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`الصور * (${images.length}/${MAX_IMAGES})`}>
        <ImageUploader images={images} onChange={setImages} onEnhance={handleEnhanceImage} max={MAX_IMAGES} />
        <p className="text-xs text-charcoal-500">
          الصورة الأولى هي الرئيسية؛ بقية الصور تتوزع تلقائيًا على أقسام القالب — كل ما زادت الصور، طالت الصفحة.
        </p>
        {errors.images && <p className="text-sm font-semibold text-red-600">{errors.images}</p>}
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

      <Toast toast={toast} />
    </form>
  )
}

function Section({ title, action, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-cream-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-extrabold text-charcoal-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm font-semibold text-red-600">{error}</span>}
    </label>
  )
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-xl bg-charcoal-900 px-5 py-3 text-center text-white shadow-lg">
      <p className="text-sm font-bold">{toast.text}</p>
      {toast.detail && (
        <p className="mt-1 text-xs text-white/70" dir="ltr">
          {toast.detail}
        </p>
      )}
    </div>
  )
}
