/**
 * Get the base path for API routes
 * In production with basePath, this will be '/nm2timesheet'
 * In local development without basePath, this will be ''
 */
export function getApiBasePath(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // If basePath is set in next.config.js, Next.js will handle it automatically
    // But we've hardcoded it, so we need to check the environment
    // For local dev, we can use an empty string or detect from window.location
    const pathname = window.location.pathname;
    if (pathname.startsWith('/nm2timesheet')) {
      return '/nm2timesheet';
    }
    return '';
  }
  
  // Server-side: check environment variable
  return process.env.DEPLOYED === 'true' ? '/nm2timesheet' : '';
}

