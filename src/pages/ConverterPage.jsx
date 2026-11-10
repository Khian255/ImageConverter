import Converter from '../components/Converter'
import PageHeader from '../components/PageHeader'
import { ImageIcon } from '../components/ui/Icons'

export default function ConverterPage() {
  return (
    <>
      <PageHeader
        icon={ImageIcon}
        eyebrow="Format conversion"
        title="Image Converter"
        description="Move between modern and classic image formats without uploading your files. Transparency, dimensions, and color are handled by your browser."
        badge="Private & on-device"
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Converter />
      </div>
    </>
  )
}
