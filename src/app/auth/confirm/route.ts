import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Sanea el parámetro `next` para evitar redirecciones abiertas (hallazgo S4 de la auditoría).
 *
 * Comprobar únicamente `startsWith('/')` era insuficiente: un valor como `//evil.com` o
 * `/\evil.com` lo supera, y `new URL()` lo resuelve como URL protocolo-relativa hacia un host
 * externo. Como esta ruta es la que llega por correo electrónico, era un vector de phishing.
 *
 * Solo se acepta una ruta interna: barra inicial única, sin barra ni contrabarra a continuación.
 */
function sanitizeNext(next: string | null): string {
  const FALLBACK = '/dashboard'
  if (!next) return FALLBACK
  if (!/^\/(?![/\\])/.test(next)) return FALLBACK
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // redirect the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url))
}
