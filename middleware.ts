import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/en' || pathname === '/ar' || pathname.startsWith('/en/') || pathname.startsWith('/ar/')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
