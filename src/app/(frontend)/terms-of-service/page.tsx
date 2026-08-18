import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { buildMetadata } from '@/lib/metadata'
import { siteSettings } from '@/lib/site-content'

/**
 * Terms of service — static React route, same rationale as the privacy policy:
 * legal copy is versioned in git alongside the site behavior it describes, not a
 * Payload `pages` document an editor can change without review.
 *
 * Scope is deliberately narrow. This governs USE OF THE WEBSITE only. Client
 * engagements run on their own signed SOW/MSA, and §"Engagements" says so
 * explicitly so nothing here is mistaken for contract terms.
 *
 * Public copy convention: no em dashes (project rule). Canonical contact is the
 * Tulsa Cheyenne address (never Sapulpa). The copy below is a reviewable draft
 * pending the Phase 5.5 legal gate, matching the privacy policy's disclaimer.
 */

export const metadata: Metadata = buildMetadata(null, {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of the SEQTEK website, including acceptable use, intellectual property, form submissions, and limitations of liability.',
})

const LAST_UPDATED = 'August 17, 2026'

const { companyName, email, address } = siteSettings

export default function TermsOfServicePage() {
  return (
    <section className="py-16 md:py-20" data-testid="terms-of-service">
      <Container size="md">
        <h1 className="text-h1 font-bold">Terms of Service</h1>
        <p className="mt-3 text-body-lg text-text-secondary">Last updated: {LAST_UPDATED}</p>
        <p className="mt-2 text-small italic text-text-secondary">
          These terms are a working draft pending final legal review.
        </p>

        <div className="mt-10 space-y-12">
          <section aria-labelledby="acceptance">
            <h2 id="acceptance" className="text-h3 font-semibold">
              Acceptance of these terms
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              These terms govern your use of this website. By browsing the site, submitting a form,
              or subscribing to updates, you agree to them. If you do not agree, please do not use
              the site. We may update these terms from time to time, and the date above tells you
              when they last changed. Continuing to use the site after a change means you accept the
              revised terms.
            </p>
          </section>

          <section aria-labelledby="engagements">
            <h2 id="engagements" className="text-h3 font-semibold">
              These terms are not a services agreement
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              Nothing on this website is an offer to perform work, a quote, or a commitment to
              deliver anything. Client engagements with {companyName} are governed exclusively by a
              separately signed statement of work or master services agreement. Where anything on
              this site conflicts with a signed agreement, the signed agreement controls.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              Submitting a form, booking a call, or registering interest in a workshop starts a
              conversation. It does not create a contract, a client relationship, or any duty on our
              part to proceed.
            </p>
          </section>

          <section aria-labelledby="acceptable-use">
            <h2 id="acceptable-use" className="text-h3 font-semibold">
              Acceptable use
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              You agree to use this site lawfully and not to interfere with it or with anyone else
              using it. In particular, you agree not to:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-body text-text-secondary">
              <li>
                attempt to gain unauthorized access to the site, its servers, or any connected
                system
              </li>
              <li>
                probe, scan, or test the vulnerability of the site, or breach its security or
                authentication measures
              </li>
              <li>
                scrape, harvest, or bulk-download content, or use automated means to overload or
                disrupt the site
              </li>
              <li>
                submit false information, malicious code, or content you do not have rights to
              </li>
              <li>use our forms or contact details to send unsolicited commercial messages</li>
              <li>
                reproduce or republish material from this site for commercial purposes without our
                written permission
              </li>
            </ul>
            <p className="mt-4 text-body text-text-secondary">
              We may suspend or block access to anyone who breaches these terms.
            </p>
          </section>

          <section aria-labelledby="intellectual-property">
            <h2 id="intellectual-property" className="text-h3 font-semibold">
              Intellectual property
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              The content on this site, including text, graphics, logos, photographs, videos, case
              studies, articles, and the design of the site itself, is owned by {companyName} or its
              licensors and is protected by copyright and trademark law. The {companyName} name and
              logo, and our workshop and methodology names, are our marks and may not be used
              without written permission.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              You may read, share, and quote our published articles and case studies with
              attribution and a link back. You may not present them as your own or resell them.
              Client names, logos, and marks shown on this site belong to those clients and appear
              with their permission.
            </p>
          </section>

          <section aria-labelledby="submissions">
            <h2 id="submissions" className="text-h3 font-semibold">
              Information you submit
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              When you submit a form, you confirm the information is accurate and that you are
              entitled to share it. Please do not send us confidential or proprietary information
              through this website. Anything you send through a public form is received outside any
              confidentiality agreement, and we cannot treat it as confidential until a signed
              agreement is in place.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              If you send us feedback, questions, or suggestions, we may use them without obligation
              or compensation to you. What we do with the personal information you provide, and the
              cookies this site sets, are described in our{' '}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="third-party-links">
            <h2 id="third-party-links" className="text-h3 font-semibold">
              Third-party services and links
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              This site uses third-party services to run forms, analytics, and marketing, and it
              links to sites we do not control. We are not responsible for the content,
              availability, or practices of any third-party site, and a link is not an endorsement.
              Those services and sites operate under their own terms and privacy policies. The
              services we use and the cookies they set are listed in our{' '}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="no-warranty">
            <h2 id="no-warranty" className="text-h3 font-semibold">
              No warranty
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              This site and its content are provided as is and as available, without warranties of
              any kind, whether express or implied, including any implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement. We do not
              warrant that the site will be uninterrupted, error free, or secure, or that any defect
              will be corrected.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              Articles, case studies, guides, and workshop material on this site are published for
              general information. They are not professional, legal, financial, or technical advice
              for your situation, and results described for one client are not a promise of similar
              results for anyone else. Do not act on this content without advice suited to your own
              circumstances.
            </p>
          </section>

          <section aria-labelledby="liability">
            <h2 id="liability" className="text-h3 font-semibold">
              Limitation of liability
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              To the fullest extent permitted by law, {companyName} and its officers, employees, and
              agents will not be liable for any indirect, incidental, special, consequential, or
              punitive damages, or for any loss of profits, revenue, data, or business, arising out
              of or connected with your use of this site, whether based in contract, tort,
              negligence, strict liability, or any other theory, and whether or not we were advised
              of the possibility of such damages.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              Some jurisdictions do not allow the exclusion of certain warranties or the limitation
              of certain damages, so some of the above may not apply to you. In those cases our
              liability is limited to the smallest amount permitted by law.
            </p>
          </section>

          <section aria-labelledby="indemnity">
            <h2 id="indemnity" className="text-h3 font-semibold">
              Indemnity
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              You agree to indemnify and hold harmless {companyName} from any claims, losses,
              liabilities, and expenses, including reasonable legal fees, arising out of your misuse
              of this site, your breach of these terms, or your violation of any law or the rights
              of a third party.
            </p>
          </section>

          <section aria-labelledby="governing-law">
            <h2 id="governing-law" className="text-h3 font-semibold">
              Governing law
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              These terms are governed by the laws of the State of Oklahoma, without regard to its
              conflict of laws rules. Any dispute arising from these terms or your use of this site
              will be brought exclusively in the state or federal courts located in Tulsa County,
              Oklahoma, and you consent to the jurisdiction of those courts.
            </p>
            <p className="mt-4 text-body text-text-secondary">
              If any provision of these terms is found unenforceable, the rest remain in effect. Our
              failure to enforce a provision is not a waiver of it.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-h3 font-semibold">
              Contact
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              Questions about these terms can go to{' '}
              <a href={`mailto:${email}`} className="underline">
                {email}
              </a>
              , or by mail to {companyName}, {address.street}, {address.city}, {address.state}{' '}
              {address.zip}.
            </p>
          </section>
        </div>
      </Container>
    </section>
  )
}
