// Placeholder hooks for future AI features. Each one throws until a real
// API key + implementation is added HERE. The form already applies the
// documented resolve shapes, so activating any hook is a one-file change.

// Will call a text-generation API (e.g. Gemini) to draft ad copy from raw
// product info. Output must be in Algerian Darija (spoken Algerian dialect,
// written in Arabic script) — NOT Modern Standard Arabic (Fusha). Use
// Darija vocabulary and phrasing throughout (headline, subheadline,
// description, feature labels/descriptions, closing line). Currently
// unimplemented.
// Resolves with: { headline, subheadline, description,
//   features: [{ icon, label, description }], closing_line }
export async function generateCopy(productInfo) {
  throw new Error('generateCopy not configured yet — add API key in aiHooks.js')
}

// Will call an image-editing API (e.g. Gemini image editing) to clean up
// background and improve a raw product photo. Currently unimplemented.
// Resolves with: a Blob/File of the enhanced image.
export async function enhanceImage(imageFile) {
  throw new Error('enhanceImage not configured yet — add API key in aiHooks.js')
}

// Will call a vision-capable API to look at the product info + photos and
// return the best-fit template_id ('A' | 'B' | 'C'). Currently unimplemented
// — template selection stays manual (the dropdown from Phase 2) until this
// is wired in.
export async function selectTemplate(productInfo) {
  throw new Error('selectTemplate not configured yet — add API key in aiHooks.js')
}
