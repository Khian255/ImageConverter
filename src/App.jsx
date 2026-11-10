import { useEffect } from 'react'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import { useRoute } from './lib/router'
import AboutPage from './pages/AboutPage'
import ConverterPage from './pages/ConverterPage'
import EnhancerPage from './pages/EnhancerPage'
import ExtendPage from './pages/ExtendPage'
import HomePage from './pages/HomePage'
import RemoverPage from './pages/RemoverPage'

const pageTitles = {
  home: 'Image Studio — AI Image Converter, Remover, Enhancer & Extension',
  converter: 'Image Converter — Image Studio',
  extend: 'AI Background Extension — Image Studio',
  removeBackground: 'Background Remover — Image Studio',
  enhance: 'AI HD Enhancer — Image Studio',
  about: 'About — Image Studio',
}

function CurrentPage({ route }) {
  if (route === 'converter') return <ConverterPage />
  if (route === 'extend') return <ExtendPage />
  if (route === 'removeBackground') return <RemoverPage />
  if (route === 'enhance') return <EnhancerPage />
  if (route === 'about') return <AboutPage />
  return <HomePage />
}

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = pageTitles[route] || pageTitles.home
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [route])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-indigo-600 focus:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <CurrentPage route={route} />
      </main>
      <Footer />
    </div>
  )
}
