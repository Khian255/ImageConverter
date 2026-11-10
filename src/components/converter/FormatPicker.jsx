import { CheckIcon, InfoIcon, LockIcon, SwapIcon } from '../ui/Icons'
import { OUTPUT_FORMATS } from '../../lib/image'

const formatNotes = {
  jpg: "JPG and JPEG are the same format. JPG doesn't support transparency, so transparent areas will be filled with white.",
  png: 'PNG is lossless and preserves transparency. Your image dimensions stay the same.',
  webp: 'WebP supports transparency and usually creates smaller files. Dimensions stay the same.',
  avif: 'AVIF offers excellent compression. The first AVIF export downloads a small browser encoder.',
  gif: 'GIF supports up to 256 colors and one-bit transparency. Only the first frame is converted.',
  bmp: 'BMP is an uncompressed bitmap. Transparency is filled with white and files can be large.',
  tiff: 'TIFF is ideal for print workflows and preserves transparency. Files are usually larger.',
  ico: 'ICO output is resized to fit within 256 x 256 px and preserves transparency.',
}

export default function FormatPicker({
  targetId,
  onTargetChange,
  onConvert,
  disabled,
}) {
  return (
    <fieldset className="flex h-full flex-col" disabled={disabled}>
      <legend className="text-base font-bold text-slate-900">
        Choose output format
      </legend>
      <p className="mt-1 text-sm text-slate-500">
        Select the format you want to convert your image to.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {OUTPUT_FORMATS.map((format) => {
          const isChecked = targetId === format.id

          return (
            <label key={format.id} className="relative block cursor-pointer">
              <input
                type="radio"
                name="output-format"
                value={format.id}
                checked={isChecked}
                onChange={() => onTargetChange(format.id)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-19 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-3 text-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 ${
                  isChecked
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-500/10'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <span
                  className={`text-sm font-extrabold sm:text-base ${
                    isChecked ? 'text-indigo-700' : 'text-slate-900'
                  }`}
                >
                  {format.label}
                </span>
                <span className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                  {format.hint}
                </span>
              </span>
              {isChecked && (
                <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-indigo-600 text-white shadow-sm">
                  <CheckIcon className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </label>
          )
        })}
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200/60">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>{formatNotes[targetId]}</span>
      </p>

      <div className="mt-5 sm:mt-6">
        <button
          type="button"
          onClick={onConvert}
          disabled={disabled}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-600/30 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
        >
          <SwapIcon className="size-5" />
          Convert Image
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <LockIcon className="size-3.5 shrink-0" />
          Files stay on your device. No uploads.
        </p>
      </div>
    </fieldset>
  )
}
