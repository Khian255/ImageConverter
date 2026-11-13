import { useSyncExternalStore } from 'react'

export const ROUTES = {
  home: '#/',
  converter: '#/converter',
  removeBackground: '#/remove-background',
  about: '#/about',
}

export const NAV_LINKS = [
  { id: 'converter', href: ROUTES.converter, label: 'Image Converter' },
  {
    id: 'removeBackground',
    href: ROUTES.removeBackground,
    label: 'Background Remover',
  },
  { id: 'about', href: ROUTES.about, label: 'About' },
]

function readRoute() {
  const hash = window.location.hash
  const path = hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '')

  if (!path || path === 'home') return 'home'
  if (path === 'converter') return 'converter'
  if (path === 'remove-background') return 'removeBackground'
  if (path === 'about') return 'about'

  return 'home'
}

function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  window.addEventListener('popstate', callback)

  return () => {
    window.removeEventListener('hashchange', callback)
    window.removeEventListener('popstate', callback)
  }
}

function getSnapshot() {
  return readRoute()
}

function getServerSnapshot() {
  return 'home'
}

export function useRoute() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function goTo(href) {
  if (window.location.hash === href) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  window.location.hash = href
}
