import {
  ArrowRightIcon,
  DownloadIcon,
  ImageIcon,
  SparklesIcon,
  UploadIcon,
} from './ui/Icons'
import { ROUTES } from '../lib/router'

const steps = [
  {
    icon: ImageIcon,
    title: 'Choose a tool',
    description:
      'Convert an image format or remove a background.',
  },
  {
    icon: UploadIcon,
    title: 'Add your image',
    description:
      'Drag and drop or browse your device. JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, and HEIC are accepted.',
  },
  {
    icon: SparklesIcon,
    title: 'Run the process',
    description:
      'Everything runs in your browser, so your image never leaves your device.',
  },
  {
    icon: DownloadIcon,
    title: 'Download the result',
    description:
      'Preview before and after, then save a clean file in the format you need.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-slate-200/70 bg-linear-to-b from-slate-50 to-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Two tools. One simple flow.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500 sm:text-lg">
            No accounts or installs — pick a tool and get a result in minutes.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5"
            >
              <span className="absolute top-5 right-5 text-xs font-extrabold tracking-widest text-slate-300 transition group-hover:text-indigo-300">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-base font-bold text-slate-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <a
            href={ROUTES.converter}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ready to try it? Open the converter
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
