export function wordCount(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function formatWordCount(count: number): string {
  if (count === 1) return '1 word'
  return `${count.toLocaleString()} words`
}
