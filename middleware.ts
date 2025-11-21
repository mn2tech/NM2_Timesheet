import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add cache-control headers to prevent TWA from caching HTML pages
  // This ensures the mobile app always gets the latest version
  const pathname = request.nextUrl.pathname;
  
  // Don't cache HTML pages - force fresh content for TWA
  if (
    pathname.endsWith('.html') ||
    (!pathname.includes('/_next/') && 
     !pathname.includes('/api/') && 
     !pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/))
  ) {
    // For HTML pages and routes, prevent caching
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // For static assets, allow caching but with shorter duration
  if (pathname.includes('/_next/static/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

