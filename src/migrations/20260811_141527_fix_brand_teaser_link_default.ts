import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Pre-existing schema drift, split out of the `add_partners_collection` migration
// so that one stays single-purpose.
//
// `BrandTeaser.linkUrl`'s defaultValue was changed in code from `/about/our-story`
// to `/our-story` when the About page was renamed, but no migration ever captured
// it — so every environment's column default still points at the old, now-301'd
// path. This only affects the DEFAULT for newly inserted rows (existing rows carry
// their own value), which is why it went unnoticed.
//
// This is an instance of the drift class the ROADMAP's "Schema-drift CI guard"
// item exists to prevent (fail CI when `migrate:create` would produce a diff).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_pages_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "case_studies_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_case_studies_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "services_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_services_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "team_members_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_team_members_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "workshops_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_workshops_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "homepage_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';
  ALTER TABLE "_homepage_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/our-story';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_pages_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "case_studies_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_case_studies_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "services_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_services_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "team_members_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_team_members_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "workshops_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_workshops_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "homepage_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';
  ALTER TABLE "_homepage_v_blocks_brand_teaser" ALTER COLUMN "link_url" SET DEFAULT '/about/our-story';`)
}
