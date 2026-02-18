export class TokenStore {
  constructor(private readonly key: string) {}

  load(): string | null {
    try {
      return window.localStorage.getItem(this.key)
    } catch {
      return null
    }
  }

  save(token: string): void {
    try {
      window.localStorage.setItem(this.key, token)
    } catch {
      // no-op
    }
  }
}
