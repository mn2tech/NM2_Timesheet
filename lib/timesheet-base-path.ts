/** Base path for Next.js when deployed under /nm2timesheet (production). */
export function getTimesheetBasePath(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.pathname.startsWith('/nm2timesheet')) return '/nm2timesheet';
  return '';
}
