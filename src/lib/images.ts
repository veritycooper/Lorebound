export function arrayBufferToDataUrl(data: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(data)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const type = mimeType || 'application/octet-stream'
  return `data:${type};base64,${btoa(binary)}`
}

export function dataUrlToArrayBuffer(dataUrl: string): { data: ArrayBuffer; mimeType: string } {
  const [header, data] = dataUrl.split(',', 2)
  if (!header || data === undefined) {
    throw new Error('Invalid data URL')
  }
  const mimeMatch = header.match(/data:([^;]+)/)
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return { data: bytes.buffer, mimeType }
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.readAsArrayBuffer(blob)
  })
}

export function decodeText(data: ArrayBuffer): string {
  return new TextDecoder().decode(data)
}
