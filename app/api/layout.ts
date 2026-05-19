// API routes read cookies/headers for auth — must not be statically prerendered at build time.
export const dynamic = 'force-dynamic';

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
