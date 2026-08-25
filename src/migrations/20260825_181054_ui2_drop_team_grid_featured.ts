import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ROADMAP UI-2 — drop the `featured` option from the `team-grid` block's
// `filter` select. `teamMembers` has `isLeadership` and `order` and nothing
// else to select on, so `featured` never had a backing field: picking it
// produced an empty section. Resolution now happens in
// `src/lib/resolveLayout.ts`, which handles `leadership-only` and `all`.
//
// HAND-EDITED after `migrate:create`. The generated statements convert each
// column to `text`, recreate the enum without `featured`, then cast back with
// `USING "filter"::enum` — which fails on any row still holding `'featured'`.
// The `UPDATE ... SET "filter" = 'all'` lines below run while the column is
// still `text` and re-home those rows first. Do not regenerate this file
// without re-adding them.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
   UPDATE "pages_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_pages_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_pages_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_pages_blocks_team_grid_filter";
  ALTER TABLE "pages_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_pages_blocks_team_grid_filter" USING "filter"::"public"."enum_pages_blocks_team_grid_filter";
  ALTER TABLE "_pages_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_pages_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_pages_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__pages_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__pages_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_pages_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__pages_v_blocks_team_grid_filter";
  ALTER TABLE "_pages_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__pages_v_blocks_team_grid_filter" USING "filter"::"public"."enum__pages_v_blocks_team_grid_filter";
  ALTER TABLE "case_studies_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "case_studies_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "case_studies_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_case_studies_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_case_studies_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "case_studies_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_case_studies_blocks_team_grid_filter";
  ALTER TABLE "case_studies_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_case_studies_blocks_team_grid_filter" USING "filter"::"public"."enum_case_studies_blocks_team_grid_filter";
  ALTER TABLE "_case_studies_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_case_studies_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_case_studies_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__case_studies_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__case_studies_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_case_studies_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__case_studies_v_blocks_team_grid_filter";
  ALTER TABLE "_case_studies_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__case_studies_v_blocks_team_grid_filter" USING "filter"::"public"."enum__case_studies_v_blocks_team_grid_filter";
  ALTER TABLE "team_members_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "team_members_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "team_members_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_team_members_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_team_members_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "team_members_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_team_members_blocks_team_grid_filter";
  ALTER TABLE "team_members_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_team_members_blocks_team_grid_filter" USING "filter"::"public"."enum_team_members_blocks_team_grid_filter";
  ALTER TABLE "_team_members_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_team_members_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_team_members_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__team_members_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__team_members_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_team_members_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__team_members_v_blocks_team_grid_filter";
  ALTER TABLE "_team_members_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__team_members_v_blocks_team_grid_filter" USING "filter"::"public"."enum__team_members_v_blocks_team_grid_filter";
  ALTER TABLE "workshops_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "workshops_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "workshops_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_workshops_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_workshops_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "workshops_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_workshops_blocks_team_grid_filter";
  ALTER TABLE "workshops_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_workshops_blocks_team_grid_filter" USING "filter"::"public"."enum_workshops_blocks_team_grid_filter";
  ALTER TABLE "_workshops_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_workshops_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_workshops_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__workshops_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__workshops_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_workshops_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__workshops_v_blocks_team_grid_filter";
  ALTER TABLE "_workshops_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__workshops_v_blocks_team_grid_filter" USING "filter"::"public"."enum__workshops_v_blocks_team_grid_filter";
  ALTER TABLE "partners_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "partners_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "partners_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_partners_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_partners_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "partners_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_partners_blocks_team_grid_filter";
  ALTER TABLE "partners_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_partners_blocks_team_grid_filter" USING "filter"::"public"."enum_partners_blocks_team_grid_filter";
  ALTER TABLE "_partners_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_partners_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_partners_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__partners_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__partners_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_partners_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__partners_v_blocks_team_grid_filter";
  ALTER TABLE "_partners_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__partners_v_blocks_team_grid_filter" USING "filter"::"public"."enum__partners_v_blocks_team_grid_filter";
  ALTER TABLE "homepage_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "homepage_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "homepage_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum_homepage_blocks_team_grid_filter";
  CREATE TYPE "public"."enum_homepage_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "homepage_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum_homepage_blocks_team_grid_filter";
  ALTER TABLE "homepage_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum_homepage_blocks_team_grid_filter" USING "filter"::"public"."enum_homepage_blocks_team_grid_filter";
  ALTER TABLE "_homepage_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE text;
  UPDATE "_homepage_v_blocks_team_grid" SET "filter" = 'all' WHERE "filter" = 'featured';
  ALTER TABLE "_homepage_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::text;
  DROP TYPE "public"."enum__homepage_v_blocks_team_grid_filter";
  CREATE TYPE "public"."enum__homepage_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  ALTER TABLE "_homepage_v_blocks_team_grid" ALTER COLUMN "filter" SET DEFAULT 'all'::"public"."enum__homepage_v_blocks_team_grid_filter";
  ALTER TABLE "_homepage_v_blocks_team_grid" ALTER COLUMN "filter" SET DATA TYPE "public"."enum__homepage_v_blocks_team_grid_filter" USING "filter"::"public"."enum__homepage_v_blocks_team_grid_filter";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__pages_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum_case_studies_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__case_studies_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum_team_members_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__team_members_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum_workshops_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__workshops_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum_partners_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__partners_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum_homepage_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';
  ALTER TYPE "public"."enum__homepage_v_blocks_team_grid_filter" ADD VALUE 'featured' BEFORE 'all';`)
}
