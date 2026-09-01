// ROADMAP SVC-2. Every `DROP CONSTRAINT` below carries `IF EXISTS`, added by
// hand after a test-apply against a fresh database failed on
// `pages_blocks_service_cards_pillar_id_service_pillars_id_fk`.
//
// The cause is local to this script, not schema drift. `DROP TABLE
// "service_pillars" CASCADE` runs a few lines below, and CASCADE drops every FK
// constraint that references the table — so by the time the explicit
// `DROP CONSTRAINT` block runs, drizzle is asking Postgres to drop constraints
// CASCADE has already removed. Dropping one that is not there is a no-op, so
// the guards are safe in both directions and no reordering is needed.
//
// (An earlier version of this comment blamed a later migration for dropping and
// recreating `pages_blocks_service_cards`. That is wrong: the table is created
// once, in `20260531_141253_init.ts`, and the only DROP of it is in that same
// file's `down()`. The snapshot chain and the live schema agree.)
//
// The `DROP INDEX` statements are guarded too, but as belt-and-braces rather
// than for the reason above — CASCADE does not touch them, since their columns
// survive. Nothing in CI applies migrations (P5-30), so the deploy is the only
// gate: the container runs `npx payload migrate && node server.js`, where one
// already-absent index is a failed deploy. Verified by applying the whole chain
// to an empty database. This is exactly what the P3 schema-drift CI guard
// is for; nothing in CI runs migrations today (P5-30).
//
// WHAT THIS DOES TO EXISTING DATA — read before running it on a lane with
// content. An empty-database apply proves the DDL parses; it proves nothing
// about the three effects below, every one of which only exists when there are
// rows.
//
//   1. `pillar_id` on twelve `*_blocks_service_cards` tables is NULLed by hand
//      before its foreign key is repointed from `service_pillars` to
//      `services`. Without that the stored pillar ids would be reinterpreted as
//      service ids — silently wrong, or a mid-deploy abort. The reasoning is
//      spelled out at the statements themselves, in `up()`.
//
//   2. Pillar DOCUMENTS are destroyed and not backfilled. `DROP TABLE
//      "service_pillars" CASCADE` (and its `_v` twin) takes every pillar's
//      title, slug, description, hero image, SEO group and version history with
//      it, and nothing here inserts the matching `services` rows at
//      `tier: 'group'`. That is deliberate — the three groups are reseeded from
//      `docs/content-drafts` with real copy, which these rows never had (they
//      are ~1.4k of description and metadata, no body; CONTENT_NEEDS §12) — but
//      it means `down()` is a SCHEMA rollback only. It recreates the tables
//      empty. There is no path back to the documents.
//
//   3. Every `service-pillar-cards` PICK is discarded. `ALTER TABLE
//      "*_rels" DROP COLUMN "service_pillars_id"` across thirteen tables throws
//      away the `pillars` selection on that block wherever it appears — Pages,
//      case studies, workshops, partners and the homepage, not just the service
//      pages. `pillars` is `required: true, minRows: 1`, so those documents are
//      INVALID until an editor re-picks and will refuse to save as they stand.
//
//   4. `services.pillar_id` and `_services_v.version_pillar_id` are DROPPED
//      outright. That column was the leaf-to-pillar mapping, and the new model
//      inverts it: the relation lives on the group as an ordered `items` list.
//      There is no in-place conversion — the old edges are read by nothing once
//      `service_pillars` is gone (effect 2), so they go with it and the group's
//      membership is authored fresh with the seed.
//
// Effects 2, 3 and 4 are content work a deploy cannot do; 2 and 3 are tracked in
// the ROADMAP SVC-2 residual. Re-pick every `service-pillar-cards` block and every
// `service-cards` block set to "By pillar" after the groups are seeded.

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_blocks_hero_variant" AS ENUM('text-only', 'with-image', 'with-video', 'split');
  CREATE TYPE "public"."enum_services_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_services_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_services_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_services_blocks_content_background" AS ENUM('none', 'subtle', 'accent');
  CREATE TYPE "public"."enum_services_blocks_two_column_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_services_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_services_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_services_blocks_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_services_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_services_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum_services_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_services_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum_services_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum_services_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum_services_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum_services_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum_services_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  CREATE TYPE "public"."enum_services_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_services_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_services_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  CREATE TYPE "public"."enum_services_tier" AS ENUM('leaf', 'group', 'axis');
  CREATE TYPE "public"."enum__services_v_blocks_hero_variant" AS ENUM('text-only', 'with-image', 'with-video', 'split');
  CREATE TYPE "public"."enum__services_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__services_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__services_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__services_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent');
  CREATE TYPE "public"."enum__services_v_blocks_two_column_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__services_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__services_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__services_v_blocks_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum__services_v_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__services_v_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum__services_v_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__services_v_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum__services_v_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum__services_v_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum__services_v_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum__services_v_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum__services_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'all');
  CREATE TYPE "public"."enum__services_v_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum__services_v_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__services_v_blocks_mission_vision_values_layout" AS ENUM('grid', 'stacked');
  CREATE TYPE "public"."enum__services_v_version_tier" AS ENUM('leaf', 'group', 'axis');
  CREATE TABLE "services_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_services_blocks_hero_variant" DEFAULT 'text-only',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_services_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_services_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_case_study_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"metric_number" varchar,
  	"metric_label" varchar,
  	"metric_context" varchar,
  	"hero_image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_service_pillar_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pillar_name" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"hero_image_id" integer,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_homepage_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"background_image_id" integer,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_services_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_services_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_position" "enum_services_blocks_two_column_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"media_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_services_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_services_blocks_image_alignment" DEFAULT 'center',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "services_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum_services_blocks_gallery_layout" DEFAULT 'grid',
  	"columns" "enum_services_blocks_gallery_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_process_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"icon" varchar
  );
  
  CREATE TABLE "services_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_deliverables_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "services_blocks_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_comparison_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "services_blocks_comparison_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_blocks_comparison_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "services_blocks_comparison_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"body" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "services_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "services_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_stats_bar_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar
  );
  
  CREATE TABLE "services_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_metric_display" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar,
  	"background" "enum_services_blocks_metric_display_background" DEFAULT 'accent',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_logo_bar_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "services_blocks_logo_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"treatment" "enum_services_blocks_logo_bar_treatment" DEFAULT 'grayscale-on-color-hover',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_featured_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_testimonial_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"testimonial_id" integer,
  	"layout" "enum_services_blocks_testimonial_block_layout" DEFAULT 'centered',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_client_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "services_blocks_client_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum_services_blocks_client_logo_grid_columns" DEFAULT '4',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_cta_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_services_blocks_cta_section_variant" DEFAULT 'centered',
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"background" "enum_services_blocks_cta_section_background" DEFAULT 'default',
  	"background_image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_newsletter_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"form_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_contact_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_case_study_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_services_blocks_case_study_grid_source" DEFAULT 'manual',
  	"industry_id" integer,
  	"service_id" integer,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_service_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_services_blocks_service_cards_source" DEFAULT 'manual',
  	"pillar_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_service_pillar_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_featured_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"case_study_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_services_blocks_post_list_source" DEFAULT 'latest',
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_related_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_industry_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_locations_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_workshop_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"filter" "enum_services_blocks_team_grid_filter" DEFAULT 'all',
  	"layout" "enum_services_blocks_team_grid_layout" DEFAULT 'cards',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_video_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" "enum_services_blocks_video_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"title" varchar,
  	"eyebrow" varchar,
  	"thumbnail_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_mission_vision_values_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "services_blocks_mission_vision_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mission" varchar,
  	"vision" varchar,
  	"layout" "enum_services_blocks_mission_vision_values_layout" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "services_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_tabs_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "services_blocks_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"embed_url" varchar,
  	"caption" varchar,
  	"height" numeric DEFAULT 400,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"caption" varchar,
  	"height" numeric DEFAULT 600,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_download_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"cover_image_id" integer,
  	"form_id" varchar,
  	"file_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_hubspot_meetings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"meeting_url" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_brand_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"link_url" varchar DEFAULT '/our-story',
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_nav_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_url" varchar
  );
  
  CREATE TABLE "services_blocks_nav_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_key_takeaways_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "services_blocks_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_tech_stack_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "services_blocks_tech_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__services_v_blocks_hero_variant" DEFAULT 'text-only',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__services_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__services_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_case_study_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"metric_number" varchar,
  	"metric_label" varchar,
  	"metric_context" varchar,
  	"hero_image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_service_pillar_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"pillar_name" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"hero_image_id" integer,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_homepage_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"background_image_id" integer,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__services_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__services_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_position" "enum__services_v_blocks_two_column_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"media_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__services_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__services_v_blocks_image_alignment" DEFAULT 'center',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum__services_v_blocks_gallery_layout" DEFAULT 'grid',
  	"columns" "enum__services_v_blocks_gallery_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_process_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"icon" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_deliverables_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_comparison_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_comparison_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_comparison_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_comparison_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_stats_bar_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_metric_display" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar,
  	"background" "enum__services_v_blocks_metric_display_background" DEFAULT 'accent',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_logo_bar_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_logo_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"treatment" "enum__services_v_blocks_logo_bar_treatment" DEFAULT 'grayscale-on-color-hover',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_featured_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_testimonial_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"testimonial_id" integer,
  	"layout" "enum__services_v_blocks_testimonial_block_layout" DEFAULT 'centered',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_client_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_client_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum__services_v_blocks_client_logo_grid_columns" DEFAULT '4',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_cta_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__services_v_blocks_cta_section_variant" DEFAULT 'centered',
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"background" "enum__services_v_blocks_cta_section_background" DEFAULT 'default',
  	"background_image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_newsletter_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"form_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_contact_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_case_study_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__services_v_blocks_case_study_grid_source" DEFAULT 'manual',
  	"industry_id" integer,
  	"service_id" integer,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_service_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__services_v_blocks_service_cards_source" DEFAULT 'manual',
  	"pillar_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_service_pillar_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_featured_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"case_study_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__services_v_blocks_post_list_source" DEFAULT 'latest',
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_related_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_industry_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_locations_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_workshop_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"filter" "enum__services_v_blocks_team_grid_filter" DEFAULT 'all',
  	"layout" "enum__services_v_blocks_team_grid_layout" DEFAULT 'cards',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_video_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum__services_v_blocks_video_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"title" varchar,
  	"eyebrow" varchar,
  	"thumbnail_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_mission_vision_values_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_mission_vision_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mission" varchar,
  	"vision" varchar,
  	"layout" "enum__services_v_blocks_mission_vision_values_layout" DEFAULT 'grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_tabs_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"embed_url" varchar,
  	"caption" varchar,
  	"height" numeric DEFAULT 400,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"caption" varchar,
  	"height" numeric DEFAULT 600,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_download_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"cover_image_id" integer,
  	"form_id" varchar,
  	"file_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_hubspot_meetings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"meeting_url" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_brand_teaser" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"link_url" varchar DEFAULT '/our-story',
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_nav_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_nav_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_key_takeaways_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_tech_stack_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_tech_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  -- ---------------------------------------------------------------------
  -- SVC-2 DATA. Everything else in this migration is DDL; these twelve
  -- statements are not, and without them the migration is silently WRONG on
  -- any database that holds content (it was verified against an empty one,
  -- which is the single dataset where this cannot show up).
  --
  -- "pillar_id" on every "*_blocks_service_cards" table stores a
  -- "service_pillars.id". Below, the column keeps its values while its foreign
  -- key is repointed at "services": "DROP TABLE ... CASCADE" drops dependent
  -- CONSTRAINTS, not referencing ROWS, and "ON DELETE set null" governs row
  -- deletes rather than table drops, so nothing clears them on its own. Left
  -- alone every id is reinterpreted as a "services.id" and one of two things
  -- happens, both bad: it matches an unrelated LEAF (both tables use small
  -- serials, so it usually does), "resolveLayout" finds no "tier: 'group'" for
  -- it, and the block renders an empty card list with no error -- the exact
  -- INERT-2 defect class this work exists to remove; or it matches nothing and
  -- "ADD CONSTRAINT" fails validation, aborting the migration mid-deploy.
  --
  -- NULL rather than a remap, deliberately: the groups that replace these
  -- pillars do not exist yet when this runs -- they are reseeded from
  -- "docs/content-drafts" afterwards (ROADMAP SVC-2 residual) -- so there is no
  -- id to remap TO. A blank "Which group" is a required field an editor is
  -- forced to re-pick; a wrong one is silent. Prior art for hand-written DML in
  -- a migration here: "20260827_232537_inert2_drop_dead_controls.ts".
  --
  -- "services_blocks_service_cards" / "_services_v_blocks_service_cards" are
  -- CREATEd empty by this same migration and so need no statement.
  UPDATE "pages_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_pages_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "case_studies_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_case_studies_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "team_members_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_team_members_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "workshops_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_workshops_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "partners_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_partners_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "homepage_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_homepage_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  -- ---------------------------------------------------------------------

  ALTER TABLE "service_pillars" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_service_pillars_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "service_pillars" CASCADE;
  DROP TABLE "_service_pillars_v" CASCADE;
  ALTER TABLE "pages_blocks_service_cards" DROP CONSTRAINT IF EXISTS "pages_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_service_pillars_fk";
  
  ALTER TABLE "_pages_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_service_pillars_fk";
  
  ALTER TABLE "case_studies_blocks_service_cards" DROP CONSTRAINT IF EXISTS "case_studies_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "case_studies_rels" DROP CONSTRAINT IF EXISTS "case_studies_rels_service_pillars_fk";
  
  ALTER TABLE "_case_studies_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_case_studies_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_case_studies_v_rels" DROP CONSTRAINT IF EXISTS "_case_studies_v_rels_service_pillars_fk";
  
  ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_services_v" DROP CONSTRAINT IF EXISTS "_services_v_version_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "team_members_blocks_service_cards" DROP CONSTRAINT IF EXISTS "team_members_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "team_members_rels" DROP CONSTRAINT IF EXISTS "team_members_rels_service_pillars_fk";
  
  ALTER TABLE "_team_members_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_team_members_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_team_members_v_rels" DROP CONSTRAINT IF EXISTS "_team_members_v_rels_service_pillars_fk";
  
  ALTER TABLE "workshops_blocks_service_cards" DROP CONSTRAINT IF EXISTS "workshops_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "workshops_rels" DROP CONSTRAINT IF EXISTS "workshops_rels_service_pillars_fk";
  
  ALTER TABLE "_workshops_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_workshops_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_workshops_v_rels" DROP CONSTRAINT IF EXISTS "_workshops_v_rels_service_pillars_fk";
  
  ALTER TABLE "partners_blocks_service_cards" DROP CONSTRAINT IF EXISTS "partners_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "partners_rels" DROP CONSTRAINT IF EXISTS "partners_rels_service_pillars_fk";
  
  ALTER TABLE "_partners_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_partners_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_partners_v_rels" DROP CONSTRAINT IF EXISTS "_partners_v_rels_service_pillars_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_service_pillars_fk";
  
  ALTER TABLE "homepage_blocks_service_cards" DROP CONSTRAINT IF EXISTS "homepage_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT IF EXISTS "homepage_rels_service_pillars_fk";
  
  ALTER TABLE "_homepage_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_homepage_v_blocks_service_cards_pillar_id_service_pillars_id_fk";
  
  ALTER TABLE "_homepage_v_rels" DROP CONSTRAINT IF EXISTS "_homepage_v_rels_service_pillars_fk";
  
  DROP INDEX IF EXISTS "pages_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_pages_v_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "case_studies_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_case_studies_v_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "services_pillar_idx";
  DROP INDEX IF EXISTS "_services_v_version_version_pillar_idx";
  DROP INDEX IF EXISTS "team_members_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_team_members_v_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "workshops_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_workshops_v_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "partners_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_partners_v_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "homepage_rels_service_pillars_id_idx";
  DROP INDEX IF EXISTS "_homepage_v_rels_service_pillars_id_idx";
  ALTER TABLE "services" ADD COLUMN "tier" "enum_services_tier" DEFAULT 'leaf';
  ALTER TABLE "services_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "industries_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_tier" "enum__services_v_version_tier" DEFAULT 'leaf';
  ALTER TABLE "_services_v_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "industries_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_case_study_hero" ADD CONSTRAINT "services_blocks_case_study_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_case_study_hero" ADD CONSTRAINT "services_blocks_case_study_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_service_pillar_hero" ADD CONSTRAINT "services_blocks_service_pillar_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_service_pillar_hero" ADD CONSTRAINT "services_blocks_service_pillar_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_homepage_hero" ADD CONSTRAINT "services_blocks_homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_homepage_hero" ADD CONSTRAINT "services_blocks_homepage_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_content" ADD CONSTRAINT "services_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_two_column" ADD CONSTRAINT "services_blocks_two_column_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_two_column" ADD CONSTRAINT "services_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_image" ADD CONSTRAINT "services_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_image" ADD CONSTRAINT "services_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery_items" ADD CONSTRAINT "services_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery_items" ADD CONSTRAINT "services_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery" ADD CONSTRAINT "services_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process_steps_steps" ADD CONSTRAINT "services_blocks_process_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process_steps" ADD CONSTRAINT "services_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_deliverables_items" ADD CONSTRAINT "services_blocks_deliverables_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_deliverables" ADD CONSTRAINT "services_blocks_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_comparison_table_columns" ADD CONSTRAINT "services_blocks_comparison_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_comparison_table_rows_cells" ADD CONSTRAINT "services_blocks_comparison_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_comparison_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_comparison_table_rows" ADD CONSTRAINT "services_blocks_comparison_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_comparison_table_best_for_row" ADD CONSTRAINT "services_blocks_comparison_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_comparison_table" ADD CONSTRAINT "services_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline_items" ADD CONSTRAINT "services_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline_items" ADD CONSTRAINT "services_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline" ADD CONSTRAINT "services_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq_items" ADD CONSTRAINT "services_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq" ADD CONSTRAINT "services_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats_bar_items" ADD CONSTRAINT "services_blocks_stats_bar_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_stats_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats_bar" ADD CONSTRAINT "services_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_metric_display" ADD CONSTRAINT "services_blocks_metric_display_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_logo_bar_logos" ADD CONSTRAINT "services_blocks_logo_bar_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_logo_bar_logos" ADD CONSTRAINT "services_blocks_logo_bar_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_logo_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_logo_bar" ADD CONSTRAINT "services_blocks_logo_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_featured_testimonials" ADD CONSTRAINT "services_blocks_featured_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_testimonial_block" ADD CONSTRAINT "services_blocks_testimonial_block_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_testimonial_block" ADD CONSTRAINT "services_blocks_testimonial_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_client_logo_grid_logos" ADD CONSTRAINT "services_blocks_client_logo_grid_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_client_logo_grid_logos" ADD CONSTRAINT "services_blocks_client_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_client_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_client_logo_grid" ADD CONSTRAINT "services_blocks_client_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_cta_section" ADD CONSTRAINT "services_blocks_cta_section_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cta_section" ADD CONSTRAINT "services_blocks_cta_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_newsletter_cta" ADD CONSTRAINT "services_blocks_newsletter_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_contact_cta" ADD CONSTRAINT "services_blocks_contact_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_case_study_grid" ADD CONSTRAINT "services_blocks_case_study_grid_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_case_study_grid" ADD CONSTRAINT "services_blocks_case_study_grid_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_case_study_grid" ADD CONSTRAINT "services_blocks_case_study_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_service_cards" ADD CONSTRAINT "services_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_service_cards" ADD CONSTRAINT "services_blocks_service_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_service_pillar_cards" ADD CONSTRAINT "services_blocks_service_pillar_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_featured_case_study" ADD CONSTRAINT "services_blocks_featured_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_featured_case_study" ADD CONSTRAINT "services_blocks_featured_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_post_list" ADD CONSTRAINT "services_blocks_post_list_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_post_list" ADD CONSTRAINT "services_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_related_posts" ADD CONSTRAINT "services_blocks_related_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_industry_grid" ADD CONSTRAINT "services_blocks_industry_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_locations_list" ADD CONSTRAINT "services_blocks_locations_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_workshop_list" ADD CONSTRAINT "services_blocks_workshop_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_team_grid" ADD CONSTRAINT "services_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_video_embed" ADD CONSTRAINT "services_blocks_video_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_video_embed" ADD CONSTRAINT "services_blocks_video_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_mission_vision_values_values" ADD CONSTRAINT "services_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_mission_vision_values" ADD CONSTRAINT "services_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_accordion_items" ADD CONSTRAINT "services_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_accordion" ADD CONSTRAINT "services_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_tabs_tabs" ADD CONSTRAINT "services_blocks_tabs_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_tabs" ADD CONSTRAINT "services_blocks_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_map" ADD CONSTRAINT "services_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_embed" ADD CONSTRAINT "services_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_download_card" ADD CONSTRAINT "services_blocks_download_card_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_download_card" ADD CONSTRAINT "services_blocks_download_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hubspot_form" ADD CONSTRAINT "services_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hubspot_meetings" ADD CONSTRAINT "services_blocks_hubspot_meetings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_brand_teaser" ADD CONSTRAINT "services_blocks_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_brand_teaser" ADD CONSTRAINT "services_blocks_brand_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_nav_cards_cards" ADD CONSTRAINT "services_blocks_nav_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_nav_cards_cards" ADD CONSTRAINT "services_blocks_nav_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_nav_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_nav_cards" ADD CONSTRAINT "services_blocks_nav_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_key_takeaways_items" ADD CONSTRAINT "services_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_key_takeaways" ADD CONSTRAINT "services_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_tech_stack_items" ADD CONSTRAINT "services_blocks_tech_stack_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_tech_stack" ADD CONSTRAINT "services_blocks_tech_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_case_study_hero" ADD CONSTRAINT "_services_v_blocks_case_study_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_case_study_hero" ADD CONSTRAINT "_services_v_blocks_case_study_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_pillar_hero" ADD CONSTRAINT "_services_v_blocks_service_pillar_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_pillar_hero" ADD CONSTRAINT "_services_v_blocks_service_pillar_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_homepage_hero" ADD CONSTRAINT "_services_v_blocks_homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_homepage_hero" ADD CONSTRAINT "_services_v_blocks_homepage_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_content" ADD CONSTRAINT "_services_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_two_column" ADD CONSTRAINT "_services_v_blocks_two_column_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_two_column" ADD CONSTRAINT "_services_v_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_image" ADD CONSTRAINT "_services_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_image" ADD CONSTRAINT "_services_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery_items" ADD CONSTRAINT "_services_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery_items" ADD CONSTRAINT "_services_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery" ADD CONSTRAINT "_services_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process_steps_steps" ADD CONSTRAINT "_services_v_blocks_process_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process_steps" ADD CONSTRAINT "_services_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_deliverables_items" ADD CONSTRAINT "_services_v_blocks_deliverables_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_deliverables" ADD CONSTRAINT "_services_v_blocks_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_comparison_table_columns" ADD CONSTRAINT "_services_v_blocks_comparison_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_comparison_table_rows_cells" ADD CONSTRAINT "_services_v_blocks_comparison_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_comparison_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_comparison_table_rows" ADD CONSTRAINT "_services_v_blocks_comparison_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_comparison_table_best_for_row" ADD CONSTRAINT "_services_v_blocks_comparison_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_comparison_table" ADD CONSTRAINT "_services_v_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline_items" ADD CONSTRAINT "_services_v_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline_items" ADD CONSTRAINT "_services_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline" ADD CONSTRAINT "_services_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq_items" ADD CONSTRAINT "_services_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq" ADD CONSTRAINT "_services_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats_bar_items" ADD CONSTRAINT "_services_v_blocks_stats_bar_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_stats_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats_bar" ADD CONSTRAINT "_services_v_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_metric_display" ADD CONSTRAINT "_services_v_blocks_metric_display_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_logo_bar_logos" ADD CONSTRAINT "_services_v_blocks_logo_bar_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_logo_bar_logos" ADD CONSTRAINT "_services_v_blocks_logo_bar_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_logo_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_logo_bar" ADD CONSTRAINT "_services_v_blocks_logo_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_featured_testimonials" ADD CONSTRAINT "_services_v_blocks_featured_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_testimonial_block" ADD CONSTRAINT "_services_v_blocks_testimonial_block_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_testimonial_block" ADD CONSTRAINT "_services_v_blocks_testimonial_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_client_logo_grid_logos" ADD CONSTRAINT "_services_v_blocks_client_logo_grid_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_client_logo_grid_logos" ADD CONSTRAINT "_services_v_blocks_client_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_client_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_client_logo_grid" ADD CONSTRAINT "_services_v_blocks_client_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta_section" ADD CONSTRAINT "_services_v_blocks_cta_section_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta_section" ADD CONSTRAINT "_services_v_blocks_cta_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_newsletter_cta" ADD CONSTRAINT "_services_v_blocks_newsletter_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_contact_cta" ADD CONSTRAINT "_services_v_blocks_contact_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_case_study_grid" ADD CONSTRAINT "_services_v_blocks_case_study_grid_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_case_study_grid" ADD CONSTRAINT "_services_v_blocks_case_study_grid_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_case_study_grid" ADD CONSTRAINT "_services_v_blocks_case_study_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_cards" ADD CONSTRAINT "_services_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_cards" ADD CONSTRAINT "_services_v_blocks_service_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_pillar_cards" ADD CONSTRAINT "_services_v_blocks_service_pillar_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_featured_case_study" ADD CONSTRAINT "_services_v_blocks_featured_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_featured_case_study" ADD CONSTRAINT "_services_v_blocks_featured_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_post_list" ADD CONSTRAINT "_services_v_blocks_post_list_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_post_list" ADD CONSTRAINT "_services_v_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_related_posts" ADD CONSTRAINT "_services_v_blocks_related_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_industry_grid" ADD CONSTRAINT "_services_v_blocks_industry_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_locations_list" ADD CONSTRAINT "_services_v_blocks_locations_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_workshop_list" ADD CONSTRAINT "_services_v_blocks_workshop_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team_grid" ADD CONSTRAINT "_services_v_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_video_embed" ADD CONSTRAINT "_services_v_blocks_video_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_video_embed" ADD CONSTRAINT "_services_v_blocks_video_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_mission_vision_values_values" ADD CONSTRAINT "_services_v_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_mission_vision_values" ADD CONSTRAINT "_services_v_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_accordion_items" ADD CONSTRAINT "_services_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_accordion" ADD CONSTRAINT "_services_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_tabs_tabs" ADD CONSTRAINT "_services_v_blocks_tabs_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_tabs" ADD CONSTRAINT "_services_v_blocks_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_map" ADD CONSTRAINT "_services_v_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_embed" ADD CONSTRAINT "_services_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_download_card" ADD CONSTRAINT "_services_v_blocks_download_card_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_download_card" ADD CONSTRAINT "_services_v_blocks_download_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hubspot_form" ADD CONSTRAINT "_services_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hubspot_meetings" ADD CONSTRAINT "_services_v_blocks_hubspot_meetings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_brand_teaser" ADD CONSTRAINT "_services_v_blocks_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_brand_teaser" ADD CONSTRAINT "_services_v_blocks_brand_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_nav_cards_cards" ADD CONSTRAINT "_services_v_blocks_nav_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_nav_cards_cards" ADD CONSTRAINT "_services_v_blocks_nav_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_nav_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_nav_cards" ADD CONSTRAINT "_services_v_blocks_nav_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_key_takeaways_items" ADD CONSTRAINT "_services_v_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_key_takeaways" ADD CONSTRAINT "_services_v_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_tech_stack_items" ADD CONSTRAINT "_services_v_blocks_tech_stack_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_tech_stack" ADD CONSTRAINT "_services_v_blocks_tech_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "services_blocks_hero_order_idx" ON "services_blocks_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_hero_parent_id_idx" ON "services_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hero_path_idx" ON "services_blocks_hero" USING btree ("_path");
  CREATE INDEX "services_blocks_hero_media_idx" ON "services_blocks_hero" USING btree ("media_id");
  CREATE INDEX "services_blocks_case_study_hero_order_idx" ON "services_blocks_case_study_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_case_study_hero_parent_id_idx" ON "services_blocks_case_study_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_case_study_hero_path_idx" ON "services_blocks_case_study_hero" USING btree ("_path");
  CREATE INDEX "services_blocks_case_study_hero_hero_image_idx" ON "services_blocks_case_study_hero" USING btree ("hero_image_id");
  CREATE INDEX "services_blocks_service_pillar_hero_order_idx" ON "services_blocks_service_pillar_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_service_pillar_hero_parent_id_idx" ON "services_blocks_service_pillar_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_service_pillar_hero_path_idx" ON "services_blocks_service_pillar_hero" USING btree ("_path");
  CREATE INDEX "services_blocks_service_pillar_hero_hero_image_idx" ON "services_blocks_service_pillar_hero" USING btree ("hero_image_id");
  CREATE INDEX "services_blocks_homepage_hero_order_idx" ON "services_blocks_homepage_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_homepage_hero_parent_id_idx" ON "services_blocks_homepage_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_homepage_hero_path_idx" ON "services_blocks_homepage_hero" USING btree ("_path");
  CREATE INDEX "services_blocks_homepage_hero_background_image_idx" ON "services_blocks_homepage_hero" USING btree ("background_image_id");
  CREATE INDEX "services_blocks_content_order_idx" ON "services_blocks_content" USING btree ("_order");
  CREATE INDEX "services_blocks_content_parent_id_idx" ON "services_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_content_path_idx" ON "services_blocks_content" USING btree ("_path");
  CREATE INDEX "services_blocks_two_column_order_idx" ON "services_blocks_two_column" USING btree ("_order");
  CREATE INDEX "services_blocks_two_column_parent_id_idx" ON "services_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_two_column_path_idx" ON "services_blocks_two_column" USING btree ("_path");
  CREATE INDEX "services_blocks_two_column_media_idx" ON "services_blocks_two_column" USING btree ("media_id");
  CREATE INDEX "services_blocks_image_order_idx" ON "services_blocks_image" USING btree ("_order");
  CREATE INDEX "services_blocks_image_parent_id_idx" ON "services_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_image_path_idx" ON "services_blocks_image" USING btree ("_path");
  CREATE INDEX "services_blocks_image_image_idx" ON "services_blocks_image" USING btree ("image_id");
  CREATE INDEX "services_blocks_gallery_items_order_idx" ON "services_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "services_blocks_gallery_items_parent_id_idx" ON "services_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_gallery_items_image_idx" ON "services_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "services_blocks_gallery_order_idx" ON "services_blocks_gallery" USING btree ("_order");
  CREATE INDEX "services_blocks_gallery_parent_id_idx" ON "services_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_gallery_path_idx" ON "services_blocks_gallery" USING btree ("_path");
  CREATE INDEX "services_blocks_process_steps_steps_order_idx" ON "services_blocks_process_steps_steps" USING btree ("_order");
  CREATE INDEX "services_blocks_process_steps_steps_parent_id_idx" ON "services_blocks_process_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_process_steps_order_idx" ON "services_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "services_blocks_process_steps_parent_id_idx" ON "services_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_process_steps_path_idx" ON "services_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "services_blocks_deliverables_items_order_idx" ON "services_blocks_deliverables_items" USING btree ("_order");
  CREATE INDEX "services_blocks_deliverables_items_parent_id_idx" ON "services_blocks_deliverables_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_deliverables_order_idx" ON "services_blocks_deliverables" USING btree ("_order");
  CREATE INDEX "services_blocks_deliverables_parent_id_idx" ON "services_blocks_deliverables" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_deliverables_path_idx" ON "services_blocks_deliverables" USING btree ("_path");
  CREATE INDEX "services_blocks_comparison_table_columns_order_idx" ON "services_blocks_comparison_table_columns" USING btree ("_order");
  CREATE INDEX "services_blocks_comparison_table_columns_parent_id_idx" ON "services_blocks_comparison_table_columns" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_comparison_table_rows_cells_order_idx" ON "services_blocks_comparison_table_rows_cells" USING btree ("_order");
  CREATE INDEX "services_blocks_comparison_table_rows_cells_parent_id_idx" ON "services_blocks_comparison_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_comparison_table_rows_order_idx" ON "services_blocks_comparison_table_rows" USING btree ("_order");
  CREATE INDEX "services_blocks_comparison_table_rows_parent_id_idx" ON "services_blocks_comparison_table_rows" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_comparison_table_best_for_row_order_idx" ON "services_blocks_comparison_table_best_for_row" USING btree ("_order");
  CREATE INDEX "services_blocks_comparison_table_best_for_row_parent_id_idx" ON "services_blocks_comparison_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_comparison_table_order_idx" ON "services_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "services_blocks_comparison_table_parent_id_idx" ON "services_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_comparison_table_path_idx" ON "services_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "services_blocks_timeline_items_order_idx" ON "services_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "services_blocks_timeline_items_parent_id_idx" ON "services_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_timeline_items_image_idx" ON "services_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "services_blocks_timeline_order_idx" ON "services_blocks_timeline" USING btree ("_order");
  CREATE INDEX "services_blocks_timeline_parent_id_idx" ON "services_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_timeline_path_idx" ON "services_blocks_timeline" USING btree ("_path");
  CREATE INDEX "services_blocks_faq_items_order_idx" ON "services_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_items_parent_id_idx" ON "services_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_order_idx" ON "services_blocks_faq" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_parent_id_idx" ON "services_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_path_idx" ON "services_blocks_faq" USING btree ("_path");
  CREATE INDEX "services_blocks_stats_bar_items_order_idx" ON "services_blocks_stats_bar_items" USING btree ("_order");
  CREATE INDEX "services_blocks_stats_bar_items_parent_id_idx" ON "services_blocks_stats_bar_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_stats_bar_order_idx" ON "services_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "services_blocks_stats_bar_parent_id_idx" ON "services_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_stats_bar_path_idx" ON "services_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "services_blocks_metric_display_order_idx" ON "services_blocks_metric_display" USING btree ("_order");
  CREATE INDEX "services_blocks_metric_display_parent_id_idx" ON "services_blocks_metric_display" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_metric_display_path_idx" ON "services_blocks_metric_display" USING btree ("_path");
  CREATE INDEX "services_blocks_logo_bar_logos_order_idx" ON "services_blocks_logo_bar_logos" USING btree ("_order");
  CREATE INDEX "services_blocks_logo_bar_logos_parent_id_idx" ON "services_blocks_logo_bar_logos" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_logo_bar_logos_logo_idx" ON "services_blocks_logo_bar_logos" USING btree ("logo_id");
  CREATE INDEX "services_blocks_logo_bar_order_idx" ON "services_blocks_logo_bar" USING btree ("_order");
  CREATE INDEX "services_blocks_logo_bar_parent_id_idx" ON "services_blocks_logo_bar" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_logo_bar_path_idx" ON "services_blocks_logo_bar" USING btree ("_path");
  CREATE INDEX "services_blocks_featured_testimonials_order_idx" ON "services_blocks_featured_testimonials" USING btree ("_order");
  CREATE INDEX "services_blocks_featured_testimonials_parent_id_idx" ON "services_blocks_featured_testimonials" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_featured_testimonials_path_idx" ON "services_blocks_featured_testimonials" USING btree ("_path");
  CREATE INDEX "services_blocks_testimonial_block_order_idx" ON "services_blocks_testimonial_block" USING btree ("_order");
  CREATE INDEX "services_blocks_testimonial_block_parent_id_idx" ON "services_blocks_testimonial_block" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_testimonial_block_path_idx" ON "services_blocks_testimonial_block" USING btree ("_path");
  CREATE INDEX "services_blocks_testimonial_block_testimonial_idx" ON "services_blocks_testimonial_block" USING btree ("testimonial_id");
  CREATE INDEX "services_blocks_client_logo_grid_logos_order_idx" ON "services_blocks_client_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "services_blocks_client_logo_grid_logos_parent_id_idx" ON "services_blocks_client_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_client_logo_grid_logos_logo_idx" ON "services_blocks_client_logo_grid_logos" USING btree ("logo_id");
  CREATE INDEX "services_blocks_client_logo_grid_order_idx" ON "services_blocks_client_logo_grid" USING btree ("_order");
  CREATE INDEX "services_blocks_client_logo_grid_parent_id_idx" ON "services_blocks_client_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_client_logo_grid_path_idx" ON "services_blocks_client_logo_grid" USING btree ("_path");
  CREATE INDEX "services_blocks_cta_section_order_idx" ON "services_blocks_cta_section" USING btree ("_order");
  CREATE INDEX "services_blocks_cta_section_parent_id_idx" ON "services_blocks_cta_section" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_cta_section_path_idx" ON "services_blocks_cta_section" USING btree ("_path");
  CREATE INDEX "services_blocks_cta_section_background_image_idx" ON "services_blocks_cta_section" USING btree ("background_image_id");
  CREATE INDEX "services_blocks_newsletter_cta_order_idx" ON "services_blocks_newsletter_cta" USING btree ("_order");
  CREATE INDEX "services_blocks_newsletter_cta_parent_id_idx" ON "services_blocks_newsletter_cta" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_newsletter_cta_path_idx" ON "services_blocks_newsletter_cta" USING btree ("_path");
  CREATE INDEX "services_blocks_contact_cta_order_idx" ON "services_blocks_contact_cta" USING btree ("_order");
  CREATE INDEX "services_blocks_contact_cta_parent_id_idx" ON "services_blocks_contact_cta" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_contact_cta_path_idx" ON "services_blocks_contact_cta" USING btree ("_path");
  CREATE INDEX "services_blocks_case_study_grid_order_idx" ON "services_blocks_case_study_grid" USING btree ("_order");
  CREATE INDEX "services_blocks_case_study_grid_parent_id_idx" ON "services_blocks_case_study_grid" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_case_study_grid_path_idx" ON "services_blocks_case_study_grid" USING btree ("_path");
  CREATE INDEX "services_blocks_case_study_grid_industry_idx" ON "services_blocks_case_study_grid" USING btree ("industry_id");
  CREATE INDEX "services_blocks_case_study_grid_service_idx" ON "services_blocks_case_study_grid" USING btree ("service_id");
  CREATE INDEX "services_blocks_service_cards_order_idx" ON "services_blocks_service_cards" USING btree ("_order");
  CREATE INDEX "services_blocks_service_cards_parent_id_idx" ON "services_blocks_service_cards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_service_cards_path_idx" ON "services_blocks_service_cards" USING btree ("_path");
  CREATE INDEX "services_blocks_service_cards_pillar_idx" ON "services_blocks_service_cards" USING btree ("pillar_id");
  CREATE INDEX "services_blocks_service_pillar_cards_order_idx" ON "services_blocks_service_pillar_cards" USING btree ("_order");
  CREATE INDEX "services_blocks_service_pillar_cards_parent_id_idx" ON "services_blocks_service_pillar_cards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_service_pillar_cards_path_idx" ON "services_blocks_service_pillar_cards" USING btree ("_path");
  CREATE INDEX "services_blocks_featured_case_study_order_idx" ON "services_blocks_featured_case_study" USING btree ("_order");
  CREATE INDEX "services_blocks_featured_case_study_parent_id_idx" ON "services_blocks_featured_case_study" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_featured_case_study_path_idx" ON "services_blocks_featured_case_study" USING btree ("_path");
  CREATE INDEX "services_blocks_featured_case_study_case_study_idx" ON "services_blocks_featured_case_study" USING btree ("case_study_id");
  CREATE INDEX "services_blocks_post_list_order_idx" ON "services_blocks_post_list" USING btree ("_order");
  CREATE INDEX "services_blocks_post_list_parent_id_idx" ON "services_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_post_list_path_idx" ON "services_blocks_post_list" USING btree ("_path");
  CREATE INDEX "services_blocks_post_list_category_idx" ON "services_blocks_post_list" USING btree ("category_id");
  CREATE INDEX "services_blocks_related_posts_order_idx" ON "services_blocks_related_posts" USING btree ("_order");
  CREATE INDEX "services_blocks_related_posts_parent_id_idx" ON "services_blocks_related_posts" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_related_posts_path_idx" ON "services_blocks_related_posts" USING btree ("_path");
  CREATE INDEX "services_blocks_industry_grid_order_idx" ON "services_blocks_industry_grid" USING btree ("_order");
  CREATE INDEX "services_blocks_industry_grid_parent_id_idx" ON "services_blocks_industry_grid" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_industry_grid_path_idx" ON "services_blocks_industry_grid" USING btree ("_path");
  CREATE INDEX "services_blocks_locations_list_order_idx" ON "services_blocks_locations_list" USING btree ("_order");
  CREATE INDEX "services_blocks_locations_list_parent_id_idx" ON "services_blocks_locations_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_locations_list_path_idx" ON "services_blocks_locations_list" USING btree ("_path");
  CREATE INDEX "services_blocks_workshop_list_order_idx" ON "services_blocks_workshop_list" USING btree ("_order");
  CREATE INDEX "services_blocks_workshop_list_parent_id_idx" ON "services_blocks_workshop_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_workshop_list_path_idx" ON "services_blocks_workshop_list" USING btree ("_path");
  CREATE INDEX "services_blocks_team_grid_order_idx" ON "services_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "services_blocks_team_grid_parent_id_idx" ON "services_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_team_grid_path_idx" ON "services_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "services_blocks_video_embed_order_idx" ON "services_blocks_video_embed" USING btree ("_order");
  CREATE INDEX "services_blocks_video_embed_parent_id_idx" ON "services_blocks_video_embed" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_video_embed_path_idx" ON "services_blocks_video_embed" USING btree ("_path");
  CREATE INDEX "services_blocks_video_embed_thumbnail_idx" ON "services_blocks_video_embed" USING btree ("thumbnail_id");
  CREATE INDEX "services_blocks_mission_vision_values_values_order_idx" ON "services_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "services_blocks_mission_vision_values_values_parent_id_idx" ON "services_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_mission_vision_values_order_idx" ON "services_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "services_blocks_mission_vision_values_parent_id_idx" ON "services_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_mission_vision_values_path_idx" ON "services_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "services_blocks_accordion_items_order_idx" ON "services_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "services_blocks_accordion_items_parent_id_idx" ON "services_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_accordion_order_idx" ON "services_blocks_accordion" USING btree ("_order");
  CREATE INDEX "services_blocks_accordion_parent_id_idx" ON "services_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_accordion_path_idx" ON "services_blocks_accordion" USING btree ("_path");
  CREATE INDEX "services_blocks_tabs_tabs_order_idx" ON "services_blocks_tabs_tabs" USING btree ("_order");
  CREATE INDEX "services_blocks_tabs_tabs_parent_id_idx" ON "services_blocks_tabs_tabs" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_tabs_order_idx" ON "services_blocks_tabs" USING btree ("_order");
  CREATE INDEX "services_blocks_tabs_parent_id_idx" ON "services_blocks_tabs" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_tabs_path_idx" ON "services_blocks_tabs" USING btree ("_path");
  CREATE INDEX "services_blocks_map_order_idx" ON "services_blocks_map" USING btree ("_order");
  CREATE INDEX "services_blocks_map_parent_id_idx" ON "services_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_map_path_idx" ON "services_blocks_map" USING btree ("_path");
  CREATE INDEX "services_blocks_embed_order_idx" ON "services_blocks_embed" USING btree ("_order");
  CREATE INDEX "services_blocks_embed_parent_id_idx" ON "services_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_embed_path_idx" ON "services_blocks_embed" USING btree ("_path");
  CREATE INDEX "services_blocks_download_card_order_idx" ON "services_blocks_download_card" USING btree ("_order");
  CREATE INDEX "services_blocks_download_card_parent_id_idx" ON "services_blocks_download_card" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_download_card_path_idx" ON "services_blocks_download_card" USING btree ("_path");
  CREATE INDEX "services_blocks_download_card_cover_image_idx" ON "services_blocks_download_card" USING btree ("cover_image_id");
  CREATE INDEX "services_blocks_hubspot_form_order_idx" ON "services_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "services_blocks_hubspot_form_parent_id_idx" ON "services_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hubspot_form_path_idx" ON "services_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "services_blocks_hubspot_meetings_order_idx" ON "services_blocks_hubspot_meetings" USING btree ("_order");
  CREATE INDEX "services_blocks_hubspot_meetings_parent_id_idx" ON "services_blocks_hubspot_meetings" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hubspot_meetings_path_idx" ON "services_blocks_hubspot_meetings" USING btree ("_path");
  CREATE INDEX "services_blocks_brand_teaser_order_idx" ON "services_blocks_brand_teaser" USING btree ("_order");
  CREATE INDEX "services_blocks_brand_teaser_parent_id_idx" ON "services_blocks_brand_teaser" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_brand_teaser_path_idx" ON "services_blocks_brand_teaser" USING btree ("_path");
  CREATE INDEX "services_blocks_brand_teaser_image_idx" ON "services_blocks_brand_teaser" USING btree ("image_id");
  CREATE INDEX "services_blocks_nav_cards_cards_order_idx" ON "services_blocks_nav_cards_cards" USING btree ("_order");
  CREATE INDEX "services_blocks_nav_cards_cards_parent_id_idx" ON "services_blocks_nav_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_nav_cards_cards_image_idx" ON "services_blocks_nav_cards_cards" USING btree ("image_id");
  CREATE INDEX "services_blocks_nav_cards_order_idx" ON "services_blocks_nav_cards" USING btree ("_order");
  CREATE INDEX "services_blocks_nav_cards_parent_id_idx" ON "services_blocks_nav_cards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_nav_cards_path_idx" ON "services_blocks_nav_cards" USING btree ("_path");
  CREATE INDEX "services_blocks_key_takeaways_items_order_idx" ON "services_blocks_key_takeaways_items" USING btree ("_order");
  CREATE INDEX "services_blocks_key_takeaways_items_parent_id_idx" ON "services_blocks_key_takeaways_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_key_takeaways_order_idx" ON "services_blocks_key_takeaways" USING btree ("_order");
  CREATE INDEX "services_blocks_key_takeaways_parent_id_idx" ON "services_blocks_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_key_takeaways_path_idx" ON "services_blocks_key_takeaways" USING btree ("_path");
  CREATE INDEX "services_blocks_tech_stack_items_order_idx" ON "services_blocks_tech_stack_items" USING btree ("_order");
  CREATE INDEX "services_blocks_tech_stack_items_parent_id_idx" ON "services_blocks_tech_stack_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_tech_stack_order_idx" ON "services_blocks_tech_stack" USING btree ("_order");
  CREATE INDEX "services_blocks_tech_stack_parent_id_idx" ON "services_blocks_tech_stack" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_tech_stack_path_idx" ON "services_blocks_tech_stack" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_hero_order_idx" ON "_services_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hero_parent_id_idx" ON "_services_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hero_path_idx" ON "_services_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_hero_media_idx" ON "_services_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_case_study_hero_order_idx" ON "_services_v_blocks_case_study_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_case_study_hero_parent_id_idx" ON "_services_v_blocks_case_study_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_case_study_hero_path_idx" ON "_services_v_blocks_case_study_hero" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_case_study_hero_hero_image_idx" ON "_services_v_blocks_case_study_hero" USING btree ("hero_image_id");
  CREATE INDEX "_services_v_blocks_service_pillar_hero_order_idx" ON "_services_v_blocks_service_pillar_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_service_pillar_hero_parent_id_idx" ON "_services_v_blocks_service_pillar_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_service_pillar_hero_path_idx" ON "_services_v_blocks_service_pillar_hero" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_service_pillar_hero_hero_image_idx" ON "_services_v_blocks_service_pillar_hero" USING btree ("hero_image_id");
  CREATE INDEX "_services_v_blocks_homepage_hero_order_idx" ON "_services_v_blocks_homepage_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_homepage_hero_parent_id_idx" ON "_services_v_blocks_homepage_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_homepage_hero_path_idx" ON "_services_v_blocks_homepage_hero" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_homepage_hero_background_image_idx" ON "_services_v_blocks_homepage_hero" USING btree ("background_image_id");
  CREATE INDEX "_services_v_blocks_content_order_idx" ON "_services_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_content_parent_id_idx" ON "_services_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_content_path_idx" ON "_services_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_two_column_order_idx" ON "_services_v_blocks_two_column" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_two_column_parent_id_idx" ON "_services_v_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_two_column_path_idx" ON "_services_v_blocks_two_column" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_two_column_media_idx" ON "_services_v_blocks_two_column" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_image_order_idx" ON "_services_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_image_parent_id_idx" ON "_services_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_image_path_idx" ON "_services_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_image_image_idx" ON "_services_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_gallery_items_order_idx" ON "_services_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_gallery_items_parent_id_idx" ON "_services_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_gallery_items_image_idx" ON "_services_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_gallery_order_idx" ON "_services_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_gallery_parent_id_idx" ON "_services_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_gallery_path_idx" ON "_services_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_process_steps_steps_order_idx" ON "_services_v_blocks_process_steps_steps" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_process_steps_steps_parent_id_idx" ON "_services_v_blocks_process_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_process_steps_order_idx" ON "_services_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_process_steps_parent_id_idx" ON "_services_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_process_steps_path_idx" ON "_services_v_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_deliverables_items_order_idx" ON "_services_v_blocks_deliverables_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_deliverables_items_parent_id_idx" ON "_services_v_blocks_deliverables_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_deliverables_order_idx" ON "_services_v_blocks_deliverables" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_deliverables_parent_id_idx" ON "_services_v_blocks_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_deliverables_path_idx" ON "_services_v_blocks_deliverables" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_comparison_table_columns_order_idx" ON "_services_v_blocks_comparison_table_columns" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_comparison_table_columns_parent_id_idx" ON "_services_v_blocks_comparison_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_comparison_table_rows_cells_order_idx" ON "_services_v_blocks_comparison_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_comparison_table_rows_cells_parent_id_idx" ON "_services_v_blocks_comparison_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_comparison_table_rows_order_idx" ON "_services_v_blocks_comparison_table_rows" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_comparison_table_rows_parent_id_idx" ON "_services_v_blocks_comparison_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_comparison_table_best_for_row_order_idx" ON "_services_v_blocks_comparison_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_comparison_table_best_for_row_parent_id_idx" ON "_services_v_blocks_comparison_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_comparison_table_order_idx" ON "_services_v_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_comparison_table_parent_id_idx" ON "_services_v_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_comparison_table_path_idx" ON "_services_v_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_timeline_items_order_idx" ON "_services_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_timeline_items_parent_id_idx" ON "_services_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_timeline_items_image_idx" ON "_services_v_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_timeline_order_idx" ON "_services_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_timeline_parent_id_idx" ON "_services_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_timeline_path_idx" ON "_services_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_faq_items_order_idx" ON "_services_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_items_parent_id_idx" ON "_services_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_order_idx" ON "_services_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_parent_id_idx" ON "_services_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_path_idx" ON "_services_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_stats_bar_items_order_idx" ON "_services_v_blocks_stats_bar_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_stats_bar_items_parent_id_idx" ON "_services_v_blocks_stats_bar_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_stats_bar_order_idx" ON "_services_v_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_stats_bar_parent_id_idx" ON "_services_v_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_stats_bar_path_idx" ON "_services_v_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_metric_display_order_idx" ON "_services_v_blocks_metric_display" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_metric_display_parent_id_idx" ON "_services_v_blocks_metric_display" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_metric_display_path_idx" ON "_services_v_blocks_metric_display" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_logo_bar_logos_order_idx" ON "_services_v_blocks_logo_bar_logos" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_logo_bar_logos_parent_id_idx" ON "_services_v_blocks_logo_bar_logos" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_logo_bar_logos_logo_idx" ON "_services_v_blocks_logo_bar_logos" USING btree ("logo_id");
  CREATE INDEX "_services_v_blocks_logo_bar_order_idx" ON "_services_v_blocks_logo_bar" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_logo_bar_parent_id_idx" ON "_services_v_blocks_logo_bar" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_logo_bar_path_idx" ON "_services_v_blocks_logo_bar" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_featured_testimonials_order_idx" ON "_services_v_blocks_featured_testimonials" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_featured_testimonials_parent_id_idx" ON "_services_v_blocks_featured_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_featured_testimonials_path_idx" ON "_services_v_blocks_featured_testimonials" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_testimonial_block_order_idx" ON "_services_v_blocks_testimonial_block" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_testimonial_block_parent_id_idx" ON "_services_v_blocks_testimonial_block" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_testimonial_block_path_idx" ON "_services_v_blocks_testimonial_block" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_testimonial_block_testimonial_idx" ON "_services_v_blocks_testimonial_block" USING btree ("testimonial_id");
  CREATE INDEX "_services_v_blocks_client_logo_grid_logos_order_idx" ON "_services_v_blocks_client_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_client_logo_grid_logos_parent_id_idx" ON "_services_v_blocks_client_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_client_logo_grid_logos_logo_idx" ON "_services_v_blocks_client_logo_grid_logos" USING btree ("logo_id");
  CREATE INDEX "_services_v_blocks_client_logo_grid_order_idx" ON "_services_v_blocks_client_logo_grid" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_client_logo_grid_parent_id_idx" ON "_services_v_blocks_client_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_client_logo_grid_path_idx" ON "_services_v_blocks_client_logo_grid" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_cta_section_order_idx" ON "_services_v_blocks_cta_section" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_cta_section_parent_id_idx" ON "_services_v_blocks_cta_section" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_cta_section_path_idx" ON "_services_v_blocks_cta_section" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_cta_section_background_image_idx" ON "_services_v_blocks_cta_section" USING btree ("background_image_id");
  CREATE INDEX "_services_v_blocks_newsletter_cta_order_idx" ON "_services_v_blocks_newsletter_cta" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_newsletter_cta_parent_id_idx" ON "_services_v_blocks_newsletter_cta" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_newsletter_cta_path_idx" ON "_services_v_blocks_newsletter_cta" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_contact_cta_order_idx" ON "_services_v_blocks_contact_cta" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_contact_cta_parent_id_idx" ON "_services_v_blocks_contact_cta" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_contact_cta_path_idx" ON "_services_v_blocks_contact_cta" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_case_study_grid_order_idx" ON "_services_v_blocks_case_study_grid" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_case_study_grid_parent_id_idx" ON "_services_v_blocks_case_study_grid" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_case_study_grid_path_idx" ON "_services_v_blocks_case_study_grid" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_case_study_grid_industry_idx" ON "_services_v_blocks_case_study_grid" USING btree ("industry_id");
  CREATE INDEX "_services_v_blocks_case_study_grid_service_idx" ON "_services_v_blocks_case_study_grid" USING btree ("service_id");
  CREATE INDEX "_services_v_blocks_service_cards_order_idx" ON "_services_v_blocks_service_cards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_service_cards_parent_id_idx" ON "_services_v_blocks_service_cards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_service_cards_path_idx" ON "_services_v_blocks_service_cards" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_service_cards_pillar_idx" ON "_services_v_blocks_service_cards" USING btree ("pillar_id");
  CREATE INDEX "_services_v_blocks_service_pillar_cards_order_idx" ON "_services_v_blocks_service_pillar_cards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_service_pillar_cards_parent_id_idx" ON "_services_v_blocks_service_pillar_cards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_service_pillar_cards_path_idx" ON "_services_v_blocks_service_pillar_cards" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_featured_case_study_order_idx" ON "_services_v_blocks_featured_case_study" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_featured_case_study_parent_id_idx" ON "_services_v_blocks_featured_case_study" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_featured_case_study_path_idx" ON "_services_v_blocks_featured_case_study" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_featured_case_study_case_study_idx" ON "_services_v_blocks_featured_case_study" USING btree ("case_study_id");
  CREATE INDEX "_services_v_blocks_post_list_order_idx" ON "_services_v_blocks_post_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_post_list_parent_id_idx" ON "_services_v_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_post_list_path_idx" ON "_services_v_blocks_post_list" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_post_list_category_idx" ON "_services_v_blocks_post_list" USING btree ("category_id");
  CREATE INDEX "_services_v_blocks_related_posts_order_idx" ON "_services_v_blocks_related_posts" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_related_posts_parent_id_idx" ON "_services_v_blocks_related_posts" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_related_posts_path_idx" ON "_services_v_blocks_related_posts" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_industry_grid_order_idx" ON "_services_v_blocks_industry_grid" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_industry_grid_parent_id_idx" ON "_services_v_blocks_industry_grid" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_industry_grid_path_idx" ON "_services_v_blocks_industry_grid" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_locations_list_order_idx" ON "_services_v_blocks_locations_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_locations_list_parent_id_idx" ON "_services_v_blocks_locations_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_locations_list_path_idx" ON "_services_v_blocks_locations_list" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_workshop_list_order_idx" ON "_services_v_blocks_workshop_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_workshop_list_parent_id_idx" ON "_services_v_blocks_workshop_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_workshop_list_path_idx" ON "_services_v_blocks_workshop_list" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_team_grid_order_idx" ON "_services_v_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_team_grid_parent_id_idx" ON "_services_v_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_team_grid_path_idx" ON "_services_v_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_video_embed_order_idx" ON "_services_v_blocks_video_embed" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_video_embed_parent_id_idx" ON "_services_v_blocks_video_embed" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_video_embed_path_idx" ON "_services_v_blocks_video_embed" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_video_embed_thumbnail_idx" ON "_services_v_blocks_video_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_services_v_blocks_mission_vision_values_values_order_idx" ON "_services_v_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_mission_vision_values_values_parent_id_idx" ON "_services_v_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_mission_vision_values_order_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_mission_vision_values_parent_id_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_mission_vision_values_path_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_accordion_items_order_idx" ON "_services_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_accordion_items_parent_id_idx" ON "_services_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_accordion_order_idx" ON "_services_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_accordion_parent_id_idx" ON "_services_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_accordion_path_idx" ON "_services_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_tabs_tabs_order_idx" ON "_services_v_blocks_tabs_tabs" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_tabs_tabs_parent_id_idx" ON "_services_v_blocks_tabs_tabs" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_tabs_order_idx" ON "_services_v_blocks_tabs" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_tabs_parent_id_idx" ON "_services_v_blocks_tabs" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_tabs_path_idx" ON "_services_v_blocks_tabs" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_map_order_idx" ON "_services_v_blocks_map" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_map_parent_id_idx" ON "_services_v_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_map_path_idx" ON "_services_v_blocks_map" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_embed_order_idx" ON "_services_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_embed_parent_id_idx" ON "_services_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_embed_path_idx" ON "_services_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_download_card_order_idx" ON "_services_v_blocks_download_card" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_download_card_parent_id_idx" ON "_services_v_blocks_download_card" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_download_card_path_idx" ON "_services_v_blocks_download_card" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_download_card_cover_image_idx" ON "_services_v_blocks_download_card" USING btree ("cover_image_id");
  CREATE INDEX "_services_v_blocks_hubspot_form_order_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hubspot_form_parent_id_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hubspot_form_path_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_hubspot_meetings_order_idx" ON "_services_v_blocks_hubspot_meetings" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hubspot_meetings_parent_id_idx" ON "_services_v_blocks_hubspot_meetings" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hubspot_meetings_path_idx" ON "_services_v_blocks_hubspot_meetings" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_brand_teaser_order_idx" ON "_services_v_blocks_brand_teaser" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_brand_teaser_parent_id_idx" ON "_services_v_blocks_brand_teaser" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_brand_teaser_path_idx" ON "_services_v_blocks_brand_teaser" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_brand_teaser_image_idx" ON "_services_v_blocks_brand_teaser" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_nav_cards_cards_order_idx" ON "_services_v_blocks_nav_cards_cards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_nav_cards_cards_parent_id_idx" ON "_services_v_blocks_nav_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_nav_cards_cards_image_idx" ON "_services_v_blocks_nav_cards_cards" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_nav_cards_order_idx" ON "_services_v_blocks_nav_cards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_nav_cards_parent_id_idx" ON "_services_v_blocks_nav_cards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_nav_cards_path_idx" ON "_services_v_blocks_nav_cards" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_key_takeaways_items_order_idx" ON "_services_v_blocks_key_takeaways_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_key_takeaways_items_parent_id_idx" ON "_services_v_blocks_key_takeaways_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_key_takeaways_order_idx" ON "_services_v_blocks_key_takeaways" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_key_takeaways_parent_id_idx" ON "_services_v_blocks_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_key_takeaways_path_idx" ON "_services_v_blocks_key_takeaways" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_tech_stack_items_order_idx" ON "_services_v_blocks_tech_stack_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_tech_stack_items_parent_id_idx" ON "_services_v_blocks_tech_stack_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_tech_stack_order_idx" ON "_services_v_blocks_tech_stack" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_tech_stack_parent_id_idx" ON "_services_v_blocks_tech_stack" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_tech_stack_path_idx" ON "_services_v_blocks_tech_stack" USING btree ("_path");
  ALTER TABLE "pages_blocks_service_cards" ADD CONSTRAINT "pages_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_cards" ADD CONSTRAINT "_pages_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_service_cards" ADD CONSTRAINT "case_studies_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_service_cards" ADD CONSTRAINT "_case_studies_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_service_cards" ADD CONSTRAINT "team_members_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_service_cards" ADD CONSTRAINT "_team_members_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_service_cards" ADD CONSTRAINT "workshops_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_service_cards" ADD CONSTRAINT "_workshops_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_cards" ADD CONSTRAINT "partners_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_cards" ADD CONSTRAINT "_partners_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_service_cards" ADD CONSTRAINT "homepage_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_service_cards" ADD CONSTRAINT "_homepage_v_blocks_service_cards_pillar_id_services_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "services_rels_services_id_idx" ON "services_rels" USING btree ("services_id");
  CREATE INDEX "services_rels_testimonials_id_idx" ON "services_rels" USING btree ("testimonials_id");
  CREATE INDEX "services_rels_posts_id_idx" ON "services_rels" USING btree ("posts_id");
  CREATE INDEX "services_rels_industries_id_idx" ON "services_rels" USING btree ("industries_id");
  CREATE INDEX "services_rels_locations_id_idx" ON "services_rels" USING btree ("locations_id");
  CREATE INDEX "services_rels_workshops_id_idx" ON "services_rels" USING btree ("workshops_id");
  CREATE INDEX "services_rels_team_members_id_idx" ON "services_rels" USING btree ("team_members_id");
  CREATE INDEX "_services_v_rels_services_id_idx" ON "_services_v_rels" USING btree ("services_id");
  CREATE INDEX "_services_v_rels_testimonials_id_idx" ON "_services_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_services_v_rels_posts_id_idx" ON "_services_v_rels" USING btree ("posts_id");
  CREATE INDEX "_services_v_rels_industries_id_idx" ON "_services_v_rels" USING btree ("industries_id");
  CREATE INDEX "_services_v_rels_locations_id_idx" ON "_services_v_rels" USING btree ("locations_id");
  CREATE INDEX "_services_v_rels_workshops_id_idx" ON "_services_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_services_v_rels_team_members_id_idx" ON "_services_v_rels" USING btree ("team_members_id");
  ALTER TABLE "pages_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "case_studies_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_case_studies_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "services" DROP COLUMN "pillar_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_pillar_id";
  ALTER TABLE "team_members_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_team_members_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "workshops_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_workshops_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "partners_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_partners_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "homepage_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_homepage_v_rels" DROP COLUMN "service_pillars_id";
  DROP TYPE "public"."enum_service_pillars_status";
  DROP TYPE "public"."enum__service_pillars_v_version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_service_pillars_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__service_pillars_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "service_pillars" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description" jsonb,
  	"hero_image_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_service_pillars_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_service_pillars_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"version_hero_image_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_order" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__service_pillars_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "services_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_case_study_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_service_pillar_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_homepage_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_two_column" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_process_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_deliverables_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_comparison_table_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_comparison_table_rows_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_comparison_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_comparison_table_best_for_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_stats_bar_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_stats_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_metric_display" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_logo_bar_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_logo_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_featured_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_testimonial_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_client_logo_grid_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_client_logo_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_cta_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_newsletter_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_contact_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_case_study_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_service_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_service_pillar_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_featured_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_post_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_related_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_industry_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_locations_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_workshop_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_video_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_accordion_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_accordion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_tabs_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_download_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_hubspot_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_hubspot_meetings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_brand_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_nav_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_nav_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_tech_stack_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_tech_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_case_study_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_service_pillar_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_homepage_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_two_column" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_process_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_deliverables_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_comparison_table_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_comparison_table_rows_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_comparison_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_comparison_table_best_for_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_stats_bar_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_stats_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_metric_display" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_logo_bar_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_logo_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_featured_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_testimonial_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_client_logo_grid_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_client_logo_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_cta_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_newsletter_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_contact_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_case_study_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_service_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_service_pillar_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_featured_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_post_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_related_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_industry_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_locations_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_workshop_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_video_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_accordion_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_accordion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_tabs_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_download_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_hubspot_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_hubspot_meetings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_brand_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_nav_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_nav_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_tech_stack_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_tech_stack" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "services_blocks_hero" CASCADE;
  DROP TABLE "services_blocks_case_study_hero" CASCADE;
  DROP TABLE "services_blocks_service_pillar_hero" CASCADE;
  DROP TABLE "services_blocks_homepage_hero" CASCADE;
  DROP TABLE "services_blocks_content" CASCADE;
  DROP TABLE "services_blocks_two_column" CASCADE;
  DROP TABLE "services_blocks_image" CASCADE;
  DROP TABLE "services_blocks_gallery_items" CASCADE;
  DROP TABLE "services_blocks_gallery" CASCADE;
  DROP TABLE "services_blocks_process_steps_steps" CASCADE;
  DROP TABLE "services_blocks_process_steps" CASCADE;
  DROP TABLE "services_blocks_deliverables_items" CASCADE;
  DROP TABLE "services_blocks_deliverables" CASCADE;
  DROP TABLE "services_blocks_comparison_table_columns" CASCADE;
  DROP TABLE "services_blocks_comparison_table_rows_cells" CASCADE;
  DROP TABLE "services_blocks_comparison_table_rows" CASCADE;
  DROP TABLE "services_blocks_comparison_table_best_for_row" CASCADE;
  DROP TABLE "services_blocks_comparison_table" CASCADE;
  DROP TABLE "services_blocks_timeline_items" CASCADE;
  DROP TABLE "services_blocks_timeline" CASCADE;
  DROP TABLE "services_blocks_faq_items" CASCADE;
  DROP TABLE "services_blocks_faq" CASCADE;
  DROP TABLE "services_blocks_stats_bar_items" CASCADE;
  DROP TABLE "services_blocks_stats_bar" CASCADE;
  DROP TABLE "services_blocks_metric_display" CASCADE;
  DROP TABLE "services_blocks_logo_bar_logos" CASCADE;
  DROP TABLE "services_blocks_logo_bar" CASCADE;
  DROP TABLE "services_blocks_featured_testimonials" CASCADE;
  DROP TABLE "services_blocks_testimonial_block" CASCADE;
  DROP TABLE "services_blocks_client_logo_grid_logos" CASCADE;
  DROP TABLE "services_blocks_client_logo_grid" CASCADE;
  DROP TABLE "services_blocks_cta_section" CASCADE;
  DROP TABLE "services_blocks_newsletter_cta" CASCADE;
  DROP TABLE "services_blocks_contact_cta" CASCADE;
  DROP TABLE "services_blocks_case_study_grid" CASCADE;
  DROP TABLE "services_blocks_service_cards" CASCADE;
  DROP TABLE "services_blocks_service_pillar_cards" CASCADE;
  DROP TABLE "services_blocks_featured_case_study" CASCADE;
  DROP TABLE "services_blocks_post_list" CASCADE;
  DROP TABLE "services_blocks_related_posts" CASCADE;
  DROP TABLE "services_blocks_industry_grid" CASCADE;
  DROP TABLE "services_blocks_locations_list" CASCADE;
  DROP TABLE "services_blocks_workshop_list" CASCADE;
  DROP TABLE "services_blocks_team_grid" CASCADE;
  DROP TABLE "services_blocks_video_embed" CASCADE;
  DROP TABLE "services_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "services_blocks_mission_vision_values" CASCADE;
  DROP TABLE "services_blocks_accordion_items" CASCADE;
  DROP TABLE "services_blocks_accordion" CASCADE;
  DROP TABLE "services_blocks_tabs_tabs" CASCADE;
  DROP TABLE "services_blocks_tabs" CASCADE;
  DROP TABLE "services_blocks_map" CASCADE;
  DROP TABLE "services_blocks_embed" CASCADE;
  DROP TABLE "services_blocks_download_card" CASCADE;
  DROP TABLE "services_blocks_hubspot_form" CASCADE;
  DROP TABLE "services_blocks_hubspot_meetings" CASCADE;
  DROP TABLE "services_blocks_brand_teaser" CASCADE;
  DROP TABLE "services_blocks_nav_cards_cards" CASCADE;
  DROP TABLE "services_blocks_nav_cards" CASCADE;
  DROP TABLE "services_blocks_key_takeaways_items" CASCADE;
  DROP TABLE "services_blocks_key_takeaways" CASCADE;
  DROP TABLE "services_blocks_tech_stack_items" CASCADE;
  DROP TABLE "services_blocks_tech_stack" CASCADE;
  DROP TABLE "_services_v_blocks_hero" CASCADE;
  DROP TABLE "_services_v_blocks_case_study_hero" CASCADE;
  DROP TABLE "_services_v_blocks_service_pillar_hero" CASCADE;
  DROP TABLE "_services_v_blocks_homepage_hero" CASCADE;
  DROP TABLE "_services_v_blocks_content" CASCADE;
  DROP TABLE "_services_v_blocks_two_column" CASCADE;
  DROP TABLE "_services_v_blocks_image" CASCADE;
  DROP TABLE "_services_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_services_v_blocks_gallery" CASCADE;
  DROP TABLE "_services_v_blocks_process_steps_steps" CASCADE;
  DROP TABLE "_services_v_blocks_process_steps" CASCADE;
  DROP TABLE "_services_v_blocks_deliverables_items" CASCADE;
  DROP TABLE "_services_v_blocks_deliverables" CASCADE;
  DROP TABLE "_services_v_blocks_comparison_table_columns" CASCADE;
  DROP TABLE "_services_v_blocks_comparison_table_rows_cells" CASCADE;
  DROP TABLE "_services_v_blocks_comparison_table_rows" CASCADE;
  DROP TABLE "_services_v_blocks_comparison_table_best_for_row" CASCADE;
  DROP TABLE "_services_v_blocks_comparison_table" CASCADE;
  DROP TABLE "_services_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_services_v_blocks_timeline" CASCADE;
  DROP TABLE "_services_v_blocks_faq_items" CASCADE;
  DROP TABLE "_services_v_blocks_faq" CASCADE;
  DROP TABLE "_services_v_blocks_stats_bar_items" CASCADE;
  DROP TABLE "_services_v_blocks_stats_bar" CASCADE;
  DROP TABLE "_services_v_blocks_metric_display" CASCADE;
  DROP TABLE "_services_v_blocks_logo_bar_logos" CASCADE;
  DROP TABLE "_services_v_blocks_logo_bar" CASCADE;
  DROP TABLE "_services_v_blocks_featured_testimonials" CASCADE;
  DROP TABLE "_services_v_blocks_testimonial_block" CASCADE;
  DROP TABLE "_services_v_blocks_client_logo_grid_logos" CASCADE;
  DROP TABLE "_services_v_blocks_client_logo_grid" CASCADE;
  DROP TABLE "_services_v_blocks_cta_section" CASCADE;
  DROP TABLE "_services_v_blocks_newsletter_cta" CASCADE;
  DROP TABLE "_services_v_blocks_contact_cta" CASCADE;
  DROP TABLE "_services_v_blocks_case_study_grid" CASCADE;
  DROP TABLE "_services_v_blocks_service_cards" CASCADE;
  DROP TABLE "_services_v_blocks_service_pillar_cards" CASCADE;
  DROP TABLE "_services_v_blocks_featured_case_study" CASCADE;
  DROP TABLE "_services_v_blocks_post_list" CASCADE;
  DROP TABLE "_services_v_blocks_related_posts" CASCADE;
  DROP TABLE "_services_v_blocks_industry_grid" CASCADE;
  DROP TABLE "_services_v_blocks_locations_list" CASCADE;
  DROP TABLE "_services_v_blocks_workshop_list" CASCADE;
  DROP TABLE "_services_v_blocks_team_grid" CASCADE;
  DROP TABLE "_services_v_blocks_video_embed" CASCADE;
  DROP TABLE "_services_v_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "_services_v_blocks_mission_vision_values" CASCADE;
  DROP TABLE "_services_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_services_v_blocks_accordion" CASCADE;
  DROP TABLE "_services_v_blocks_tabs_tabs" CASCADE;
  DROP TABLE "_services_v_blocks_tabs" CASCADE;
  DROP TABLE "_services_v_blocks_map" CASCADE;
  DROP TABLE "_services_v_blocks_embed" CASCADE;
  DROP TABLE "_services_v_blocks_download_card" CASCADE;
  DROP TABLE "_services_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_services_v_blocks_hubspot_meetings" CASCADE;
  DROP TABLE "_services_v_blocks_brand_teaser" CASCADE;
  DROP TABLE "_services_v_blocks_nav_cards_cards" CASCADE;
  DROP TABLE "_services_v_blocks_nav_cards" CASCADE;
  DROP TABLE "_services_v_blocks_key_takeaways_items" CASCADE;
  DROP TABLE "_services_v_blocks_key_takeaways" CASCADE;
  DROP TABLE "_services_v_blocks_tech_stack_items" CASCADE;
  DROP TABLE "_services_v_blocks_tech_stack" CASCADE;
  ALTER TABLE "pages_blocks_service_cards" DROP CONSTRAINT IF EXISTS "pages_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_pages_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "case_studies_blocks_service_cards" DROP CONSTRAINT IF EXISTS "case_studies_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_case_studies_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_case_studies_v_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_services_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_testimonials_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_posts_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_industries_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_locations_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_workshops_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT IF EXISTS "services_rels_team_members_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_services_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_testimonials_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_posts_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_industries_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_locations_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_workshops_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT IF EXISTS "_services_v_rels_team_members_fk";
  
  ALTER TABLE "team_members_blocks_service_cards" DROP CONSTRAINT IF EXISTS "team_members_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_team_members_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_team_members_v_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "workshops_blocks_service_cards" DROP CONSTRAINT IF EXISTS "workshops_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_workshops_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_workshops_v_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "partners_blocks_service_cards" DROP CONSTRAINT IF EXISTS "partners_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_partners_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_partners_v_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "homepage_blocks_service_cards" DROP CONSTRAINT IF EXISTS "homepage_blocks_service_cards_pillar_id_services_id_fk";
  
  ALTER TABLE "_homepage_v_blocks_service_cards" DROP CONSTRAINT IF EXISTS "_homepage_v_blocks_service_cards_pillar_id_services_id_fk";
  
  DROP INDEX IF EXISTS "services_rels_services_id_idx";
  DROP INDEX IF EXISTS "services_rels_testimonials_id_idx";
  DROP INDEX IF EXISTS "services_rels_posts_id_idx";
  DROP INDEX IF EXISTS "services_rels_industries_id_idx";
  DROP INDEX IF EXISTS "services_rels_locations_id_idx";
  DROP INDEX IF EXISTS "services_rels_workshops_id_idx";
  DROP INDEX IF EXISTS "services_rels_team_members_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_services_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_testimonials_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_posts_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_industries_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_locations_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_workshops_id_idx";
  DROP INDEX IF EXISTS "_services_v_rels_team_members_id_idx";
  ALTER TABLE "pages_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "case_studies_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_case_studies_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "services" ADD COLUMN "pillar_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_pillar_id" integer;
  ALTER TABLE "team_members_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_team_members_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "workshops_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_workshops_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "partners_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_partners_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "homepage_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_homepage_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "service_pillars" ADD CONSTRAINT "service_pillars_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_pillars" ADD CONSTRAINT "service_pillars_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_service_pillars_v" ADD CONSTRAINT "_service_pillars_v_parent_id_service_pillars_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_service_pillars_v" ADD CONSTRAINT "_service_pillars_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_service_pillars_v" ADD CONSTRAINT "_service_pillars_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "service_pillars_slug_idx" ON "service_pillars" USING btree ("slug");
  CREATE INDEX "service_pillars_hero_image_idx" ON "service_pillars" USING btree ("hero_image_id");
  CREATE INDEX "service_pillars_seo_seo_og_image_idx" ON "service_pillars" USING btree ("seo_og_image_id");
  CREATE INDEX "service_pillars_updated_at_idx" ON "service_pillars" USING btree ("updated_at");
  CREATE INDEX "service_pillars_created_at_idx" ON "service_pillars" USING btree ("created_at");
  CREATE INDEX "service_pillars__status_idx" ON "service_pillars" USING btree ("_status");
  CREATE INDEX "_service_pillars_v_parent_idx" ON "_service_pillars_v" USING btree ("parent_id");
  CREATE INDEX "_service_pillars_v_version_version_slug_idx" ON "_service_pillars_v" USING btree ("version_slug");
  CREATE INDEX "_service_pillars_v_version_version_hero_image_idx" ON "_service_pillars_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_service_pillars_v_version_seo_version_seo_og_image_idx" ON "_service_pillars_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_service_pillars_v_version_version_updated_at_idx" ON "_service_pillars_v" USING btree ("version_updated_at");
  CREATE INDEX "_service_pillars_v_version_version_created_at_idx" ON "_service_pillars_v" USING btree ("version_created_at");
  CREATE INDEX "_service_pillars_v_version_version__status_idx" ON "_service_pillars_v" USING btree ("version__status");
  CREATE INDEX "_service_pillars_v_created_at_idx" ON "_service_pillars_v" USING btree ("created_at");
  CREATE INDEX "_service_pillars_v_updated_at_idx" ON "_service_pillars_v" USING btree ("updated_at");
  CREATE INDEX "_service_pillars_v_latest_idx" ON "_service_pillars_v" USING btree ("latest");
  -- SVC-2 DATA, in reverse. After "up()" these columns hold "services.id"
  -- values; the constraints below repoint them at a "service_pillars" table
  -- that has just been recreated EMPTY, so any surviving value fails FK
  -- validation and aborts the rollback. Clear them first. Note this is a
  -- schema rollback, not a data one: the pillar documents themselves are gone
  -- for good (see the header).
  UPDATE "pages_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_pages_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "case_studies_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_case_studies_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "team_members_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_team_members_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "workshops_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_workshops_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "partners_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_partners_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "homepage_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;
  UPDATE "_homepage_v_blocks_service_cards" SET "pillar_id" = NULL WHERE "pillar_id" IS NOT NULL;

  ALTER TABLE "pages_blocks_service_cards" ADD CONSTRAINT "pages_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_cards" ADD CONSTRAINT "_pages_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_service_cards" ADD CONSTRAINT "case_studies_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_service_cards" ADD CONSTRAINT "_case_studies_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_pillar_id_service_pillars_id_fk" FOREIGN KEY ("version_pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_service_cards" ADD CONSTRAINT "team_members_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_service_cards" ADD CONSTRAINT "_team_members_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_service_cards" ADD CONSTRAINT "workshops_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_service_cards" ADD CONSTRAINT "_workshops_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_cards" ADD CONSTRAINT "partners_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_cards" ADD CONSTRAINT "_partners_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_service_cards" ADD CONSTRAINT "homepage_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_service_cards" ADD CONSTRAINT "_homepage_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_service_pillars_id_idx" ON "pages_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_pages_v_rels_service_pillars_id_idx" ON "_pages_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "case_studies_rels_service_pillars_id_idx" ON "case_studies_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_case_studies_v_rels_service_pillars_id_idx" ON "_case_studies_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "services_pillar_idx" ON "services" USING btree ("pillar_id");
  CREATE INDEX "_services_v_version_version_pillar_idx" ON "_services_v" USING btree ("version_pillar_id");
  CREATE INDEX "team_members_rels_service_pillars_id_idx" ON "team_members_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_team_members_v_rels_service_pillars_id_idx" ON "_team_members_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "workshops_rels_service_pillars_id_idx" ON "workshops_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_workshops_v_rels_service_pillars_id_idx" ON "_workshops_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "partners_rels_service_pillars_id_idx" ON "partners_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_partners_v_rels_service_pillars_id_idx" ON "_partners_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "payload_locked_documents_rels_service_pillars_id_idx" ON "payload_locked_documents_rels" USING btree ("service_pillars_id");
  CREATE INDEX "homepage_rels_service_pillars_id_idx" ON "homepage_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_homepage_v_rels_service_pillars_id_idx" ON "_homepage_v_rels" USING btree ("service_pillars_id");
  ALTER TABLE "services" DROP COLUMN "tier";
  ALTER TABLE "services_rels" DROP COLUMN "services_id";
  ALTER TABLE "services_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "services_rels" DROP COLUMN "posts_id";
  ALTER TABLE "services_rels" DROP COLUMN "industries_id";
  ALTER TABLE "services_rels" DROP COLUMN "locations_id";
  ALTER TABLE "services_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "services_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_tier";
  ALTER TABLE "_services_v_rels" DROP COLUMN "services_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "posts_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "industries_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "locations_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "team_members_id";
  DROP TYPE "public"."enum_services_blocks_hero_variant";
  DROP TYPE "public"."enum_services_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_services_blocks_hero_alignment";
  DROP TYPE "public"."enum_services_blocks_content_width";
  DROP TYPE "public"."enum_services_blocks_content_background";
  DROP TYPE "public"."enum_services_blocks_two_column_media_position";
  DROP TYPE "public"."enum_services_blocks_image_width";
  DROP TYPE "public"."enum_services_blocks_image_alignment";
  DROP TYPE "public"."enum_services_blocks_gallery_layout";
  DROP TYPE "public"."enum_services_blocks_gallery_columns";
  DROP TYPE "public"."enum_services_blocks_metric_display_background";
  DROP TYPE "public"."enum_services_blocks_logo_bar_treatment";
  DROP TYPE "public"."enum_services_blocks_testimonial_block_layout";
  DROP TYPE "public"."enum_services_blocks_client_logo_grid_columns";
  DROP TYPE "public"."enum_services_blocks_cta_section_variant";
  DROP TYPE "public"."enum_services_blocks_cta_section_background";
  DROP TYPE "public"."enum_services_blocks_case_study_grid_source";
  DROP TYPE "public"."enum_services_blocks_service_cards_source";
  DROP TYPE "public"."enum_services_blocks_post_list_source";
  DROP TYPE "public"."enum_services_blocks_team_grid_filter";
  DROP TYPE "public"."enum_services_blocks_team_grid_layout";
  DROP TYPE "public"."enum_services_blocks_video_embed_provider";
  DROP TYPE "public"."enum_services_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum_services_tier";
  DROP TYPE "public"."enum__services_v_blocks_hero_variant";
  DROP TYPE "public"."enum__services_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__services_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__services_v_blocks_content_width";
  DROP TYPE "public"."enum__services_v_blocks_content_background";
  DROP TYPE "public"."enum__services_v_blocks_two_column_media_position";
  DROP TYPE "public"."enum__services_v_blocks_image_width";
  DROP TYPE "public"."enum__services_v_blocks_image_alignment";
  DROP TYPE "public"."enum__services_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__services_v_blocks_gallery_columns";
  DROP TYPE "public"."enum__services_v_blocks_metric_display_background";
  DROP TYPE "public"."enum__services_v_blocks_logo_bar_treatment";
  DROP TYPE "public"."enum__services_v_blocks_testimonial_block_layout";
  DROP TYPE "public"."enum__services_v_blocks_client_logo_grid_columns";
  DROP TYPE "public"."enum__services_v_blocks_cta_section_variant";
  DROP TYPE "public"."enum__services_v_blocks_cta_section_background";
  DROP TYPE "public"."enum__services_v_blocks_case_study_grid_source";
  DROP TYPE "public"."enum__services_v_blocks_service_cards_source";
  DROP TYPE "public"."enum__services_v_blocks_post_list_source";
  DROP TYPE "public"."enum__services_v_blocks_team_grid_filter";
  DROP TYPE "public"."enum__services_v_blocks_team_grid_layout";
  DROP TYPE "public"."enum__services_v_blocks_video_embed_provider";
  DROP TYPE "public"."enum__services_v_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum__services_v_version_tier";`)
}
