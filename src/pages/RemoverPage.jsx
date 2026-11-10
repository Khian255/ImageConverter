import { useEffect, useRef, useState } from 'react'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import Dropzone from '../components/converter/Dropzone'
import SelectedFilePanel from '../components/converter/SelectedFilePanel'
import PageHeader from '../components/PageHeader'
import {
  AlertIcon,
  DownloadIcon,
  EraserIcon,
  InfoIcon,
  PaletteIcon,
  ShieldIcon,
  WandIcon,
} from '../components/ui/Icons'
import { removeBackground } from '../lib/ai/background'
import {
  ImageConversionError,
  INPUT_ACCEPT,
  buildConvertedFilename,
  canvasToPngBlob,
  formatBytes,
  inspectImageFile,
} from '../lib/image'

const backgroundModes = [
  { id: 'transparent', label: 'Transparent' },
  { id: 'solid', label: 'Solid color' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'image', label: 'Custom image' },
]

function drawCover(context, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  )
}

async function composeBackground(subjectCanvas, settings) {
  const canvas = document.createElement('canvas')
  canvas.width = subjectCanvas.width
  canvas.height = subjectCanvas.height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new ImageConversionError('Could not build the background preview.')
  }

  if (settings.mode === 'solid') {
    context.fillStyle = settings.color
    context.fillRect(0, 0, canvas.width, canvas.height)
  } else if (settings.mode === 'gradient') {
    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    )
    gradient.addColorStop(0, settings.gradientFrom)
    gradient.addColorStop(1, settings.gradientTo)
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  } else if (settings.mode === 'image' && settings.image) {
    drawCover(context, settings.image.canvas, canvas.width, canvas.height)
  }

  context.drawImage(subjectCanvas, 0, 0)
  return canvas
}

function resultFilename(name, mode) {
  const base = name.replace(/\.[^.]+$/, '')
  const suffix = mode === 'transparent' ? 'no-bg' : 'background'
  return buildConvertedFilename(`${base}-${suffix}.png`, 'png')
}

export default function RemoverPage() {
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null)
  const [subject, setSubject] = useState(null)
  const [composed, setComposed] = useState(null)
  const [backgroundMode, setBackgroundMode] = useState('transparent')
  const [solidColor, setSolidColor] = useState('#eef2ff')
  const [gradientFrom, setGradientFrom] = useState('#c7d2fe')
  const [gradientTo, setGradientTo] = useState('#fbcfe8')
  const [background, setBackground] = useState(null)
  const [isReadingBackground, setIsReadingBackground] = useState(false)

  const fileInputRef = useRef(null)
  const backgroundInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const backgroundUrlRef = useRef(null)
  const subjectUrlRef = useRef(null)
  const composedUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current)
      if (subjectUrlRef.current) URL.revokeObjectURL(subjectUrlRef.current)
      if (composedUrlRef.current) URL.revokeObjectURL(composedUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!subject) return undefined

    const controller = new AbortController()

    composeBackground(subject.canvas, {
      mode: backgroundMode,
      color: solidColor,
      gradientFrom,
      gradientTo,
      image: background,
    })
      .then((canvas) => canvasToPngBlob(canvas))
      .then((blob) => {
        if (controller.signal.aborted) return

        if (composedUrlRef.current) {
          URL.revokeObjectURL(composedUrlRef.current)
        }

        const url = URL.createObjectURL(blob)
        composedUrlRef.current = url
        setComposed({
          blob,
          url,
          width: subject.canvas.width,
          height: subject.canvas.height,
        })
      })
      .catch((caughtError) => {
        if (controller.signal.aborted) return
        setError(
          caughtError instanceof ImageConversionError
            ? caughtError.message
            : 'Could not build the background preview.',
        )
      })

    return () => {
      controller.abort()
    }
  }, [
    subject,
    backgroundMode,
    solidColor,
    gradientFrom,
    gradientTo,
    background,
  ])

  function clearResult() {
    if (subjectUrlRef.current) {
      URL.revokeObjectURL(subjectUrlRef.current)
      subjectUrlRef.current = null
    }
    if (composedUrlRef.current) {
      URL.revokeObjectURL(composedUrlRef.current)
      composedUrlRef.current = null
    }
    setSubject(null)
    setComposed(null)
    setProgress(null)
  }

  async function handleFile(file) {
    setError('')
    setStatus('reading')

    try {
      const info = await inspectImageFile(file)

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = info.url
      clearResult()
      setSelected({ ...info, file })
      setStatus('ready')
    } catch (caughtError) {
      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'Something went wrong while reading this image.',
      )
      setStatus('idle')
    }
  }

  async function handleBackgroundFile(file) {
    setError('')
    setIsReadingBackground(true)

    try {
      const info = await inspectImageFile(file)

      if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current)
      backgroundUrlRef.current = info.url
      setBackground({ ...info, file })
      setBackgroundMode('image')
    } catch (caughtError) {
      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'The background image could not be read.',
      )
    } finally {
      setIsReadingBackground(false)
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) handleFile(file)
  }

  function handleBackgroundInput(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) handleBackgroundFile(file)
  }

  function resetAll() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    if (backgroundUrlRef.current) {
      URL.revokeObjectURL(backgroundUrlRef.current)
      backgroundUrlRef.current = null
    }
    clearResult()
    setSelected(null)
    setBackground(null)
    setError('')
    setStatus('idle')
    setBackgroundMode('transparent')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRemove() {
    if (!selected || status === 'processing') return

    setError('')
    setStatus('processing')
    setProgress({
      stage: 'preparing',
      message: 'Preparing the on-device background removal model...',
      percent: 0,
    })

    try {
      const cutout = await removeBackground(selected.canvas, {
        onProgress: setProgress,
      })

      if (subjectUrlRef.current) URL.revokeObjectURL(subjectUrlRef.current)
      const transparentUrl = URL.createObjectURL(cutout.blob)
      subjectUrlRef.current = transparentUrl

      setSubject({
        canvas: cutout.canvas,
        transparentBlob: cutout.blob,
        transparentUrl,
        width: cutout.width,
        height: cutout.height,
      })
      setProgress(null)
      setStatus('done')
    } catch (caughtError) {
      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'Background removal failed. Please try again with a different image.',
      )
      setProgress(null)
      setStatus('ready')
    }
  }

  const isProcessing = status === 'processing'
  const afterUrl = composed?.url || subject?.transparentUrl

  return (
    <>
      <PageHeader
        icon={EraserIcon}
        eyebrow="AI segmentation"
        title="Background Remover"
        description="Cut out people, products, and objects with an on-device AI model. Refine the result with a transparent, solid, gradient, or custom image background."
        badge="Private & on-device"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertIcon className="mt-0.5 size-5 shrink-0 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {status === 'idle' && (
          <div className="mx-auto max-w-4xl">
            <Dropzone
              id="remover-dropzone"
              title="Drop a photo to remove its background"
              subtitle="The AI model runs in your browser. Nothing is uploaded."
              formats={['JPG', 'PNG', 'WebP', 'AVIF', 'HEIC', 'TIFF']}
              onBrowse={() => fileInputRef.current?.click()}
              onFileSelected={handleFile}
              onError={setError}
            />
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-800">
              <ShieldIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                Background removal is fully local. The first run downloads the
                4.6 MB U2-Netp model and the browser caches it for next time.
              </p>
            </div>
          </div>
        )}

        {status === 'reading' && (
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-sm font-semibold text-slate-600">
            <span className="size-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
            Reading your image...
          </div>
        )}

        {status !== 'idle' && status !== 'reading' && selected && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <SelectedFilePanel
                  selected={selected}
                  onBrowse={() => fileInputRef.current?.click()}
                  onRemove={resetAll}
                  disabled={isProcessing}
                />
              </div>

              {subject && (
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Before &amp; after
                    </h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      AI cutout
                    </span>
                  </div>
                  <div className="mt-3">
                    <BeforeAfterSlider
                      beforeSrc={selected.url}
                      afterSrc={afterUrl}
                      beforeAlt="Original image"
                      afterAlt="Background removed"
                      beforeLabel="Original"
                      afterLabel="Cutout"
                      transparentAfter={backgroundMode === 'transparent'}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_-40px_rgba(79,70,229,0.35)] sm:p-6">
              <fieldset disabled={isProcessing}>
                <legend className="text-lg font-bold tracking-tight text-slate-900">
                  Background settings
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  The cutout keeps its transparency. Choose what appears behind
                  it for the preview and download.
                </p>

                {!subject && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      Ready to remove the background.
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Your image stays on this device. The model is downloaded
                      once and cached by the browser.
                    </p>
                  </div>
                )}

                {subject && (
                  <>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {backgroundModes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBackgroundMode(item.id)}
                          aria-pressed={backgroundMode === item.id}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                            backgroundMode === item.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-indigo-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {backgroundMode === 'solid' && (
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <input
                          type="color"
                          value={solidColor}
                          onChange={(event) => setSolidColor(event.target.value)}
                          aria-label="Solid background color"
                          className="size-10 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Background color
                          </p>
                          <p className="text-xs text-slate-500">{solidColor}</p>
                        </div>
                      </div>
                    )}

                    {backgroundMode === 'gradient' && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          From
                          <input
                            type="color"
                            value={gradientFrom}
                            onChange={(event) => setGradientFrom(event.target.value)}
                            className="size-9 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          To
                          <input
                            type="color"
                            value={gradientTo}
                            onChange={(event) => setGradientTo(event.target.value)}
                            className="size-9 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                          />
                        </label>
                        <span
                          aria-hidden="true"
                          className="h-9 flex-1 rounded-lg ring-1 ring-slate-200"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                          }}
                        />
                      </div>
                    )}

                    {backgroundMode === 'image' && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
                            <PaletteIcon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900">
                              Background image
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {background
                                ? background.file.name
                                : 'Choose an image to place behind the cutout.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => backgroundInputRef.current?.click()}
                            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            {isReadingBackground ? 'Reading...' : 'Choose'}
                          </button>
                        </div>
                        {background && (
                          <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-2">
                            <img
                              src={background.url}
                              alt="Selected background"
                              className="size-14 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1 text-xs text-slate-500">
                              <p className="truncate font-semibold text-slate-700">
                                {background.width} × {background.height} px
                              </p>
                              <p>{formatBytes(background.file.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (backgroundUrlRef.current) {
                                  URL.revokeObjectURL(backgroundUrlRef.current)
                                  backgroundUrlRef.current = null
                                }
                                setBackground(null)
                              }}
                              className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="mt-5">
                  {isProcessing ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-indigo-900">
                            {progress?.message || 'Removing the background...'}
                          </p>
                          <p className="mt-1 text-xs text-indigo-700">
                            {progress?.percent
                              ? `${progress.percent}% complete`
                              : 'Loading the local AI model...'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${progress?.percent || 4}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0 sm:text-base"
                    >
                      <WandIcon className="size-5" />
                      {subject ? 'Remove Again' : 'Remove Background'}
                    </button>
                  )}
                </div>

                {composed && !isProcessing && (
                  <div className="mt-4">
                    <a
                      href={composed.url}
                      download={resultFilename(selected.file.name, backgroundMode)}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <DownloadIcon className="size-4" />
                      Download PNG
                    </a>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                      <InfoIcon className="size-3.5" />
                      {formatBytes(composed.blob.size)} ·{' '}
                      {backgroundMode === 'transparent'
                        ? 'transparent PNG'
                        : 'PNG with background'}
                    </p>
                  </div>
                )}
              </fieldset>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={INPUT_ACCEPT}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload an image to remove its background"
      />
      <input
        ref={backgroundInputRef}
        type="file"
        accept={INPUT_ACCEPT}
        onChange={handleBackgroundInput}
        className="hidden"
        aria-label="Upload a background image"
      />
    </>
  )
}
