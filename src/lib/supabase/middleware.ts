import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSystemRole, isModeratorRole } from '@/lib/roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // /exposicion(es), /bounties y /galeria son contenido público navegable ("Explorar"): se
  // pueden ver sin sesión, igual que /vitrina/[id]. Las acciones dentro (votar, participar,
  // reclamar) siguen exigiendo sesión vía RLS y comprobaciones de servidor.
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/mesa-de-trabajo') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/ajustes');
    
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAdminSystemRoute = request.nextUrl.pathname.startsWith('/admin/system');

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Chequeo de rol para TODO /admin (antes solo /admin/system). Motivo (ADR-011, Fase 6): con el
  // acceso de invitado, cualquier sesión —incluida una anónima con role='user'— pasaba el
  // `!user` y podía *ver* /admin/exposiciones y /admin/bounties, que no tenían gate de rol a
  // nivel de página (dependían de la RLS solo para escritura). /admin/system mantiene el chequeo
  // más estricto (isSystemRole); el resto del panel admite además a admin_exposiciones
  // (isModeratorRole), coherente con el gate propio de /admin/moderacion.
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('usuarios_perfil')
      .select('role')
      .eq('id', user.id)
      .single()

    const permitido = isAdminSystemRoute
      ? isSystemRole(profile?.role)
      : isSystemRole(profile?.role) || isModeratorRole(profile?.role)

    if (!permitido) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Handle protected api routes here if necessary

  return supabaseResponse
}
