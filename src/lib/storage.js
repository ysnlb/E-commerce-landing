import { supabase } from './supabase'

const BUCKET_MARKER = '/product-images/'

// Converts a Supabase public URL back to its path inside the bucket.
export function storagePathFromUrl(url) {
  const i = String(url ?? '').indexOf(BUCKET_MARKER)
  return i === -1 ? null : decodeURIComponent(url.slice(i + BUCKET_MARKER.length))
}

// Best-effort removal of storage files by their public URLs.
export async function removeImagesByUrls(urls) {
  const paths = (urls ?? []).map(storagePathFromUrl).filter(Boolean)
  if (paths.length === 0) return
  await supabase.storage
    .from('product-images')
    .remove(paths)
    .catch(() => {})
}
