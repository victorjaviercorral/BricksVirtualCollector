import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSystemRole } from '@/lib/roles'

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

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/mesa-de-trabajo') ||
    request.nextUrl.pathname.startsWith('/exposicion') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/ajustes');
    
  const isAdminSystemRoute = request.nextUrl.pathname.startsWith('/admin/system');

  if (!user && (isProtectedRoute || isAdminSystemRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si es una ruta de administración del sistema, verificar rol 'admin' o 'sysadmin'
  // (isSystemRole, src/lib/roles.ts). 'admin' se añadió el 19/08/2026: el titular es la única
  // persona que gestiona el proyecto y, por la misma decisión que D2, no mantiene una identidad
  // de sysadmin separada -- un solo rol 'admin' debe dar acceso a todo el panel.
  if (user && isAdminSystemRoute) {
    const { data: profile } = await supabase
      .from('usuarios_perfil')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!isSystemRole(profile?.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard' // o una página de 'Acceso Denegado'
      return NextResponse.redirect(url)
    }
  }

  // Handle protected api routes here if necessary

  return supabaseResponse
}
