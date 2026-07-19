// Cleans up a product photo (background, lighting) with Gemini image editing.
// Called by src/lib/aiHooks.js → enhanceImage(). Accepts { imageBase64,
// mimeType } for new uploads or { imageUrl } for already-stored images.
import { bytesToBase64, callGemini, corsHeaders, firstImage, json, requireUser } from '../_shared/mod.ts'

const MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') ?? 'gemini-2.5-flash-image'

const PROMPT = `Professional e-commerce product photo retouch: keep the product EXACTLY as it is (same shape, colors, materials, printed text), remove background clutter and place it on a clean, soft, neutral light studio background with a gentle natural shadow. Improve lighting, sharpness and color balance. Do not add any objects, text or watermarks. Output only the edited image.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const user = await requireUser(req)
    if (!user) return json({ error: 'unauthorized' }, 401)

    const { imageBase64, imageUrl, mimeType } = await req.json()
    let data = imageBase64
    let mime = mimeType ?? 'image/jpeg'
    if (!data && imageUrl) {
      const res = await fetch(imageUrl)
      if (!res.ok) return json({ error: `could not fetch image (${res.status})` }, 400)
      mime = res.headers.get('content-type')?.split(';')[0] ?? mime
      data = await bytesToBase64(await res.arrayBuffer())
    }
    if (!data) return json({ error: 'imageBase64 or imageUrl required' }, 400)

    const result = await callGemini(MODEL, {
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: mime, data } }, { text: PROMPT }],
        },
      ],
    })

    const img = firstImage(result)
    if (!img) return json({ error: 'model returned no image' }, 502)
    return json({ imageBase64: img.data, mimeType: img.mimeType })
  } catch (err) {
    return json({ error: String(err?.message ?? err) }, 500)
  }
})
