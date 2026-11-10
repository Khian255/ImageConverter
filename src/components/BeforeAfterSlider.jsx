import { useState } from 'react'

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = 'Original image',
  afterAlt = 'Processed image',
  beforeLabel = 'Before',
  afterLabel = 'After',
  transparentAfter = false,
}) {
  const [position, setPosition] = useState(50)

  return (
    <figure>
      <div
        className={`relative overflow-hidden rounded-2xl border border-slate-200 shadow-inner ${
          transparentAfter ? 'bg-checkerboard' : 'bg-slate-100'
        }`}
      >
        <img
          src={afterSrc}
          alt={afterAlt}
          className="h-72 w-full object-contain sm:h-96 lg:h-[28rem]"
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <img
            src={beforeSrc}
            alt={beforeAlt}
            className="h-72 w-full object-contain sm:h-96 lg:h-[28rem]"
          />
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
          {afterLabel}
        </span>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.25)]"
          style={{ left: `${position}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white text-slate-700 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="m9 7-5 5 5 5" />
              <path d="m15 7 5 5-5 5" />
            </svg>
          </span>
        </span>

        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Compare before and after images"
          aria-valuetext={`${position}% of the original image shown`}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>{beforeLabel} shown on the left</span>
        <span>Drag the slider to compare</span>
      </figcaption>
    </figure>
  )
}
