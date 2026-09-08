import type { Metadata } from 'next'

import { ContactForm } from '@/components/forms/ContactForm'
import { Container } from '@/components/ui/Container'

// Static route: no Payload data, so static metadata (no `seo` group). When the
// contact page gains CMS-managed copy, switch to a `pages` doc + generateMetadata.
export const metadata: Metadata = {
  title: 'Contact SEQTEK',
  description:
    'Start a conversation with SEQTEK about your project, a partnership, or a Touchstone workshop.',
}

export default function ContactPage() {
  return (
    <section className="py-16">
      <Container size="md">
        <h1 className="text-h1 font-bold">Let&rsquo;s talk</h1>
        <p className="mt-3 text-body-lg text-text-secondary">
          Tell us what you&rsquo;re working on. We&rsquo;ll point you to the right person and follow
          up within one business day.
        </p>
        <div className="mt-10">
          <ContactForm />
        </div>
      </Container>
    </section>
  )
}
