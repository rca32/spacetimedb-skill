declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void): void
  export function expect<T = unknown>(value: T): {
    toBe: (expected: unknown) => void
    toEqual: (expected: unknown) => void
    toBeGreaterThan: (expected: number) => void
    toBeLessThan: (expected: number) => void
    toBeLessThanOrEqual: (expected: number) => void
  }
}
