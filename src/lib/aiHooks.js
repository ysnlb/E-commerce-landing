import { supabase } from './supabase'

// Real AI implementations backed by Supabase Edge Functions
// (supabase/functions/{generate-copy,enhance-image,select-template}) so the
// Gemini API key stays server-side and calls require your Supabase login.
// One-time setup (deploy functions + set GEMINI_API_KEY secret): see
// README → "AI features". No other frontend file needs to change.

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    // FunctionsHttpError hides the function's JSON body — dig the real
    // error message out of the response so the toast shows the true cause.
    let detail = error.message
    try {
      const responseBody = await error.context?.json()
      if (responseBody?.error) detail = responseBody.error
    } catch {
      // keep the generic message
    }
    throw new Error(`${name}: ${detail}`)
  }
  if (data?.error) throw new Error(`${name}: ${data.error}`)
  return data
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('could not read image file'))
    reader.readAsDataURL(file)
  })
}

// Drafts full ad copy in Algerian Darija (NOT Fusha) from raw product info.
// Resolves with: { headline, subheadline, description,
//   features: [{ icon, label, description }], closing_line }
export async function generateCopy(productInfo) {
  return invoke('generate-copy', { product: productInfo })
}

// Cleans up a product photo (background, lighting) via Gemini image editing.
// Accepts a File/Blob (new upload) or a URL string (already uploaded image).
// Resolves with: a File of the enhanced image.
export async function enhanceImage(imageFile) {
  const body =
    typeof imageFile === 'string'
      ? { imageUrl: imageFile }
      : {
          imageBase64: await fileToBase64(imageFile),
          mimeType: imageFile.type || 'image/jpeg',
        }
  const data = await invoke('enhance-image', body)
  if (!data?.imageBase64) throw new Error('enhance-image: empty image in response')
  return base64ToFile(data.imageBase64, data.mimeType)
}

// Decodes model-returned base64 defensively: strips whitespace/newlines,
// converts base64url variants, and fixes padding before atob.
function base64ToFile(b64, mime) {
  let clean = String(b64).replace(/[\s\r\n]/g, '').replace(/-/g, '+').replace(/_/g, '/')
  while (clean.length % 4 !== 0) clean += '='
  const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0))
  const type = mime ?? 'image/png'
  return new File([bytes], `enhanced.${type.split('/')[1] ?? 'png'}`, { type })
}

// Picks the best-fit template AND theme from product info + first photo.
// Resolves with: { template_id: 'A' | 'B' | 'C', theme_id: string }
export async function selectTemplate(productInfo) {
  return invoke('select-template', { product: productInfo })
}
