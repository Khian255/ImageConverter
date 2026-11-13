import HowItWorks from '../components/HowItWorks'
import {
  ArrowRightIcon,
  BoltIcon,
  CloudIcon,
  EraserIcon,
  ImageIcon,
  ShieldIcon,
  SparklesIcon,
} from '../components/ui/Icons'
import { ROUTES } from '../lib/router'

const tools = [
  {
    id: 'converter',
    title: 'Image Converter',
    description:
      'Convert between JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, and ICO. HEIC and HEIF files are accepted as input.',
    href: ROUTES.converter,
    icon: ImageIcon,
    badge: 'On-device',
    external: false,
    accent: 'from-indigo-500 to-blue-600',
    soft: 'bg-indigo-50 text-indigo-600',
    features: ['9 input formats', 'Transparency aware', 'Batch-free simplicity'],
  },
  {
    id: 'remove-background',
    title: 'Background Remover',
    description:
      'Separate people, products, and objects from their backgrounds with an on-device AI model that keeps fine edges.',
    href: ROUTES.removeBackground,
    icon: EraserIcon,
    badge: 'On-device',
    external: false,
    accent: 'from-fuchsia-500 to-pink-600',
    soft: 'bg-fuchsia-50 text-fuchsia-600',
    features: ['Hair-level edges', 'Transparent PNG', 'Custom backdrops'],
  },
]

const highlights = [
  {
    icon: ShieldIcon,
    title: 'Private where it matters',
    description: 'Conversion and background removal stay on your device.',
  },
  {
    icon: BoltIcon,
    title: 'Real browser AI',
    description: 'ONNX and WASM models run directly in the page.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-48 size-[36rem] rounded-full bg-indigo-200/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-16 -right-52 size-[32rem] rounded-full bg-violet-200/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-hero-grid"
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-sm">
              <SparklesIcon className="size-3.5" />
              AI-powered · Free · No sign-up
            </span>

            <h1 className="mt-5 animate-fade-up text-4xl font-extrabold tracking-tight text-slate-900 [animation-delay:80ms] sm:text-5xl lg:text-6xl">
              Your complete{' '}
              <span className="text-gradient">AI image studio</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-base leading-relaxed text-slate-600 [animation-delay:160ms] sm:text-lg">
              Convert image formats and remove backgrounds. Two focused tools,
              no accounts, and no software installs.
            </p>
          </div>

          <div className="mt-10 grid animate-fade-up gap-4 [animation-delay:240ms] sm:mt-12 sm:grid-cols-2">
            {tools.map(({ id, title, description, href, icon: Icon, badge, external, accent, soft, features }) => (
              <a
                key={id}
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 text-left shadow-[0_18px_50px_-30px_rgba(79,70,229,0.35)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_28px_60px_-28px_rgba(79,70,229,0.4)] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-14 -right-14 size-36 rounded-full bg-linear-to-br ${accent} opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]`}
                />
                <span className="flex items-start justify-between gap-3">
                  <span
                    className={`grid size-11 place-items-center rounded-2xl bg-linear-to-br ${accent} text-white shadow-md`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      external
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
                        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'
                    }`}
                  >
                    {external ? (
                      <CloudIcon className="size-3" />
                    ) : (
                      <ShieldIcon className="size-3" />
                    )}
                    {badge}
                  </span>
                </span>

                <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>

                <span className="mt-4 flex flex-wrap gap-1.5">
                  {features.map((feature) => (
                    <span
                      key={feature}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${soft}`}
                    >
                      {feature}
                    </span>
                  ))}
                </span>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600">
                  Open tool
                  <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>

          <ul className="mx-auto mt-8 grid max-w-5xl animate-fade-up gap-3 [animation-delay:320ms] sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-sm"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <HowItWorks />
    </>
  )
}
