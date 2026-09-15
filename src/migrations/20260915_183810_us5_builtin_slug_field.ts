import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// `generate_slug` defaults to true, which ADD COLUMN applies to every existing
// row. slugField regenerates the slug from the title on any update while it is
// true, so a record that already has a slug is switched off here; otherwise its
// next save would silently change a live URL. Rows with no slug keep true, so
// their next save derives one.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_pages_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "case_studies" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "services" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_services_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "team_members" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_team_members_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "workshops" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "partners" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_partners_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "industries" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_industries_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "locations" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_locations_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "generate_slug" boolean DEFAULT true;
  UPDATE "pages" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "posts" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "case_studies" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "services" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "team_members" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "workshops" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "partners" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "industries" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "locations" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "categories" SET "generate_slug" = false WHERE "slug" IS NOT NULL;
  UPDATE "_pages_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_posts_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_case_studies_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_services_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_team_members_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_workshops_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_partners_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_industries_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;
  UPDATE "_locations_v" SET "version_generate_slug" = false WHERE "version_slug" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "generate_slug";
  ALTER TABLE "_pages_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "posts" DROP COLUMN "generate_slug";
  ALTER TABLE "_posts_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "case_studies" DROP COLUMN "generate_slug";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "services" DROP COLUMN "generate_slug";
  ALTER TABLE "_services_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "industries" DROP COLUMN "generate_slug";
  ALTER TABLE "_industries_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "workshops" DROP COLUMN "generate_slug";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "team_members" DROP COLUMN "generate_slug";
  ALTER TABLE "_team_members_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "partners" DROP COLUMN "generate_slug";
  ALTER TABLE "_partners_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "categories" DROP COLUMN "generate_slug";
  ALTER TABLE "locations" DROP COLUMN "generate_slug";
  ALTER TABLE "_locations_v" DROP COLUMN "version_generate_slug";`)
}
