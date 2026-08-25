import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_pages_v_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "case_studies_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_case_studies_v_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "team_members_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_team_members_v_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "workshops_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_workshops_v_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "partners_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_partners_v_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "homepage_blocks_stats_bar" DROP COLUMN "source";
  ALTER TABLE "_homepage_v_blocks_stats_bar" DROP COLUMN "source";
  DROP TYPE "public"."enum_pages_blocks_stats_bar_source";
  DROP TYPE "public"."enum__pages_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum_case_studies_blocks_stats_bar_source";
  DROP TYPE "public"."enum__case_studies_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum_team_members_blocks_stats_bar_source";
  DROP TYPE "public"."enum__team_members_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum_workshops_blocks_stats_bar_source";
  DROP TYPE "public"."enum__workshops_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum_partners_blocks_stats_bar_source";
  DROP TYPE "public"."enum__partners_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum_homepage_blocks_stats_bar_source";
  DROP TYPE "public"."enum__homepage_v_blocks_stats_bar_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__pages_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_case_studies_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__case_studies_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_team_members_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__team_members_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_workshops_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__workshops_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_partners_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__partners_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_homepage_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__homepage_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  ALTER TABLE "pages_blocks_stats_bar" ADD COLUMN "source" "enum_pages_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_pages_v_blocks_stats_bar" ADD COLUMN "source" "enum__pages_v_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "case_studies_blocks_stats_bar" ADD COLUMN "source" "enum_case_studies_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_case_studies_v_blocks_stats_bar" ADD COLUMN "source" "enum__case_studies_v_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "team_members_blocks_stats_bar" ADD COLUMN "source" "enum_team_members_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_team_members_v_blocks_stats_bar" ADD COLUMN "source" "enum__team_members_v_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "workshops_blocks_stats_bar" ADD COLUMN "source" "enum_workshops_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_workshops_v_blocks_stats_bar" ADD COLUMN "source" "enum__workshops_v_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "partners_blocks_stats_bar" ADD COLUMN "source" "enum_partners_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_partners_v_blocks_stats_bar" ADD COLUMN "source" "enum__partners_v_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "homepage_blocks_stats_bar" ADD COLUMN "source" "enum_homepage_blocks_stats_bar_source" DEFAULT 'inline';
  ALTER TABLE "_homepage_v_blocks_stats_bar" ADD COLUMN "source" "enum__homepage_v_blocks_stats_bar_source" DEFAULT 'inline';`)
}
