import { supabase } from './supabase'

// Real AI implementations backed by Supabase Edge Functions
// (supabase/functions/{generate-copy,enhance-image,select-template}) so the
// Gemini API key stays server-side and calls require your Supabase login.
// One-time setup (deploy functions + set GEMINI_API_KEY secret): see
// README → "AI features". No other frontend file needs to change.

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw new Error(`${name}: ${error.message}`)
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
  const bytes = Uint8Array.from(atob(data.imageBase64), (c) => c.charCodeAt(0))
  const mime = data.mimeType ?? 'image/png'
  return new File([bytes], `enhanced.${mime.split('/')[1] ?? 'png'}`, { type: mime })
}

// Picks the best-fit template AND theme from product info + first photo.
// Resolves with: { template_id: 'A' | 'B' | 'C', theme_id: string }
export async function selectTemplate(productInfo) {
  return invoke('select-template', { product: productInfo })
}
