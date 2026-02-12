import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('should export a default component', async () => {
    const module = await import('../App')
    expect(module.default).toBeDefined()
  })
})
