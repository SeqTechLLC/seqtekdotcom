import type { Metadata } from 'next'

import { Container } from '@/components/ui/Container'
import { buildMetadata } from '@/lib/metadata'

/**
 * Privacy policy — static React route (spec 006 US5 / research R7). Legal copy
 * is versioned in git alongside the cookie/third-party disclosures it must stay
 * consistent with (like the error pages), not a Payload `pages` document.
 *
 * Engineering ships the route, structure, canonical address, the cookie-category
 * + third-party disclosures (data-model §7), and the pointer to the footer
 * "Cookie preferences" control. The finalized legal prose + sign-off is the
 * Phase 5.5 "Legal / privacy" gate — the copy below is a reviewable draft.
 *
 * Public copy convention: no em dashes (project rule). Canonical contact is the
 * Tulsa Cheyenne address (never Sapulpa).
 */

export const metadata: Metadata = buildMetadata(null, {
  title: 'Privacy Policy',
  description:
    'How SEQTEK collects, uses, and protects your information, the cookies we use, the third parties involved, and how to change or withdraw your consent.',
})

const LAST_UPDATED = 'June 3, 2026'

export default function PrivacyPolicyPage() {
  return (
    <section className="py-16 md:py-20" data-testid="privacy-policy">
      <Container size="md">
        <h1 className="text-h1 font-bold">Privacy Policy</h1>
        <p className="mt-3 text-body-lg text-text-secondary">Last updated: {LAST_UPDATED}</p>
        <p className="mt-2 text-small italic text-text-secondary">
          This policy is a working draft pending final legal review.
        </p>

        <div className="mt-10 space-y-12">
          <section aria-labelledby="data-we-collect">
            <h2 id="data-we-collect" className="text-h3 font-semibold">
              Information we collect
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              When you contact us, request a workshop, or subscribe to updates, we collect the
              information you provide through our forms. That typically includes your name, email
              address, company, and the details of your inquiry. We also collect limited technical
              and usage information through cookies and similar technologies (see below) to
              understand how the site is used and to support our marketing.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              We do not collect payment information or special categories of sensitive personal data
              through this website. We only ask for what we need to respond to you and to run our
              business.
            </p>
          </section>

          <section aria-labelledby="how-we-use">
            <h2 id="how-we-use" className="text-h3 font-semibold">
              How we use your information
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              We use the information you provide to respond to inquiries, deliver the services or
              resources you request, send updates you have opted into, and improve our website and
              offerings. We use analytics and advertising cookies only after you consent to them.
            </p>
          </section>

          <section aria-labelledby="cookies">
            <h2 id="cookies" className="text-h3 font-semibold">
              Cookies and similar technologies
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              We group cookies into the categories below. Necessary cookies are always active
              because the site cannot function without them. Analytics and advertising cookies are
              off by default and only turn on when you choose to allow them.
            </p>
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-body font-semibold">Necessary and functionality</dt>
                <dd className="mt-1 text-body text-text-secondary">
                  Required for the site to work and to remember your preferences, including your
                  cookie choices. Always active.
                </dd>
              </div>
              <div>
                <dt className="text-body font-semibold">Analytics</dt>
                <dd className="mt-1 text-body text-text-secondary">
                  Help us understand how visitors use the site so we can improve it. Off until you
                  allow them.
                </dd>
              </div>
              <div>
                <dt className="text-body font-semibold">Advertising</dt>
                <dd className="mt-1 text-body text-text-secondary">
                  Used to measure and improve our marketing across platforms. Off until you allow
                  them.
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="third-parties">
            <h2 id="third-parties" className="text-h3 font-semibold">
              Third parties
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              We work with the following providers, who may process information on our behalf when
              you consent to the relevant cookie categories:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-body text-text-secondary">
              <li>
                <span className="font-semibold">HubSpot</span> for forms, our consent banner, and
                analytics.
              </li>
              <li>
                <span className="font-semibold">Google</span> (Tag Manager and Google Ads) for tag
                management and advertising measurement.
              </li>
              <li>
                <span className="font-semibold">Meta</span> for advertising measurement.
              </li>
              <li>
                <span className="font-semibold">LinkedIn</span> for advertising measurement.
              </li>
            </ul>
          </section>

          <section aria-labelledby="your-choices">
            <h2 id="your-choices" className="text-h3 font-semibold">
              Your choices: changing or withdrawing consent
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              You are in control of analytics and advertising cookies. To review or change your
              choices at any time, use the <span className="font-semibold">Cookie preferences</span>{' '}
              control in the footer of any page. To clear your consent entirely, use{' '}
              <span className="font-semibold">Withdraw consent</span> in the same place. Withdrawing
              consent returns the site to its default state, where only necessary cookies are
              active.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-h3 font-semibold">
              Contact us
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              If you have questions about this policy or how we handle your information, contact us
              at:
            </p>
            <address className="mt-4 not-italic text-body text-text-secondary">
              SEQTEK
              <br />
              12 N Cheyenne Ave
              <br />
              Tulsa, OK 74103
            </address>
          </section>
        </div>
      </Container>
    </section>
  )
}
