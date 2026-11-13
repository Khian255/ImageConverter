import About from '../components/About'
import PageHeader from '../components/PageHeader'
import {
  ImageIcon,
  ShieldIcon,
  SparklesIcon,
} from '../components/ui/Icons'

const details = [
  {
    icon: SparklesIcon,
    title: 'How the AI works',
    description:
      'Background removal uses U2-Netp segmentation in the browser.',
  },
  {
    icon: ShieldIcon,
    title: 'What stays on your device',
    description:
      'Conversion and background removal never upload your image. Only the necessary model files and browser runtimes are downloaded.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        icon={ImageIcon}
        eyebrow="About"
        title="Real tools, clear privacy"
        description="Image Studio is a browser-first image workspace built around real AI models, honest limits, and a simple workflow."
        badge="No sign-up required"
      />
      <About />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          {details.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          <h2 className="text-base font-bold">Honest format limits</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>HEIC and HEIF are accepted as input but cannot be exported by the browser.</li>
            <li>GIF export converts the first frame, not an animation.</li>
            <li>BMP does not support transparency, so transparent areas become white.</li>
            <li>ICO icons are resized to fit within 256 × 256 px.</li>
          </ul>
        </div>
      </section>
    </>
  )
}
