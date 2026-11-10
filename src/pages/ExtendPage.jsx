import { useEffect, useRef, useState } from 'react'
import Dropzone from '../components/converter/Dropzone'
import SelectedFilePanel from '../components/converter/SelectedFilePanel'
import PageHeader from '../components/PageHeader'
import {
  AlertIcon,
  CloudIcon,
  DownloadIcon,
  ExpandIcon,
  InfoIcon,
  PaletteIcon,
  StopIcon,
  WandIcon,
} from '../components/ui/Icons'
import {
  EXTENSION_PRESETS,
  EXTENSION_STYLES,
  composeExtension,
  extendImage,
  getExtensionDimensions,
} from '../lib/ai/extension'
import {
  ImageConversionError,
  INPUT_ACCEPT,
  buildConvertedFilename,
  canvasToPngBlob,
  formatBytes,
  inspectImageFile,
} from '../lib/image'

const modes = [
  {
    id: 'ai',
    title: 'AI outpainting',
    description: 'Generate a matching extension with a prompt and style.',
  },
  {
    id: 'color',
    title: 'Solid color',
    description: 'Fill the new area with a flat background color.',
  },
  {
    id: 'image',
    title: 'Custom image',
    description: 'Place your photo over another image background.',
  },
]

const colorPresets = ['#ffffff', '#0f172a', '#e8edf7', '#dbeafe', '#fce7f3', '#dcfce7']

function resultFilename(name, width, height) {
  const base = name.replace(/\.[^.]+$/, '')
  return buildConvertedFilename(`${base}-extended-${width}x${height}.png`, 'png')
}

export default function ExtendPage() {
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [ratioId, setRatioId] = useState('1:1')
  const [customWidth, setCustomWidth] = useState('4')
  const [customHeight, setCustomHeight] = useState('3')
  const [mode, setMode] = useState('ai')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('nature')
  const [solidColor, setSolidColor] = useState('#e8edf7')
  const [background, setBackground] = useState(null)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)
  const [isReadingBackground, setIsReadingBackground] = useState(false)

  const fileInputRef = useRef(null)
  const backgroundInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const backgroundUrlRef = useRef(null)
  const resultUrlRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (backgroundUrlRef.current) URL.revokeObjectURL(backgroundUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const preset = EXTENSION_PRESETS.find((item) => item.id === ratioId)
  const parsedWidth = Number(customWidth)
  const parsedHeight = Number(customHeight)
  const activeRatio =
    ratioId === 'custom'
      ? parsedWidth > 0 && parsedHeight > 0
        ? parsedWidth / parsedHeight
        : null
      : preset?.ratio || null
  const dimensions =
    selected && activeRatio
      ? getExtensionDimensions(selected.width, selected.height, activeRatio)
      : null

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }
    setResult(null)
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
      setMode('image')
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

  function handleBackgroundInput(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) handleBackgroundFile(file)
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) handleFile(file)
  }

  function resetAll() {
    abortRef.current?.abort()
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
    setProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function cancelRun() {
    abortRef.current?.abort()
    abortRef.current = null
    setProgress(null)
    setStatus('ready')
  }

  async function handleExtend() {
    if (!selected || !dimensions || status === 'processing') return

    if (mode === 'image' && !background) {
      setError('Upload a background image or choose another fill mode.')
      return
    }

    setError('')
    setStatus('processing')
    setProgress({
      stage: mode === 'ai' ? 'preparing' : 'composing',
      message:
        mode === 'ai'
          ? 'Preparing the AI outpainting request...'
          : 'Composing the extended canvas...',
    })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let outputCanvas

      if (mode === 'ai') {
        const generated = await extendImage(selected.canvas, {
          targetWidth: dimensions.width,
          targetHeight: dimensions.height,
          prompt,
          style,
          signal: controller.signal,
          onProgress: setProgress,
        })

        const bitmap = await createImageBitmap(generated.blob)
        outputCanvas = document.createElement('canvas')
        outputCanvas.width = dimensions.width
        outputCanvas.height = dimensions.height
        const context = outputCanvas.getContext('2d')

        if (!context) {
          throw new ImageConversionError('Could not compose the AI result.')
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, dimensions.width, dimensions.height)
        context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height)
        bitmap.close?.()
        context.drawImage(
          selected.canvas,
          generated.sourceRect.x,
          generated.sourceRect.y,
          generated.sourceRect.width,
          generated.sourceRect.height,
        )
      } else {
        const composed = composeExtension(
          selected.canvas,
          dimensions.width,
          dimensions.height,
          mode === 'color'
            ? { type: 'color', color: solidColor }
            : { type: 'image', image: background.canvas },
        )
        outputCanvas = composed.canvas
      }

      setProgress({
        stage: 'encoding',
        message: 'Preparing your download...',
      })

      const blob = await canvasToPngBlob(outputCanvas)

      if (controller.signal.aborted) {
        throw new DOMException('Extension cancelled', 'AbortError')
      }

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url

      setResult({
        url,
        blob,
        width: dimensions.width,
        height: dimensions.height,
        filename: resultFilename(
          selected.file.name,
          dimensions.width,
          dimensions.height,
        ),
        mode,
        style: mode === 'ai' ? style : null,
      })
      setProgress(null)
      setStatus('done')
    } catch (caughtError) {
      if (caughtError.name === 'AbortError') {
        setProgress(null)
        setStatus('ready')
        return
      }

      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'Background extension failed. Please try again.',
      )
      setProgress(null)
      setStatus('ready')
    } finally {
      abortRef.current = null
    }
  }

  const isProcessing = status === 'processing'

  return (
    <>
      <PageHeader
        icon={ExpandIcon}
        eyebrow="Generative fill"
        title="AI Background Extension"
        description="Expand any photo beyond its original frame. Use prompt-guided AI outpainting, a clean solid fill, or your own background image."
        badge="Free AI cloud"
        external
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
              id="extend-dropzone"
              title="Drop a photo to extend"
              subtitle="Add extra space around your image with AI or a custom background."
              formats={['JPG', 'PNG', 'WebP', 'AVIF', 'HEIC', 'TIFF']}
              privacyText="AI outpainting sends your image to the free Stable Horde network only when you run it."
              external
              onBrowse={() => fileInputRef.current?.click()}
              onFileSelected={handleFile}
              onError={setError}
            />
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              <CloudIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                AI outpainting is powered by Stable Horde, a free public
                network. No account or API key is needed. Free jobs can wait in
                a public queue. Solid color and custom image fills stay on your
                device.
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

              {dimensions && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                  <p className="text-[11px] font-bold tracking-wide text-indigo-500 uppercase">
                    Output canvas
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-indigo-900">
                    {dimensions.width} × {dimensions.height} px
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-indigo-700/80">
                    The AI renders up to 1024 px on the long edge. Your original
                    pixels are composited back into the result.
                  </p>
                </div>
              )}

              {status === 'done' && result && (
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Extended result
                    </h2>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                      {result.width} × {result.height}
                    </span>
                  </div>
                  <div className="mt-3 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-2">
                    <img
                      src={result.url}
                      alt="Extended result"
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                  </div>
                  <a
                    href={result.url}
                    download={result.filename}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <DownloadIcon className="size-4" />
                    Download Extended PNG
                  </a>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    {formatBytes(result.blob.size)} · PNG with a filled
                    background
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_-40px_rgba(79,70,229,0.35)] sm:p-6">
              <fieldset disabled={isProcessing}>
                <legend className="text-lg font-bold tracking-tight text-slate-900">
                  Extension settings
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the new canvas shape and how the extra space is filled.
                </p>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                      Aspect ratio
                    </span>
                    {dimensions && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {dimensions.width} × {dimensions.height}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXTENSION_PRESETS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRatioId(item.id)}
                        aria-pressed={ratioId === item.id}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                          ratioId === item.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        <span className="block">{item.label}</span>
                        <span className="text-[10px] font-semibold opacity-70">
                          {item.id}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRatioId('custom')}
                      aria-pressed={ratioId === 'custom'}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                        ratioId === 'custom'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <span className="block">Custom</span>
                      <span className="text-[10px] font-semibold opacity-70">
                        Your ratio
                      </span>
                    </button>
                  </div>

                  {ratioId === 'custom' && (
                    <div className="mt-3 flex items-center gap-2">
                      <label className="sr-only" htmlFor="custom-ratio-width">
                        Custom ratio width
                      </label>
                      <input
                        id="custom-ratio-width"
                        type="number"
                        min="1"
                        max="100"
                        value={customWidth}
                        onChange={(event) => setCustomWidth(event.target.value)}
                        className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                      <span className="text-lg font-bold text-slate-400">:</span>
                      <label className="sr-only" htmlFor="custom-ratio-height">
                        Custom ratio height
                      </label>
                      <input
                        id="custom-ratio-height"
                        type="number"
                        min="1"
                        max="100"
                        value={customHeight}
                        onChange={(event) => setCustomHeight(event.target.value)}
                        className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      />
                      {!activeRatio && (
                        <span className="text-xs font-semibold text-red-600">
                          Enter a valid ratio.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Fill method
                  </span>
                  <div className="mt-2 grid gap-2">
                    {modes.map((item) => (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          mode === item.id
                            ? 'border-indigo-500 bg-indigo-50/70'
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="extension-mode"
                          value={item.id}
                          checked={mode === item.id}
                          onChange={() => setMode(item.id)}
                          className="mt-1 accent-indigo-600"
                        />
                        <span>
                          <span className="block text-sm font-bold text-slate-900">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                            {item.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {mode === 'color' && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={solidColor}
                        onChange={(event) => setSolidColor(event.target.value)}
                        aria-label="Extension background color"
                        className="size-10 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Background color
                        </p>
                        <p className="text-xs text-slate-500">{solidColor}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSolidColor(color)}
                          aria-label={`Use color ${color}`}
                          className={`size-7 rounded-full border-2 transition ${
                            solidColor === color
                              ? 'border-indigo-600 ring-2 ring-indigo-200'
                              : 'border-white shadow-sm'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'image' && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
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
                            : 'Choose an image to place behind your photo.'}
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

                {mode === 'ai' && (
                  <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                    <label
                      htmlFor="extension-prompt"
                      className="text-xs font-bold tracking-wide text-slate-500 uppercase"
                    >
                      Describe the background
                    </label>
                    <textarea
                      id="extension-prompt"
                      rows="3"
                      maxLength="400"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="e.g. a quiet forest clearing with soft morning light"
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Optional — a style alone works too.</span>
                      <span>{prompt.length}/400</span>
                    </div>

                    <span className="mt-3 block text-xs font-bold tracking-wide text-slate-500 uppercase">
                      Style
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {EXTENSION_STYLES.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStyle(item.id)}
                          aria-pressed={style === item.id}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                            style === item.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-indigo-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-800">
                      <CloudIcon className="mt-0.5 size-3.5 shrink-0" />
                      Your photo is sent to Stable Horde only when you start
                      outpainting.
                    </p>
                  </div>
                )}
              </fieldset>

              <div className="mt-5">
                  {isProcessing ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-indigo-900">
                            {progress?.message || 'Working...'}
                          </p>
                          <p className="mt-1 text-xs text-indigo-700">
                            {progress?.queuePosition > 0
                              ? `Queue position ${progress.queuePosition}${
                                  progress.waitTime > 0
                                    ? ` · about ${Math.max(1, Math.ceil(progress.waitTime / 60))} min`
                                    : ''
                                }`
                              : 'Free public AI jobs can take several minutes.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={cancelRun}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <StopIcon className="size-3.5" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExtend}
                      disabled={
                        !activeRatio ||
                        (mode === 'image' && !background) ||
                        isReadingBackground
                      }
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-base"
                    >
                      {mode === 'ai' ? (
                        <WandIcon className="size-5" />
                      ) : (
                        <ExpandIcon className="size-5" />
                      )}
                      {status === 'done'
                        ? 'Extend Again'
                        : mode === 'ai'
                          ? 'Extend with AI'
                          : 'Extend Image'}
                    </button>
                  )}
                </div>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                  <InfoIcon className="size-3.5 shrink-0" />
                  Output is a PNG at {dimensions?.width || '—'} ×{' '}
                  {dimensions?.height || '—'} px.
                </p>
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
        aria-label="Upload an image to extend"
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
