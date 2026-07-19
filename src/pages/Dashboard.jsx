import DebugPanel from '../components/DebugPanel'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal-900">المنتجات</h1>
        <p className="mt-1 text-sm text-charcoal-500">
          قائمة المنتجات تُبنى في المرحلة القادمة.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-100 p-10 text-center text-charcoal-500">
        لا توجد منتجات بعد — ابدأ بإضافة منتج جديد.
      </div>

      <DebugPanel />
    </div>
  )
}
