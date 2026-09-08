import { describe, expect, it } from 'vitest'
import { wordCount, formatWordCount } from './wordCount'

describe('wordCount', () => {
  it('returns 0 for empty text', () => {
    expect(wordCount('')).toBe(0)
    expect(wordCount('   \n')).toBe(0)
  })

  it('counts words', () => {
    expect(wordCount('the river remembers')).toBe(3)
    expect(wordCount('  one   two\nthree ')).toBe(3)
  })

  it('formats counts', () => {
    expect(formatWordCount(1)).toBe('1 word')
    expect(formatWordCount(1200)).toBe('1,200 words')
  })
})
