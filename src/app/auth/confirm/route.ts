import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Evitar doble barra en la redirección si `next` ya empieza por `/`
      const nextUrl = next.startsWith('/') ? next : `/${next}`
      return NextResponse.redirect(new URL(nextUrl, request.url))
    }
  }

  // redirect the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url))
}
