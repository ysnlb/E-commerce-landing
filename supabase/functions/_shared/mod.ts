// Shared helpers for the AI Edge Functions (plain JavaScript, Deno runtime).
import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Rejects callers that are not a signed-in user. Platform-level verify_jwt is
// not enough on its own: the public anon key is itself a valid JWT, so we
// resolve the actual user from the forwarded Authorization header.
export async function requireUser(req) {
  const client = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  )
  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function callGemini(model, payload) {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY secret is not set (supabase secrets set GEMINI_API_KEY=...)')
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    throw new Error(`Gemini ${model} → HTTP ${res.status}: ${detail}`)
  }
  return res.json()
}

// Parses model JSON output, tolerating markdown code fences the model
// sometimes wraps around JSON despite responseMimeType.
export function parseModelJson(text) {
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

export function firstText(geminiResponse) {
  const parts = geminiResponse?.candidates?.[0]?.content?.parts ?? []
  const part = parts.find((p) => typeof p.text === 'string')
  return part ? part.text : null
}

export function firstImage(geminiResponse) {
  const parts = geminiResponse?.candidates?.[0]?.content?.parts ?? []
  const part = parts.find((p) => p.inlineData?.data || p.inline_data?.data)
  if (!part) return null
  const d = part.inlineData ?? part.inline_data
  return { data: d.data, mimeType: d.mimeType ?? d.mime_type ?? 'image/png' }
}

export async function bytesToBase64(buffer) {
  const arr = new Uint8Array(buffer)
  let bin = ''
  const chunk = 32768
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode(...arr.subarray(i, i + chunk))
  }
  return btoa(bin)
}
