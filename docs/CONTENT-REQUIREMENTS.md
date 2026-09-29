# SEQTEK Website — Content Requirements

The standards site content is held to: what each page type needs, the voice, and the SEO,
AI-crawler and CTA rules. The status of individual pieces of content lives in `CONTENT_NEEDS.md`
in the private content repo.

## 1. Principles

- **The client is the hero.** Above the fold, every page answers what SEQTEK does, how it helps the
  reader, and what to do next.
- **Answer the questions buyers ask:** cost (directional is fine), the problems a service solves, how
  the approach compares with alternatives, and quantified outcomes. Every service page and case study
  answers at least one.
- **Evidence over description:** real projects, named technologies, specific outcomes, real
  photography and fully attributed quotes. No claim without a source.

## 2. Accessibility (WCAG 2.2 AA)

- Alt text on every image, describing what it shows.
- Contrast of at least 4.5:1 for body text and 3:1 for large text.
- One `<h1>` per page; `<h2>`/`<h3>` nest without skipping a level.
- Descriptive link text; never "click here" or a bare URL.
- Body copy at roughly a grade 8–10 reading level.
- Captions on every video, and a transcript on the page or linked from it.

## 3. Images and video

The media library takes JPEG, PNG, WebP, AVIF, GIF and PDF. SVG is not accepted. Payload builds
WebP and JPEG copies at 640, 1024, 1600 and 2400 px wide (never enlarging), and the site serves
them through `ResponsiveImage` as a `<picture>` with `width`, `height` and lazy loading. So upload a
source at least as wide as the image will display.

| Image                 | Source size              | Notes                                |
| --------------------- | ------------------------ | ------------------------------------ |
| Hero                  | 1920 × 1080 or larger    | Real SEQTEK photography, not stock   |
| Headshot              | 400 × 400 or larger      | One consistent style across the team |
| Social / Article card | 1200 × 630               | Every Insights post needs one        |
| Case study image      | 1200 × 800 or larger     | Real screenshots or diagrams         |
| Client logo           | PNG or WebP, transparent | Written permission before use        |

Video is embedded from YouTube or Vimeo. Give it a poster image: with one, the video loads only
when a reader presses play.

## 4. Page types

**Homepage (`/`)**

| Element                  | Requirement                                        |
| ------------------------ | -------------------------------------------------- |
| Hero headline            | 8–12 words that name the differentiator            |
| Hero subheadline         | 1–2 sentences addressed to the reader ("you/your") |
| Hero image               | Real SEQTEK photography                            |
| Primary CTA              | A specific verb and outcome                        |
| Stats                    | Verified numbers, the same everywhere they appear  |
| Services                 | Routes the visitor to the services                 |
| Featured case study      | One study with its headline metric                 |
| Sequoyah acknowledgement | 2–3 sentences linking to `/our-story` (ADR 0003)   |
| Client logos             | Permissioned logos only                            |
| Testimonials             | 2–3, fully attributed (§6)                         |
| Workshops and insights   | A workshops teaser and the latest posts            |

**Service (`/services/<slug>`)** — written for a leaf service; a group page does the same job over
its ordered list of services.

| Element      | Requirement                                                |
| ------------ | ---------------------------------------------------------- |
| Hero         | Leads with the client's problem, not the service name      |
| Problem      | 1–2 paragraphs of symptoms the buyer recognizes            |
| Overview     | 200–300 words on the approach and why it differs           |
| Approach     | 3–5 steps, each with a deliverable                         |
| Deliverables | Specific ("a 90-day implementation roadmap", not "a plan") |
| Proof        | Case study cards and a relevant testimonial                |
| Related      | Links to related services and industries                   |
| FAQ          | 3–5 questions taken from real sales conversations          |
| CTA          | Specific to the service                                    |
| Length       | 800–1,200 words of copy unique to the page                 |

**Case study (`/case-studies/<slug>`)**

| Element         | Requirement                                              |
| --------------- | -------------------------------------------------------- |
| Headline metric | One quantified outcome. A study without one is not ready |
| At a glance     | Industry, services and technologies                      |
| Challenge       | The business problem and what was at stake               |
| Approach        | The method and the named technologies, and why           |
| Results         | Numbers, percentages and timeframes                      |
| Testimonial     | A fully attributed client quote (§6)                     |
| Related         | 2–3 studies from the same industry or service            |
| Imagery         | Real screenshots, diagrams or photos                     |

An anonymized study names the client nowhere: title, slug, body, images, image filenames and alt
text. The **Keep the client anonymous** checkbox is not read by any page, so it hides nothing by
itself.

**Insights post (`/insights/<slug>`)**

| Element        | Requirement                                              |
| -------------- | -------------------------------------------------------- |
| Title          | Specific, with the primary keyword                       |
| Author         | A named team member, linked to their `/team/<slug>` page |
| Dates          | Published date, and a last-updated date when revised     |
| Category       | At least one                                             |
| Featured image | 1200 × 630, with alt text                                |
| Body           | 1,500–2,500 words under `<h2>`/`<h3>` headings           |
| Links          | 2–3 inline anchor-text CTAs, a service and a case study  |

**Industry (`/industries/<slug>`)** — names the industry's specific challenge, 2–3 paragraphs of
context, the relevant services, its case studies, the industry's permissioned client logos and a CTA.
600–900 words.

**Workshops (`/workshops`)** — the landing presents the workshops as peers, each a card linking to
its own page. Each workshop page gives the description, format, duration, audience, deliverables,
facilitator and CTA. The meaning of "Touchstone" belongs on the Touchstone workshop's page.

**Market pages** — unique local content per city, never a template with the city name swapped. No
office listing where there is no office.

## 5. Voice and quality

### 5A. Voice and tone

**Voice:** knowledgeable, direct, human. Earned authority, not performed confidence.

**Tone by context:**

- Service pages: confident and consultative. "Here's how we solve this."
- Case studies: evidence-based and specific. Let the numbers speak.
- Our Story: warm and authentic.
- Insights: educational and generous. Real expertise, not teasers.
- CTAs: direct and specific.

**Words to use:** transform, partner, results, strategy, implement, deliver, local, proven.
**Words to avoid:** synergy, leverage (as a verb), cutting-edge, best-in-class, world-class,
disruptive, turnkey, "solutions" as a standalone noun.

**Punctuation:**

- "and", not "&", in page and section titles ("AI and Automation"). Job titles keep a conventional
  ampersand ("Founder & CEO").
- No em dashes in public copy. Use commas, periods, colons, semicolons and parentheses.

**Pronouns:** "we" for SEQTEK, "you/your" for the reader. No "one" and no passive constructions
addressed to the buyer.

### 5B. Quality gates

| Gate          | Check                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Accuracy      | Every statistic sourced, every claim verifiable, every date confirmed |
| Voice         | Passes §5A                                                            |
| SEO           | Primary keyword in the title, `<h1>`, first 100 words and description |
| Accessibility | §2                                                                    |
| Permission    | Client names, logos and quotes used with written permission           |

## 6. Testimonials

Every testimonial carries a full name, job title, company, headshot and a 2–4 sentence quote. A
LinkedIn URL or a short video is optional. First-name-and-initial or anonymous testimonials are not
used.

## 7. Metadata

- Title: 50–60 characters, primary keyword first, brand last.
- Description: 150–160 characters, with the keyword and a call to action.
- Social image: 1200 × 630.

## 8. SEO and AI Crawler Readiness

**Structured data** — what the site emits:

| Schema           | Where                                                                |
| ---------------- | -------------------------------------------------------------------- |
| `Organization`   | Homepage                                                             |
| `Article`        | Insights posts (`datePublished`, `dateModified`, author, image)      |
| `Person`         | Team member pages (job title, image, LinkedIn as `sameAs`)           |
| `BreadcrumbList` | Case studies, industries, partners, services, workshops, team, pages |

There is no `FAQPage`, `Review`, `LocalBusiness` or `Service` markup. Google has limited FAQ rich
results to government and health sites since August 2023, and reviews a business publishes about
itself have not been eligible for review stars since September 2019. Structured data passes Google's
Rich Results Test before launch.

**Redirects** — the map from Wix-era URLs lives in `src/lib/redirects.ts`, pinned by
`tests/int/config/redirects.int.spec.ts`. Redirects stay permanently.

**Internal links** — every post links to at least one service and one case study; every case study
to its services, its industry and 1–2 related studies; every service to at least one case study;
every industry to its case studies and services. Every page has at least three internal links
pointing at it.

**AI Crawler Readiness** — the content side. The infrastructure side (per-crawler `robots.txt`,
`llms.txt`, Markdown alternates) is planned in `docs/planning/aico.md`.

- Every Insights post and case study has a named author or a named client quote, visible published
  and updated dates, and a source for every statistic.
- Distinctive, specific claims over boilerplate: specific claims get quoted, generic ones don't.
- Lead with the answer. Case studies run problem, approach, result, metrics.
- Every team bio has a job title and a LinkedIn link, which the `Person` markup carries.
- Not built: a publish gate for posts missing an author, date or source, an auto-stamped
  last-updated date, and a review list for stale posts (ROADMAP F-6).

## 9. CTAs

Offer three levels of commitment, not only "Book a Call":

| Level  | The visitor gives | CTAs                                                       |
| ------ | ----------------- | ---------------------------------------------------------- |
| Low    | Attention         | "Read the Case Study", "Explore Our Services"              |
| Medium | An email address  | Subscribe to Insights, download a resource                 |
| High   | Calendar time     | "Book a Call", "Schedule a Workshop", "Request a Proposal" |

| Page       | Primary                      | Secondary               |
| ---------- | ---------------------------- | ----------------------- |
| Homepage   | Book a Call                  | See our case studies    |
| Our Story  | Meet the Team                | See Our Work            |
| Service    | Discuss your [service] needs | Related case studies    |
| Case study | Get Similar Results          | More case studies       |
| Industry   | Talk to us about [industry]  | [Industry] case studies |
| Insights   | Subscribe to Insights        | Book a Call             |
| Workshops  | Schedule a Workshop          | Start the conversation  |
| Contact    | Submit the form              | —                       |

**Rules:**

- Never "Learn More" or "Request Info". Every CTA says what happens next.
- Primary CTAs are solid buttons, secondary ones outlined. In Insights posts, CTAs are anchor text.
- Place a CTA in the first viewport, one mid-page and one at the end.
