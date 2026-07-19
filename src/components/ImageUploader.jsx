import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Sparkles, X } from 'lucide-react'

// Controlled multi-image picker with local previews.
// Reordering: arrow buttons (touch-friendly) + native drag (desktop only).
// `images` is [{ key, file, preview }] (or { key, url, preview } for already
// uploaded images in edit mode) — the order defines image_urls order.
// `onEnhance(image)` is optional; when provided, each thumbnail gets an
// AI-enhance button.
export default function ImageUploader({ images, onChange, onEnhance, max = 4 }) {
  const inputRef = useRef(null)
  const [dragKey, setDragKey] = useState(null)

  function addFiles(fileList) {
    const room = max - images.length
    const added = Array.from(fileList)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, room)
      .map((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }))
    if (added.length) onChange([...images, ...added])
  }

  function removeImage(key) {
    const img = images.find((i) => i.key === key)
    if (img) URL.revokeObjectURL(img.preview)
    onChange(images.filter((i) => i.key !== key))
  }

  // Arrow reordering: delta -1 moves toward the first (main) slot.
  function move(index, delta) {
    const to = index + delta
    if (to < 0 || to >= images.length) return
    const next = [...images]
    ;[next[index], next[to]] = [next[to], next[index]]
    onChange(next)
  }

  // Live reorder while dragging over a sibling thumbnail (mouse only).
  function reorder(overKey) {
    if (dragKey === null || dragKey === overKey) return
    const from = images.findIndex((i) => i.key === dragKey)
    const to = images.findIndex((i) => i.key === overKey)
    const next = [...images]
    next.splice(to, 0, next.splice(from, 1)[0])
    onChange(next)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = '' // allow re-picking the same file later
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={img.key}
            draggable
            onDragStart={() => setDragKey(img.key)}
            onDragEnd={() => setDragKey(null)}
            onDragOver={(e) => {
              e.preventDefault()
              reorder(img.key)
            }}
            className={`group relative aspect-square overflow-hidden rounded-xl border border-cream-300 bg-white ${
              dragKey === img.key ? 'opacity-60' : ''
            }`}
          >
            <img src={img.preview} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1.5 right-1.5 rounded bg-charcoal-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                رئيسية
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(img.key)}
              aria-label="حذف الصورة"
              className="absolute left-1.5 top-1.5 rounded-full bg-white/95 p-1.5 text-charcoal-700 shadow-sm"
            >
              <X size={14} />
            </button>
            {onEnhance && (
              <button
                type="button"
                onClick={() => onEnhance(img)}
                title="تحسين الصورة (AI)"
                aria-label="تحسين الصورة"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1.5 text-leather-700 shadow-sm"
              >
                <Sparkles size={14} />
              </button>
            )}
            <div className="absolute bottom-1.5 left-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="تقديم الصورة"
                className="rounded-full bg-white/95 p-1.5 text-charcoal-700 shadow-sm disabled:opacity-35"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                aria-label="تأخير الصورة"
                className="rounded-full bg-white/95 p-1.5 text-charcoal-700 shadow-sm disabled:opacity-35"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-cream-300 text-charcoal-500 transition hover:border-leather-400 hover:text-leather-600"
          >
            <ImagePlus size={22} />
            <span className="text-xs font-semibold">إضافة صور</span>
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-charcoal-500">
        من 1 إلى {max} صور — الأولى هي الرئيسية. رتّب بالأسهم (أو بالسحب على الحاسوب).
      </p>
    </div>
  )
}
