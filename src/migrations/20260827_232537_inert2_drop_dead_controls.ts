import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ROADMAP INERT-2 — drop the controls the admin offered that nothing rendered.
// Each was declared `inert` on its block by the output-contract gate
// (`src/payload/blocks/outputContract.ts`); this file is where they stop being
// offered at all.
//
//   - `logo-bar.source`      the "reuse the homepage set" option mapped to an
//                            empty list and there was nothing to reuse: the
//                            `homepage` global carries only a `layout`. With
//                            that gone one option remained, so the whole select
//                            goes and the picked logos are the only source.
//   - `mission-vision-values.layout: 'tabs'`
//                            branched nowhere; it rendered exactly like "grid".
//   - `featured-testimonials.autoplay`   read by nothing (no carousel shipped).
//   - `hubspot-form.submitRedirect`      read by nothing (the form shows an
//                                        inline success panel and never navigates).
//   - `posts.relatedPosts`   a "Read next" picker no route ever read. Every
//                            instance in `docs/content-drafts/posts.json` is
//                            `[]`, so no editorial work is discarded.
//   - `media.caption`        blocks draw their own caption; the media pickers
//                            label a file by alt text or filename.
//
// `servicePillars.order` was on the list and is deliberately NOT here: it is
// already `admin.hidden`, so no editor is being promised anything, and
// `docs/content-drafts/service-pillars.json` carries real values in it.
//
// HAND-EDITED after `migrate:create`, for the same reason as
// `20260825_181054_ui2_drop_team_grid_featured.ts`: the generated statements
// convert each `layout` column to `text`, recreate the enum without `tabs`,
// then cast back with `USING "layout"::enum` — which fails on any row still
// holding `'tabs'`. The `UPDATE ... SET "layout" = 'grid'` lines run while the
// column is still `text` and re-home those rows first. Do not regenerate this
// file without re-adding them. The plain `DROP COLUMN` statements need no such
// care; they succeed whatever the rows hold.
//
// RUN THESE FOUR COUNTS AGAINST THE TARGET DATABASE BEFORE PROMOTING.
// The "no editorial work is discarded" claim below is verified against
// `docs/content-drafts/*.json`, which is the seed data — NOT against preview or
// ww3, which accept admin authoring. Anything these return is destroyed by
// `up()` and is not recoverable by `down()`:
//
//   SELECT count(*) FROM posts_rels WHERE posts_id IS NOT NULL;   -- relatedPosts picks
//   SELECT count(*) FROM media WHERE caption IS NOT NULL;         -- captions
//   -- and across each of the 12 *_blocks_mission_vision_values tables:
//   SELECT count(*) FROM pages_blocks_mission_vision_values WHERE layout = 'tabs';
//
// One more, which is a RENDER change rather than data loss: a `logo-bar` saved
// under the withdrawn `from-homepage` source can still hold rows in
// `*_blocks_logo_bar_logos`. Those render nothing today because the renderer
// mapped any non-`inline` source to an empty list — and they START rendering
// the moment `source` is dropped. The block-preview verification is code-level
// and cannot see this.
//
//   SELECT count(*) FROM pages_blocks_logo_bar b
//    WHERE b.source = 'from-homepage'
//      AND EXISTS (SELECT 1 FROM pages_blocks_logo_bar_logos l WHERE l._parent_id = b.id);
//
// `docs/content-drafts/*.json` contains no `logo-bar` block at all, so a lane
// loaded only from the drafts is safe; a hand-authored block in preview is not.
//
// `down()` IS NOT A DATA UNDO. It restores the columns, the enum value and the
// relationship table column — the SHAPE — and nothing else. The `'tabs'`
// selections re-homed to `'grid'` above, every `relatedPosts` pick, and every
// `media.caption` are gone for good the moment `up()` commits. Rolling back
// gives you somewhere to put that data, not the data.
//
// That matters less than it sounds, because of where the content came from:
// these lanes are loaded by `tools/payload-seed` from `docs/content-drafts/*.json`,
// so re-running the seeder IS the recovery path for anything seeded. What the
// seeder cannot bring back is work typed straight into `/admin` since the last
// load — and that is exactly what the counts above measure. If they come back
// zero, there is nothing here a snapshot would save. If they do not, take one
// (INFRASTRUCTURE_RUNBOOK.md §2.9) before promoting, remembering that preview
// and prod are separate DATABASES on one RDS INSTANCE, so a restore lands in a
// new instance and the rows come back by hand.
//
// NO AUTOMATED GATE EXERCISES THIS FILE. No workflow runs `payload migrate`,
// and the testcontainers Vitest job builds its schema with a drizzle PUSH, not
// the migration chain — so a green CI says nothing about whether this applies.
// Verified by hand on a scratch Postgres; see the PR for what was run.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_posts_fk";
  
  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_posts_fk";
  
  ALTER TABLE "pages_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "pages_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "pages_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_pages_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_pages_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "pages_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_pages_blocks_mission_vision_values_layout";
  ALTER TABLE "pages_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_pages_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_pages_blocks_mission_vision_values_layout";
  ALTER TABLE "_pages_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_pages_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_pages_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__pages_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__pages_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_pages_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__pages_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_pages_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__pages_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__pages_v_blocks_mission_vision_values_layout";
  ALTER TABLE "case_studies_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "case_studies_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "case_studies_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_case_studies_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_case_studies_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "case_studies_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_case_studies_blocks_mission_vision_values_layout";
  ALTER TABLE "case_studies_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_case_studies_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_case_studies_blocks_mission_vision_values_layout";
  ALTER TABLE "_case_studies_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_case_studies_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_case_studies_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__case_studies_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__case_studies_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_case_studies_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__case_studies_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_case_studies_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__case_studies_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__case_studies_v_blocks_mission_vision_values_layout";
  ALTER TABLE "team_members_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "team_members_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "team_members_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_team_members_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_team_members_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "team_members_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_team_members_blocks_mission_vision_values_layout";
  ALTER TABLE "team_members_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_team_members_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_team_members_blocks_mission_vision_values_layout";
  ALTER TABLE "_team_members_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_team_members_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_team_members_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__team_members_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__team_members_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_team_members_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__team_members_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_team_members_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__team_members_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__team_members_v_blocks_mission_vision_values_layout";
  ALTER TABLE "workshops_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "workshops_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "workshops_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_workshops_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_workshops_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "workshops_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_workshops_blocks_mission_vision_values_layout";
  ALTER TABLE "workshops_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_workshops_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_workshops_blocks_mission_vision_values_layout";
  ALTER TABLE "_workshops_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_workshops_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_workshops_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__workshops_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__workshops_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_workshops_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__workshops_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_workshops_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__workshops_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__workshops_v_blocks_mission_vision_values_layout";
  ALTER TABLE "partners_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "partners_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "partners_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_partners_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_partners_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "partners_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_partners_blocks_mission_vision_values_layout";
  ALTER TABLE "partners_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_partners_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_partners_blocks_mission_vision_values_layout";
  ALTER TABLE "_partners_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_partners_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_partners_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_partners_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__partners_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_partners_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__partners_v_blocks_mission_vision_values_layout";
  ALTER TABLE "homepage_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "homepage_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "homepage_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum_homepage_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum_homepage_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "homepage_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum_homepage_blocks_mission_vision_values_layout";
  ALTER TABLE "homepage_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_homepage_blocks_mission_vision_values_layout" USING "layout"::"public"."enum_homepage_blocks_mission_vision_values_layout";
  ALTER TABLE "_homepage_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE text;
  UPDATE "_homepage_v_blocks_mission_vision_values" SET "layout" = 'grid' WHERE "layout" = 'tabs';
  ALTER TABLE "_homepage_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::text;
  DROP TYPE "public"."enum__homepage_v_blocks_mission_vision_values_layout";
  CREATE TYPE "public"."enum__homepage_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  ALTER TABLE "_homepage_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DEFAULT 'grid'::"public"."enum__homepage_v_blocks_mission_vision_values_layout";
  ALTER TABLE "_homepage_v_blocks_mission_vision_values" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__homepage_v_blocks_mission_vision_values_layout" USING "layout"::"public"."enum__homepage_v_blocks_mission_vision_values_layout";
  DROP INDEX "posts_rels_posts_id_idx";
  DROP INDEX "_posts_v_rels_posts_id_idx";
  ALTER TABLE "media" DROP COLUMN "caption";
  ALTER TABLE "pages_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "pages_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "pages_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_pages_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_pages_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_pages_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "posts_rels" DROP COLUMN "posts_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "posts_id";
  ALTER TABLE "case_studies_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "case_studies_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "case_studies_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_case_studies_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_case_studies_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_case_studies_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "team_members_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "team_members_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "team_members_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_team_members_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_team_members_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_team_members_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "workshops_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "workshops_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "workshops_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_workshops_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_workshops_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_workshops_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "partners_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "partners_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "partners_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_partners_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_partners_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_partners_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "homepage_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "homepage_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "homepage_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  ALTER TABLE "_homepage_v_blocks_logo_bar" DROP COLUMN "source";
  ALTER TABLE "_homepage_v_blocks_featured_testimonials" DROP COLUMN "autoplay";
  ALTER TABLE "_homepage_v_blocks_hubspot_form" DROP COLUMN "submit_redirect";
  DROP TYPE "public"."enum_pages_blocks_logo_bar_source";
  DROP TYPE "public"."enum__pages_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum_case_studies_blocks_logo_bar_source";
  DROP TYPE "public"."enum__case_studies_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum_team_members_blocks_logo_bar_source";
  DROP TYPE "public"."enum__team_members_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum_workshops_blocks_logo_bar_source";
  DROP TYPE "public"."enum__workshops_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum_partners_blocks_logo_bar_source";
  DROP TYPE "public"."enum__partners_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum_homepage_blocks_logo_bar_source";
  DROP TYPE "public"."enum__homepage_v_blocks_logo_bar_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__pages_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_case_studies_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__case_studies_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_team_members_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__team_members_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_workshops_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__workshops_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_partners_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__partners_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_homepage_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__homepage_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  ALTER TYPE "public"."enum_pages_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__pages_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum_case_studies_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__case_studies_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum_team_members_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__team_members_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum_workshops_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__workshops_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum_partners_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum_homepage_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TYPE "public"."enum__homepage_v_blocks_mission_vision_values_layout" ADD VALUE 'tabs' BEFORE 'grid';
  ALTER TABLE "media" ADD COLUMN "caption" varchar;
  ALTER TABLE "pages_blocks_logo_bar" ADD COLUMN "source" "enum_pages_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "pages_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_pages_v_blocks_logo_bar" ADD COLUMN "source" "enum__pages_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_pages_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "posts_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "case_studies_blocks_logo_bar" ADD COLUMN "source" "enum_case_studies_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "case_studies_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "case_studies_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_case_studies_v_blocks_logo_bar" ADD COLUMN "source" "enum__case_studies_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_case_studies_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_case_studies_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "team_members_blocks_logo_bar" ADD COLUMN "source" "enum_team_members_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "team_members_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "team_members_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_team_members_v_blocks_logo_bar" ADD COLUMN "source" "enum__team_members_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_team_members_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_team_members_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "workshops_blocks_logo_bar" ADD COLUMN "source" "enum_workshops_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "workshops_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "workshops_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_workshops_v_blocks_logo_bar" ADD COLUMN "source" "enum__workshops_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_workshops_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_workshops_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "partners_blocks_logo_bar" ADD COLUMN "source" "enum_partners_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "partners_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "partners_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_partners_v_blocks_logo_bar" ADD COLUMN "source" "enum__partners_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_partners_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_partners_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "homepage_blocks_logo_bar" ADD COLUMN "source" "enum_homepage_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "homepage_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "homepage_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "_homepage_v_blocks_logo_bar" ADD COLUMN "source" "enum__homepage_v_blocks_logo_bar_source" DEFAULT 'inline';
  ALTER TABLE "_homepage_v_blocks_featured_testimonials" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_homepage_v_blocks_hubspot_form" ADD COLUMN "submit_redirect" varchar;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX "_posts_v_rels_posts_id_idx" ON "_posts_v_rels" USING btree ("posts_id");`)
}
