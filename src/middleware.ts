import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  console.log("Middleware - Session found:", !!session);
  if (session) {
    console.log("User ID:", session.user.id);
  }
  // הגנה על דפים: אם אין סשן ואתה מנסה לגשת לדף שאינו התחברות/הרשמה - חזור ללוגין
  const publicAuthPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isPublicAuth = publicAuthPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (!session && !isPublicAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // מניעה ממי שמחובר לגשת לדפי התחברות (לא כולל reset-password — אחרי קישור מהמייל)
  if (session && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup') || request.nextUrl.pathname.startsWith('/forgot-password'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}