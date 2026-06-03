/**
 * Lighthouse CI.
 *
 * Budgets mirror ARCHITECTURE.md §7 exactly. Runs against the production
 * build (`npm run start`) so dev-mode overhead doesn't taint the numbers.
 *
 * Coverage (T127 / spec 003 Polish): homepage, one representative public
 * route, and the admin login (the one auth surface publicly reachable).
 * Expand to the 5 archetype pages (Home, About, Service Pillar, Service
 * Detail, Case Study) per §12 Visual Regression once spec 004 ships them.
 */

module.exports = {
  ci: {
    collect: {
      url: [
        // spec 004 T044 — the marquee + in-scope LISTING surfaces. The public
        // assertMatrix gate (a11y / best-practices / SEO ≥ 0.95) applies to
        // all of these; Performance budgets stay `warn` until Phase 5.
        //
        // CI runs LHCI against a freshly-migrated, EMPTY DB (the build must not
        // depend on DB content), so only routes that 200 without seeded content
        // are listed: the homepage + the collection listings (which render an
        // empty grid) + the admin login. CONTENT-dependent `pages` routes
        // (/about, /localshoring) and per-slug detail URLs 404 here — they get
        // LHCI coverage in a SEEDED environment (staging), tracked below, not
        // silently dropped.
        'http://localhost:3200/',
        'http://localhost:3200/team',
        'http://localhost:3200/case-studies',
        'http://localhost:3200/insights',
        'http://localhost:3200/services',
        'http://localhost:3200/touchstone-workshops',
        // spec 006 T031 — static legal route (200s against the empty CI DB);
        // carries the same public a11y/best-practices/SEO >= 0.95 gate, and
        // covers the footer consent-preferences control (present on every page).
        'http://localhost:3200/privacy-policy',
        'http://localhost:3200/admin/login',
        // Seeded-env-only (404 against the empty CI DB): /about, /localshoring,
        // and the per-slug detail URLs (/case-studies/<slug>, /touchstone-
        // workshops/<slug>). Add to a staging LHCI run with real content.
      ],
      // :3200 keeps this clear of the other localhost projects (the Nuxt
      // dev container that auto-binds :3000, and the Next dev script that
      // uses :3100). next start respects $PORT.
      //
      // /admin/* deeper authoring views are not in scope here — they're
      // behind auth and Payload's admin chrome isn't a SEO/best-practices
      // target the way the public site is. axe coverage of authoring views
      // lives in tests/a11y/adminAuthoring.e2e.spec.ts.
      startServerCommand: 'PORT=3200 npm run start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 90_000,
      numberOfRuns: 1,
      settings: {
        // Lighthouse defaults to a mobile form factor with 3G throttling,
        // which matches the harshest §7 target (Mobile LCP < 2.0s).
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      // assertMatrix so the public routes and the admin login can carry
      // different gates. LHCI applies the assertions of EVERY matching pattern
      // to a URL, so the public pattern uses a negative lookahead to exclude
      // /admin/* — otherwise /admin/login would inherit the public
      // SEO/best-practices error gates that, per the `collect` note above,
      // Payload's admin chrome was never meant to meet.
      assertMatrix: [
        {
          // Public site (everything except /admin/*). A11y / Best Practices /
          // SEO gate from day one; the empty-state baseline already clears all
          // three (0.95 / 0.96 / 1.00).
          matchingUrlPattern: '^(?!.*/admin/).*$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'categories:seo': ['error', { minScore: 0.95 }],

            // Performance budgets stay as warnings during Phase 1 (we're testing
            // an empty-state placeholder page against mobile 3G throttling on a
            // single localhost instance — no CDN, no real content). ROADMAP
            // Phase 5 "Polish" flips these to `error` once Performance ≥ 95
            // against the actual archetype pages (§7 launch targets).
            'categories:performance': ['warn', { minScore: 0.95 }],
            'largest-contentful-paint': ['warn', { maxNumericValue: 2000 }],
            'total-blocking-time': ['warn', { maxNumericValue: 100 }],
            'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
          },
        },
        {
          // Admin login: hold the auth form to the a11y bar, but skip the
          // SEO/best-practices gates — Payload's noindex admin SPA chrome
          // isn't a target for those (see the `collect` note above).
          matchingUrlPattern: '/admin/',
          assertions: {
            'categories:accessibility': ['error', { minScore: 0.95 }],
          },
        },
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
