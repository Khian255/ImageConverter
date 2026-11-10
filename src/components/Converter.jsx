import { useEffect, useRef, useState } from 'react'
import Dropzone from './converter/Dropzone'
import FormatPicker from './converter/FormatPicker'
import ResultPanel from './converter/ResultPanel'
import SelectedFilePanel from './converter/SelectedFilePanel'
import { AlertIcon, ImageIcon, ShieldIcon } from './ui/Icons'
import {
  buildConvertedFilename,
  convertImage,
  ImageConversionError,
  INPUT_ACCEPT,
  inspectImageFile,
  OUTPUT_FORMATS,
} from '../lib/image'

const MIN_CONVERSION_TIME = 600

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export default function Converter() {
  const [selected, setSelected] = useState(null)
  const [targetId, setTargetId] = useState('jpg')
  const [status, setStatus] = useState('idle')
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const fileInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const resultUrlRef = useRef(null)
  const resultPreviewUrlRef = useRef(null)
  const resultContainerRef = useRef(null)
  const focusDropzoneAfterReset = useRef(false)

  useEffect(() => {
    function preventWindowDrop(event) {
      event.preventDefault()
    }

    window.addEventListener('dragover', preventWindowDrop)
    window.addEventListener('drop', preventWindowDrop)

    return () => {
      window.removeEventListener('dragover', preventWindowDrop)
      window.removeEventListener('drop', preventWindowDrop)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      if (resultPreviewUrlRef.current) {
        URL.revokeObjectURL(resultPreviewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (status === 'done') {
      resultContainerRef.current?.focus({ preventScroll: true })
    }
  }, [status])

  useEffect(() => {
    if (status === 'idle' && focusDropzoneAfterReset.current) {
      focusDropzoneAfterReset.current = false
      document.getElementById('converter-dropzone')?.focus()
    }
  }, [status])

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }

    if (resultPreviewUrlRef.current) {
      URL.revokeObjectURL(resultPreviewUrlRef.current)
      resultPreviewUrlRef.current = null
    }

    setResult(null)
  }

  async function handleFile(file) {
    setError('')
    setIsReading(true)

    try {
      const info = await inspectImageFile(file)

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }

      previewUrlRef.current = info.url
      setSelected({ ...info, file })
      clearResult()
      setStatus('ready')
      setTargetId(info.format.id === 'jpg' ? 'png' : 'jpg')
    } catch (caughtError) {
      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'Something went wrong while reading this image. Please try again.',
      )
    } finally {
      setIsReading(false)
    }
  }

  async function handleInputChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file) {
      await handleFile(file)
    }
  }

  function handleDropFile(file) {
    handleFile(file)
  }

  function resetAll() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    clearResult()
    setSelected(null)
    setError('')
    setStatus('idle')
    setTargetId('jpg')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    focusDropzoneAfterReset.current = true
  }

  function handleBackToOptions() {
    clearResult()
    setError('')
    setStatus('ready')
  }

  async function handleConvert() {
    if (!selected || status === 'converting') return

    const targetFormat = OUTPUT_FORMATS.find(
      (format) => format.id === targetId,
    )

    if (!targetFormat) return

    setError('')
    setStatus('converting')
    const startedAt = performance.now()

    try {
      const converted = await convertImage(selected.file, targetFormat, {
        sourceCanvas: selected.canvas,
        sourceFormat: selected.format,
      })
      const elapsed = performance.now() - startedAt

      if (elapsed < MIN_CONVERSION_TIME) {
        await wait(MIN_CONVERSION_TIME - elapsed)
      }

      clearResult()

      const url = URL.createObjectURL(converted.blob)
      resultUrlRef.current = url
      const previewUrl =
        converted.previewBlob === converted.blob
          ? url
          : URL.createObjectURL(converted.previewBlob)

      if (previewUrl !== url) {
        resultPreviewUrlRef.current = previewUrl
      }

      setResult({
        url,
        previewUrl,
        filename: buildConvertedFilename(
          selected.file.name,
          targetFormat.extension,
        ),
        size: converted.blob.size,
        width: converted.width,
        height: converted.height,
        format: targetFormat,
      })
      setStatus('done')
    } catch (caughtError) {
      setError(
        caughtError instanceof ImageConversionError
          ? caughtError.message
          : 'Conversion failed. Please try again with a different image.',
      )
      setStatus('ready')
    }
  }

  const isConverting = status === 'converting'
  const isBusy = isConverting || isReading

  return (
    <section id="converter" className="scroll-mt-24">
      <div
        aria-busy={isBusy}
        className="relative rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.28)] ring-1 ring-slate-900/[0.03] sm:p-6 lg:p-8"
      >
        <div inert={isBusy}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ImageIcon className="size-4" />
                </span>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Image converter
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Upload an image, pick a format, and download.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/60">
              <ShieldIcon className="size-3.5" />
              Private &amp; local
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={INPUT_ACCEPT}
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload an image"
          />

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
            >
              <AlertIcon className="mt-0.5 size-5 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {status === 'idle' && (
            <Dropzone
              id="converter-dropzone"
              onBrowse={openFilePicker}
              onFileSelected={handleDropFile}
              onError={setError}
            />
          )}

          {(status === 'ready' || status === 'converting') && selected && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
              <SelectedFilePanel
                selected={selected}
                onBrowse={openFilePicker}
                onRemove={resetAll}
                disabled={isConverting}
              />
              <div className="border-t border-slate-100 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                <FormatPicker
                  targetId={targetId}
                  onTargetChange={(nextTargetId) => {
                    setTargetId(nextTargetId)
                    setError('')
                  }}
                  onConvert={handleConvert}
                  disabled={isConverting}
                />
              </div>
            </div>
          )}

          {status === 'done' && selected && result && (
            <div ref={resultContainerRef} tabIndex={-1} className="outline-none">
              <ResultPanel
                selected={selected}
                result={result}
                onStartOver={resetAll}
                onBackToOptions={handleBackToOptions}
              />
            </div>
          )}
        </div>

        {isBusy && (
          <div
            role="status"
            className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-white/85 p-6 backdrop-blur-sm"
          >
            <div className="text-center">
              <span
                aria-hidden="true"
                className="mx-auto block size-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
              />
              <p className="mt-4 text-base font-bold text-slate-900">
                {isReading ? 'Reading your image...' : 'Converting your image...'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isReading
                  ? 'Decoding wide-gamut and high-efficiency formats.'
                  : 'Hang tight, this only takes a moment.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
