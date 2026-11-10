import { useEffect, useState } from 'react'
import { LogoIcon, MenuIcon, CloseIcon } from './ui/Icons'
import { NAV_LINKS, ROUTES, useRoute } from '../lib/router'

export default function Navbar() {
  const [openRoute, setOpenRoute] = useState(null)
  const route = useRoute()
  const isOpen = openRoute === route

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpenRoute(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href={ROUTES.home}
          aria-label="Image Studio home"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
            <LogoIcon className="size-5" strokeWidth={2} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Image <span className="text-indigo-600">Studio</span>
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-0.5 xl:flex"
        >
          {NAV_LINKS.map((link) => {
            const isActive = route === link.id

            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-full px-2.5 py-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none 2xl:px-3 2xl:text-[13px] ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpenRoute(isOpen ? null : route)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none xl:hidden"
        >
          {isOpen ? (
            <CloseIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          id="mobile-nav"
          className="animate-pop border-t border-slate-200/70 bg-white xl:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3"
          >
            {NAV_LINKS.map((link) => {
              const isActive = route === link.id

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpenRoute(null)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

