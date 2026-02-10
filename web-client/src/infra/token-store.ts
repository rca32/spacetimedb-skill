export class TokenStore {
  constructor(private readonly storageKey: string) {}

  load(): string | null {
    return localStorage.getItem(this.storageKey)
  }

  save(token: string): void {
    localStorage.setItem(this.storageKey, token)
  }

  clear(): void {
    localStorage.removeItem(this.storageKey)
  }
}
