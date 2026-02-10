export class SubscriptionRegistry {
  private readonly active = new Set<string>()

  add(key: string): void {
    this.active.add(key)
  }

  clear(): void {
    this.active.clear()
  }

  values(): string[] {
    return [...this.active]
  }
}
