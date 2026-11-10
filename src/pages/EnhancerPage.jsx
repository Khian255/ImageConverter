import { useEffect, useRef, useState } from 'react'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import Dropzone from '../components/converter/Dropzone'
import SelectedFilePanel from '../components/converter/SelectedFilePanel'
import PageHeader from '../components/PageHeader'
import {
  AlertIcon,
  DownloadIcon,
  InfoIcon,
  ShieldIcon,
  StopIcon,
  WandIcon,
} from '../components/ui/Icons'
import {
  enhanceImage,
  getEnhancementEstimate,
  preloadEnhancementModel,
  subscribeEnhancementModel,
} from '../lib/ai/enhance'
import {
  ImageConversionError,
  INPUT_ACCEPT,
  buildConvertedFilename,
  formatBytes,
  inspectImageFile,
} from '../lib/image'

const scales = [
  { id: 2, label: '2x', description: 'Balanced detail and speed' },
  { id: 4, label: '4x', description: 'Maximum resolution' },
]

function enhancedFilename(name, scale) {
  const base = name.replace(/\.[^.]+$/, '')
  return buildConvertedFilename(`${base}-${scale}x.png`, 'png')
}

export default function EnhancerPage() {
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [scale, setScale] = useState(2)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [modelState, setModelState] = useState({
    status: 'idle',
    percent: 0,
  })

  const fileInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const resultUrlRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => subscribeEnhancementModel(setModelState), [])

  useEffect(() => {
    preloadEnhancementModel().catch(() => {})
  }, [])

  const estimatedPixels = selected ? selected.width * selected.height : 0
  const estimatedOutput = selected
    ? Math.max(selected.width, selected.height) * scale
    : 0
  const exceedsInputLimit = estimatedPixels > 4_000_000
  const exceedsOutputLimit = estimatedOutput > 4096
  const estimate = selected
    ? getEnhancementEstimate(selected.width, selected.height)
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
    clearResult()
    setSelected(null)
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

  async function handleEnhance() {
    if (
      !selected ||
      status === 'processing' ||
      exceedsInputLimit ||
      exceedsOutputLimit
    ) {
      return
    }

    setError('')
    setStatus('processing')
    setProgress({
      stage: 'model',
      message: 'Loading the Real-ESRGAN model...',
      percent: 0,
    })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const enhanced = await enhanceImage(selected.canvas, {
        scale,
        signal: controller.signal,
        onProgress: setProgress,
      })

      if (controller.signal.aborted) {
        throw new DOMException('Enhancement cancelled', 'AbortError')
      }

      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(enhanced.blob)
      resultUrlRef.current = url

      setResult({
        url,
        blob: enhanced.blob,
        width: enhanced.width,
        height: enhanced.height,
        filename: enhancedFilename(selected.file.name, scale),
        scale,
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
          : 'Image enhancement failed. Please try again with a smaller image.',
      )
      setProgress(null)
      setStatus('ready')
    } finally {
      abortRef.current = null
    }
  }

  const isProcessing = status === 'processing'
  const blocked = exceedsInputLimit || exceedsOutputLimit
  const downloadingModel =
    progress?.stage === 'model' && modelState.status === 'downloading'
  const progressPercent = downloadingModel
    ? modelState.percent
    : progress?.percent || 0

  return (
    <>
      <PageHeader
        icon={WandIcon}
        eyebrow="Super-resolution"
        title="AI HD Enhancer"
        description="Recover detail and create a larger, sharper image with Real-ESRGAN. The model runs in your browser, so your photo never leaves your device."
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
              id="enhancer-dropzone"
              title="Drop a photo to enhance"
              subtitle="Recover detail with local AI super-resolution."
              formats={['JPG', 'PNG', 'WebP', 'AVIF', 'HEIC', 'TIFF']}
              onBrowse={() => fileInputRef.current?.click()}
              onFileSelected={handleFile}
              onError={setError}
            />
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-800">
              <ShieldIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                {modelState.status === 'downloading'
                  ? `Downloading the 5 MB AI model in the background... ${modelState.percent}%`
                  : modelState.status === 'initializing'
                    ? 'Starting the local AI engine...'
                    : modelState.status === 'ready'
                      ? 'The local AI model is ready and cached for faster reuse. For reliable results, use images up to 4 megapixels.'
                      : 'Enhancement is local. The 5 MB Real-ESRGAN model downloads in the background and is cached after the first run.'}
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <SelectedFilePanel
                  selected={selected}
                  onBrowse={() => fileInputRef.current?.click()}
                  onRemove={resetAll}
                  disabled={isProcessing}
                />
              </div>

              {blocked && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                  <AlertIcon className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {exceedsInputLimit
                      ? 'This image is over 4 megapixels. Please use a smaller image for local enhancement.'
                      : 'This output would exceed 4096 px. Try 2x instead.'}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_-40px_rgba(79,70,229,0.35)] sm:p-6">
              <fieldset disabled={isProcessing}>
                <legend className="text-lg font-bold tracking-tight text-slate-900">
                  Enhancement settings
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  Choose how much larger the result should be.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {scales.map((item) => (
                    <label
                      key={item.id}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        scale === item.id
                          ? 'border-indigo-500 bg-indigo-50/80'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="enhance-scale"
                        value={item.id}
                        checked={scale === item.id}
                        onChange={() => setScale(item.id)}
                        className="sr-only"
                      />
                      <span className="block text-base font-extrabold text-slate-900">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                        {item.description}
                      </span>
                    </label>
                  ))}
                </div>

                {selected && (
                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-xs">
                    <div className="bg-white px-3 py-2.5">
                      <dt className="font-semibold text-slate-400 uppercase">
                        Output
                      </dt>
                      <dd className="mt-0.5 font-bold text-slate-900">
                        {selected.width * scale} × {selected.height * scale} px
                      </dd>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <dt className="font-semibold text-slate-400 uppercase">
                        Estimate
                      </dt>
                      <dd className="mt-0.5 font-bold text-slate-900">
                        {blocked ? 'Too large' : `~${estimate.seconds}s`}
                      </dd>
                    </div>
                  </dl>
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
                      <span className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-indigo-900">
                          {progress?.message || 'Enhancing your image...'}
                        </p>
                        <p className="mt-1 text-xs text-indigo-700">
                          {downloadingModel
                            ? `Downloading the local AI model... ${modelState.percent}%`
                            : progress?.percent
                              ? `${progress.percent}% · about ${progress.remaining}s remaining`
                              : modelState.status === 'initializing'
                                ? 'Starting the local AI engine...'
                                : modelState.status === 'ready'
                                  ? 'Enhancing your image...'
                                  : 'Preparing the local AI engine...'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${Math.max(progressPercent, 4)}%` }}
                      />
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
                    onClick={handleEnhance}
                    disabled={blocked}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0 sm:text-base"
                  >
                    <WandIcon className="size-5" />
                    {status === 'done' ? 'Enhance Again' : 'Enhance Image'}
                  </button>
                )}
              </div>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                <InfoIcon className="size-3.5 shrink-0" />
                Runs locally with ONNX Runtime and Real-ESRGAN.
              </p>

              {result && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900">
                      Enhanced result
                    </h2>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                      {result.scale}x
                    </span>
                  </div>
                  <div className="mt-3">
                    <BeforeAfterSlider
                      beforeSrc={selected.url}
                      afterSrc={result.url}
                      beforeAlt="Original image"
                      afterAlt="Enhanced image"
                      beforeLabel="Original"
                      afterLabel="Enhanced"
                    />
                  </div>
                  <a
                    href={result.url}
                    download={result.filename}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <DownloadIcon className="size-4" />
                    Download {result.width} × {result.height} PNG
                  </a>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    {formatBytes(result.blob.size)} · enhanced PNG
                  </p>
                </div>
              )}
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
        aria-label="Upload an image to enhance"
      />
    </>
  )
}
