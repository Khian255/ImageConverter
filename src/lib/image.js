import UTIF from 'utif'
import { GIFEncoder, applyPalette, quantize } from 'gifenc'

export const MAX_FILE_SIZE = 25 * 1024 * 1024
export const MAX_FILE_SIZE_LABEL = '25 MB'

const MAX_CANVAS_DIMENSION = 16384
const MAX_CANVAS_PIXELS = 100_000_000
const EXPORT_QUALITY = 0.92
const MAX_ICON_SIZE = 256
const MAX_PREVIEW_DIMENSION = 1600

const JPG = {
  id: 'jpg',
  label: 'JPG',
  mime: 'image/jpeg',
  extension: 'jpg',
  hint: 'Universal',
  alpha: false,
}

const PNG = {
  id: 'png',
  label: 'PNG',
  mime: 'image/png',
  extension: 'png',
  hint: 'Lossless',
  alpha: true,
}

const WEBP = {
  id: 'webp',
  label: 'WebP',
  mime: 'image/webp',
  extension: 'webp',
  hint: 'Small & sharp',
  alpha: true,
}

const AVIF = {
  id: 'avif',
  label: 'AVIF',
  mime: 'image/avif',
  extension: 'avif',
  hint: 'Next-gen',
  alpha: true,
}

const GIF = {
  id: 'gif',
  label: 'GIF',
  mime: 'image/gif',
  extension: 'gif',
  hint: 'Indexed',
  alpha: true,
}

const BMP = {
  id: 'bmp',
  label: 'BMP',
  mime: 'image/bmp',
  extension: 'bmp',
  hint: 'Bitmap',
  alpha: false,
}

const TIFF = {
  id: 'tiff',
  label: 'TIFF',
  mime: 'image/tiff',
  extension: 'tiff',
  hint: 'Print-ready',
  alpha: true,
}

const ICO = {
  id: 'ico',
  label: 'ICO',
  mime: 'image/x-icon',
  extension: 'ico',
  hint: 'App icon',
  alpha: true,
}

const HEIC = {
  id: 'heic',
  label: 'HEIC / HEIF',
  mime: 'image/heic',
  extension: 'heic',
  hint: 'Input only',
  alpha: true,
}

export const OUTPUT_FORMATS = [JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF, ICO]

export const INPUT_FORMATS = [JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF, ICO, HEIC]

export const INPUT_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tif,.tiff,.ico,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/tiff,image/x-icon,image/heic,image/heif'

export class ImageConversionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImageConversionError'
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** unitIndex
  const digits = unitIndex === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2

  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length))
}

export function detectImageFormat(buffer) {
  const bytes = new Uint8Array(buffer)

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return JPG
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return PNG
  }

  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === 'RIFF' &&
    ascii(bytes, 8, 4) === 'WEBP'
  ) {
    return WEBP
  }

  if (bytes.length >= 6) {
    const signature = ascii(bytes, 0, 6)

    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return GIF
    }
  }

  if (bytes.length >= 18 && ascii(bytes, 0, 2) === 'BM') {
    return BMP
  }

  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x2a &&
      bytes[3] === 0x00) ||
      (bytes[0] === 0x4d &&
        bytes[1] === 0x4d &&
        bytes[2] === 0x00 &&
        bytes[3] === 0x2a))
  ) {
    return TIFF
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return ICO
  }

  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4)
    const compatibleBrands = ascii(bytes, 8, Math.min(32, bytes.length - 8))

    if (
      brand === 'avif' ||
      brand === 'avis' ||
      compatibleBrands.includes('avif') ||
      compatibleBrands.includes('avis')
    ) {
      return AVIF
    }

    if (
      ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1'].includes(
        brand,
      )
    ) {
      return HEIC
    }
  }

  return null
}

export function buildConvertedFilename(originalName, extension) {
  const baseName =
    originalName
      .replace(/\.[^.]+$/, '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .trim() || 'image'

  return `${baseName}.${extension}`
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be decoded'))
    image.src = url
  })
}

function assertCanvasLimits(width, height) {
  if (
    width > MAX_CANVAS_DIMENSION ||
    height > MAX_CANVAS_DIMENSION ||
    width * height > MAX_CANVAS_PIXELS
  ) {
    throw new ImageConversionError(
      'This image is too large to process in your browser. Please use an image smaller than 100 megapixels.',
    )
  }
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new ImageConversionError(
      'Your browser could not prepare the image canvas. Please try a different browser.',
    )
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  return { canvas, context }
}

function drawImageToCanvas(image, width, height) {
  const { canvas, context } = createCanvas(width, height)
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

async function readFormat(file) {
  const header = await file.slice(0, 32).arrayBuffer()
  return detectImageFormat(header)
}

function canvasToBlob(canvas, mimeType, quality = EXPORT_QUALITY) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('The browser returned an empty file'))
        }
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality,
    )
  })
}

async function decodeWithNativeBrowser(file) {
  const url = URL.createObjectURL(file)

  try {
    const image = await loadImage(url)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height

    if (!width || !height) {
      throw new Error('Image has no dimensions')
    }

    assertCanvasLimits(width, height)
    return drawImageToCanvas(image, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function decodeTiff(file) {
  const buffer = await file.arrayBuffer()
  const ifds = UTIF.decode(buffer)

  if (!ifds.length) {
    throw new ImageConversionError(
      "We couldn't read this TIFF image. Please make sure it is valid.",
    )
  }

  UTIF.decodeImage(buffer, ifds[0])
  const width = ifds[0].width
  const height = ifds[0].height

  if (!width || !height) {
    throw new ImageConversionError(
      "We couldn't read this TIFF image. Please make sure it is valid.",
    )
  }

  assertCanvasLimits(width, height)

  const rgba = UTIF.toRGBA8(ifds[0])
  const { canvas, context } = createCanvas(width, height)
  const imageData = context.createImageData(width, height)
  imageData.data.set(rgba)
  context.putImageData(imageData, 0, 0)

  return canvas
}

async function decodeHeic(file) {
  const { default: createLibheif } = await import(
    /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/libheif-js@1.23.5/libheif-wasm/libheif-bundle.mjs'
  )
  const libheif = createLibheif()
  const decoder = new libheif.HeifDecoder()
  const images = decoder.decode(new Uint8Array(await file.arrayBuffer()))

  if (!images.length) {
    throw new ImageConversionError(
      "We couldn't read this HEIC image. Please make sure it is valid.",
    )
  }

  const image = images[0]
  const width = image.get_width()
  const height = image.get_height()

  if (!width || !height) {
    throw new ImageConversionError(
      "We couldn't read this HEIC image. Please make sure it is valid.",
    )
  }

  assertCanvasLimits(width, height)

  const { canvas, context } = createCanvas(width, height)
  const imageData = context.createImageData(width, height)

  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (displayData) {
        resolve()
      } else {
        reject(new Error('HEIF processing error'))
      }
    })
  })

  context.putImageData(imageData, 0, 0)
  return canvas
}

async function decodeAvifWithWasm(file) {
  const { decode } = await import(
    /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@jsquash/avif@2.1.1/+esm'
  )
  const imageData = await decode(await file.arrayBuffer())

  if (!imageData?.width || !imageData?.height) {
    throw new ImageConversionError(
      "We couldn't read this AVIF image. Please make sure it is valid.",
    )
  }

  assertCanvasLimits(imageData.width, imageData.height)

  const { canvas, context } = createCanvas(imageData.width, imageData.height)
  context.putImageData(imageData, 0, 0)
  return canvas
}

async function decodeToCanvas(file, format) {
  if (format.id === 'tiff') {
    return { canvas: await decodeTiff(file), usedFallback: true }
  }

  if (format.id === 'heic') {
    return { canvas: await decodeHeic(file), usedFallback: true }
  }

  try {
    return { canvas: await decodeWithNativeBrowser(file), usedFallback: false }
  } catch (error) {
    if (format.id === 'avif') {
      return { canvas: await decodeAvifWithWasm(file), usedFallback: true }
    }

    throw error
  }
}

function makePreviewUrl(canvas) {
  const width = canvas.width
  const height = canvas.height
  const scale = Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(width, height))

  if (scale === 1) {
    return canvasToBlob(canvas, 'image/png').then((blob) =>
      URL.createObjectURL(blob),
    )
  }

  const preview = drawImageToCanvas(
    canvas,
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  )

  return canvasToBlob(preview, 'image/png').then((blob) =>
    URL.createObjectURL(blob),
  )
}

export async function inspectImageFile(file) {
  if (!file) {
    throw new ImageConversionError('Please choose an image to continue.')
  }

  if (file.size === 0) {
    throw new ImageConversionError(
      'This file is empty. Please choose a valid image.',
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ImageConversionError(
      `This image is larger than ${MAX_FILE_SIZE_LABEL}. Please choose a smaller file.`,
    )
  }

  const format = await readFormat(file)

  if (!format) {
    throw new ImageConversionError(
      'Unsupported file type. Please upload a JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, or HEIC image.',
    )
  }

  let decoded

  try {
    decoded = await decodeToCanvas(file, format)
  } catch (error) {
    if (error instanceof ImageConversionError) {
      throw error
    }

    throw new ImageConversionError(
      `We couldn't read this ${format.label} image. Please make sure it's a valid file.`,
    )
  }

  const { canvas } = decoded
  let url

  if (decoded.usedFallback) {
    url = await makePreviewUrl(canvas)
  } else {
    url = URL.createObjectURL(file)
  }

  return {
    file,
    format,
    width: canvas.width,
    height: canvas.height,
    url,
    canvas,
  }
}

export async function decodeImageFile(file) {
  const format = await readFormat(file)

  if (!format) {
    throw new ImageConversionError(
      'Unsupported file type. Please upload a supported image.',
    )
  }

  return decodeToCanvas(file, format)
}

function fillWhite(context, width, height) {
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
}

function imageDataToCanvas(imageData) {
  const { canvas, context } = createCanvas(imageData.width, imageData.height)
  context.putImageData(imageData, 0, 0)
  return canvas
}

async function encodeAvif(canvas) {
  const { encode } = await import(
    /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@jsquash/avif@2.1.1/+esm'
  )
  const context = canvas.getContext('2d')
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const buffer = await encode(imageData, { quality: 62, speed: 7 })
  return new Blob([buffer], { type: 'image/avif' })
}

function canvasHasTransparency(canvas) {
  const context = canvas.getContext('2d')
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) return true
  }

  return false
}

function encodeGif(canvas) {
  const context = canvas.getContext('2d')
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const hasAlpha = canvasHasTransparency(canvas)
  const format = hasAlpha ? 'rgba4444' : 'rgb565'
  const palette = quantize(imageData.data, hasAlpha ? 255 : 256, {
    format,
    oneBitAlpha: hasAlpha ? 127 : false,
  })
  const index = applyPalette(imageData.data, palette, format)
  const gif = GIFEncoder()
  let transparentIndex = -1

  if (hasAlpha) {
    transparentIndex = palette.findIndex((color) => color[3] === 0)

    if (transparentIndex === -1 && palette.length < 256) {
      palette.push([0, 0, 0, 0])
      transparentIndex = palette.length - 1
    }

    if (transparentIndex !== -1) {
      for (let offset = 0; offset < imageData.data.length; offset += 4) {
        if (imageData.data[offset + 3] < 128) {
          index[offset / 4] = transparentIndex
        }
      }
    }
  }

  gif.writeFrame(index, canvas.width, canvas.height, {
    palette,
    transparent: hasAlpha && transparentIndex !== -1,
    transparentIndex: transparentIndex === -1 ? 0 : transparentIndex,
  })
  gif.finish()

  return new Blob([gif.bytes()], { type: 'image/gif' })
}

function encodeBmp(canvas) {
  const context = canvas.getContext('2d')
  const { width, height } = canvas
  const imageData = context.getImageData(0, 0, width, height).data
  const rowSize = Math.floor((24 * width + 31) / 32) * 4
  const pixelDataSize = rowSize * height
  const buffer = new ArrayBuffer(54 + pixelDataSize)
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  bytes[0] = 0x42
  bytes[1] = 0x4d
  view.setUint32(2, 54 + pixelDataSize, true)
  view.setUint32(10, 54, true)
  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(34, pixelDataSize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)

  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y
    let offset = 54 + y * rowSize

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (sourceY * width + x) * 4
      bytes[offset] = imageData[sourceOffset + 2]
      bytes[offset + 1] = imageData[sourceOffset + 1]
      bytes[offset + 2] = imageData[sourceOffset]
      offset += 3
    }
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

function encodeTiff(canvas) {
  const context = canvas.getContext('2d')
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const buffer = UTIF.encodeImage(
    new Uint8Array(imageData.data),
    canvas.width,
    canvas.height,
  )

  return new Blob([buffer], { type: 'image/tiff' })
}

async function encodeIco(canvas) {
  const png = await canvasToBlob(canvas, 'image/png')
  const pngBuffer = await png.arrayBuffer()
  const buffer = new ArrayBuffer(22 + pngBuffer.byteLength)
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)
  bytes[6] = canvas.width >= 256 ? 0 : canvas.width
  bytes[7] = canvas.height >= 256 ? 0 : canvas.height
  bytes[8] = 0
  bytes[9] = 0
  view.setUint16(10, 1, true)
  view.setUint16(12, 32, true)
  view.setUint32(14, pngBuffer.byteLength, true)
  view.setUint32(18, 22, true)
  bytes.set(new Uint8Array(pngBuffer), 22)

  return new Blob([buffer], { type: 'image/x-icon' })
}

function resizeForIcon(canvas) {
  const longest = Math.max(canvas.width, canvas.height)

  if (longest <= MAX_ICON_SIZE) return canvas

  const scale = MAX_ICON_SIZE / longest
  return drawImageToCanvas(
    canvas,
    Math.max(1, Math.round(canvas.width * scale)),
    Math.max(1, Math.round(canvas.height * scale)),
  )
}

export async function convertImage(file, targetFormat, options = {}) {
  const sourceFormat = options.sourceFormat || (await readFormat(file))

  if (!sourceFormat) {
    throw new ImageConversionError(
      'This file is not a supported image. Please upload a supported image.',
    )
  }

  let sourceCanvas = options.sourceCanvas

  if (!sourceCanvas) {
    try {
      sourceCanvas = (await decodeToCanvas(file, sourceFormat)).canvas
    } catch (error) {
      if (error instanceof ImageConversionError) {
        throw error
      }

      throw new ImageConversionError(
        "We couldn't read this image. Please make sure it's a valid file.",
      )
    }
  }

  let outputCanvas = sourceCanvas

  if (targetFormat.id === 'ico' && Math.max(outputCanvas.width, outputCanvas.height) > MAX_ICON_SIZE) {
    outputCanvas = resizeForIcon(outputCanvas)
  } else if (targetFormat.id === 'ico') {
    outputCanvas = resizeForIcon(outputCanvas)
  }

  let workingCanvas = outputCanvas

  if (targetFormat.id === 'jpg' || targetFormat.id === 'bmp') {
    const width = outputCanvas.width
    const height = outputCanvas.height
    const flattened = createCanvas(width, height)
    fillWhite(flattened.context, width, height)
    flattened.context.drawImage(outputCanvas, 0, 0, width, height)
    workingCanvas = flattened.canvas
  }

  try {
    let blob

    switch (targetFormat.id) {
      case 'avif':
        blob = await encodeAvif(workingCanvas)
        break
      case 'gif':
        blob = encodeGif(workingCanvas)
        break
      case 'bmp':
        blob = encodeBmp(workingCanvas)
        break
      case 'tiff':
        blob = encodeTiff(workingCanvas)
        break
      case 'ico':
        blob = await encodeIco(workingCanvas)
        break
      default:
        blob = await canvasToBlob(workingCanvas, targetFormat.mime)
    }

    if (blob.size === 0) {
      throw new Error('The converted image is empty')
    }

    if (targetFormat.mime !== 'application/octet-stream' && blob.type !== targetFormat.mime) {
      if (!['image/bmp', 'image/tiff', 'image/x-icon'].includes(targetFormat.mime)) {
        throw new ImageConversionError(
          `Your browser can't export ${targetFormat.label} images. Please choose another format.`,
        )
      }
    }

    let previewBlob = blob

    if (targetFormat.id === 'tiff') {
      previewBlob = await canvasToBlob(workingCanvas, 'image/png')
    }

    return {
      blob,
      previewBlob,
      width: workingCanvas.width,
      height: workingCanvas.height,
    }
  } catch (error) {
    if (error instanceof ImageConversionError) {
      throw error
    }

    throw new ImageConversionError(
      `Conversion to ${targetFormat.label} failed. The image may be too large or your browser may not support this encoder.`,
    )
  }
}

export function canvasToPngBlob(canvas) {
  return canvasToBlob(canvas, 'image/png')
}

export function imageDataToDataUrl(imageData) {
  const canvas = imageDataToCanvas(imageData)
  return canvas.toDataURL('image/png')
}
