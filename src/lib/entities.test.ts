import { describe, expect, it } from 'vitest'
import { emptyStory, parseTags } from './entities'

describe('parseTags', () => {
  it('splits commas and hashes', () => {
    expect(parseTags('rain, betrayal #market')).toEqual(['rain', 'betrayal', 'market'])
  })

  it('drops empties', () => {
    expect(parseTags(' , # ')).toEqual([])
  })
})

describe('emptyStory', () => {
  it('starts with nested collections', () => {
    const story = emptyStory({ title: 'Ashwood' })
    expect(story.title).toBe('Ashwood')
    expect(story.characters).toEqual([])
    expect(story.status).toBe('seed')
  })
})
