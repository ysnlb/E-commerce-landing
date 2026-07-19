import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // On success the auth listener updates the session and App leaves /login.
    if (signInError) {
      setError('فشل تسجيل الدخول — تحقّق من البريد وكلمة السر.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-cream-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-charcoal-900">
          تسجيل الدخول
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-charcoal-900 outline-none focus:border-leather-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">
              كلمة السر
            </label>
            <input
              id="password"
              type="password"
              dir="ltr"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-charcoal-900 outline-none focus:border-leather-500"
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-charcoal-900 py-2.5 font-bold text-white transition hover:bg-charcoal-800 disabled:opacity-50"
          >
            {loading ? '...جاري الدخول' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
