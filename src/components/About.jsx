import {
  ArrowRightIcon,
  BoltIcon,
  ShieldIcon,
  SparklesIcon,
} from './ui/Icons'
import { ROUTES } from '../lib/router'

const features = [
  {
    icon: ShieldIcon,
    title: 'Local by default',
    description:
      'Format conversion and background removal run inside your browser. Images are not uploaded.',
  },
  {
    icon: SparklesIcon,
    title: 'Real AI, not filters',
    description:
      'The background remover uses a segmentation model. Results are generated, not faked with CSS effects.',
  },
  {
    icon: BoltIcon,
    title: 'No accounts or installs',
    description:
      'Open a tool, upload an image, and download the result. There is no sign-up, watermark, or software to install.',
  },
]

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-violet-200/40 blur-3xl"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-indigo-600 shadow-sm backdrop-blur-sm">
                About Image Studio
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                A complete image studio that respects your files
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Image Studio brings format conversion and background
                removal into one clean workspace. Both tools run locally in
                your browser, so your photos stay on your device.
              </p>
              <a
                href={ROUTES.home}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Explore the tools
                <ArrowRightIcon className="size-4" />
              </a>
            </div>

            <ul className="grid gap-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="group flex items-start gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
