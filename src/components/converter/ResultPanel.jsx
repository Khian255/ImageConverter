import {
  CheckIcon,
  DownloadIcon,
  RefreshIcon,
  SparklesIcon,
} from '../ui/Icons'
import { formatBytes } from '../../lib/image'

function getSizeChange(originalSize, convertedSize) {
  const difference = convertedSize - originalSize

  if (difference === 0) {
    return { label: 'Same size', isSmaller: false }
  }

  const percent = Math.round((Math.abs(difference) / originalSize) * 100)

  if (percent === 0) {
    return { label: 'About the same size', isSmaller: difference < 0 }
  }

  return {
    label: `${percent}% ${difference < 0 ? 'smaller' : 'larger'}`,
    isSmaller: difference < 0,
  }
}

function PreviewCard({
  label,
  formatLabel,
  src,
  name,
  size,
  width,
  height,
  isConverted = false,
}) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border bg-white ${
        isConverted
          ? 'border-indigo-200 shadow-lg shadow-indigo-600/5'
          : 'border-slate-200'
      }`}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            isConverted
              ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {formatLabel}
        </span>
      </figcaption>
      <div className="flex h-52 items-center justify-center overflow-hidden bg-checkerboard p-2">
        <img
          src={src}
          alt={`${label} preview of ${name}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="border-t border-slate-100 px-4 py-3">
        <p
          className="truncate text-sm font-semibold text-slate-900"
          title={name}
        >
          {name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatBytes(size)} · {width} × {height} px
        </p>
      </div>
    </figure>
  )
}

export default function ResultPanel({
  selected,
  result,
  onStartOver,
  onBackToOptions,
}) {
  const sizeChange = getSizeChange(selected.file.size, result.size)

  return (
    <div className="animate-pop">
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-600/20">
          <CheckIcon className="size-5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-bold text-emerald-900">Conversion complete</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Your {result.format.label} image is ready to download.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <PreviewCard
          label="Original"
          formatLabel={selected.format.label}
          src={selected.url}
          name={selected.file.name}
          size={selected.file.size}
          width={selected.width}
          height={selected.height}
        />
        <PreviewCard
          label="Converted"
          formatLabel={result.format.label}
          src={result.previewUrl || result.url}
          name={result.filename}
          size={result.size}
          width={result.width}
          height={result.height}
          isConverted
        />
      </div>

      <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <dt className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            New format
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
            {result.format.label}
            <SparklesIcon className="size-3.5 text-indigo-500" />
          </dd>
        </div>
        <div className="bg-white px-4 py-3">
          <dt className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Dimensions
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-900">
            {result.width} × {result.height} px
          </dd>
        </div>
        <div className="bg-white px-4 py-3">
          <dt className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            File size
          </dt>
          <dd
            className={`mt-1 text-sm font-bold ${
              sizeChange.isSmaller ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {sizeChange.label}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={result.url}
          download={result.filename}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 sm:text-base"
        >
          <DownloadIcon className="size-5" />
          Download Image
        </a>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 sm:text-base"
        >
          <RefreshIcon className="size-5" />
          Convert Another Image
        </button>
      </div>

      <button
        type="button"
        onClick={onBackToOptions}
        className="mx-auto mt-3 flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Convert this image to another format
      </button>
    </div>
  )
}
