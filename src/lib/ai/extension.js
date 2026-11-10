import { ImageConversionError } from '../image'

const HORDE_API = 'https://stablehorde.net/api/v2'
const HORDE_CLIENT = 'image-studio:1.0:local-browser'
const HORDE_ANONYMOUS_KEY = '0000000000'
const MAX_EXTENSION_EDGE = 1024
const MIN_EXTENSION_EDGE = 640
const POLL_INTERVAL = 4000
const MAX_POLL_ATTEMPTS = 300

export const EXTENSION_PRESETS = [
  { id: '1:1', label: 'Square', ratio: 1 },
  { id: '4:5', label: 'Portrait', ratio: 4 / 5 },
  { id: '3:4', label: 'Classic', ratio: 3 / 4 },
  { id: '16:9', label: 'Widescreen', ratio: 16 / 9 },
  { id: '9:16', label: 'Story', ratio: 9 / 16 },
]

export const EXTENSION_STYLES = [
  { id: 'nature', label: 'Nature', prompt: 'lush natural landscape, trees, soft natural light' },
  { id: 'sky', label: 'Sky', prompt: 'open sky, soft clouds, atmospheric perspective' },
  { id: 'studio', label: 'Studio', prompt: 'clean studio backdrop, softbox lighting, seamless surface' },
  { id: 'indoor', label: 'Indoor', prompt: 'tasteful interior, matching furniture and architecture' },
  { id: 'outdoor', label: 'Outdoor', prompt: 'outdoor environment, matching daylight and scenery' },
  { id: 'abstract', label: 'Abstract', prompt: 'tasteful abstract background, cohesive colors and texture' },
]

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Extension cancelled', 'AbortError')
  }
}

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    function cleanup() {
      signal?.removeEventListener('abort', handleAbort)
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, milliseconds)

    function handleAbort() {
      clearTimeout(timer)
      cleanup()
      reject(new DOMException('Extension cancelled', 'AbortError'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function roundToMultipleOfSixtyFour(value) {
  return Math.max(64, Math.round(value / 64) * 64)
}

export function getExtensionDimensions(
  sourceWidth,
  sourceHeight,
  ratio,
  maxEdge = MAX_EXTENSION_EDGE,
) {
  const sourceRatio = sourceWidth / sourceHeight
  let width
  let height

  if (ratio > sourceRatio) {
    height = sourceHeight
    width = sourceHeight * ratio
  } else {
    width = sourceWidth
    height = sourceWidth / ratio
  }

  const longest = Math.max(width, height)
  const edgeLimit = Math.max(MIN_EXTENSION_EDGE, maxEdge)

  if (longest > edgeLimit) {
    const scale = edgeLimit / longest
    width *= scale
    height *= scale
  }

  return {
    width: roundToMultipleOfSixtyFour(width),
    height: roundToMultipleOfSixtyFour(height),
  }
}

export function drawContained(sourceCanvas, targetContext, targetWidth, targetHeight) {
  const scale = Math.min(
    targetWidth / sourceCanvas.width,
    targetHeight / sourceCanvas.height,
  )
  const width = Math.round(sourceCanvas.width * scale)
  const height = Math.round(sourceCanvas.height * scale)
  const x = Math.round((targetWidth - width) / 2)
  const y = Math.round((targetHeight - height) / 2)

  targetContext.drawImage(sourceCanvas, x, y, width, height)

  return { x, y, width, height }
}

export function composeExtension(
  sourceCanvas,
  targetWidth,
  targetHeight,
  background,
) {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new ImageConversionError(
      'Your browser could not prepare the extension canvas.',
    )
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, targetWidth, targetHeight)

  if (background?.type === 'color') {
    context.fillStyle = background.color || '#ffffff'
    context.fillRect(0, 0, targetWidth, targetHeight)
  } else if (background?.type === 'image') {
    const image = background.image
    const scale = Math.max(
      targetWidth / image.width,
      targetHeight / image.height,
    )
    const width = image.width * scale
    const height = image.height * scale
    context.drawImage(
      image,
      (targetWidth - width) / 2,
      (targetHeight - height) / 2,
      width,
      height,
    )
  }

  const sourceRect = drawContained(
    sourceCanvas,
    context,
    targetWidth,
    targetHeight,
  )

  return { canvas, sourceRect }
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('The browser returned an empty image'))
      },
      mimeType,
      quality,
    )
  })
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Image encoding failed'))
    reader.readAsDataURL(blob)
  })
}

async function hordeRequest(path, options = {}) {
  const response = await fetch(`${HORDE_API}${path}`, {
    ...options,
    headers: {
      'Client-Agent': HORDE_CLIENT,
      ...(options.headers || {}),
    },
  })

  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const details = payload?.errors
      ? Object.values(payload.errors).join(' ')
      : null

    throw new ImageConversionError(
      [payload?.message, details].filter(Boolean).join(' ') ||
        'The AI service rejected the request. Please try again in a moment.',
    )
  }

  return payload
}

function buildPrompt(prompt, styleId) {
  const style = EXTENSION_STYLES.find((item) => item.id === styleId)
  const parts = [
    prompt.trim() ||
      'a natural background that continues the scene seamlessly',
    style?.prompt,
    'seamless outpainting, matching perspective, lighting, colors and texture, photorealistic, highly detailed, no visible seam',
  ]

  return parts.filter(Boolean).join(', ')
}

async function prepareHordeImages(sourceCanvas, targetWidth, targetHeight) {
  const sourceLayer = document.createElement('canvas')
  sourceLayer.width = targetWidth
  sourceLayer.height = targetHeight

  const sourceContext = sourceLayer.getContext('2d')

  if (!sourceContext) {
    throw new ImageConversionError('Could not prepare the AI request.')
  }

  sourceContext.fillStyle = '#ffffff'
  sourceContext.fillRect(0, 0, targetWidth, targetHeight)
  const sourceRect = drawContained(
    sourceCanvas,
    sourceContext,
    targetWidth,
    targetHeight,
  )

  const mask = document.createElement('canvas')
  mask.width = targetWidth
  mask.height = targetHeight

  const maskContext = mask.getContext('2d')

  if (!maskContext) {
    throw new ImageConversionError('Could not prepare the AI request.')
  }

  maskContext.fillStyle = '#ffffff'
  maskContext.fillRect(0, 0, targetWidth, targetHeight)
  maskContext.fillStyle = '#000000'
  maskContext.fillRect(
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
  )

  const sourceBlob = await canvasToBlob(sourceLayer, 'image/png')
  let maskBlob

  try {
    maskBlob = await canvasToBlob(mask, 'image/webp', 0.95)
  } catch {
    maskBlob = await canvasToBlob(mask, 'image/png')
  }

  return {
    sourceImage: await blobToBase64(sourceBlob),
    sourceMask: await blobToBase64(maskBlob),
    sourceRect,
  }
}

async function fetchResultImage(url, signal) {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new ImageConversionError(
      'The AI image was generated but could not be downloaded. Please try again.',
    )
  }

  return response.blob()
}

export async function extendImage(
  sourceCanvas,
  {
    targetWidth,
    targetHeight,
    prompt,
    style,
    signal,
    onProgress,
  },
) {
  throwIfAborted(signal)
  onProgress?.({
    stage: 'preparing',
    message: 'Preparing the outpainting request...',
  })

  const { sourceImage, sourceMask, sourceRect } = await prepareHordeImages(
    sourceCanvas,
    targetWidth,
    targetHeight,
  )

  throwIfAborted(signal)
  const finalPrompt = buildPrompt(prompt, style)
  const payload = {
    prompt: finalPrompt,
    params: {
      width: targetWidth,
      height: targetHeight,
      steps: 22,
      cfg_scale: 7.5,
      sampler_name: 'k_euler',
      denoising_strength: 0.7,
      n: 1,
    },
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
    models: ['stable_diffusion'],
    source_processing: 'outpainting',
    source_image: sourceImage,
    source_mask: sourceMask,
  }

  onProgress?.({
    stage: 'submitting',
    message: 'Sending your image to the AI queue...',
  })

  let request

  try {
    request = await hordeRequest('/generate/async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: HORDE_ANONYMOUS_KEY,
      },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    if (error instanceof ImageConversionError) throw error

    throw new ImageConversionError(
      'The free AI service could not be reached. Check your internet connection and try again.',
      { cause: error },
    )
  }

  if (!request?.id) {
    throw new ImageConversionError(
      'The free AI service did not return a job. Please try again.',
    )
  }

  let done = false

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    throwIfAborted(signal)
    await wait(POLL_INTERVAL, signal)

    let check

    try {
      check = await hordeRequest(`/generate/check/${request.id}`, { signal })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      continue
    }

    if (check?.faulted) {
      throw new ImageConversionError(
        'The AI worker could not finish this image. Please try again.',
      )
    }

    const queuePosition = Number(check?.queue_position || 0)
    const waitTime = Number(check?.wait_time || 0)

    onProgress?.({
      stage: check?.processing ? 'generating' : 'queued',
      message: check?.processing
        ? 'The AI is painting the extended areas...'
        : queuePosition > 0
          ? `Waiting in the free AI queue (position ${queuePosition})...`
          : 'Waiting for an available AI worker...',
      queuePosition,
      waitTime,
      elapsed: (attempt + 1) * (POLL_INTERVAL / 1000),
    })

    if (check?.done || check?.finished === 1) {
      done = true
      break
    }
  }

  if (!done) {
    throw new ImageConversionError(
      'The free AI queue is taking longer than expected. Please try again.',
    )
  }

  onProgress?.({
    stage: 'downloading',
    message: 'Downloading your extended image...',
  })

  const status = await hordeRequest(`/generate/status/${request.id}`, { signal })
  const generation = status?.generations?.[0]

  if (status?.faulted || !generation?.img) {
    throw new ImageConversionError(
      'The AI worker finished without an image. Please try again.',
    )
  }

  const imageBlob = await fetchResultImage(generation.img, signal)

  return {
    blob: imageBlob,
    prompt: finalPrompt,
    sourceRect,
    model: generation.model || 'stable_diffusion',
  }
}
