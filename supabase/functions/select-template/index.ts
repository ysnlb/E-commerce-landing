// Picks the best-fit template (A/B/C) and theme for a product, optionally
// looking at the first product photo. Called by aiHooks.js → selectTemplate().
import { bytesToBase64, callGemini, corsHeaders, firstText, json, requireUser } from '../_shared/mod.ts'

const MODEL = Deno.env.get('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash'

const GUIDE = `اختر أنسب قالب وثيم لصفحة إعلان منتج جزائري (صورة طويلة عمودية 800px).
القوالب:
- A "متجر أنيق": هيرو داكن + سعر بارز + مميزات نقطية وآراء — يناسب الإلكترونيات والساعات والمنتجات العصرية.
- B "قصة إقناع": سؤال المشكل + صورة دائرية + أيقونات دائرية وفقرات — يناسب الصحة، أدوات المنزل، حلول المشاكل اليومية.
- C "كتالوج فاخر": عناوين بأشرطة + كولاج صور + جدول مواصفات — يناسب الحقائب، الإكسسوارات، منتجات الجودة والهدايا.
- D "عرض ترويجي": شارة تخفيض + سعر مبكر + قائمة مرقمة وخطوات — يناسب العروض القوية والمنتجات العملية الرخيصة.
الثيمات:
- warm: دافئ كلاسيكي بيج (افتراضي آمن لأدوات المنزل).
- night: داكن جريء (إلكترونيات، منتجات رجالية، عروض قوية).
- mint: أخضر منعش (صحة، جمال، مطبخ).
- blush: وردي ناعم (منتجات نسائية).
- ocean: أزرق تقني (أدوات وإلكترونيات).
- poster: مشمشي شبابي (منتجات مرحة، أطفال، عروض).`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const user = await requireUser(req)
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { product = {} } = await req.json()
    const parts = [
      {
        text: `${GUIDE}\n\nالمنتج: ${product.name ?? ''}\nالوصف: ${product.description ?? ''}\nالعنوان: ${product.headline ?? ''}\nمميزات: ${JSON.stringify(product.features ?? [])}`,
      },
    ]

    // The first photo helps a lot but is optional (not yet uploaded on /new).
    const imageUrl = (product.image_urls ?? [])[0]
    if (imageUrl) {
      try {
        const res = await fetch(imageUrl)
        if (res.ok) {
          const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
          parts.push({
            inlineData: { mimeType: mime, data: await bytesToBase64(await res.arrayBuffer()) },
          })
        }
      } catch (_err) {
        // image is optional — continue without it
      }
    }

    const result = await callGemini(MODEL, {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            template_id: { type: 'STRING', enum: ['A', 'B', 'C', 'D'] },
            theme_id: {
              type: 'STRING',
              enum: ['warm', 'night', 'mint', 'blush', 'ocean', 'poster'],
            },
          },
          required: ['template_id', 'theme_id'],
        },
      },
    })

    const text = firstText(result)
    if (!text) return json({ error: 'empty model response' }, 502)
    return json(JSON.parse(text))
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500)
  }
})
