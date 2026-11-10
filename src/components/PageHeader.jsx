import { ChevronLeftIcon, CloudIcon, ShieldIcon } from './ui/Icons'
import { ROUTES } from '../lib/router'

export default function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  external = false,
  children,
}) {
  const BadgeIcon = external ? CloudIcon : ShieldIcon

  return (
    <section className="relative overflow-hidden border-b border-slate-200/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 size-[28rem] rounded-full bg-indigo-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 size-[24rem] rounded-full bg-violet-200/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8">
        <a
          href={ROUTES.home}
          className="inline-flex items-center gap-1 rounded-lg py-1 text-xs font-bold text-slate-500 transition hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ChevronLeftIcon className="size-4" />
          All tools
        </a>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Icon className="size-6" />
              </span>
              <span className="text-xs font-extrabold tracking-[0.16em] text-indigo-600 uppercase">
                {eyebrow}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {badge && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  external
                    ? 'bg-amber-50 text-amber-700 ring-amber-200/70'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
                }`}
              >
                <BadgeIcon className="size-3.5" />
                {badge}
              </span>
            )}
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
