/**
 * Lighthouse CI — Phase 1 baseline.
 *
 * Budgets mirror ARCHITECTURE.md §7 exactly. Runs against the production
 * build (`npm run start`) so dev-mode overhead doesn't taint the numbers.
 *
 * Scope today is just `/`. Expand to the 5 archetype pages (Home, About,
 * Service Pillar, Service Detail, Case Study) per §12 Visual Regression
 * once those pages exist.
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      startServerCommand: 'npm run start',
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
      assertions: {
        // A11y / Best Practices / SEO are gating from day one. Current
        // empty-state baseline already clears all three (0.95 / 0.96 / 1.00).
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
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
