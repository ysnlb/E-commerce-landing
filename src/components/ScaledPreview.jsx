import { useEffect, useRef, useState } from 'react'

// Displays a fixed-width canvas scaled down to fit its container while the
// DOM keeps full resolution (required for the later image export).
export default function ScaledPreview({ width = 800, children }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(null)

  useEffect(() => {
    function update() {
      if (!outerRef.current || !innerRef.current) return
      const nextScale = Math.min(1, outerRef.current.clientWidth / width)
      setScale(nextScale)
      setHeight(innerRef.current.offsetHeight * nextScale)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(outerRef.current)
    observer.observe(innerRef.current)
    return () => observer.disconnect()
  }, [width])

  return (
    // items-start is load-bearing: without it the flex child stretches to the
    // outer's explicit height, which is derived from the child's height —
    // a feedback loop that collapses the preview to a few pixels.
    <div ref={outerRef} style={{ height }} className="flex items-start justify-center overflow-hidden">
      <div
        ref={innerRef}
        style={{ width, transform: `scale(${scale})`, transformOrigin: 'top center' }}
        className="shrink-0"
      >
        {children}
      </div>
    </div>
  )
}
