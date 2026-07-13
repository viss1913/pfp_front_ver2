/**
 * Prepare media for Content Factory base64 upload.
 * Backend/nginx often reject large JSON bodies (413 Request Entity Too Large).
 * We resize/compress images on the client before encoding.
 */

const DEFAULT_MAX_EDGE = 1600
/** Target max raw base64 length (~750KB binary → ~1MB base64) */
const DEFAULT_MAX_BASE64_CHARS = 900_000

function stripDataUrl(dataUrl: string): string {
  const i = dataUrl.indexOf(',')
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать изображение'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Не удалось сжать изображение'))
        else resolve(blob)
      },
      type,
      quality
    )
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(stripDataUrl(reader.result as string))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function drawScaled(
  img: HTMLImageElement,
  maxEdge: number
): HTMLCanvasElement {
  let { width, height } = img
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  width = Math.max(1, Math.round(width * scale))
  height = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas не поддерживается')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

export type PreparedMedia = {
  name: string
  content_base64: string
  content_type: string
  /** true if file was resized/recompressed */
  compressed: boolean
  originalBytes: number
  resultBytes: number
}

/**
 * Resize + compress images so POST /media fits typical body limits.
 * Non-images are passed through; rejected if still too large.
 */
export async function prepareMediaForUpload(
  file: File,
  opts?: { maxEdge?: number; maxBase64Chars?: number }
): Promise<PreparedMedia> {
  const maxEdge = opts?.maxEdge ?? DEFAULT_MAX_EDGE
  const maxBase64 = opts?.maxBase64Chars ?? DEFAULT_MAX_BASE64_CHARS
  const originalBytes = file.size
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)

  if (!isImage) {
    if (file.size > 500_000) {
      throw new Error(
        `Файл «${file.name}» слишком большой (${Math.round(file.size / 1024)} KB). Макс. ~500 KB для не-изображений.`
      )
    }
    const content_base64 = await blobToBase64(file)
    if (content_base64.length > maxBase64) {
      throw new Error(`Файл «${file.name}» слишком большой для загрузки (413).`)
    }
    return {
      name: file.name,
      content_base64,
      content_type: file.type || 'application/octet-stream',
      compressed: false,
      originalBytes,
      resultBytes: file.size,
    }
  }

  // GIF: avoid canvas (loses animation) — only accept small ones
  if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
    if (file.size > 400_000) {
      throw new Error(
        'GIF слишком большой. Сохраните как PNG/JPEG или уменьшите файл.'
      )
    }
    const content_base64 = await blobToBase64(file)
    return {
      name: file.name,
      content_base64,
      content_type: 'image/gif',
      compressed: false,
      originalBytes,
      resultBytes: file.size,
    }
  }

  const img = await loadImage(file)
  const prefersPng =
    file.type === 'image/png' ||
    /\.png$/i.test(file.name) ||
    /logo|icon|svg/i.test(file.name)

  let edge = maxEdge
  let quality = 0.82
  let mime = prefersPng ? 'image/png' : 'image/jpeg'
  let blob: Blob | null = null
  let base64 = ''

  // Iteratively shrink until under limit
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = drawScaled(img, edge)
    if (mime === 'image/png' && attempt >= 2) {
      // PNG still huge → switch to JPEG
      mime = 'image/jpeg'
      quality = 0.8
    }
    blob =
      mime === 'image/png'
        ? await canvasToBlob(canvas, mime, 1)
        : await canvasToBlob(canvas, mime, quality)
    base64 = await blobToBase64(blob)
    if (base64.length <= maxBase64) break
    edge = Math.round(edge * 0.75)
    quality = Math.max(0.45, quality - 0.1)
  }

  if (!blob || !base64 || base64.length > maxBase64) {
    throw new Error(
      `Не удалось сжать «${file.name}» до лимита сервера. Попробуйте меньший файл.`
    )
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  const name = `${baseName}.${ext}`

  return {
    name,
    content_base64: base64,
    content_type: mime,
    compressed: true,
    originalBytes,
    resultBytes: blob.size,
  }
}
