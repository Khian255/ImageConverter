import { useState } from 'react'
import { CloudIcon, LockIcon, UploadIcon } from '../ui/Icons'
import { MAX_FILE_SIZE_LABEL } from '../../lib/image'

const defaultFormats = [
  'JPG',
  'PNG',
  'WebP',
  'AVIF',
  'GIF',
  'BMP',
  'TIFF',
  'ICO',
  'HEIC',
]

export default function Dropzone({
  onBrowse,
  onFileSelected,
  onError,
  title = 'Drag & drop your image here',
  subtitle = 'or choose a file from your device',
  formats = defaultFormats,
  privacyText = `Up to ${MAX_FILE_SIZE_LABEL}. Your images never leave your device.`,
  external = false,
  id = 'upload-dropzone',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const PrivacyIcon = external ? CloudIcon : LockIcon

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer?.files ?? [])

    if (files.length === 0) return

    if (files.length > 1) {
      onError('Please upload one image at a time.')
      return
    }

    onFileSelected(files[0])
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false)
    }
  }

  return (
    <button
      type="button"
      id={id}
      aria-label="Upload an image from your device"
      onClick={onBrowse}
      onDragEnter={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
        setIsDragging(true)
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-describedby={`${id}-requirements`}
      className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-5 py-9 text-center transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-6 sm:py-12 ${
        isDragging
          ? 'scale-[1.01] border-indigo-500 bg-indigo-50'
          : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/40'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-violet-500/10 transition-opacity duration-300 ${
          isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      <span className="relative z-10 flex flex-col items-center">
        <span
          className={`mb-5 grid size-16 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-300 ${
            isDragging
              ? 'scale-110'
              : 'group-hover:-translate-y-0.5 group-hover:scale-105'
          }`}
        >
          <UploadIcon className="size-7" strokeWidth={2} />
        </span>

        <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {isDragging ? 'Drop your image here' : title}
        </span>
        <span className="mt-1.5 text-sm text-slate-500">{subtitle}</span>

        <span className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-indigo-600/30 sm:text-base">
          <UploadIcon className="size-5" />
          Upload Image
        </span>

        <span
          id={`${id}-requirements`}
          className="mt-5 flex max-w-md flex-wrap items-center justify-center gap-1.5"
        >
          {formats.map((format) => (
            <span
              key={format}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm sm:text-[11px]"
            >
              {format}
            </span>
          ))}
        </span>

        <span className="mt-3 flex max-w-sm items-center justify-center gap-1.5 text-xs text-slate-500">
          <PrivacyIcon className="size-3.5 shrink-0" />
          {privacyText}
        </span>
      </span>
    </button>
  )
}
