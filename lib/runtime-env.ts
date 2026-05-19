/**
 * Read env at request/build time without Next.js inlining a missing value from an old build.
 * Use for secrets on Amplify (process.env.KEY is often replaced at compile time).
 */
export function getRuntimeEnv(name: string): string | undefined {
  return process.env[name];
}
