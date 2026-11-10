import { canvasToPngBlob, ImageConversionError } from '../image'

const ORT_VERSION = '1.21.0'
const ORT_MODULE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.bundle.min.mjs`
const ORT_WASM_PATH = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`
const MODEL_URL =
  'https://huggingface.co/BritishWerewolf/U-2-Netp/resolve/main/onnx/model.onnx'
const MODEL_SIZE = 320
const IMAGE_MEAN = [0.485, 0.456, 0.406]
const IMAGE_STD = [0.229, 0.224, 0.225]

let ortPromise = null
let sessionPromise = null

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException('Background removal cancelled', 'AbortError')
  }
}

function getOrt() {
  if (!ortPromise) {
    ortPromise = import(/* @vite-ignore */ ORT_MODULE_URL).then((ort) => {
      ort.env.wasm.wasmPaths = ORT_WASM_PATH
      ort.env.wasm.numThreads = 1
      ort.env.wasm.proxy = false
      return ort
    })
  }

  return ortPromise
}

async function downloadModel(onProgress, signal) {
  const response = await fetch(MODEL_URL, { signal })

  if (!response.ok) {
    throw new Error(`Model download failed with status ${response.status}`)
  }

  const total = Number(response.headers.get('content-length')) || 0
  const reader = response.body?.getReader()

  if (!reader) {
    return response.arrayBuffer()
  }

  const chunks = []
  let received = 0

  while (true) {
    throwIfAborted(signal)
    const { done, value } = await reader.read()
    if (done) break

    chunks.push(value)
    received += value.length

    onProgress?.({
      stage: 'model',
      message: 'Downloading the on-device background AI...',
      percent:
        total > 0 ? Math.min(96, Math.round((received / total) * 90)) : 0,
      detail: total > 0 ? `${received} / ${total} bytes` : null,
    })
  }

  const bytes = new Uint8Array(received)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }

  return bytes.buffer
}

function getSession(onProgress, signal) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      onProgress?.({
        stage: 'runtime',
        message: 'Loading the browser AI runtime...',
        percent: 1,
      })
      const ort = await getOrt()
      const model = await downloadModel(onProgress, signal)

      onProgress?.({
        stage: 'initializing',
        message: 'Initializing the segmentation model...',
        percent: 94,
      })

      return ort.InferenceSession.create(model, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      })
    })().catch((error) => {
      sessionPromise = null
      throw error
    })
  }

  return sessionPromise
}

function tensorFromCanvas(canvas) {
  const size = MODEL_SIZE
  const scratch = document.createElement('canvas')
  scratch.width = size
  scratch.height = size
  const context = scratch.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new ImageConversionError('Could not prepare the segmentation input.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(canvas, 0, 0, size, size)

  const pixels = context.getImageData(0, 0, size, size).data
  const values = new Float32Array(size * size * 3)

  for (let index = 0; index < size * size; index += 1) {
    const offset = index * 4
    values[index] =
      (pixels[offset] / 255 - IMAGE_MEAN[0]) / IMAGE_STD[0]
    values[size * size + index] =
      (pixels[offset + 1] / 255 - IMAGE_MEAN[1]) / IMAGE_STD[1]
    values[size * size * 2 + index] =
      (pixels[offset + 2] / 255 - IMAGE_MEAN[2]) / IMAGE_STD[2]
  }

  return values
}

function maskCanvasFromTensor(tensor) {
  const height = tensor.dims.at(-2)
  const width = tensor.dims.at(-1)
  const values = tensor.data
  const length = width * height
  let minimum = Infinity
  let maximum = -Infinity

  for (let index = 0; index < length; index += 1) {
    const value = values[index]
    if (value < minimum) minimum = value
    if (value > maximum) maximum = value
  }

  const range = maximum - minimum || 1
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const imageData = context.createImageData(width, height)

  for (let index = 0; index < length; index += 1) {
    const alpha = Math.max(
      0,
      Math.min(255, Math.round(((values[index] - minimum) / range) * 255)),
    )
    const offset = index * 4
    imageData.data[offset] = 255
    imageData.data[offset + 1] = 255
    imageData.data[offset + 2] = 255
    imageData.data[offset + 3] = alpha
  }

  context.putImageData(imageData, 0, 0)
  return canvas
}

export async function removeBackground(sourceCanvas, { signal, onProgress } = {}) {
  throwIfAborted(signal)

  let session
  let ort

  try {
    ort = await getOrt()
    session = await getSession(onProgress, signal)
  } catch (error) {
    if (error.name === 'AbortError') throw error

    throw new ImageConversionError(
      'The background AI could not load. Check your internet connection and try again.',
      { cause: error },
    )
  }

  throwIfAborted(signal)
  onProgress?.({
    stage: 'segmenting',
    message: 'Separating the subject from its background...',
    percent: 97,
  })

  const values = tensorFromCanvas(sourceCanvas)
  const inputName = session.inputNames?.[0] || 'input.1'
  const feeds = {
    [inputName]: new ort.Tensor('float32', values, [1, 3, MODEL_SIZE, MODEL_SIZE]),
  }

  let output

  try {
    output = await session.run(feeds)
  } catch (error) {
    throw new ImageConversionError(
      'Background segmentation failed. Please try a different image.',
      { cause: error },
    )
  }

  throwIfAborted(signal)
  onProgress?.({
    stage: 'refining',
    message: 'Refining the cutout edges...',
    percent: 99,
  })

  const outputName = session.outputNames?.[0]
  const tensor = output[outputName]

  if (!tensor) {
    throw new ImageConversionError(
      'The background model returned no mask. Please try again.',
    )
  }

  const mask = maskCanvasFromTensor(tensor)
  const cutout = document.createElement('canvas')
  cutout.width = sourceCanvas.width
  cutout.height = sourceCanvas.height
  const context = cutout.getContext('2d')

  if (!context) {
    throw new ImageConversionError('Could not build the transparent cutout.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(sourceCanvas, 0, 0)
  context.globalCompositeOperation = 'destination-in'
  context.drawImage(mask, 0, 0, cutout.width, cutout.height)
  context.globalCompositeOperation = 'source-over'

  return {
    canvas: cutout,
    blob: await canvasToPngBlob(cutout),
    width: cutout.width,
    height: cutout.height,
  }
}
