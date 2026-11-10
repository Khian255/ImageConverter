import { CloudIcon, LogoIcon, ShieldIcon } from './ui/Icons'
import { NAV_LINKS, ROUTES } from '../lib/router'

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
          <a
            href={ROUTES.home}
            aria-label="Image Studio home"
            className="flex items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <LogoIcon className="size-4" strokeWidth={2} />
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Image <span className="text-indigo-600">Studio</span>
            </span>
          </a>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center justify-center gap-0.5">
              <li>
                <a
                  href={ROUTES.home}
                  className="rounded-full px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:text-sm"
                >
                  Home
                </a>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-full px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 lg:flex-row">
          <p>© {currentYear} Image Studio. All rights reserved.</p>
          <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-4">
            <p className="flex items-center gap-1.5">
              <ShieldIcon className="size-3.5" />
              Converter, remover, and enhancer run locally.
            </p>
            <p className="flex items-center gap-1.5">
              <CloudIcon className="size-3.5" />
              Extension uses the free Stable Horde network.
            </p>
          </div>
          <p>
            Designed &amp; built by{' '}
            <span className="font-semibold text-slate-700">Khian</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
