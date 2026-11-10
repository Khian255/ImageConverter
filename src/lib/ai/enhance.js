import { canvasToPngBlob, ImageConversionError } from '../image'

const ORT_VERSION = '1.21.0'
const ORT_MODULE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.bundle.min.mjs`
const ORT_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`
const MODEL_URL =
  'https://huggingface.co/vlad-grig/realesr-general-x4v3-onnx/resolve/main/onnx/model.onnx'
const MODEL_SIZE = 4_866_420
const MODEL_CACHE = 'image-studio-models-v1'
const TILE_SIZE = 128
const TILE_PADDING = 12
const MODEL_SCALE = 4
const MAX_OUTPUT_DIMENSION = 4096
const MAX_INPUT_PIXELS = 4_000_000

let ortPromise = null
let sessionPromise = null
let modelBufferPromise = null
let modelState = {
  status: 'idle',
  loaded: 0,
  total: MODEL_SIZE,
  percent: 0,
}
const modelListeners = new Set()

function updateModelState(next) {
  modelState = { ...modelState, ...next }

  for (const listener of modelListeners) {
    listener(modelState)
  }
}

export function subscribeEnhancementModel(listener) {
  modelListeners.add(listener)
  listener(modelState)
  return () => modelListeners.delete(listener)
}

async function readCachedModel() {
  if (typeof caches === 'undefined') return null

  try {
    const cache = await caches.open(MODEL_CACHE)
    const response = await cache.match(MODEL_URL)

    if (!response) return null
    return new Uint8Array(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function writeCachedModel(buffer) {
  if (typeof caches === 'undefined') return

  try {
    const cache = await caches.open(MODEL_CACHE)
    await cache.put(
      MODEL_URL,
      new Response(buffer, {
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    )
  } catch {
    return
  }
}

async function clearCachedModel() {
  if (typeof caches === 'undefined') return

  try {
    const cache = await caches.open(MODEL_CACHE)
    await cache.delete(MODEL_URL)
  } catch {
    return
  }
}

async function downloadModel() {
  const response = await fetch(MODEL_URL)

  if (!response.ok) {
    throw new Error('The AI model could not be downloaded.')
  }

  const total = Number(response.headers.get('content-length')) || MODEL_SIZE
  updateModelState({
    status: 'downloading',
    loaded: 0,
    total,
    percent: 0,
  })

  if (!response.body?.getReader) {
    const buffer = new Uint8Array(await response.arrayBuffer())
    await writeCachedModel(buffer)
    updateModelState({
      status: 'initializing',
      loaded: buffer.byteLength,
      total,
      percent: 100,
    })
    return buffer
  }

  const reader = response.body.getReader()
  const chunks = []
  let loaded = 0

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    updateModelState({
      status: 'downloading',
      loaded,
      total,
      percent: Math.min(99, Math.round((loaded / total) * 100)),
    })
  }

  const buffer = new Uint8Array(loaded)
  let offset = 0

  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }

  await writeCachedModel(buffer)
  updateModelState({
    status: 'initializing',
    loaded,
    total,
    percent: 100,
  })
  return buffer
}

function getModelBuffer() {
  if (!modelBufferPromise) {
    modelBufferPromise = (async () => {
      updateModelState({
        status: 'checking',
        loaded: 0,
        total: MODEL_SIZE,
        percent: 0,
      })

      const cached = await readCachedModel()

      if (cached) {
        updateModelState({
          status: 'initializing',
          loaded: cached.byteLength,
          total: cached.byteLength,
          percent: 100,
        })
        return cached
      }

      return downloadModel()
    })().catch((error) => {
      modelBufferPromise = null
      updateModelState({ status: 'error', percent: 0 })
      throw error
    })
  }

  return modelBufferPromise
}

function getOrt() {
  if (!ortPromise) {
    ortPromise = import(/* @vite-ignore */ ORT_MODULE_URL)
      .then((ort) => {
        ort.env.wasm.wasmPaths = ORT_WASM_PATH
        ort.env.wasm.numThreads = 1
        ort.env.wasm.proxy = false
        return ort
      })
      .catch((error) => {
        ortPromise = null
        throw error
      })
  }

  return ortPromise
}

function getSession() {
  if (!sessionPromise) {
    sessionPromise = Promise.all([getOrt(), getModelBuffer()])
      .then(([ort, model]) => {
        updateModelState({ status: 'initializing', percent: 100 })
        return ort.InferenceSession.create(model, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        })
      })
      .then((session) => {
        updateModelState({
          status: 'ready',
          loaded: modelState.total,
          total: modelState.total,
          percent: 100,
        })
        return session
      })
      .catch(async (error) => {
        sessionPromise = null
        modelBufferPromise = null
        await clearCachedModel()
        updateModelState({ status: 'error', percent: 0 })
        throw error
      })
  }

  return sessionPromise
}

export function preloadEnhancementModel() {
  return getSession()
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Enhancement cancelled', 'AbortError')
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function contextFor(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new ImageConversionError(
      'Your browser could not prepare the enhancement canvas.',
    )
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  return context
}

function hasTransparency(canvas) {
  const context = contextFor(canvas)
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) return true
  }

  return false
}

function tensorFromTile(context, x, y, width, height) {
  const imageData = context.getImageData(x, y, width, height).data
  const pixelCount = width * height
  const values = new Float32Array(pixelCount * 3)

  for (let index = 0; index < pixelCount; index += 1) {
    const sourceIndex = index * 4
    values[index] = imageData[sourceIndex] / 255
    values[pixelCount + index] = imageData[sourceIndex + 1] / 255
    values[pixelCount * 2 + index] = imageData[sourceIndex + 2] / 255
  }

  return values
}

function tileCanvasFromOutput(tensor) {
  const [, , height, width] = tensor.dims
  const canvas = createCanvas(width, height)
  const context = contextFor(canvas)
  const imageData = context.createImageData(width, height)
  const values = tensor.data

  for (let index = 0; index < width * height; index += 1) {
    const targetIndex = index * 4
    imageData.data[targetIndex] = Math.max(
      0,
      Math.min(255, Math.round(values[index] * 255)),
    )
    imageData.data[targetIndex + 1] = Math.max(
      0,
      Math.min(255, Math.round(values[width * height + index] * 255)),
    )
    imageData.data[targetIndex + 2] = Math.max(
      0,
      Math.min(255, Math.round(values[width * height * 2 + index] * 255)),
    )
    imageData.data[targetIndex + 3] = 255
  }

  context.putImageData(imageData, 0, 0)
  return canvas
}

export function getEnhancementEstimate(width, height) {
  const tilesX = Math.ceil(width / TILE_SIZE)
  const tilesY = Math.ceil(height / TILE_SIZE)
  const tileCount = tilesX * tilesY

  return {
    tileCount,
    seconds: Math.max(8, Math.round(tileCount * 2.2 + 8)),
  }
}

export async function enhanceImage(sourceCanvas, { scale, signal, onProgress }) {
  if (![2, 4].includes(scale)) {
    throw new ImageConversionError('Choose a 2x or 4x enhancement scale.')
  }

  const sourceWidth = sourceCanvas.width
  const sourceHeight = sourceCanvas.height
  const outputWidth = sourceWidth * scale
  const outputHeight = sourceHeight * scale

  if (sourceWidth * sourceHeight > MAX_INPUT_PIXELS) {
    throw new ImageConversionError(
      'This image is too large for browser-based HD enhancement. Please use an image under 4 megapixels.',
    )
  }

  if (
    outputWidth > MAX_OUTPUT_DIMENSION ||
    outputHeight > MAX_OUTPUT_DIMENSION
  ) {
    throw new ImageConversionError(
      'The enhanced image would be too large. Please choose 2x or use a smaller image.',
    )
  }

  throwIfAborted(signal)

  onProgress?.({
    stage: 'model',
    message: 'Loading the Real-ESRGAN model...',
  })

  let ort
  let session

  try {
    ort = await getOrt()
    session = await getSession()
  } catch (error) {
    throw new ImageConversionError(
      'The AI upscaler could not load. Check your internet connection and try again.',
      { cause: error },
    )
  }

  throwIfAborted(signal)

  const sourceContext = contextFor(sourceCanvas)
  const outputCanvas = createCanvas(outputWidth, outputHeight)
  const outputContext = contextFor(outputCanvas)
  const tilesX = Math.ceil(sourceWidth / TILE_SIZE)
  const tilesY = Math.ceil(sourceHeight / TILE_SIZE)
  const tileCount = tilesX * tilesY
  const outputName = session.outputNames?.[0] || 'output'
  const startedAt = performance.now()
  let completed = 0

  for (let tileY = 0; tileY < sourceHeight; tileY += TILE_SIZE) {
    for (let tileX = 0; tileX < sourceWidth; tileX += TILE_SIZE) {
      throwIfAborted(signal)

      const tileWidth = Math.min(TILE_SIZE, sourceWidth - tileX)
      const tileHeight = Math.min(TILE_SIZE, sourceHeight - tileY)
      const sourceX = Math.max(0, tileX - TILE_PADDING)
      const sourceY = Math.max(0, tileY - TILE_PADDING)
      const sourceRight = Math.min(
        sourceWidth,
        tileX + tileWidth + TILE_PADDING,
      )
      const sourceBottom = Math.min(
        sourceHeight,
        tileY + tileHeight + TILE_PADDING,
      )
      const inputWidth = sourceRight - sourceX
      const inputHeight = sourceBottom - sourceY
      const values = tensorFromTile(
        sourceContext,
        sourceX,
        sourceY,
        inputWidth,
        inputHeight,
      )
      const tensor = new ort.Tensor('float32', values, [
        1,
        3,
        inputHeight,
        inputWidth,
      ])
      const result = await session.run({ input: tensor })
      const enhancedTile = tileCanvasFromOutput(result[outputName])
      const outputTileX = (tileX - sourceX) * MODEL_SCALE
      const outputTileY = (tileY - sourceY) * MODEL_SCALE

      outputContext.drawImage(
        enhancedTile,
        outputTileX,
        outputTileY,
        tileWidth * MODEL_SCALE,
        tileHeight * MODEL_SCALE,
        tileX * scale,
        tileY * scale,
        tileWidth * scale,
        tileHeight * scale,
      )

      completed += 1
      const elapsedSeconds = (performance.now() - startedAt) / 1000
      const secondsPerTile = elapsedSeconds / completed
      const remaining = Math.max(
        0,
        Math.round((tileCount - completed) * secondsPerTile + 3),
      )

      onProgress?.({
        stage: 'enhancing',
        message: 'Enhancing details...',
        completed,
        total: tileCount,
        percent: Math.round((completed / tileCount) * 100),
        remaining,
      })
    }
  }

  if (hasTransparency(sourceCanvas)) {
    const alphaCanvas = createCanvas(sourceWidth, sourceHeight)
    const alphaContext = contextFor(alphaCanvas)
    alphaContext.drawImage(sourceCanvas, 0, 0)
    outputContext.globalCompositeOperation = 'destination-in'
    outputContext.drawImage(
      alphaCanvas,
      0,
      0,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    )
    outputContext.globalCompositeOperation = 'source-over'
  }

  return {
    canvas: outputCanvas,
    blob: await canvasToPngBlob(outputCanvas),
    width: outputWidth,
    height: outputHeight,
    tileCount,
  }
}
