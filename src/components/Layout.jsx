import { Link, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-cream-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-extrabold text-charcoal-900">
            مولّد الإعلانات
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/new"
              className="rounded-lg bg-leather-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-leather-700"
            >
              منتج جديد
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm font-semibold text-charcoal-500 transition hover:text-charcoal-800"
            >
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
