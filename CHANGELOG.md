# Changelog

## [0.3.0](https://github.com/SeqTechLLC/seqtekdotcom/compare/v0.2.0...v0.3.0) (2026-07-01)


### Features

* **auth:** admit [@seqtek](https://github.com/seqtek).com Workspace domain to /admin (+ Megan-meeting roadmap reconcile) ([#77](https://github.com/SeqTechLLC/seqtekdotcom/issues/77)) ([656e451](https://github.com/SeqTechLLC/seqtekdotcom/commit/656e451682e1cc36d6f81c74809bc21e056efb08))
* block-composed pages — two content primitives (spec 010) ([#66](https://github.com/SeqTechLLC/seqtekdotcom/issues/66)) ([8704344](https://github.com/SeqTechLLC/seqtekdotcom/commit/87043443c3de626d4ae89a00bdd4634ebc72696a))
* **brand:** quill favicon from the SEQTEK logo Q mark ([#48](https://github.com/SeqTechLLC/seqtekdotcom/issues/48)) ([ffc0674](https://github.com/SeqTechLLC/seqtekdotcom/commit/ffc0674d3db499251ea8db5ca1d6c419c5e13261))
* **contact:** wire the live HubSpot Contact form GUID ([#76](https://github.com/SeqTechLLC/seqtekdotcom/issues/76)) ([a0a4015](https://github.com/SeqTechLLC/seqtekdotcom/commit/a0a4015b41bf37c12a749890142ee0fd84208028))
* mid-post insight illustrations + body alignment fix ([#60](https://github.com/SeqTechLLC/seqtekdotcom/issues/60)) ([6926332](https://github.com/SeqTechLLC/seqtekdotcom/commit/6926332d649897bb471bd4f2bd468a5514768e49))
* **services:** restructure /services into four peer offerings ([#79](https://github.com/SeqTechLLC/seqtekdotcom/issues/79)) ([fa66a98](https://github.com/SeqTechLLC/seqtekdotcom/commit/fa66a98b00f6f8019d750a7629e58bbb62045736))
* **tools:** generic payload-seed CLI for any collection/global from JSON ([#82](https://github.com/SeqTechLLC/seqtekdotcom/issues/82)) ([e8a719f](https://github.com/SeqTechLLC/seqtekdotcom/commit/e8a719fc34d8827bc90e03229d8aa89de8cade7e))
* **ui:** make whole section cards clickable across the app ([#78](https://github.com/SeqTechLLC/seqtekdotcom/issues/78)) ([b8d4ebe](https://github.com/SeqTechLLC/seqtekdotcom/commit/b8d4ebec222b18db532b0f63fdf2fa756e1daefb))
* **ui:** render case study hero image on the detail page ([#57](https://github.com/SeqTechLLC/seqtekdotcom/issues/57)) ([39dfccd](https://github.com/SeqTechLLC/seqtekdotcom/commit/39dfccdbd4c0e570f9a1c642205be7675c924132))
* **ui:** render featured image on insight detail pages ([#59](https://github.com/SeqTechLLC/seqtekdotcom/issues/59)) ([98cf157](https://github.com/SeqTechLLC/seqtekdotcom/commit/98cf157d91d0a15afc663bc30720bea13c869bd6))
* **ui:** render homepage client-logo strip in full color ([#61](https://github.com/SeqTechLLC/seqtekdotcom/issues/61)) ([6fab2fc](https://github.com/SeqTechLLC/seqtekdotcom/commit/6fab2fcc7d2e07c0ab69a0a9d5619193b3fbab34))
* **ui:** render workshop deliverables; BrandTeaser full-width sans image ([#56](https://github.com/SeqTechLLC/seqtekdotcom/issues/56)) ([cfded6c](https://github.com/SeqTechLLC/seqtekdotcom/commit/cfded6c269841d4c23dce860378181ea6be0590c))
* **ui:** warm-paper visual system — one grid rail, one card grammar ([#55](https://github.com/SeqTechLLC/seqtekdotcom/issues/55)) ([66451bc](https://github.com/SeqTechLLC/seqtekdotcom/commit/66451bcad8e764e50dbbbb3a6f738824a5e09931))
* **workshops:** proof section — photo gallery + recap video on detail pages ([#50](https://github.com/SeqTechLLC/seqtekdotcom/issues/50)) ([32d9511](https://github.com/SeqTechLLC/seqtekdotcom/commit/32d951186babce7d588ad8be8d25a29a0a76b100))
* **workshops:** wire the Workshop Inquiry HubSpot form onto workshop pages ([#74](https://github.com/SeqTechLLC/seqtekdotcom/issues/74)) ([0b4276c](https://github.com/SeqTechLLC/seqtekdotcom/commit/0b4276ca6f7e8f0734db96ad4b5beed19e855306))


### Bug Fixes

* **deploy:** deliver NEXT_PUBLIC_* client IDs to the staging build via build args ([#46](https://github.com/SeqTechLLC/seqtekdotcom/issues/46)) ([09c7533](https://github.com/SeqTechLLC/seqtekdotcom/commit/09c7533838785cfcaf71449bb90359789aec6115))
* **deps:** resolve esbuild advisories failing the production audit gate ([#52](https://github.com/SeqTechLLC/seqtekdotcom/issues/52)) ([8ae87be](https://github.com/SeqTechLLC/seqtekdotcom/commit/8ae87bedffc0650094a013c225f62386bb217feb))
* **ia:** one Touchstone workshop among three — /workshops replaces the branded umbrella ([#49](https://github.com/SeqTechLLC/seqtekdotcom/issues/49)) ([fa42926](https://github.com/SeqTechLLC/seqtekdotcom/commit/fa429268cf949a4d61ce8c0a7291bb33cc4658d7))
* **infra:** provision CLOUDFRONT_DISTRIBUTION_ID + invalidation IAM grant ([#44](https://github.com/SeqTechLLC/seqtekdotcom/issues/44)) ([7d254a1](https://github.com/SeqTechLLC/seqtekdotcom/commit/7d254a120a77f7e66dde1ec1fd39d296e7dee72c))
* **infra:** provision s3_region SSM param so S3 storage actually activates ([#38](https://github.com/SeqTechLLC/seqtekdotcom/issues/38)) ([0f4ded8](https://github.com/SeqTechLLC/seqtekdotcom/commit/0f4ded8d9774a0bf91e1ba51424a34263dc8d30e))
* **media:** serve media from CloudFront /media/* with correct serverURL (ADR 0008) ([#43](https://github.com/SeqTechLLC/seqtekdotcom/issues/43)) ([1d8b063](https://github.com/SeqTechLLC/seqtekdotcom/commit/1d8b06341b77e7670a390b6f1456548884baad30))
* **nav:** eliminate every 404 link in the site chrome ([#84](https://github.com/SeqTechLLC/seqtekdotcom/issues/84)) ([49eeb5f](https://github.com/SeqTechLLC/seqtekdotcom/commit/49eeb5f34578897a10aed58affbf9a129e1c0c70))
* **payload:** always register S3 storage plugin so admin importMap stays consistent ([#41](https://github.com/SeqTechLLC/seqtekdotcom/issues/41)) ([a6cda50](https://github.com/SeqTechLLC/seqtekdotcom/commit/a6cda50c29ffc97c1e3dc11b983b71ed0aa9b073))
* **payload:** migration adding the S3 media "prefix" column ([#39](https://github.com/SeqTechLLC/seqtekdotcom/issues/39)) ([6992d35](https://github.com/SeqTechLLC/seqtekdotcom/commit/6992d35fd49166e1db13fd8e4bc24b23b353ee16))
* **ui:** align video and stats sections to the shared section grid ([#54](https://github.com/SeqTechLLC/seqtekdotcom/issues/54)) ([d4d64ce](https://github.com/SeqTechLLC/seqtekdotcom/commit/d4d64cefbae1ed71512a82ba1e51b641c14c60f6))
* **ui:** center reading columns across content templates ([#64](https://github.com/SeqTechLLC/seqtekdotcom/issues/64)) ([5c773a9](https://github.com/SeqTechLLC/seqtekdotcom/commit/5c773a9c609b45476ac8fa394c5efb9fde864ce5))
* **ui:** render homepage client logos as a legible grid ([#63](https://github.com/SeqTechLLC/seqtekdotcom/issues/63)) ([f9c2ce6](https://github.com/SeqTechLLC/seqtekdotcom/commit/f9c2ce623578a05d1bff45c4ff2011ccf78f17dc))
* **ui:** TeamGrid cards layout renders full-bleed 4:3 photos ([#47](https://github.com/SeqTechLLC/seqtekdotcom/issues/47)) ([8ecdfca](https://github.com/SeqTechLLC/seqtekdotcom/commit/8ecdfca7e286f3c31103344e7cf0ecb7cab30a5d))
* **ui:** whole insight/case-study cards clickable; crisp card images ([#58](https://github.com/SeqTechLLC/seqtekdotcom/issues/58)) ([4b2f26a](https://github.com/SeqTechLLC/seqtekdotcom/commit/4b2f26a4a87f3dff5ad530ed5cac0cc7a6cdf977))
* **ui:** YouTube embeds fail with player error 153 under no-referrer ([#51](https://github.com/SeqTechLLC/seqtekdotcom/issues/51)) ([91597e2](https://github.com/SeqTechLLC/seqtekdotcom/commit/91597e249d8976df45ee1be27f93c936ab410eb1))

## [0.2.0](https://github.com/SeqTechLLC/seqtekdotcom/compare/v0.1.0...v0.2.0) (2026-06-08)


### Features

* **003:** close Phase 2 — US6 + US7 + Polish ([#19](https://github.com/SeqTechLLC/seqtekdotcom/issues/19)) ([0605c79](https://github.com/SeqTechLLC/seqtekdotcom/commit/0605c79d174954f7c04b4602061d02d233c0162f))
* **003:** Phase 2 foundational + US1 MVP block library framework ([#11](https://github.com/SeqTechLLC/seqtekdotcom/issues/11)) ([d49bf2c](https://github.com/SeqTechLLC/seqtekdotcom/commit/d49bf2cd3b2acc4ba99459afd83c7bc26d377550))
* **003:** Phase 4 US2 — live preview + close Phase 3 stragglers ([#13](https://github.com/SeqTechLLC/seqtekdotcom/issues/13)) ([a1cd89a](https://github.com/SeqTechLLC/seqtekdotcom/commit/a1cd89a2f3c58a7b5b71e381d8b5511472bae036))
* **003:** Phase 5 US3 — render-path ergonomics ([#14](https://github.com/SeqTechLLC/seqtekdotcom/issues/14)) ([1868fd8](https://github.com/SeqTechLLC/seqtekdotcom/commit/1868fd80730a6bcc932dc077f47f654c4440d3e1))
* **003:** Phase 6 US4 — Wix audit seed pipeline ([#15](https://github.com/SeqTechLLC/seqtekdotcom/issues/15)) ([af13135](https://github.com/SeqTechLLC/seqtekdotcom/commit/af131351ff60a5133bb05b08a7efa0d185e635af))
* **003:** Phase 7 US5 — access matrix + draft-leak invariants ([#16](https://github.com/SeqTechLLC/seqtekdotcom/issues/16)) ([26ab5d3](https://github.com/SeqTechLLC/seqtekdotcom/commit/26ab5d3b3270f4bb6943eb120f9856c58701a962))
* **004:** public render foundation + marquee pages ([#21](https://github.com/SeqTechLLC/seqtekdotcom/issues/21)) ([26ee6f0](https://github.com/SeqTechLLC/seqtekdotcom/commit/26ee6f075864f2b692ffd97ac09d7ea646fa7887))
* **005:** HubSpot Forms API engine + live workshop form (half-wired contact) ([#25](https://github.com/SeqTechLLC/seqtekdotcom/issues/25)) ([1dfa1cc](https://github.com/SeqTechLLC/seqtekdotcom/commit/1dfa1cc1a65a858046d6ad5c0c7cbfc6a73c8d97))
* **006:** consent bridge + privacy surfaces + CSP enforce machinery ([#26](https://github.com/SeqTechLLC/seqtekdotcom/issues/26)) ([5bc867d](https://github.com/SeqTechLLC/seqtekdotcom/commit/5bc867d6e5e72a0ff02bcc9d5db2875197f55bf5))
* **007:** Launch hardening & a11y/perf polish ([#29](https://github.com/SeqTechLLC/seqtekdotcom/issues/29)) ([80d942f](https://github.com/SeqTechLLC/seqtekdotcom/commit/80d942ffbf835d9b4e5e6812ad8fe017e7031015))
* **gtm:** GTM pixel activation — dataLayer conversion signals + scope/CAPI decisions ([#31](https://github.com/SeqTechLLC/seqtekdotcom/issues/31)) ([8737585](https://github.com/SeqTechLLC/seqtekdotcom/commit/8737585f65230e36241f4285ed4552eed7d68961))
* **tooling:** case-study REST importer (JSON file → Payload) ([#27](https://github.com/SeqTechLLC/seqtekdotcom/issues/27)) ([ef115d7](https://github.com/SeqTechLLC/seqtekdotcom/commit/ef115d7a6e0c137b7878a1aed16fccfe5521536e))
* **tooling:** curated-set ingest + staging runbook (C-8) ([#36](https://github.com/SeqTechLLC/seqtekdotcom/issues/36)) ([69bc96c](https://github.com/SeqTechLLC/seqtekdotcom/commit/69bc96c20eca892aa753f82efe9089ecdba3955e))
* **tooling:** photo-library ingest + normalize/catalog pipeline (C-8) ([#35](https://github.com/SeqTechLLC/seqtekdotcom/issues/35)) ([c1317cf](https://github.com/SeqTechLLC/seqtekdotcom/commit/c1317cf8cec41baa43e2b03f3268273eb16a25b3))


### Bug Fixes

* **004:** resolve PR [#21](https://github.com/SeqTechLLC/seqtekdotcom/issues/21) review follow-ups (404 dead link + pillar-move revalidation) ([#23](https://github.com/SeqTechLLC/seqtekdotcom/issues/23)) ([34cd062](https://github.com/SeqTechLLC/seqtekdotcom/commit/34cd062975924be1fb6e6666e7afd0c0273c70ce))
* **db:** collapse migrations into single init + bump Postgres 16 → 18 ([#17](https://github.com/SeqTechLLC/seqtekdotcom/issues/17)) ([9e237db](https://github.com/SeqTechLLC/seqtekdotcom/commit/9e237dbc41c04eec4fd648bf46c15ac01adaf795))
