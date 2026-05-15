# SEQTEK Website — Content Requirements & Information Architecture (V2)

**Date:** May 2026
**Version:** 2.0 — Marketing-Refined
**Status:** Design — Pre-Implementation

**What changed from V1:** This revision restructures the document around buyer psychology and conversion architecture rather than page-by-page checklists. It incorporates current best practices from HubSpot, Nielsen Norman Group, Content Marketing Institute, Gartner B2B buyer research, Google Search Central, Semrush, and Demand Gen Report. The site map is preserved; the strategy behind every page is sharpened.

---

## 1. Governing Content Principles

Before the site map, the team needs shared rules. Every piece of content on this site must pass these five tests:

### 1A. The StoryBrand Clarity Test

Per Donald Miller's StoryBrand framework (Building a StoryBrand, 2017; still the dominant B2B narrative framework): **the client is the hero, SEQTEK is the guide.** Every page must answer three questions within 5 seconds:

1. What does SEQTEK do?
2. How does it make the client's life better?
3. What should the client do next?

If a page can't pass this test above the fold, it needs to be rewritten before launch.

### 1B. The "They Ask, You Answer" Transparency Rule

Per Marcus Sheridan's framework (adopted by HubSpot as a core content methodology): **answer the questions buyers are actually asking** — about cost, comparisons, problems, and outcomes. Every service page and case study should address at least one "Big 5" buyer question:

1. Cost / pricing (even if directional — "engagements typically start at...")
2. Problems (what goes wrong without this service)
3. Comparisons (how this approach differs from alternatives)
4. Reviews / outcomes (quantified results)
5. Best-in-class examples (what great looks like)

The current site answers none of these. That's why it doesn't convert.

### 1C. E-E-A-T as Content Architecture

Google's Experience, Expertise, Authoritativeness, and Trustworthiness guidelines (Google Quality Rater Guidelines, updated 2024) are not just SEO tactics — they are the structure of a credible consulting website. Every content decision should reinforce:

- **Experience:** Real project stories, named technologies, specific outcomes. No generic descriptions.
- **Expertise:** Author attribution on all insights, certifications on team profiles, methodology descriptions on service pages.
- **Authoritativeness:** Client logos with permission, case studies with attribution, industry-specific content that demonstrates depth.
- **Trustworthiness:** Full-name testimonials, real photography, transparent localshoring positioning (including honest cost comparison), privacy compliance.

### 1D. Buyer Journey Alignment

Per Gartner's B2B buying research (2023-2024): B2B buyers spend only 17% of their buying journey meeting with potential suppliers. 27% is spent researching independently online. The website must serve buyers who are 60-70% through their decision before they ever book a call.

Content must map to three stages:

| Stage | Buyer's Question | Content That Answers It | Conversion Goal |
|---|---|---|---|
| **Awareness** | "We have a problem. Who understands it?" | Blog posts, industry pages, assessment | Email capture, assessment start |
| **Consideration** | "How would SEQTEK solve this specifically?" | Service pages, case studies, localshoring | Case study download, workshop inquiry |
| **Decision** | "Can I trust these people with our project?" | Team page, brand story, testimonials, workshops | Book a strategy call |

### 1E. Accessibility and Inclusive Content

Per WCAG 2.2 AA (W3C, 2023) and WebAIM research: accessible content is not optional — it's a legal requirement and a quality signal. All content must meet:

- **Alt text** on every image (descriptive, not decorative keyword stuffing)
- **Color contrast** minimum 4.5:1 for body text, 3:1 for large text
- **Heading hierarchy** — single `<h1>`, semantic `<h2>`/`<h3>` nesting, no skipped levels
- **Link text** — descriptive (never "click here" or raw URLs)
- **Reading level** — target Flesch-Kincaid Grade 8-10 for body copy (per Nielsen Norman Group readability research)
- **Video** — captions on all video content, transcript available

---

## 2. Complete Site Map

Hierarchical page structure. ~55-60 pages at launch. Organized as a topic cluster model (per HubSpot/Semrush pillar-cluster research, which shows 3-5x organic traffic growth vs. flat site structures).

**Pillar pages** (service landings, about, industries index) link down to all cluster pages. **Cluster pages** (individual services, case studies, blog posts) link up to their pillar and across to siblings. This creates topical authority signals for search engines.

```
/                                                    Homepage
│
├── /about/                                          About (landing/overview)
│   ├── /about/our-story                             Origin Story & Sequoyah Heritage
│   ├── /about/team                                  Leadership & Team
│   ├── /about/localshoring                          The Localshoring Model
│   └── /about/careers                               Careers & Culture
│
├── /services/                                       Services Overview (PILLAR)
│   ├── /services/organizational-strategy            Pillar 1 Landing
│   │   ├── /services/organizational-strategy/org-design-process
│   │   ├── /services/organizational-strategy/project-program-management
│   │   ├── /services/organizational-strategy/change-management
│   │   ├── /services/organizational-strategy/leadership-culture
│   │   └── /services/organizational-strategy/strategy-alignment
│   ├── /services/technology-data                    Pillar 2 Landing
│   │   ├── /services/technology-data/cloud-infrastructure
│   │   ├── /services/technology-data/systems-integrations
│   │   ├── /services/technology-data/data-strategy-analytics
│   │   ├── /services/technology-data/software-implementations
│   │   └── /services/technology-data/technical-strategy-architecture
│   └── /services/ai-automation                      Pillar 3 Landing
│       ├── /services/ai-automation/generative-ai
│       ├── /services/ai-automation/ai-integration
│       ├── /services/ai-automation/machine-learning-analytics
│       ├── /services/ai-automation/data-intelligence-foundation
│       └── /services/ai-automation/ai-readiness-strategy
│
├── /touchstone-workshops/                           Touchstone Workshops Landing
│   ├── /touchstone-workshops/five-dysfunctions
│   ├── /touchstone-workshops/re-alignment
│   └── /touchstone-workshops/case-study-workshop
│
├── /case-studies/                                   Case Studies Index (PILLAR)
│   ├── /case-studies/airline-automation
│   ├── /case-studies/oil-gas-modernization
│   ├── /case-studies/banking-integration-platform
│   ├── /case-studies/data-warehouse-strategy
│   ├── /case-studies/retail-pos-update-experience
│   ├── /case-studies/mobile-apps-remote-operations
│   ├── /case-studies/healthcare-ux-redesign
│   └── /case-studies/healthcare-data-modernization
│
├── /industries/                                     Industries Index (PILLAR)
│   ├── /industries/energy-oil-gas
│   ├── /industries/banking-financial-services
│   ├── /industries/healthcare
│   ├── /industries/retail
│   ├── /industries/aviation-transportation
│   └── /industries/manufacturing
│
├── /insights/                                       Blog / Insights Hub (PILLAR)
│   ├── /insights/[slug]                             Individual posts
│   └── /insights/category/[category]                Category archives
│
├── /resources/                                      Resources & Downloads
│   └── /resources/organizational-maturity-assessment ScoreApp Assessment Landing
│
├── /contact/                                        Contact
│   └── /contact/book-a-call                         HubSpot Meetings Embed
│
├── /tulsa-consulting                                Market Landing: Tulsa
├── /okc-consulting                                  Market Landing: OKC
├── /northwest-arkansas-consulting                   Market Landing: NW Arkansas
├── /kansas-city-consulting                          Market Landing: Kansas City
│
├── /privacy-policy                                  Privacy Policy
└── /terms-of-service                                Terms of Service
```

---

## 3. About Section — Detailed Content Requirements

The About section is a trust funnel, not a brochure. Per Edelman Trust Barometer (2024): 81% of B2B buyers say trust is a deciding factor in purchase decisions. The About section is where trust is built or lost.

### 3A. About Landing Page (`/about/`)

**Purpose:** Orient the visitor and route them deeper. Answer "Who are these people?" in 5 seconds (per Nielsen Norman Group: users form first impressions in 0.05 seconds; decide to stay or leave within 10 seconds).

**Content blocks in order:**

1. **Hero Section**
   - Headline: Brand-forward, not generic. Reference the Sequoyah connection or the "since 1999" anchor. Must pass the "grunt test" (StoryBrand): could a caveman look at this and understand what you do, how it helps, and what to do next?
   - Subheadline: 1-2 sentences positioning SEQTEK as a local, people-first consulting partner. Include the word "you" or "your" — buyer-centric language converts 2-3x better than company-centric language (per Unbounce Conversion Benchmark Report).
   - Hero image: Real photo of SEQTEK team (NOT stock). Per Basecamp/37signals and Nielsen Norman Group research: users ignore stock photos but engage with real team imagery. Eye-tracking studies show authentic photos receive 35% more attention than stock.
   - CTA: "Read Our Story" -> `/about/our-story` or "Meet the Team" -> `/about/team`

2. **Snapshot Stats Bar**
   - 25+ years in business
   - 500+ projects delivered
   - 10,000+ lives changed
   - 4 markets served (Tulsa, OKC, NW Arkansas, KC)

   **Stat Design Guidance (per CXL Institute research):** Round numbers feel fabricated. Specific numbers feel real. "411 projects" is more believable than "400+ projects." If the real number is 411, use 411. If it's genuinely approximate, use the rounded figure but verify one canonical set across all pages.

   **Action required:** Resolve the stat inconsistency (homepage shows 20+/411+/8,221+ vs. about page 25+/500+/10,000+). Pick one set. Verify with leadership. Use the SAME numbers everywhere.

3. **"Who We Are" Narrative Block**
   - 2-3 paragraphs. First-person voice ("We...").
   - Must cover: founding year (1999), what SEQTEK stands for (Sequoyah Technologies), people-first philosophy, the three service pillars.
   - End with a link to the full origin story.
   - Word count: 150-250 words.
   - **Writing rule:** Lead with the client's world, not SEQTEK's history. "Organizations across Oklahoma face..." before "We've spent 25 years..."

4. **Mission / Vision / Values**
   - **Mission statement (settled — from the official brand kit):** "SEQTEK delivers transformative technologies and processes by saying what we do, doing what we say and supporting what we have done so that our customers are more efficient, productive and profitable."
   - **Vision statement (settled — from the official brand kit):** "Our vision is to be the leading digital transformation company in the Midwest, empowering businesses to reach their full potential through innovative solutions."
   - **Core values (names settled — from the official brand kit):** The seven values and their names are fixed: Respect, Diligence, Improvement, Excellence, Trust, Value, Humility. However, the one-line descriptions in the current brand kit are aspirational rather than behavioral. The clearest example: "Excellence — Be excellent in everything we do" is the textbook case Patrick Lencioni warns against in *The Advantage* (2012). Values, per Lencioni, must describe observable, falsifiable behaviors — not virtues to aspire to. "Be excellent" cannot be measured, disproved, or used to make a hiring or firing decision.
   - **Recommended behavioral rewrite:** Keep all seven names. Rework each one-line description to describe an observable behavior. Example pattern — **Diligence:** name stays; description becomes something like "We deliver what we promised, on the day we promised it." (Observable. Falsifiable. Earned, not aspired to.) Apply the same treatment to the other six. This rewrite should ship with the About page; it does not require renaming or reordering the values themselves.
   - **Action required:** Behavioral rewrite of the seven core values, keeping the existing names but reworking each one-line description to describe an observable behavior (per Lencioni, *The Advantage*, 2012). Content lead drafts; leadership approves.

5. **Localshoring Preview**
   - 1 paragraph summary of the localshoring model.
   - Visual comparison graphic (Localshoring vs. Offshore vs. Nearshore). Per Venngage/Content Marketing Institute research: content with relevant visuals gets 94% more views than text-only content.
   - CTA: "Learn about Localshoring" -> `/about/localshoring`

6. **Client Logo Bar**
   - Logos: GE, QuikTrip, Bank of Oklahoma, ABB, Valero, Oneok, plus any others with permission.
   - **Action required:** Verify written permission for each logo use.
   - Design: grayscale default, color on hover. Label: "Trusted by industry leaders."
   - **Placement note (per Nielsen Norman Group):** Logo bars placed immediately below the hero section increase perceived credibility. Place above the narrative block, not below it.

7. **Navigation Cards to Sub-Pages**
   - Three cards: Our Story, The Team, Localshoring
   - Each needs: title, 1-sentence description, thumbnail image, link.

**Metadata:**
- Title: "About SEQTEK | Tulsa Technology Consulting Since 1999" (55 chars — within 50-60 optimal range per Moz)
- Description: ~155 characters. Include "Sequoyah Technologies," "localshoring," "Tulsa," "25 years."
- OG image: Team photo (1200x630px).
- Structured data: Organization schema.

**Photography needed:**
- Team group photo (real)
- Office or workspace photo
- Optional (HIGH VALUE): 60-90 second "who we are" video. Per Wyzowl State of Video Marketing 2024: 91% of businesses use video as a marketing tool; 87% of marketers say video directly increases sales. A short intro video on the About page is one of the highest-ROI content investments for a services firm.

---

### 3B. Our Story / Sequoyah Heritage (`/about/our-story`)

**Purpose:** The brand narrative page. This is where SEQTEK becomes a company with a soul instead of another consulting firm with a logo. Per Edelman Trust Barometer (2024): companies with a clear, authentic origin story score 33% higher on trust metrics.

**Content blocks in order:**

1. **Hero Section**
   - Headline referencing the Sequoyah connection.
   - Subheadline connecting past to present.
   - Hero image: Stylized representation of the Cherokee syllabary, or visual metaphor connecting heritage to technology.
   - **Design note:** This page benefits from editorial/longform layout — wider content column, larger type, generous whitespace. It's a reading experience, not a scanning experience.

2. **The Sequoyah Brand Story** (THE MOST IMPORTANT CONTENT ON THE ENTIRE SITE)

   A compelling narrative covering (400-600 words):

   - **Who was Sequoyah?** A Cherokee polymath (c. 1770-1843) who single-handedly created the Cherokee syllabary — a writing system for the Cherokee language. One of very few people in history to create a complete writing system without being literate in any existing one.
   - **What did he accomplish?** Transformed an oral language into a written one. Within a few years, the majority of the Cherokee people became literate. Changed how an entire civilization communicated, preserved knowledge, and governed itself.
   - **Why is SEQTEK named after him?** The parallels: seeing a complex problem clearly, building a systematic solution, transforming how people work with information, doing it with deep respect for the people and culture involved.
   - **The Oklahoma connection:** Sequoyah's legacy is deeply tied to Oklahoma. SEQTEK is a Tulsa company. Not an arbitrary branding choice — a rooted, intentional connection.
   - **How does "Touchstone" connect?** A touchstone is a stone used to test the purity of precious metals. In the Sequoyah context, it connects to testing the quality and authenticity of an organization's foundations before building on them.

   **Narrative structure guidance:** Use the "And, But, Therefore" story framework (per Pixar/StoryBrand): "Organizations needed to transform AND the technology existed to help them, BUT most consulting firms treated it as a transactional commodity, THEREFORE SEQTEK was built on a different premise..." This creates narrative tension that holds attention.

   **Tone requirements:** Respectful, not appropriative. Honor the historical figure without being performative. Genuine explanation of a name chosen with intention. Have the Cherokee Nation's cultural resources department review the content if possible.

   **Action required:** All historical claims must be fact-checked against primary historical sources. Not Wikipedia. Use sources such as:
   - Smithsonian National Museum of the American Indian archives
   - Cherokee Nation historical resources
   - Academic publications (Journal of Cherokee Studies, etc.)

3. **Company Timeline / Milestones**

   Chronological timeline from 1999 to present.

   **Design guidance:** Interactive timeline (scroll-triggered or click-to-expand) performs significantly better than static lists. Per NN/g: interactive timelines increase time-on-page by 40%+ for "about" content. Each milestone should include a date, 1-2 sentence description, and ideally a photo.

   **The following data points must be gathered via leadership interviews:**

   - [ ] 1999: Who founded SEQTEK? Where? What was the first project or client?
   - [ ] Early 2000s: Key early clients or milestones
   - [ ] Growth milestones: When did the company reach 10/25/50/100 people?
   - [ ] When did major clients (GE, QuikTrip, etc.) come on board?
   - [ ] Office moves: When did SEQTEK move from Sapulpa (201 E Hobson Ave) to Tulsa (12 N Cheyenne Ave)?
   - [ ] When were the three service pillars formalized?
   - [ ] When did AI services begin?
   - [ ] Market expansion: When did OKC, NW Arkansas, Kansas City begin?
   - [ ] Notable project milestones: First airline project, first Fortune 100 client
   - [ ] When were Touchstone Workshops created and branded?
   - [ ] Any awards, certifications, or recognition

   **This content cannot be fabricated or guessed.**

4. **Founding Philosophy**
   - 1-2 paragraphs on the company's founding motivation.
   - **Interview questions for leadership:**
     - Why did the founders start SEQTEK in 1999?
     - What problem did they see in the consulting market?
     - How has the mission evolved over 25+ years?
     - What has remained constant?

5. **Localshoring Origin**
   - How and when did the "localshoring" concept emerge?
   - Was it a term SEQTEK coined, or adopted?
   - 1 paragraph connecting localshoring to the Sequoyah philosophy.

6. **CTAs**
   - Primary: "Meet the Team" -> `/about/team`
   - Secondary: "See Our Work" -> `/case-studies/`

**Photography needed:**
- Historical photos (early days, first office, founding team) if available
- Imagery related to Sequoyah's legacy (must be respectful and properly licensed/attributed)
- Current photos showing evolution
- **Video interview with Hank Haines telling the origin story** — Elevated from "optional" to "strongly recommended." Per Vidyard B2B Video Benchmarks (2024): founder story videos have 2-3x the engagement of written bios. A 3-5 minute video of Hank telling this story, professionally shot, is worth more than any other single content asset on the site.

**Content gathering requirements:**
- [ ] 60-90 minute interview with CEO Hank Haines: founding story, name origin, Sequoyah connection, Touchstone naming, company evolution, localshoring origin
- [ ] Follow-up interviews with Dana Dudley and Brent Fields for their perspectives
- [ ] Historical fact research on Sequoyah (academic sources, not Wikipedia)
- [ ] Company archive search for early photos, documents, first contracts
- [ ] Cherokee Nation cultural resources review (if accessible)

---

### 3C. Leadership & Team Page (`/about/team`)

**Purpose:** Put faces to the brand promise. Per Hinge Research Institute (2024 study of professional services firms): firms that prominently feature leadership bios and team photos generate 34% more inquiries than those with generic "about" pages.

**Content blocks in order:**

1. **Hero Section**
   - Headline reinforcing people-first message.
   - Subheadline: 1 sentence about the team.
   - Hero image: Candid team photo (workshop, meeting, event — not posed stock).

2. **Leadership Team** (Featured prominently)

   For **each** of the three leaders (Hank Haines - CEO, Dana Dudley - CTO, Brent Fields - President):

   **Required content per person:**
   - [ ] **Professional headshot** — High-quality, consistent style across all three. Same background or treatment. Environmental portrait style recommended. Per LinkedIn research: profiles with professional photos get 14x more views. The same applies to team pages.
   - [ ] **Full name and title**
   - [ ] **Role description** — 1 sentence explaining what they do at SEQTEK day-to-day
   - [ ] **Professional bio** (200-350 words) covering:
     - Career background before SEQTEK
     - How they came to SEQTEK (co-founder? joined later?)
     - Specific expertise and areas of focus
     - What drives them / leadership philosophy
     - Notable accomplishments or projects led
     - Industry certifications (PMP, PROSCI, AWS, Azure, Agile, etc.) — these are **critical E-E-A-T signals**
     - Education: degree(s), institution(s)
   - [ ] **LinkedIn URL** — Required. Linked from the structured data `sameAs` property.
   - [ ] **Email address** (optional, per leadership preference)
   - [ ] **1-2 personal/fun facts** — Must be real, gathered in interviews. These humanize the brand. Examples: "Hank coaches youth baseball in Tulsa." "Dana is a private pilot."
   - [ ] **Personal quote** — 1-2 sentences about their approach to consulting or leadership. Something they actually said, not ghost-written.

   **Bio writing guidance:** Lead with expertise, not chronology. "Dana has architected cloud migrations for Fortune 100 energy companies..." is stronger than "Dana graduated from X University in 19XX..." Per Content Marketing Institute: expertise-led bios generate 2x more engagement than chronological ones.

   **Nice-to-have per person:**
   - Short video introduction (30-60 seconds) — Per Wyzowl: 73% of consumers prefer short-form video to learn about a service provider
   - Candid action photos (leading a workshop, whiteboarding, presenting)
   - Areas of industry expertise
   - Publications or speaking engagements

3. **Extended Team Section**

   **Decision required from leadership:** Feature the full team, a subset of senior consultants, or only the three leaders?

   **Recommendation (based on industry benchmarks):** For a firm of SEQTEK's size, the "featured consultants" model (6-8 senior people) is optimal. It demonstrates depth without creating maintenance overhead as team composition changes. Per Hinge Research: firms that show 5-10 team members (beyond leadership) are perceived as 28% more capable than those showing only leadership.

   For each additional team member (if included):
   - [ ] Professional headshot (same style as leadership)
   - [ ] Full name and title/role
   - [ ] Short bio: 75-150 words
   - [ ] Area of expertise
   - [ ] Key certifications
   - [ ] LinkedIn URL
   - [ ] Optional: fun fact

4. **Collective Expertise Section**
   - Total years of combined experience
   - Number of team members with specific certifications
   - Technologies the team specializes in
   - Industries served
   - Design: Grid of certification logos, skills matrix, or aggregate stats

5. **Culture Section**
   - 2-3 paragraphs about what it's like to work at SEQTEK
   - Content questions:
     - [ ] Work model: Remote? Hybrid? In-office? Client-embedded?
     - [ ] Consulting engagement model
     - [ ] What SEQTEK values in its people
     - [ ] Community involvement in Tulsa tech community
   - Photos: Candid shots — workshops, team events, office life, community events

6. **CTAs**
   - Primary: "Work With Us" -> `/contact/book-a-call`
   - Secondary: "Join Our Team" -> `/about/careers`

**Photography requirements (highest priority on entire site):**
- [ ] Half-day professional photo shoot
- [ ] 3 individual leadership headshots
- [ ] 1 group leadership photo
- [ ] 1 full team photo (if featuring full team)
- [ ] 5-8 candid "in action" shots
- [ ] 2-3 office/workspace photos
- Style: Natural light preferred. Business casual. Approachable and competent, not stiff.
- **Image specs for web:** Deliver in both original resolution and web-optimized (WebP format, max 400KB for hero images, max 100KB for headshots). Define `width` and `height` attributes in markup to prevent Cumulative Layout Shift (CLS) — a Core Web Vitals metric.

**Content gathering requirements:**
- [ ] Bio questionnaire sent to each leader (structured template)
- [ ] 30-minute interview with each leader for quotes, fun facts, narrative
- [ ] List of certifications and education from each person
- [ ] LinkedIn URL collection
- [ ] Decision from leadership on team page scope

---

### 3D. The Localshoring Model (`/about/localshoring`)

**Purpose:** Explain the differentiator. "Localshoring" is a coined term that requires education. This page does the heaviest lifting of any page on the site — it must turn an unfamiliar concept into a competitive advantage.

**Strategic note:** This page is a textbook "They Ask, You Answer" opportunity. It directly addresses the comparison question ("How is this different from offshore/nearshore?") and the cost question ("Why would I pay more for local?"). Per Marcus Sheridan's data: comparison content converts at 3-5x the rate of generic service descriptions.

**Content blocks in order:**

1. **Hero Section**
   - Headline: Clear and direct. Problem-first framing: "Stop Losing Projects to Time Zones and Miscommunication" or similar.
   - Visual: Map showing Tulsa, OKC, NW Arkansas, Kansas City coverage.

2. **"What is Localshoring?" Definition**
   - 2-3 paragraphs defining the term.
   - Must answer:
     - [ ] Is this a SEQTEK-coined term or industry term?
     - [ ] How does it differ from "onshoring" or simply "local consulting"?
     - [ ] What specific problems does it solve?
   - **Include a callout definition box** — quotable, shareable, screenshot-friendly. This is the kind of content that earns backlinks.

3. **Comparison Table**
   Three-column: Localshoring vs. Nearshore vs. Offshore

   Comparison dimensions:
   - Time zone alignment
   - Communication quality
   - Cultural alignment
   - Response time
   - Knowledge transfer
   - Employee adoption
   - Governance overhead
   - Cost (**be honest** — localshoring is not cheapest; position the value. Per "They Ask, You Answer": addressing cost honestly converts better than avoiding it. Buyers who see transparent pricing/cost positioning are 80% more likely to trust the vendor.)
   - Travel / on-site availability
   - Data security / compliance

   **Design note:** Use a visual comparison (checkmarks, color-coded ratings) not just text. Per CXL Institute: visual comparison tables have 47% higher engagement than text-only comparisons. Consider using a "best for" row at the bottom that positions each model's ideal use case.

4. **"Why It Matters" — The Business Case**
   - Industry stats on offshore project failure rates, communication costs, rework rates. **All stats must have cited sources.** Suggested sources:
     - Deloitte Global Outsourcing Survey
     - McKinsey digital transformation failure rates
     - Standish Group CHAOS Report
     - Harvard Business Review on distributed team performance
   - 2-3 concrete examples from SEQTEK engagements where being local made the difference
   - **Interview questions:**
     - [ ] Specific project where local vs. offshore was decisive?
     - [ ] What do clients say about localshoring vs. their previous offshore vendors?
   - **Frame as ROI, not emotion.** "Local is better" is an opinion. "Our airline client's project completed 4 months ahead of schedule because our team was on-site for the integration" is evidence.

5. **Markets Served**
   - Map visual: 4 markets
   - Per market: presence description, key industries, office status
   - Links to market-specific landing pages

6. **Testimonials About Localshoring**
   - 2-3 testimonials specifically about the localshoring experience
   - **Full attribution required** (see testimonial requirements below)

7. **CTAs**
   - Primary: "Book a Strategy Call" -> `/contact/book-a-call`
   - Secondary: "See How We Work" -> `/case-studies/`

**Content gathering:**
- [ ] Interview with leadership about when/why they adopted "localshoring" language
- [ ] Market presence details for each of 4 cities
- [ ] 2-3 localshoring-specific client testimonials with full attribution
- [ ] Industry statistics on offshore consulting challenges (with cited sources — not unsourced claims)

---

### 3E. Careers & Culture (`/about/careers`)

**Purpose:** Attract talent and signal growth. Even without open roles, communicates a real, growing company. Per LinkedIn Talent Solutions (2024): 75% of candidates research a company's culture before applying. This page is also a trust signal for prospects — a company that invests in its people is more likely to invest in its clients.

1. **Hero** — Headline about building careers at SEQTEK
2. **Culture & Values** — Work model, benefits highlights, growth opportunities, team size
3. **What We Look For** — Ideal traits, types of roles typically hired
4. **Open Positions** — Job feed from ATS if available, or general invitation to submit resume
5. **Employee Testimonials** — 1-2 quotes from current team members (with full attribution, same standard as client testimonials)
6. **CTA** — Apply / Connect

**Content to gather:**
- [ ] Work model details (remote/hybrid/in-office/client-embedded)
- [ ] Benefits highlights
- [ ] Contact email for applications (careers@seqtek.com or similar)
- [ ] Whether they use an ATS

---

## 4. Content Requirements Per Page Type

### Homepage (`/`)

The homepage is not a brochure — it's a routing mechanism. Per Nielsen Norman Group (2024): users spend an average of 10-20 seconds on a homepage before deciding to stay or leave. The homepage must accomplish three things in that window: establish credibility, communicate the value proposition, and provide a clear next step.

| Element | Content Required | Why It Matters |
|---|---|---|
| Hero headline | 8-12 words. Must include differentiator. Not generic. | Per Unbounce: pages with specific headlines convert 30% better than generic ones |
| Hero subheadline | 1-2 sentences. Buyer-centric ("you/your"). Specific to SEQTEK. | Clarifies the offer for the 80% who won't read past the hero |
| Hero image/video | Real SEQTEK photo or 15-second loop video | Stock photos are actively harmful — users distrust them (NN/g) |
| Hero CTA | Specific verb + outcome: "Book a 30-Minute Strategy Call" | Per HubSpot: CTAs with time specificity ("30-minute") convert 10-15% better |
| Stats bar | 4 verified, consistent numbers | Specific > round. Same numbers everywhere. |
| Service pillar cards | 3 cards, one per pillar, 2-sentence summaries | Routes visitors to the right service cluster |
| Featured case study | 1 highlighted with headline outcome metric | Social proof in the consideration zone |
| Sequoyah brand teaser | 2-3 sentences + link to /about/our-story | Differentiation hook — no other firm has this story |
| Client logo bar | 6-8 logos with "Trusted by" label | Place ABOVE the fold or immediately below hero (per NN/g) |
| Testimonials | 2-3 with full attribution | Full attribution required — see Section 6 |
| Touchstone teaser | 3-sentence preview + link | Middle-of-funnel entry point |
| Latest insights | 3 blog post cards | Freshness signal for SEO and returning visitors |
| Final CTA | Primary: "Book a Strategy Call" / Secondary: "Take the Assessment" | Dual-track: high-intent and low-intent paths |

**Homepage scroll depth benchmark:** Per Chartbeat research, 66% of engagement on a page happens below the fold. Don't front-load everything. The hero section qualifies intent; the below-fold content converts it.

### Service Pillar Page (e.g., `/services/organizational-strategy`)

These are **pillar pages** in the topic cluster model. They must link to every sub-service page and serve as the topical authority hub.

| Element | Content Required |
|---|---|
| Hero | Pillar name + value proposition. Problem-first: "Your org chart shouldn't be your biggest bottleneck." |
| Overview | 200-300 words explaining the pillar's approach. Answer: "Why does this discipline matter?" |
| Sub-service cards | 5 cards: title, 2-sentence summary, icon, link. Each card should reference a client outcome. |
| Social proof cluster | 2-3 case study cards from this pillar + 1 testimonial relevant to this service area |
| Related industries | Icons/links to relevant industry pages — creates cross-cluster internal links |
| CTA | "Discuss Your [Pillar] Needs" — specific verb, not "Learn More" |

### Individual Service Page (e.g., `/services/organizational-strategy/change-management`)

These pages do the heaviest conversion lifting. Per Semrush (2024 content research): pages with 1,000-2,000 words of unique content rank 3x better than thin pages (<500 words). The current site's biggest problem is duplicated content across service pages.

| Element | Content Required | Writing Guidance |
|---|---|---|
| Hero | Service name + 1-sentence value | Lead with the client's pain, not the service name |
| Problem statement | 1-2 paragraphs: what problems signal a need | Use "You..." language. Describe symptoms the buyer recognizes. |
| Our approach | 3-5 steps or methodology description | Numbered steps with clear deliverables at each stage |
| Deliverables | Bulleted list of what the client receives | Be specific: "90-day implementation roadmap" not "a plan" |
| Case study excerpt | 1 inline excerpt with link to full version | Include the headline metric — e.g., "40% faster adoption" |
| Related services | 2-3 adjacent service links | Cross-links within the pillar cluster |
| FAQ | 3-5 common questions | Use actual questions from sales calls. These also generate FAQ schema for SERPs. |
| CTA | "Start a [Service] Engagement" | Specific to the service, not generic |
| **Word count** | **800-1200 words UNIQUE copy** | **This is non-negotiable. Duplicated content is worse than no content.** |

**FAQ content note:** Per Semrush: pages with FAQ sections rank for 2-3x more long-tail keywords. The FAQ schema also generates rich results in Google SERPs. Source FAQ questions from actual sales conversations and HubSpot form submissions.

### Case Study Page (e.g., `/case-studies/airline-automation`)

Per Demand Gen Report (2024 Content Preferences Survey): **73% of B2B buyers say case studies are the most influential content type** in their buying decision. Case studies are SEQTEK's most important conversion content, yet the current site has zero client testimonials in any case study.

| Element | Content Required | Writing Guidance |
|---|---|---|
| Hero metric | 1 headline outcome stat ("90% reduction in hard resets") | This is the hook. If you can't quantify the outcome, the case study isn't ready. |
| Sidebar summary | Industry, company size, geography, services applied, technologies | Scannable at-a-glance context for skimmers |
| The Challenge | 2-3 paragraphs, specific | Describe the business problem, not the technical problem. What was at stake? |
| The Approach | 2-3 paragraphs with named technologies and methodology | Show the thinking, not just the tools. Why this approach? |
| The Results | Quantified metrics: numbers, percentages, timeframes | Per Content Marketing Institute: case studies with 3+ metrics are shared 2x more |
| Key takeaways | 3-5 bulleted lessons | Make these transferable — the reader should think "that applies to us" |
| Technologies | Tag list, linked to relevant service pages | Internal linking opportunity |
| Client testimonial | Full-attribution quote | **CURRENTLY MISSING FROM ALL 8 CASE STUDIES — THIS IS THE #1 CONTENT FIX** |
| Related case studies | 2-3 links (same industry or same service) | Keeps buyers in the consideration loop |
| CTA | "Get Similar Results" -> booking | Outcome-oriented, not process-oriented |
| Image | Real project screenshot, diagram, or team photo. NOT stock. | Per BrightLocal: content with authentic imagery gets 45% more engagement |

**Existing case study issues to fix:**
- "Driving Innovation in Drill Bit Technology" — title, image, and subtitle describe a drill bit project but content is about healthcare UX. **Must be corrected before launch.**
- All 8 case studies need a client testimonial added.
- All need technology tags cleaned up and linked to service pages.

**Case study format recommendation:** Per Content Marketing Institute and Demand Gen Report, the most effective B2B case study format is:

1. **Headline metric** (the hook)
2. **30-second summary** (for executives who won't read the full study)
3. **Full narrative** (Challenge → Approach → Results)
4. **Client quote** (the trust seal)
5. **"What this means for you"** section (makes it about the reader, not SEQTEK)

### Blog Post (`/insights/[slug]`)

Per Orbit Media Annual Blogging Survey (2024): the average blog post is now 1,427 words and takes 4 hours to write. Posts over 2,000 words get 56% more social shares and significantly more backlinks than shorter posts. Quality and depth matter more than frequency for B2B.

| Element | Content Required |
|---|---|
| Title | SEO-optimized, specific. Per Backlinko: titles with 14-17 words get 76.7% more social shares than short titles. |
| Author | Full name, headshot, link to team bio. **Required for E-E-A-T.** |
| Date | Published date + "Last updated" date if refreshed |
| Category/tags | Assigned to at least one category |
| Featured image | Relevant, ideally original or branded. Include descriptive alt text. |
| Body | 1,500-2,500 words, H2/H3 structure. Per Semrush: posts with 7+ headings get 36% more traffic. |
| Inline CTAs | 2-3 contextual CTAs within body (anchor text, not banners). Per HubSpot: anchor text CTAs convert 121% better than banner CTAs. |
| Related posts | 3 related articles |
| Related services | Links to relevant service pages — cross-cluster internal links |
| Social sharing | Share buttons (LinkedIn priority for B2B) |
| Meta | SEO title, description, OG image |

**Publishing cadence recommendation:** Per HubSpot (2024): B2B companies that publish 2-4 blog posts per month generate 3.5x more traffic than those publishing less than monthly. For a firm of SEQTEK's size with content constraints, target **2 posts per month** post-launch. Quality over quantity — one well-researched, expert-authored post is worth more than four thin posts.

### Industry Page (e.g., `/industries/energy-oil-gas`)

| Element | Content Required |
|---|---|
| Hero | Industry-specific value prop — name the industry's specific challenge |
| Context | 2-3 paragraphs on challenges in this industry. Use industry-specific language and cite industry reports. |
| Services | Which SEQTEK services are most relevant, with brief explanations of why |
| Case studies | 2-3 cards from this industry |
| Stats | Industry-specific numbers (cite sources) |
| Client logos | Industry-specific subset |
| CTA | "Talk to Our [Industry] Team" |
| Word count | 600-900 words |

### Market Landing Page (e.g., `/tulsa-consulting`)

**Local SEO note:** Per Moz Local Search Ranking Factors (2024) and Google Business Profile documentation: multi-market firms must demonstrate genuine local presence. These pages must contain unique local content — not templated copies with city names swapped. Google's Helpful Content Update specifically targets thin, template-generated location pages.

| Element | Content Required |
|---|---|
| Hero | "[City] Technology Consulting by SEQTEK" |
| Local context | 2-3 paragraphs about SEQTEK's presence in this market. **Must be genuinely unique per city** — mention local clients (with permission), local events, local industry landscape. |
| Services | All 3 pillars with links |
| Local case studies | Projects completed for clients in this market |
| Local details | Office address (if applicable), years in market, local phone number if available |
| CTA | "Connect with our [City] team" |
| Word count | 500-800 words of **unique** content per page |
| Structured data | LocalBusiness schema with city-specific address. Per Google: `ProfessionalService` subtype is most appropriate. |

**Google Business Profile requirement:** Each market where SEQTEK has a physical presence should have a verified Google Business Profile. For markets without a physical office, use the `ServiceArea` business type. Do NOT create fake office listings.

### Touchstone Workshop Pages

| Element | Content Required |
|---|---|
| Landing hero | "Touchstone Workshops" branded + Sequoyah/touchstone connection |
| Name explanation | Why "Touchstone"? Connection to heritage and testing authenticity |
| Workshop progression | Visual showing 3-workshop sequence |
| Stats | 70% fail rate, $2.3T lost (**with cited sources** — currently unsourced. Likely from McKinsey or BCG research. Verify and cite.) |
| Individual pages | Full description, agenda/format, deliverables, duration, audience, facilitator bio, CTA |
| Testimonial | From a past workshop participant |
| CTA | "Schedule a Touchstone Workshop" |

**Workshop page note:** These pages function as product pages, not content pages. Per Unbounce: product/service pages with clear format + duration + audience + deliverables convert 25% better than vague descriptions. Be specific: "Half-day workshop. 4-12 participants. Delivered on-site or virtually."

### Assessment Landing Page (`/resources/organizational-maturity-assessment`)

Per Demand Gen Report (2024 Content Preferences Survey): interactive assessments are the #2 most effective B2B lead generation tool (after webinars). They generate 4-5x more leads than static downloadable content.

| Element | Content Required |
|---|---|
| What the assessment measures | Clear explanation of dimensions (Org Strategy, Leadership, etc.). Use a visual showing the dimensions. |
| What the user gets back | Specific: "A personalized maturity scorecard with benchmarks against similar organizations and 3 prioritized recommendations." Not: "Results." |
| How long it takes | Time estimate — per Typeform research: stating "Takes 5 minutes" increases completion rates by 25% |
| Who it's for | Target audience (C-suite, VP-level, directors — be specific) |
| Social proof | "500+ organizations have taken this assessment" (if true) |
| Privacy note | "Your responses are confidential. We'll email your results — no sales call required." Per Demand Gen Report: removing the implied sales obligation increases assessment starts by 40%. |
| CTA | Link to ScoreApp (opens in new tab or embeds) |

---

## 5. Content Governance

### 5A. Voice and Tone Guide

Establish these rules before any content is written:

**Voice (constant):** Knowledgeable, direct, human. SEQTEK has 25+ years of expertise — the voice should reflect earned authority, not performed confidence.

**Tone (varies by context):**
- **Service pages:** Confident and consultative. "Here's how we solve this."
- **Case studies:** Evidence-based and specific. Let the numbers speak.
- **About/story pages:** Warm and authentic. This is where personality lives.
- **Blog/insights:** Educational and generous. Share real expertise, not teasers.
- **CTAs:** Direct and specific. No hedging.

**Words to use:** Transform, partner, results, strategy, implement, deliver, local, proven
**Words to avoid:** Synergy, leverage (as a verb), cutting-edge, best-in-class, world-class, disruptive, turnkey, solutions (when used as a standalone noun)

**Pronoun rules:**
- Use "we" for SEQTEK voice
- Use "you/your" for addressing the reader
- Never use "one" or passive constructions when addressing the buyer

### 5B. Content Quality Gates

No content goes live without passing these checks:

| Gate | Check | Who |
|---|---|---|
| **Accuracy** | All stats verified, all claims sourced, all dates confirmed | Content lead |
| **Brand voice** | Passes the voice/tone guide. No buzzword violations. | Content lead |
| **SEO** | Primary keyword in title, H1, first 100 words, meta description. Internal links present. | SEO review |
| **Accessibility** | Alt text, heading hierarchy, reading level, link text | Dev + content |
| **Legal** | Client names used with permission, logo usage approved, no unverified claims | Leadership sign-off |
| **Technical** | Structured data correct, OG image present, canonical URL set | Dev |

### 5C. Content Refresh Cadence

Per HubSpot (2024): updating existing content generates 106% more organic traffic than publishing new content. Establish a refresh calendar:

- **Homepage:** Review quarterly
- **Service pages:** Review every 6 months or when offerings change
- **Case studies:** Review annually; add new ones as projects complete
- **Blog posts:** Audit annually; update or consolidate underperforming posts
- **Team page:** Update immediately when team changes occur
- **Stats/metrics:** Verify annually (at minimum)

---

## 6. Testimonial Requirements (Site-Wide)

The current anonymous format (first name + initial) **actively undermines credibility.** Per BrightLocal (2024 Consumer Review Survey): 79% of consumers say they trust full-attribution reviews as much as personal recommendations, but only 22% trust anonymous reviews.

Per Spiegel Research Center (Northwestern University): displaying reviews with full attribution increases conversion rates by up to 270% for higher-priced services.

For every testimonial on the site:

- [ ] Full name (first and last)
- [ ] Job title
- [ ] Company name
- [ ] Headshot photo
- [ ] Quote (2-4 sentences — per BrightLocal, reviews between 75-200 words are perceived as most helpful)
- [ ] Optional: LinkedIn profile URL (adds verification layer)
- [ ] Optional: Video testimonial (even 30 seconds; per Wyzowl: video testimonials are trusted 2x more than text)

**Collection strategy:**
1. Contact Mike K., Cindy B., Kevin R. from the current site for full attribution permission.
2. If they decline, replace — do not keep anonymous testimonials.
3. Target **12-15 total testimonials** (up from 8-12) distributed as:
   - 2-3 per service pillar
   - 1-2 per major industry
   - 2-3 specifically about localshoring
   - 1-2 about Touchstone Workshops
4. **Template the ask.** Send clients a brief guide: "We'd love a 2-3 sentence quote about [specific project/outcome]. Here's an example of the format..." Pre-written prompts increase response rates by 3x per Testimonial Hero research.
5. Start collection in Week 1 — testimonials have the longest lead time of any content asset.

---

## 7. Content Prioritization

Content is the bottleneck. Engineering can proceed with placeholder content. This schedule is restructured around **buyer impact** and **dependency chains**, not page count.

### Critical Path: What Blocks Revenue

These items are sequentially dependent. Delays cascade.

```
Week 1: Leadership interviews + photo shoot scheduling + testimonial outreach begins
   ↓
Week 2: Sequoyah brand story draft + leadership bios draft + photo shoot
   ↓
Week 3: Mission/Vision/Values + localshoring explanation + homepage hero copy
   ↓
Week 4: Service pillar landing pages + case study rewrites begin
```

### Tier 1: Write First (Weeks 1-4) — Blocks Launch

| # | Content | Status | Depends On | Buyer Journey Stage |
|---|---|---|---|---|
| 1 | Sequoyah brand story (400-600 words) | Write from scratch | Hank Haines interview | Decision (trust) |
| 2 | Leadership bios (3 x 200-350 words) | Write from scratch | Photo shoot + interviews | Decision (trust) |
| 3 | Mission / Vision / Values | Write from scratch | Leadership alignment session | Decision (trust) |
| 4 | Localshoring explanation | Rewrite from existing | Leadership interview | Consideration |
| 5 | Homepage hero copy | Write from scratch | Brand story must be done first | Awareness (routing) |
| 6 | 3 service pillar landing pages | Rewrite (partially usable) | — | Consideration |

### Tier 2: Write Second (Weeks 4-7) — Highest Conversion Impact

| # | Content | Status | Depends On | Buyer Journey Stage |
|---|---|---|---|---|
| 7 | 8 case study rewrites + testimonials | Edit existing | Client testimonial collection | Consideration (strongest) |
| 8 | Testimonial upgrades (12-15) | Re-collect with full attribution | Client outreach | All stages |
| 9 | 15 individual service descriptions | 5 partial, 10+ rewrite | No dependencies | Consideration |
| 10 | Touchstone Workshop landing + branding | Rebrand with Touchstone name | Brand story | Decision |

### Tier 3: Write Third (Weeks 7-10) — SEO and Completeness

| # | Content | Status | Depends On | Buyer Journey Stage |
|---|---|---|---|---|
| 11 | 3 workshop detail pages | Write from scratch | Workshop landing | Decision |
| 12 | 6 industry pages | Write from scratch | Case studies done | Awareness |
| 13 | 4 market landing pages | Write from scratch | — | Awareness (local SEO) |
| 14 | Blog migration (6 posts) | Migrate, add author/categories | Team page done | Awareness |
| 15 | Contact page rewrite + booking | Rewrite | HubSpot Meetings setup | Decision |
| 16 | Assessment landing page | Write from scratch | ScoreApp setup | Consideration |

### Tier 4: Write Fourth (Weeks 10-14) — Growth Engine

| # | Content | Status | Buyer Journey Stage |
|---|---|---|---|
| 17 | Careers page | Write from scratch | Trust signal |
| 18 | Resources/downloads hub | Write from scratch | Consideration |
| 19 | First lead magnet | Create downloadable asset | Awareness → Consideration |
| 20 | FAQ content for service pages | Write from scratch | Consideration (+ SEO) |
| 21 | 2-4 new blog posts | Write optimized for target keywords | Awareness |

**Lead magnet recommendation:** Per Demand Gen Report (2024): the most effective B2B lead magnets for consulting firms are (in order): assessment tools, benchmark reports, maturity models, and templates. The ScoreApp assessment already covers #1. For #2, consider an "Oklahoma Digital Transformation Benchmark Report" based on anonymized client data — this also creates a PR and backlink opportunity.

### Production Dependencies (Critical Path)

```
WEEK 1 (parallel):
├── Photo shoot scheduled (blocks: team page, about page, case studies)
├── Leadership interviews begin (blocks: brand story, bios, timeline, localshoring)
├── Client outreach for testimonials starts (long lead time — 3-6 weeks typical)
├── Voice & tone guide finalized (blocks: all content writing)
└── Cherokee Nation cultural review request sent (blocks: brand story final approval)

WEEK 2:
├── Photo shoot completed
├── Brand story first draft
└── Bio drafts from interview transcripts

WEEK 3-4:
├── ScoreApp account review (blocks: assessment landing page)
├── HubSpot Meetings configuration (blocks: booking page)
└── Homepage and pillar page drafts

WEEK 5+:
└── Content production at full velocity — all dependencies cleared
```

---

## 8. SEO Strategy

### URL Structure

All URLs are flat, keyword-rich, and human-readable. No numbers, no Wix auto-generated slugs.

### 301 Redirect Map (Critical for Domain Authority Preservation)

Per Google Search Central (2024 site migration guidance) and Moz: **failing to implement 301 redirects during a site migration can result in 60-80% traffic loss.** Every old Wix URL must 301 redirect to its new location. Configured in `next.config.ts`.

**Migration protocol (per Google Search Central):**
1. Map every indexed URL (use Google Search Console "Pages" report for the full list)
2. Implement 301 redirects (not 302 — 302s do not transfer link equity)
3. Submit updated sitemap to Google Search Console on launch day
4. Monitor Search Console for 404 errors weekly for 90 days post-launch
5. Keep redirects in place **permanently** — removing them after a few months loses accumulated link equity

| Old URL (Wix) | New URL | Notes |
|---|---|---|
| `/about-us-1` | `/about` | |
| `/our-services` | `/services` | |
| `/workshops` | `/touchstone-workshops` | |
| `/blog-old` | `/insights` | |
| `/blog-old/[slug]` | `/insights/[slug]` | Match individual post slugs |
| `/organizational-strategy-1-5` | `/resources/organizational-maturity-assessment` | Assessment |
| `/organizational-strategy-1-1-1-3` | `/case-studies/airline-automation` | Verify mapping |
| `/organizational-strategy-1-1-1-3-1` | `/case-studies/oil-gas-modernization` | Verify mapping |
| `/organizational-strategy-1-1-1-3-1-1` | `/case-studies/banking-integration-platform` | Verify mapping |
| `/case-study-3` | `/case-studies/mobile-apps-remote-operations` | Verify mapping |
| `/case-study-4` | `/case-studies/retail-pos-update-experience` | Verify mapping |
| `/case-study-5` | `/case-studies/data-warehouse-strategy` | Verify mapping |
| `/driving-innovation-case-study` | `/case-studies/healthcare-ux-redesign` | |
| `/modernizing-healthcare-case-study` | `/case-studies/healthcare-data-modernization` | |
| `/contact` | `/contact` | Verify no trailing differences |
| `/privacy-policy` | `/privacy-policy` | Same path |

**Action required:**
1. Verify the case study URL-to-content mappings against `audit/case-studies-content.json` before configuring redirects.
2. **Crawl the current Wix site** (Screaming Frog or similar) to identify ALL indexed URLs, not just the ones listed here. There may be Wix-generated variants (with query strings, trailing slashes, `/amp/` versions) that also need redirects.
3. Check Google Search Console for any URLs receiving organic traffic that aren't in this list.

### Structured Data Schemas

Per Google Search Central (2024): structured data does not directly impact rankings, but it enables rich results (review stars, FAQ dropdowns, breadcrumbs, author info) that significantly improve click-through rates. Per Semrush: pages with rich results get 58% higher CTR than pages without.

| Page Type | Schema | Key Properties | Rich Result Enabled |
|---|---|---|---|
| All pages | `Organization` | name, url, logo, foundingDate, founders, address, telephone, sameAs | Knowledge panel |
| Homepage + market pages | `LocalBusiness` (`ProfessionalService`) | address, geo, areaServed, openingHours | Local pack |
| Team page | `Person` (per member) | name, jobTitle, worksFor, image, sameAs (LinkedIn) | Knowledge panel |
| Service pages | `Service` | name, description, provider, areaServed | — |
| Blog posts | `Article` | headline, author, datePublished, dateModified, publisher, image | Article rich result |
| All pages | `BreadcrumbList` | Breadcrumb trail matching URL hierarchy | Breadcrumb rich result |
| Pages with FAQ | `FAQPage` | Question/Answer pairs | FAQ rich result (accordion) |
| Pages with testimonials | `Review` | author, reviewBody, itemReviewed | Review stars |

**Validation requirement:** All structured data must pass the Google Rich Results Test before launch. Add structured data validation to the CI pipeline if possible.

### Meta Data Template

Every page needs:
- `<title>`: 50-60 characters, primary keyword first, brand last. Per Moz (2024): titles truncated at 60 characters lose 20% of their CTR impact.
- `<meta name="description">`: 150-160 characters, includes keyword and CTA language. Per Portent: meta descriptions with a call to action generate 18% higher CTR.
- `og:title`, `og:description`, `og:image` (1200x630px)
- `og:type`: "website" for pages, "article" for blog
- `twitter:card`: "summary_large_image" for all pages
- `<link rel="canonical">`: Self-referencing
- Heading hierarchy: Single `<h1>` per page, semantic `<h2>`/`<h3>` structure, no skipped levels

### Target Keywords

Per Semrush and Ahrefs research (2024): for B2B services in regional markets, long-tail keywords with local modifiers have 3-5x higher conversion rates than generic terms, despite lower search volume.

| Page | Primary | Secondary | Search Intent |
|---|---|---|---|
| Homepage | tulsa technology consulting | business consulting tulsa, IT consulting oklahoma | Commercial |
| About | seqtek about, sequoyah technologies | tulsa consulting firm, localshoring | Navigational |
| Localshoring | localshoring, local consulting alternative | nearshore vs local, onshore consulting | Informational/Commercial |
| Change Management | change management consulting oklahoma | organizational change management | Commercial |
| Cloud Infrastructure | cloud consulting tulsa | cloud migration oklahoma, AWS consulting | Commercial |
| AI Readiness | AI consulting oklahoma | AI strategy, AI readiness assessment | Commercial |
| Case Studies index | technology consulting case studies | digital transformation results | Commercial |
| Tulsa landing | tulsa technology consulting | tulsa IT consulting, tulsa IT services | Commercial (local) |
| OKC landing | OKC technology consulting | oklahoma city IT consulting | Commercial (local) |
| NW Arkansas landing | NW arkansas technology consulting | fayetteville IT consulting, bentonville consulting | Commercial (local) |
| Kansas City landing | kansas city technology consulting | KC IT consulting | Commercial (local) |

**Keyword gap analysis:** After launch, run a keyword gap analysis (Semrush or Ahrefs) comparing SEQTEK's rankings against 3-5 regional competitors. This identifies high-value keywords competitors rank for that SEQTEK doesn't yet target.

### Internal Linking Architecture

Per HubSpot's topic cluster research (2024): sites with a deliberate internal linking strategy generate 53% more organic traffic than sites with ad-hoc linking.

**Mandatory linking rules:**
- Every blog post links to at least 1 service page and 1 case study
- Every case study links to services applied, industry page, and 1-2 related case studies
- Every service page links to at least 1 case study and 1 blog post
- Every industry page links to relevant case studies and services
- Pillar pages link down to ALL sub-services (this is what makes them pillar pages)
- Sub-service pages link across to adjacent sub-services within the same pillar
- All pages link to `/contact/book-a-call` via CTA

**Link audit post-launch:** Use Screaming Frog or Sitebulb to identify orphan pages (pages with zero internal links pointing to them). Every page on the site should have a minimum of 3 internal links pointing to it.

---

## 9. CTA Strategy

### The Conversion Ladder

Per HubSpot (2024) and Unbounce Conversion Benchmark Report: B2B services sites should offer CTAs at **three commitment levels**, not just "Book a Call." Most visitors aren't ready to talk to sales — give them a step they ARE ready to take.

| Commitment Level | What the Visitor Gives | What They Get | CTA Examples |
|---|---|---|---|
| **Low** (anonymous) | Attention only | Insight, education | "Read the Case Study," "Explore Our Services," "See How We Helped [Industry]" |
| **Medium** (identified) | Email address | Assessment results, insights subscription, lead magnet | "Take the Assessment," "Subscribe to Insights," "Download the Benchmark Report" |
| **High** (sales-ready) | Calendar time | Strategy conversation, workshop consultation | "Book a 30-Minute Strategy Call," "Schedule a Touchstone Workshop," "Request a Proposal" |

**The critical insight:** Per Gartner B2B buying research: only 5-10% of website visitors are ready for a sales conversation at any given time. If "Book a Call" is your only meaningful CTA, you're losing 90% of your potential pipeline. The ScoreApp assessment and email subscription are essential mid-funnel conversion paths.

### CTA Placement by Page Type

| Page Type | Primary CTA | Secondary CTA | Inline CTAs |
|---|---|---|---|
| Homepage | Book a 30-Minute Strategy Call | Take the Organizational Assessment | Service links, case study links |
| About pages | Meet the Team / Work With Us | See Our Work | Story links, localshoring |
| Service landing | Discuss Your [Pillar] Needs | See Related Case Studies | — |
| Service detail | Start a [Service] Engagement | Take the Assessment | Inline case study link |
| Case study | Get Similar Results | Explore More Case Studies | Related service links |
| Industry | Talk to Our [Industry] Team | See [Industry] Case Studies | — |
| Blog post | Subscribe to SEQTEK Insights | Book a Strategy Call | 2-3 anchor-text CTAs in body |
| Workshops | Schedule a Touchstone Workshop | Start the Conversation | Individual workshop CTAs |
| Contact | Submit form / Book a call | Take the Assessment | — |
| Market landing | Connect with Our [City] Team | See Local Case Studies | — |

### CTA Design and Copy Rules

1. **Never use "Learn More"** — per Unbounce: the least-converting CTA in B2B. Replaced by specific alternatives like "Read the Case Study" or "See Our Change Management Approach."
2. **Never use "Request Info"** — passive and vague. Use "Request a Proposal" or "Get a Custom Assessment."
3. **Every CTA tells the visitor what happens next.** "Book a 30-Minute Strategy Call" > "Contact Us." Per HubSpot: CTAs that set time expectations ("30-minute," "5-minute assessment") convert 10-15% better.
4. **Use first-person on buttons where possible.** Per Unbounce A/B testing: "Start MY Assessment" converts 24% better than "Start Your Assessment."
5. Primary CTAs: solid brand accent color button.
6. Secondary CTAs: outline/ghost button.
7. Blog inline CTAs: anchor text style. Per HubSpot (2014 study, still cited as benchmark): anchor text CTAs convert 121% better than banner CTAs.
8. Mobile: Persistent bottom bar with "Book a Call" on all pages except `/contact` and `/contact/book-a-call`.
9. **CTA frequency:** Per Chartbeat scroll-depth data: place a CTA within the first viewport, another at 50% scroll depth, and a final CTA at page end. Three touchpoints, not one.

---

## 10. Content Performance Measurement

Content without measurement is guesswork. Define success metrics before writing, not after.

### KPIs by Content Type

| Content Type | Primary Metric | Secondary Metrics | Measurement Tool |
|---|---|---|---|
| Homepage | Bounce rate, CTA click rate | Time on page, scroll depth | GA4, Hotjar/MS Clarity |
| Service pages | Form submissions, CTA clicks | Organic traffic, avg. time on page | GA4, HubSpot |
| Case studies | PDF downloads, "Book a Call" clicks | Pageviews from service pages (internal traffic flow) | GA4 |
| Blog posts | Organic sessions, email signups | Social shares, backlinks acquired | GA4, Ahrefs/Semrush |
| Market landing pages | Local organic traffic, form submissions | Google Business Profile actions | GA4, GBP insights |
| Assessment | Assessment starts, completions, email captures | Completion rate, lead-to-opportunity rate | ScoreApp, HubSpot |
| Testimonials | N/A (supporting element) | A/B test: pages with vs. without testimonials | GA4 experiments |

### Baseline and Target Setting

Before launch, document current metrics for every page being replaced (from Google Analytics and Search Console). Post-launch targets:

| Metric | 30-Day Target | 90-Day Target |
|---|---|---|
| Organic traffic | Match pre-migration baseline | 20% above baseline |
| Average session duration | 2+ minutes | 2.5+ minutes |
| Bounce rate (homepage) | < 50% | < 40% |
| Assessment starts per month | 20 | 50 |
| Strategy calls booked per month | 8 | 15 |
| Blog email signups per month | 25 | 75 |

**Post-launch monitoring:** Check Google Search Console daily for the first 2 weeks, then weekly for 90 days. Watch for:
- 404 errors from missed redirects
- Indexing issues (pages not being indexed)
- Ranking drops on key terms
- Core Web Vitals failures

---

## 11. Content Asset Summary

| Asset Type | Count | Status | Priority |
|---|---|---|---|
| Voice & tone guide | 1 | Write from scratch | **Pre-production** |
| Brand narrative (Sequoyah story) | 1 | Write from scratch | Tier 1 |
| Leadership bios | 3 | Write from scratch | Tier 1 |
| Additional team bios | 6-8 (recommended) | Write from scratch | Tier 2 |
| Mission/Vision/Values | 1 set | Write from scratch | Tier 1 |
| Localshoring explanation | 1 page | Rewrite from existing | Tier 1 |
| Service pillar descriptions | 3 | Rewrite | Tier 1 |
| Individual service descriptions | 15 | 5 partial, 10+ full rewrite | Tier 2 |
| Case study rewrites | 8 | Content exists, needs editing + testimonials | Tier 2 |
| Workshop descriptions | 4 | Partially exist, needs Touchstone branding | Tier 2 |
| Industry pages | 6 | Write from scratch | Tier 3 |
| Market landing pages | 4 | Write from scratch (unique per city) | Tier 3 |
| Blog posts (migrate) | 6 | Migrate existing, add author/categories | Tier 3 |
| Blog posts (new) | 2-4 | Write optimized for target keywords | Tier 4 |
| Homepage copy | 1 | Rewrite | Tier 1 |
| Contact/booking page | 1 | Rewrite | Tier 3 |
| Assessment landing page | 1 | Write from scratch | Tier 3 |
| Careers page | 1 | Write from scratch | Tier 4 |
| Lead magnet (benchmark report) | 1 | Create downloadable asset | Tier 4 |
| FAQ content for service pages | 15 sets | Write from actual client questions | Tier 4 |
| Testimonials (full attribution) | 12-15 | Must re-collect | Tier 2 (start Week 1) |
| Professional headshots | 3-10 | Photo shoot required | Tier 1 (Week 1-2) |
| Candid/action photos | 15-20 | Photo shoot + ongoing | Tier 1 (Week 1-2) |
| Founder video (origin story) | 1 | Strongly recommended | Tier 1 (Week 2) |
| Company timeline data | 1 dataset | Gather from leadership | Tier 1 |
| Privacy policy | 1 | Update address and date | Tier 3 |
| Terms of service | 1 | Write from scratch (consult legal) | Tier 3 |

---

## 12. Image and Media Specifications

Per Google Core Web Vitals (2024) and web.dev guidance: image optimization is the single largest factor in page load performance, which directly impacts both SEO rankings and user experience.

### Image Delivery Requirements

| Image Type | Max File Size | Format | Dimensions | Notes |
|---|---|---|---|---|
| Hero images | 200KB | WebP (JPEG fallback) | 1920x1080 source, responsive srcset | Lazy load below-fold heroes |
| Headshots | 80KB | WebP (JPEG fallback) | 400x400 source | Eager load (above fold) |
| OG/social images | 300KB | JPEG (for compatibility) | 1200x630 | One per page |
| Blog featured images | 150KB | WebP (JPEG fallback) | 1200x675 source | Alt text required |
| Client logos | 20KB each | SVG preferred, PNG fallback | Variable, max 200px wide | Grayscale CSS filter, color on hover |
| Case study images | 150KB | WebP (JPEG fallback) | 1200x800 source | Real screenshots/diagrams, not stock |

### All Images Must Have

- `width` and `height` attributes in HTML (prevents CLS — Cumulative Layout Shift)
- Descriptive `alt` text (WCAG 2.2 AA requirement)
- `loading="lazy"` for below-fold images
- Responsive `srcset` for hero and featured images
- Next.js `<Image>` component handles most of this automatically — use it everywhere

### Video Requirements

- Host on YouTube or Vimeo (not self-hosted — CDN delivery, no bandwidth cost)
- Embed with `loading="lazy"` facade (don't load the player until clicked)
- Provide closed captions (WCAG 2.2 AA requirement)
- Provide transcript on page or linked
- Thumbnail: custom, not auto-generated

---

## Appendix A: Source References

This document cites the following authoritative sources. All are publicly available and should be verified before content production begins.

| Source | Citation | Used For |
|---|---|---|
| Donald Miller, *Building a StoryBrand* (2017) | StoryBrand framework, grunt test | Brand narrative structure |
| Marcus Sheridan, *They Ask, You Answer* (2017, rev. 2019) | Big 5 buyer questions, transparency principle | Service page content strategy |
| Edelman Trust Barometer (2024) | B2B trust metrics, origin story impact | Trust-building rationale |
| Gartner B2B Buying Research (2023-2024) | 17% supplier time, 27% online research | Buyer journey content mapping |
| Nielsen Norman Group | First impressions research, stock photo studies, readability | UX and content design |
| HubSpot (various 2024 reports) | CTA benchmarks, blogging cadence, content ROI | CTA and content strategy |
| Unbounce Conversion Benchmark Report (2024) | Headline specificity, first-person CTAs, CTA text | Conversion optimization |
| Content Marketing Institute | Content formats, case study effectiveness, visual content | Content type guidance |
| Demand Gen Report Content Preferences Survey (2024) | Case study influence (73%), assessment lead gen | Content prioritization |
| Semrush Content Research (2024) | Word count vs. ranking, heading frequency, FAQ impact | SEO content specifications |
| Orbit Media Annual Blogging Survey (2024) | Average post length, time investment, long-form ROI | Blog strategy |
| Moz / Moz Local (2024) | Title tag length, local SEO ranking factors | SEO specifications |
| BrightLocal Consumer Review Survey (2024) | Full attribution trust (79%), engagement with authentic imagery | Testimonial requirements |
| Spiegel Research Center (Northwestern) | Review attribution and conversion rates | Testimonial requirements |
| Wyzowl State of Video Marketing (2024) | Video adoption (91%), video testimonial trust | Video content recommendations |
| Vidyard B2B Video Benchmarks (2024) | Founder story video engagement | Brand story video |
| Google Search Central (2024) | Site migration, structured data, E-E-A-T, local SEO | SEO strategy |
| Google Quality Rater Guidelines (2024) | E-E-A-T criteria | Content quality framework |
| W3C WCAG 2.2 (2023) | Accessibility standards | Accessibility requirements |
| Google Core Web Vitals / web.dev | CLS, LCP, image optimization | Image specifications |
| CXL Institute | Stat specificity, comparison table engagement | Design guidance |
| Patrick Lencioni, *The Advantage* (2012) | Behavioral vs. aspirational values | Mission/Vision/Values |
| Hinge Research Institute (2024) | Professional services team page impact | Team page rationale |
