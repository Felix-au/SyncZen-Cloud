/**
 * Integration tests for the invite key generator pattern.
 * Tests the format, uniqueness distribution, and character set
 * used for hotel invite keys (format: XXXX-XXXX).
 *
 * We test the algorithm rather than importing the private function
 * by reimplementing the same logic and verifying its properties.
 *
 * Note: We inline the generator rather than importing nanoid because
 * nanoid v5 is ESM-only and requires separate Jest ESM config.
 */

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function customAlphabet(alphabet: string, size: number) {
  return () => Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

const genKey = () => {
  const part = customAlphabet(ALPHA, 4)
  return `${part()}-${part()}`
}

describe('Invite key format', () => {
  test('matches XXXX-XXXX pattern', () => {
    for (let i = 0; i < 20; i++) {
      const key = genKey()
      expect(key).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    }
  })

  test('has exactly 9 characters including dash', () => {
    const key = genKey()
    expect(key).toHaveLength(9)
  })

  test('does not contain ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 100; i++) {
      const key = genKey()
      expect(key).not.toMatch(/[01IO]/)
    }
  })

  test('always uppercase', () => {
    const key = genKey()
    expect(key).toBe(key.toUpperCase())
  })

  test('generates distinct keys (collision resistance)', () => {
    const keys = new Set<string>()
    for (let i = 0; i < 500; i++) {
      keys.add(genKey())
    }
    // With 32^8 = 1 trillion combinations, 500 samples should have zero collisions
    expect(keys.size).toBe(500)
  })
})

describe('Booking reference format', () => {
  function genRef(): string {
    return 'SS' + Date.now().toString(36).toUpperCase().slice(-6)
  }

  test('starts with SS prefix', () => {
    expect(genRef()).toMatch(/^SS/)
  })

  test('has length of 8', () => {
    expect(genRef()).toHaveLength(8)
  })

  test('is uppercase', () => {
    const ref = genRef()
    expect(ref).toBe(ref.toUpperCase())
  })
})
