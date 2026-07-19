// Drafts full ad copy in Algerian Darija from raw product info.
// Called by src/lib/aiHooks.js → generateCopy().
import { callGemini, corsHeaders, firstText, json, requireUser } from '../_shared/mod.ts'

const MODEL = Deno.env.get('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash'

const ICON_KEYS = [
  'package', 'boxes', 'shield-check', 'truck', 'star', 'zap',
  'timer', 'battery', 'ruler', 'shirt', 'droplets', 'sparkles',
]

const SYSTEM = `أنت كاتب إعلانات محترف للتجارة الإلكترونية في الجزائر (دروب شيبينغ).
اكتب حصريًا بالدارجة الجزائرية المكتوبة بالحرف العربي — ممنوع الفصحى تمامًا.
استعمل مفردات جزائرية يومية (بزاف، برك، ديالك/تاعك، دروك، بلاصة، هبال، شباب...) وأسلوب مباشر يبيع لجمهور فيسبوك وتيك توك الجزائري.
القواعد:
- headline: قصير وصادم، يلمس مشكل الزبون. تقدر تحط كلمة وحدة بين علامتي ~ باش تنشطب بخط أحمر (مثال: عيت من ~الروينة~ في خزانتك؟).
- subheadline: جملة وحدة تكمل العنوان وتقدّم الحل.
- description: جملتين إلى ثلاثة تشرح المنتج بطريقة بسيطة.
- features: بالضبط 3 عناصر. icon لازم يكون من القائمة المسموحة فقط. label قصير (2-4 كلمات). description قصيرة تكمل الفكرة.
- closing_line: جملة ختامية قوية تحمّس للشراء (بلا كلمة "اطلب" لأن الزر موجود تحتها).`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const user = await requireUser(req)
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { product = {} } = await req.json()
    const input = [
      `المنتج: ${product.name ?? ''}`,
      `السعر: ${product.price ?? 'غير محدد'} دج`,
      `معلومات خام عن المنتج: ${product.description ?? ''}`,
      `عناوين حالية (حسّنها إذا وجدت): ${product.headline ?? ''} / ${product.subheadline ?? ''}`,
      `مميزات حالية: ${JSON.stringify(product.features ?? [])}`,
      `الأيقونات المسموحة: ${ICON_KEYS.join(', ')}`,
    ].join('\n')

    const result = await callGemini(MODEL, {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: input }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            headline: { type: 'STRING' },
            subheadline: { type: 'STRING' },
            description: { type: 'STRING' },
            features: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  icon: { type: 'STRING', enum: ICON_KEYS },
                  label: { type: 'STRING' },
                  description: { type: 'STRING' },
                },
                required: ['icon', 'label', 'description'],
              },
            },
            closing_line: { type: 'STRING' },
          },
          required: ['headline', 'subheadline', 'description', 'features', 'closing_line'],
        },
        temperature: 0.9,
      },
    })

    const text = firstText(result)
    if (!text) return json({ error: 'empty model response' }, 502)
    return json(JSON.parse(text))
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500)
  }
})
