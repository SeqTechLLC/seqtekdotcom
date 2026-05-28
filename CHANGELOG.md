# Changelog

## [0.2.0](https://github.com/SeqTechLLC/seqtekdotcom/compare/v0.1.0...v0.2.0) (2026-05-28)


### Features

* **auth:** finish /admin SSO login UI + restore LHCI gates ([85080d9](https://github.com/SeqTechLLC/seqtekdotcom/commit/85080d9076f5078338d851a8317074966f3e1d69))
* **auth:** foundational plugin wiring for /admin SSO (T001–T014) ([253a004](https://github.com/SeqTechLLC/seqtekdotcom/commit/253a004bb8c4980ec07a65c057d5d6b8f4f6680d))
* **auth:** Google Workspace SSO for /admin (D-14, spec 001) ([7c01a2b](https://github.com/SeqTechLLC/seqtekdotcom/commit/7c01a2bfafe4e22a35ff667e24314d638cca1497))
* **auth:** hook bodies, tests, and doc reconciliation (Phases 3-6) ([13e8272](https://github.com/SeqTechLLC/seqtekdotcom/commit/13e8272cb57a06e1e9adfcd7a899d2aa48a0ecde))
* **auth:** replace payload-auth-plugin with custom OAuth integration ([7af0ce8](https://github.com/SeqTechLLC/seqtekdotcom/commit/7af0ce8d17078c0997758ac3741d4678f0571cc0))
* **health:** /api/health probe for the ALB target group ([32d1dff](https://github.com/SeqTechLLC/seqtekdotcom/commit/32d1dff9e1f3e5d829e235a6c2115a17efd15727))
* **infra:** 002 — AWS CDK infrastructure + blue-green CI/CD ([#3](https://github.com/SeqTechLLC/seqtekdotcom/issues/3)) ([90d81d3](https://github.com/SeqTechLLC/seqtekdotcom/commit/90d81d39aaf9d9b201672bf3ca939aa02df2cb48))
* **infra:** 002 Phase 5 T038-T042 — observability stack + Slack notifier ([#7](https://github.com/SeqTechLLC/seqtekdotcom/issues/7)) ([3d83792](https://github.com/SeqTechLLC/seqtekdotcom/commit/3d83792be6079699be5b9496c18603d162ad8e16))
* **integrations:** nonce-aware HubSpot + GTM bootstrap ([4ca5899](https://github.com/SeqTechLLC/seqtekdotcom/commit/4ca58991cb9f381aa40f88c49424c4f963743a15))
* **layout:** apply D-1 tokens and ship base layout chrome ([2660307](https://github.com/SeqTechLLC/seqtekdotcom/commit/266030735fb249ed30d4320cbea52251136e739d))
* **security:** nonce-based CSP via Next.js Proxy + /api/csp-report sink ([f18d5b7](https://github.com/SeqTechLLC/seqtekdotcom/commit/f18d5b7240ca85ddfe61134570eaf7a9cf1fa270))
* **spike:** scaffold Next 16 + Payload 3.84 + Postgres + Tailwind v3 stack ([cbcf3f3](https://github.com/SeqTechLLC/seqtekdotcom/commit/cbcf3f315e98b30c3a9d87d25f4e24ba7bf71407))


### Bug Fixes

* **auth:** HTML bounce page on OAuth callback so /admin keeps the cookie ([339c521](https://github.com/SeqTechLLC/seqtekdotcom/commit/339c5211832a61302ea7316022c60d0dd0ac3066))
* **auth:** issue sessions-aware JWT so /admin honors our cookie ([1340a3d](https://github.com/SeqTechLLC/seqtekdotcom/commit/1340a3d19859ff8fd5512a6653bd4904656e91a0))
* **auth:** OAuth entry path is /authorization/, not /authorize/ ([d4d1983](https://github.com/SeqTechLLC/seqtekdotcom/commit/d4d1983b44c66a2ae8bd8684c2d147878792033c))
* **auth:** register local-jwt strategy explicitly (disableLocalStrategy skips it) ([f93555d](https://github.com/SeqTechLLC/seqtekdotcom/commit/f93555d61465854fc57adb819cbc3a9ab1028cac))
* **auth:** use disableLocalStrategy.enableFields so sessions table exists ([82839e8](https://github.com/SeqTechLLC/seqtekdotcom/commit/82839e8245b9bd34494423c48c6ccd9cdb11c4c5))
* **infra:** staging CD — split IAM + explicit instance-refresh ([#4](https://github.com/SeqTechLLC/seqtekdotcom/issues/4)) ([bacd00f](https://github.com/SeqTechLLC/seqtekdotcom/commit/bacd00f82873daa10cbaa2b21c048d645200d060))
