import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/rate-limit'

export async function proxy(request: NextRequest) {
  // 1. RATE LIMITING
  // Obtenemos la IP de los headers. En Vercel, x-real-ip o x-forwarded-for.
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'anonymous'
  
  // Excluimos las peticiones a archivos estáticos que el matcher pudiera haber dejado pasar por error
  const isApiOrAppRoute = !request.nextUrl.pathname.includes('.')

  if (isApiOrAppRoute) {
    const rateLimit = await checkRateLimit(ip)
    
    if (!rateLimit.success) {
      // Bloquear la petición si se excede el límite
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests', message: 'Has excedido el límite de peticiones.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
          } 
        }
      )
    }
  }

  // 2. SESIÓN Y AUTENTICACIÓN (incluye la protección de rutas sysadmin)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
