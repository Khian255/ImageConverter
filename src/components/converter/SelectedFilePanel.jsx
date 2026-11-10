import { CloseIcon, RefreshIcon } from '../ui/Icons'
import { formatBytes } from '../../lib/image'

export default function SelectedFilePanel({
  selected,
  onBrowse,
  onRemove,
  disabled,
}) {
  const { file, url, width, height, format } = selected

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">Image preview</h3>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 ring-1 ring-indigo-100">
          {format.label} original
        </span>
      </div>

      <div className="mt-3 flex min-h-60 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-checkerboard p-3">
        <img
          src={url}
          alt={`Preview of ${file.name}`}
          className="max-h-80 max-w-full rounded-lg object-contain drop-shadow-sm"
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p
          className="truncate text-sm font-semibold text-slate-900"
          title={file.name}
        >
          {file.name}
        </p>
        <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
          <div className="flex gap-1.5">
            <dt>Size</dt>
            <dd className="font-semibold text-slate-700">
              {formatBytes(file.size)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Dimensions</dt>
            <dd className="font-semibold text-slate-700">
              {width} × {height} px
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Format</dt>
            <dd className="font-semibold text-slate-700">{format.label}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onBrowse}
          disabled={disabled}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshIcon className="size-4" />
          Change image
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CloseIcon className="size-4" />
          Remove
        </button>
      </div>
    </div>
  )
}
