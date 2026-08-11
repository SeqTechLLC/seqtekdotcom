import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_partners_blocks_hero_variant" AS ENUM('text-only', 'with-image', 'with-video', 'split');
  CREATE TYPE "public"."enum_partners_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_partners_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_partners_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_partners_blocks_content_background" AS ENUM('none', 'subtle', 'accent');
  CREATE TYPE "public"."enum_partners_blocks_two_column_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_partners_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_partners_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_partners_blocks_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_partners_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_partners_blocks_mission_vision_values_layout" AS ENUM('tabs', 'grid', 'stacked');
  CREATE TYPE "public"."enum_partners_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_partners_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_partners_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum_partners_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_partners_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum_partners_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum_partners_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum_partners_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum_partners_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum_partners_blocks_team_grid_filter" AS ENUM('leadership-only', 'featured', 'all');
  CREATE TYPE "public"."enum_partners_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_partners_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_variant" AS ENUM('text-only', 'with-image', 'with-video', 'split');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__partners_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__partners_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent');
  CREATE TYPE "public"."enum__partners_v_blocks_two_column_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__partners_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__partners_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__partners_v_blocks_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum__partners_v_blocks_gallery_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout" AS ENUM('tabs', 'grid', 'stacked');
  CREATE TYPE "public"."enum__partners_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__partners_v_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__partners_v_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum__partners_v_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__partners_v_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum__partners_v_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum__partners_v_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum__partners_v_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum__partners_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'featured', 'all');
  CREATE TYPE "public"."enum__partners_v_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum__partners_v_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__partners_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "partners_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_partners_blocks_hero_variant" DEFAULT 'text-only',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_partners_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_partners_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_case_study_hero" (
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
  
  CREATE TABLE "partners_blocks_service_pillar_hero" (
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
  
  CREATE TABLE "partners_blocks_homepage_hero" (
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
  
  CREATE TABLE "partners_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_partners_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_partners_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_position" "enum_partners_blocks_two_column_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"media_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_partners_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_partners_blocks_image_alignment" DEFAULT 'center',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "partners_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum_partners_blocks_gallery_layout" DEFAULT 'grid',
  	"columns" "enum_partners_blocks_gallery_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_process_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"icon" varchar
  );
  
  CREATE TABLE "partners_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_deliverables_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "partners_blocks_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_comparison_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "partners_blocks_comparison_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "partners_blocks_comparison_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "partners_blocks_comparison_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "partners_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_mission_vision_values_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "partners_blocks_mission_vision_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mission" varchar,
  	"vision" varchar,
  	"layout" "enum_partners_blocks_mission_vision_values_layout" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"body" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "partners_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_stats_bar_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar
  );
  
  CREATE TABLE "partners_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_partners_blocks_stats_bar_source" DEFAULT 'inline',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_metric_display" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar,
  	"background" "enum_partners_blocks_metric_display_background" DEFAULT 'accent',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_logo_bar_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "partners_blocks_logo_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_partners_blocks_logo_bar_source" DEFAULT 'inline',
  	"treatment" "enum_partners_blocks_logo_bar_treatment" DEFAULT 'grayscale-on-color-hover',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_featured_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"autoplay" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_testimonial_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"testimonial_id" integer,
  	"layout" "enum_partners_blocks_testimonial_block_layout" DEFAULT 'centered',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_client_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "partners_blocks_client_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum_partners_blocks_client_logo_grid_columns" DEFAULT '4',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_cta_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_partners_blocks_cta_section_variant" DEFAULT 'centered',
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"background" "enum_partners_blocks_cta_section_background" DEFAULT 'default',
  	"background_image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_newsletter_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"form_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_contact_cta" (
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
  
  CREATE TABLE "partners_blocks_case_study_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_partners_blocks_case_study_grid_source" DEFAULT 'manual',
  	"industry_id" integer,
  	"service_id" integer,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_service_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_partners_blocks_service_cards_source" DEFAULT 'manual',
  	"pillar_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_service_pillar_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_featured_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"case_study_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum_partners_blocks_post_list_source" DEFAULT 'latest',
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_related_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_industry_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_locations_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_workshop_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"filter" "enum_partners_blocks_team_grid_filter" DEFAULT 'all',
  	"layout" "enum_partners_blocks_team_grid_layout" DEFAULT 'cards',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_video_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" "enum_partners_blocks_video_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"title" varchar,
  	"eyebrow" varchar,
  	"thumbnail_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "partners_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "partners_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_tabs_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "partners_blocks_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_map" (
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
  
  CREATE TABLE "partners_blocks_embed" (
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
  
  CREATE TABLE "partners_blocks_download_card" (
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
  
  CREATE TABLE "partners_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"submit_redirect" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_hubspot_meetings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"meeting_url" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_brand_teaser" (
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
  
  CREATE TABLE "partners_blocks_nav_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_url" varchar
  );
  
  CREATE TABLE "partners_blocks_nav_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_key_takeaways_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "partners_blocks_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_tech_stack_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "partners_blocks_tech_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"logo_id" integer,
  	"url" varchar,
  	"order" numeric,
  	"published_at" timestamp(3) with time zone,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_partners_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "partners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"services_id" integer,
  	"service_pillars_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"locations_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer
  );
  
  CREATE TABLE "_partners_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__partners_v_blocks_hero_variant" DEFAULT 'text-only',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__partners_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__partners_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_case_study_hero" (
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
  
  CREATE TABLE "_partners_v_blocks_service_pillar_hero" (
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
  
  CREATE TABLE "_partners_v_blocks_homepage_hero" (
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
  
  CREATE TABLE "_partners_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__partners_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__partners_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_position" "enum__partners_v_blocks_two_column_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"media_id" integer,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__partners_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__partners_v_blocks_image_alignment" DEFAULT 'center',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"layout" "enum__partners_v_blocks_gallery_layout" DEFAULT 'grid',
  	"columns" "enum__partners_v_blocks_gallery_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_process_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"icon" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_deliverables_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_comparison_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_comparison_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_comparison_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_comparison_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_comparison_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_mission_vision_values_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_mission_vision_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mission" varchar,
  	"vision" varchar,
  	"layout" "enum__partners_v_blocks_mission_vision_values_layout" DEFAULT 'grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"title" varchar,
  	"body" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_stats_bar_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__partners_v_blocks_stats_bar_source" DEFAULT 'inline',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_metric_display" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar,
  	"background" "enum__partners_v_blocks_metric_display_background" DEFAULT 'accent',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_logo_bar_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_logo_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__partners_v_blocks_logo_bar_source" DEFAULT 'inline',
  	"treatment" "enum__partners_v_blocks_logo_bar_treatment" DEFAULT 'grayscale-on-color-hover',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_featured_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"autoplay" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_testimonial_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"testimonial_id" integer,
  	"layout" "enum__partners_v_blocks_testimonial_block_layout" DEFAULT 'centered',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_client_logo_grid_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_client_logo_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"columns" "enum__partners_v_blocks_client_logo_grid_columns" DEFAULT '4',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_cta_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__partners_v_blocks_cta_section_variant" DEFAULT 'centered',
  	"headline" varchar,
  	"body" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"background" "enum__partners_v_blocks_cta_section_background" DEFAULT 'default',
  	"background_image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_newsletter_cta" (
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
  
  CREATE TABLE "_partners_v_blocks_contact_cta" (
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
  
  CREATE TABLE "_partners_v_blocks_case_study_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__partners_v_blocks_case_study_grid_source" DEFAULT 'manual',
  	"industry_id" integer,
  	"service_id" integer,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_service_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__partners_v_blocks_service_cards_source" DEFAULT 'manual',
  	"pillar_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_service_pillar_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_featured_case_study" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"case_study_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_post_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"source" "enum__partners_v_blocks_post_list_source" DEFAULT 'latest',
  	"category_id" integer,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_related_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_industry_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_locations_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_workshop_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_team_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"filter" "enum__partners_v_blocks_team_grid_filter" DEFAULT 'all',
  	"layout" "enum__partners_v_blocks_team_grid_layout" DEFAULT 'cards',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_video_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"provider" "enum__partners_v_blocks_video_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"title" varchar,
  	"eyebrow" varchar,
  	"thumbnail_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_tabs_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_map" (
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
  
  CREATE TABLE "_partners_v_blocks_embed" (
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
  
  CREATE TABLE "_partners_v_blocks_download_card" (
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
  
  CREATE TABLE "_partners_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"submit_redirect" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_hubspot_meetings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"meeting_url" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_brand_teaser" (
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
  
  CREATE TABLE "_partners_v_blocks_nav_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_nav_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_key_takeaways_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_key_takeaways" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_tech_stack_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_tech_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_logo_id" integer,
  	"version_url" varchar,
  	"version_order" numeric,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__partners_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_partners_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"services_id" integer,
  	"service_pillars_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"locations_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "partners_blocks_hero" ADD CONSTRAINT "partners_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_hero" ADD CONSTRAINT "partners_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_case_study_hero" ADD CONSTRAINT "partners_blocks_case_study_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_case_study_hero" ADD CONSTRAINT "partners_blocks_case_study_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_pillar_hero" ADD CONSTRAINT "partners_blocks_service_pillar_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_pillar_hero" ADD CONSTRAINT "partners_blocks_service_pillar_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_homepage_hero" ADD CONSTRAINT "partners_blocks_homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_homepage_hero" ADD CONSTRAINT "partners_blocks_homepage_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_content" ADD CONSTRAINT "partners_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_two_column" ADD CONSTRAINT "partners_blocks_two_column_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_two_column" ADD CONSTRAINT "partners_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_image" ADD CONSTRAINT "partners_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_image" ADD CONSTRAINT "partners_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery_items" ADD CONSTRAINT "partners_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery_items" ADD CONSTRAINT "partners_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery" ADD CONSTRAINT "partners_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_process_steps_steps" ADD CONSTRAINT "partners_blocks_process_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_process_steps" ADD CONSTRAINT "partners_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_deliverables_items" ADD CONSTRAINT "partners_blocks_deliverables_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_deliverables" ADD CONSTRAINT "partners_blocks_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_comparison_table_columns" ADD CONSTRAINT "partners_blocks_comparison_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_comparison_table_rows_cells" ADD CONSTRAINT "partners_blocks_comparison_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_comparison_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_comparison_table_rows" ADD CONSTRAINT "partners_blocks_comparison_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_comparison_table_best_for_row" ADD CONSTRAINT "partners_blocks_comparison_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_comparison_table" ADD CONSTRAINT "partners_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_mission_vision_values_values" ADD CONSTRAINT "partners_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_mission_vision_values" ADD CONSTRAINT "partners_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_timeline_items" ADD CONSTRAINT "partners_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_timeline_items" ADD CONSTRAINT "partners_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_timeline" ADD CONSTRAINT "partners_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_stats_bar_items" ADD CONSTRAINT "partners_blocks_stats_bar_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_stats_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_stats_bar" ADD CONSTRAINT "partners_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_metric_display" ADD CONSTRAINT "partners_blocks_metric_display_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_logo_bar_logos" ADD CONSTRAINT "partners_blocks_logo_bar_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_logo_bar_logos" ADD CONSTRAINT "partners_blocks_logo_bar_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_logo_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_logo_bar" ADD CONSTRAINT "partners_blocks_logo_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_featured_testimonials" ADD CONSTRAINT "partners_blocks_featured_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_testimonial_block" ADD CONSTRAINT "partners_blocks_testimonial_block_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_testimonial_block" ADD CONSTRAINT "partners_blocks_testimonial_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_client_logo_grid_logos" ADD CONSTRAINT "partners_blocks_client_logo_grid_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_client_logo_grid_logos" ADD CONSTRAINT "partners_blocks_client_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_client_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_client_logo_grid" ADD CONSTRAINT "partners_blocks_client_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_cta_section" ADD CONSTRAINT "partners_blocks_cta_section_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cta_section" ADD CONSTRAINT "partners_blocks_cta_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_newsletter_cta" ADD CONSTRAINT "partners_blocks_newsletter_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_contact_cta" ADD CONSTRAINT "partners_blocks_contact_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_case_study_grid" ADD CONSTRAINT "partners_blocks_case_study_grid_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_case_study_grid" ADD CONSTRAINT "partners_blocks_case_study_grid_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_case_study_grid" ADD CONSTRAINT "partners_blocks_case_study_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_cards" ADD CONSTRAINT "partners_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_cards" ADD CONSTRAINT "partners_blocks_service_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_service_pillar_cards" ADD CONSTRAINT "partners_blocks_service_pillar_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_featured_case_study" ADD CONSTRAINT "partners_blocks_featured_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_featured_case_study" ADD CONSTRAINT "partners_blocks_featured_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_post_list" ADD CONSTRAINT "partners_blocks_post_list_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_post_list" ADD CONSTRAINT "partners_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_related_posts" ADD CONSTRAINT "partners_blocks_related_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_industry_grid" ADD CONSTRAINT "partners_blocks_industry_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_locations_list" ADD CONSTRAINT "partners_blocks_locations_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_workshop_list" ADD CONSTRAINT "partners_blocks_workshop_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_team_grid" ADD CONSTRAINT "partners_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_video_embed" ADD CONSTRAINT "partners_blocks_video_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_video_embed" ADD CONSTRAINT "partners_blocks_video_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_faq_items" ADD CONSTRAINT "partners_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_faq" ADD CONSTRAINT "partners_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_accordion_items" ADD CONSTRAINT "partners_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_accordion" ADD CONSTRAINT "partners_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_tabs_tabs" ADD CONSTRAINT "partners_blocks_tabs_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_tabs" ADD CONSTRAINT "partners_blocks_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_map" ADD CONSTRAINT "partners_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_embed" ADD CONSTRAINT "partners_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_download_card" ADD CONSTRAINT "partners_blocks_download_card_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_download_card" ADD CONSTRAINT "partners_blocks_download_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_hubspot_form" ADD CONSTRAINT "partners_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_hubspot_meetings" ADD CONSTRAINT "partners_blocks_hubspot_meetings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_brand_teaser" ADD CONSTRAINT "partners_blocks_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_brand_teaser" ADD CONSTRAINT "partners_blocks_brand_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_nav_cards_cards" ADD CONSTRAINT "partners_blocks_nav_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_nav_cards_cards" ADD CONSTRAINT "partners_blocks_nav_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_nav_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_nav_cards" ADD CONSTRAINT "partners_blocks_nav_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_key_takeaways_items" ADD CONSTRAINT "partners_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_key_takeaways" ADD CONSTRAINT "partners_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_tech_stack_items" ADD CONSTRAINT "partners_blocks_tech_stack_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_tech_stack" ADD CONSTRAINT "partners_blocks_tech_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hero" ADD CONSTRAINT "_partners_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hero" ADD CONSTRAINT "_partners_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_case_study_hero" ADD CONSTRAINT "_partners_v_blocks_case_study_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_case_study_hero" ADD CONSTRAINT "_partners_v_blocks_case_study_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_pillar_hero" ADD CONSTRAINT "_partners_v_blocks_service_pillar_hero_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_pillar_hero" ADD CONSTRAINT "_partners_v_blocks_service_pillar_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_homepage_hero" ADD CONSTRAINT "_partners_v_blocks_homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_homepage_hero" ADD CONSTRAINT "_partners_v_blocks_homepage_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_content" ADD CONSTRAINT "_partners_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_two_column" ADD CONSTRAINT "_partners_v_blocks_two_column_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_two_column" ADD CONSTRAINT "_partners_v_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_image" ADD CONSTRAINT "_partners_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_image" ADD CONSTRAINT "_partners_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery_items" ADD CONSTRAINT "_partners_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery_items" ADD CONSTRAINT "_partners_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery" ADD CONSTRAINT "_partners_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_process_steps_steps" ADD CONSTRAINT "_partners_v_blocks_process_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_process_steps" ADD CONSTRAINT "_partners_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_deliverables_items" ADD CONSTRAINT "_partners_v_blocks_deliverables_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_deliverables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_deliverables" ADD CONSTRAINT "_partners_v_blocks_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_comparison_table_columns" ADD CONSTRAINT "_partners_v_blocks_comparison_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_comparison_table_rows_cells" ADD CONSTRAINT "_partners_v_blocks_comparison_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_comparison_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_comparison_table_rows" ADD CONSTRAINT "_partners_v_blocks_comparison_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_comparison_table_best_for_row" ADD CONSTRAINT "_partners_v_blocks_comparison_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_comparison_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_comparison_table" ADD CONSTRAINT "_partners_v_blocks_comparison_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_mission_vision_values_values" ADD CONSTRAINT "_partners_v_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_mission_vision_values" ADD CONSTRAINT "_partners_v_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_timeline_items" ADD CONSTRAINT "_partners_v_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_timeline_items" ADD CONSTRAINT "_partners_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_timeline" ADD CONSTRAINT "_partners_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_stats_bar_items" ADD CONSTRAINT "_partners_v_blocks_stats_bar_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_stats_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_stats_bar" ADD CONSTRAINT "_partners_v_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_metric_display" ADD CONSTRAINT "_partners_v_blocks_metric_display_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_logo_bar_logos" ADD CONSTRAINT "_partners_v_blocks_logo_bar_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_logo_bar_logos" ADD CONSTRAINT "_partners_v_blocks_logo_bar_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_logo_bar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_logo_bar" ADD CONSTRAINT "_partners_v_blocks_logo_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_featured_testimonials" ADD CONSTRAINT "_partners_v_blocks_featured_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_testimonial_block" ADD CONSTRAINT "_partners_v_blocks_testimonial_block_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_testimonial_block" ADD CONSTRAINT "_partners_v_blocks_testimonial_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_client_logo_grid_logos" ADD CONSTRAINT "_partners_v_blocks_client_logo_grid_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_client_logo_grid_logos" ADD CONSTRAINT "_partners_v_blocks_client_logo_grid_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_client_logo_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_client_logo_grid" ADD CONSTRAINT "_partners_v_blocks_client_logo_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cta_section" ADD CONSTRAINT "_partners_v_blocks_cta_section_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cta_section" ADD CONSTRAINT "_partners_v_blocks_cta_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_newsletter_cta" ADD CONSTRAINT "_partners_v_blocks_newsletter_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_contact_cta" ADD CONSTRAINT "_partners_v_blocks_contact_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_case_study_grid" ADD CONSTRAINT "_partners_v_blocks_case_study_grid_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_case_study_grid" ADD CONSTRAINT "_partners_v_blocks_case_study_grid_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_case_study_grid" ADD CONSTRAINT "_partners_v_blocks_case_study_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_cards" ADD CONSTRAINT "_partners_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_cards" ADD CONSTRAINT "_partners_v_blocks_service_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_service_pillar_cards" ADD CONSTRAINT "_partners_v_blocks_service_pillar_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_featured_case_study" ADD CONSTRAINT "_partners_v_blocks_featured_case_study_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_featured_case_study" ADD CONSTRAINT "_partners_v_blocks_featured_case_study_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_post_list" ADD CONSTRAINT "_partners_v_blocks_post_list_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_post_list" ADD CONSTRAINT "_partners_v_blocks_post_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_related_posts" ADD CONSTRAINT "_partners_v_blocks_related_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_industry_grid" ADD CONSTRAINT "_partners_v_blocks_industry_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_locations_list" ADD CONSTRAINT "_partners_v_blocks_locations_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_workshop_list" ADD CONSTRAINT "_partners_v_blocks_workshop_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_team_grid" ADD CONSTRAINT "_partners_v_blocks_team_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_video_embed" ADD CONSTRAINT "_partners_v_blocks_video_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_video_embed" ADD CONSTRAINT "_partners_v_blocks_video_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_faq_items" ADD CONSTRAINT "_partners_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_faq" ADD CONSTRAINT "_partners_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_accordion_items" ADD CONSTRAINT "_partners_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_accordion" ADD CONSTRAINT "_partners_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_tabs_tabs" ADD CONSTRAINT "_partners_v_blocks_tabs_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_tabs" ADD CONSTRAINT "_partners_v_blocks_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_map" ADD CONSTRAINT "_partners_v_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_embed" ADD CONSTRAINT "_partners_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_download_card" ADD CONSTRAINT "_partners_v_blocks_download_card_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_download_card" ADD CONSTRAINT "_partners_v_blocks_download_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hubspot_form" ADD CONSTRAINT "_partners_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hubspot_meetings" ADD CONSTRAINT "_partners_v_blocks_hubspot_meetings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_brand_teaser" ADD CONSTRAINT "_partners_v_blocks_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_brand_teaser" ADD CONSTRAINT "_partners_v_blocks_brand_teaser_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_nav_cards_cards" ADD CONSTRAINT "_partners_v_blocks_nav_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_nav_cards_cards" ADD CONSTRAINT "_partners_v_blocks_nav_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_nav_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_nav_cards" ADD CONSTRAINT "_partners_v_blocks_nav_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_key_takeaways_items" ADD CONSTRAINT "_partners_v_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_key_takeaways" ADD CONSTRAINT "_partners_v_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_tech_stack_items" ADD CONSTRAINT "_partners_v_blocks_tech_stack_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_tech_stack" ADD CONSTRAINT "_partners_v_blocks_tech_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_parent_id_partners_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "partners_blocks_hero_order_idx" ON "partners_blocks_hero" USING btree ("_order");
  CREATE INDEX "partners_blocks_hero_parent_id_idx" ON "partners_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_hero_path_idx" ON "partners_blocks_hero" USING btree ("_path");
  CREATE INDEX "partners_blocks_hero_media_idx" ON "partners_blocks_hero" USING btree ("media_id");
  CREATE INDEX "partners_blocks_case_study_hero_order_idx" ON "partners_blocks_case_study_hero" USING btree ("_order");
  CREATE INDEX "partners_blocks_case_study_hero_parent_id_idx" ON "partners_blocks_case_study_hero" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_case_study_hero_path_idx" ON "partners_blocks_case_study_hero" USING btree ("_path");
  CREATE INDEX "partners_blocks_case_study_hero_hero_image_idx" ON "partners_blocks_case_study_hero" USING btree ("hero_image_id");
  CREATE INDEX "partners_blocks_service_pillar_hero_order_idx" ON "partners_blocks_service_pillar_hero" USING btree ("_order");
  CREATE INDEX "partners_blocks_service_pillar_hero_parent_id_idx" ON "partners_blocks_service_pillar_hero" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_service_pillar_hero_path_idx" ON "partners_blocks_service_pillar_hero" USING btree ("_path");
  CREATE INDEX "partners_blocks_service_pillar_hero_hero_image_idx" ON "partners_blocks_service_pillar_hero" USING btree ("hero_image_id");
  CREATE INDEX "partners_blocks_homepage_hero_order_idx" ON "partners_blocks_homepage_hero" USING btree ("_order");
  CREATE INDEX "partners_blocks_homepage_hero_parent_id_idx" ON "partners_blocks_homepage_hero" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_homepage_hero_path_idx" ON "partners_blocks_homepage_hero" USING btree ("_path");
  CREATE INDEX "partners_blocks_homepage_hero_background_image_idx" ON "partners_blocks_homepage_hero" USING btree ("background_image_id");
  CREATE INDEX "partners_blocks_content_order_idx" ON "partners_blocks_content" USING btree ("_order");
  CREATE INDEX "partners_blocks_content_parent_id_idx" ON "partners_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_content_path_idx" ON "partners_blocks_content" USING btree ("_path");
  CREATE INDEX "partners_blocks_two_column_order_idx" ON "partners_blocks_two_column" USING btree ("_order");
  CREATE INDEX "partners_blocks_two_column_parent_id_idx" ON "partners_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_two_column_path_idx" ON "partners_blocks_two_column" USING btree ("_path");
  CREATE INDEX "partners_blocks_two_column_media_idx" ON "partners_blocks_two_column" USING btree ("media_id");
  CREATE INDEX "partners_blocks_image_order_idx" ON "partners_blocks_image" USING btree ("_order");
  CREATE INDEX "partners_blocks_image_parent_id_idx" ON "partners_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_image_path_idx" ON "partners_blocks_image" USING btree ("_path");
  CREATE INDEX "partners_blocks_image_image_idx" ON "partners_blocks_image" USING btree ("image_id");
  CREATE INDEX "partners_blocks_gallery_items_order_idx" ON "partners_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_gallery_items_parent_id_idx" ON "partners_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_gallery_items_image_idx" ON "partners_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "partners_blocks_gallery_order_idx" ON "partners_blocks_gallery" USING btree ("_order");
  CREATE INDEX "partners_blocks_gallery_parent_id_idx" ON "partners_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_gallery_path_idx" ON "partners_blocks_gallery" USING btree ("_path");
  CREATE INDEX "partners_blocks_process_steps_steps_order_idx" ON "partners_blocks_process_steps_steps" USING btree ("_order");
  CREATE INDEX "partners_blocks_process_steps_steps_parent_id_idx" ON "partners_blocks_process_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_process_steps_order_idx" ON "partners_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "partners_blocks_process_steps_parent_id_idx" ON "partners_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_process_steps_path_idx" ON "partners_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "partners_blocks_deliverables_items_order_idx" ON "partners_blocks_deliverables_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_deliverables_items_parent_id_idx" ON "partners_blocks_deliverables_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_deliverables_order_idx" ON "partners_blocks_deliverables" USING btree ("_order");
  CREATE INDEX "partners_blocks_deliverables_parent_id_idx" ON "partners_blocks_deliverables" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_deliverables_path_idx" ON "partners_blocks_deliverables" USING btree ("_path");
  CREATE INDEX "partners_blocks_comparison_table_columns_order_idx" ON "partners_blocks_comparison_table_columns" USING btree ("_order");
  CREATE INDEX "partners_blocks_comparison_table_columns_parent_id_idx" ON "partners_blocks_comparison_table_columns" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_comparison_table_rows_cells_order_idx" ON "partners_blocks_comparison_table_rows_cells" USING btree ("_order");
  CREATE INDEX "partners_blocks_comparison_table_rows_cells_parent_id_idx" ON "partners_blocks_comparison_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_comparison_table_rows_order_idx" ON "partners_blocks_comparison_table_rows" USING btree ("_order");
  CREATE INDEX "partners_blocks_comparison_table_rows_parent_id_idx" ON "partners_blocks_comparison_table_rows" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_comparison_table_best_for_row_order_idx" ON "partners_blocks_comparison_table_best_for_row" USING btree ("_order");
  CREATE INDEX "partners_blocks_comparison_table_best_for_row_parent_id_idx" ON "partners_blocks_comparison_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_comparison_table_order_idx" ON "partners_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "partners_blocks_comparison_table_parent_id_idx" ON "partners_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_comparison_table_path_idx" ON "partners_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "partners_blocks_mission_vision_values_values_order_idx" ON "partners_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "partners_blocks_mission_vision_values_values_parent_id_idx" ON "partners_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_mission_vision_values_order_idx" ON "partners_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "partners_blocks_mission_vision_values_parent_id_idx" ON "partners_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_mission_vision_values_path_idx" ON "partners_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "partners_blocks_timeline_items_order_idx" ON "partners_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_timeline_items_parent_id_idx" ON "partners_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_timeline_items_image_idx" ON "partners_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "partners_blocks_timeline_order_idx" ON "partners_blocks_timeline" USING btree ("_order");
  CREATE INDEX "partners_blocks_timeline_parent_id_idx" ON "partners_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_timeline_path_idx" ON "partners_blocks_timeline" USING btree ("_path");
  CREATE INDEX "partners_blocks_stats_bar_items_order_idx" ON "partners_blocks_stats_bar_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_stats_bar_items_parent_id_idx" ON "partners_blocks_stats_bar_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_stats_bar_order_idx" ON "partners_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "partners_blocks_stats_bar_parent_id_idx" ON "partners_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_stats_bar_path_idx" ON "partners_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "partners_blocks_metric_display_order_idx" ON "partners_blocks_metric_display" USING btree ("_order");
  CREATE INDEX "partners_blocks_metric_display_parent_id_idx" ON "partners_blocks_metric_display" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_metric_display_path_idx" ON "partners_blocks_metric_display" USING btree ("_path");
  CREATE INDEX "partners_blocks_logo_bar_logos_order_idx" ON "partners_blocks_logo_bar_logos" USING btree ("_order");
  CREATE INDEX "partners_blocks_logo_bar_logos_parent_id_idx" ON "partners_blocks_logo_bar_logos" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_logo_bar_logos_logo_idx" ON "partners_blocks_logo_bar_logos" USING btree ("logo_id");
  CREATE INDEX "partners_blocks_logo_bar_order_idx" ON "partners_blocks_logo_bar" USING btree ("_order");
  CREATE INDEX "partners_blocks_logo_bar_parent_id_idx" ON "partners_blocks_logo_bar" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_logo_bar_path_idx" ON "partners_blocks_logo_bar" USING btree ("_path");
  CREATE INDEX "partners_blocks_featured_testimonials_order_idx" ON "partners_blocks_featured_testimonials" USING btree ("_order");
  CREATE INDEX "partners_blocks_featured_testimonials_parent_id_idx" ON "partners_blocks_featured_testimonials" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_featured_testimonials_path_idx" ON "partners_blocks_featured_testimonials" USING btree ("_path");
  CREATE INDEX "partners_blocks_testimonial_block_order_idx" ON "partners_blocks_testimonial_block" USING btree ("_order");
  CREATE INDEX "partners_blocks_testimonial_block_parent_id_idx" ON "partners_blocks_testimonial_block" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_testimonial_block_path_idx" ON "partners_blocks_testimonial_block" USING btree ("_path");
  CREATE INDEX "partners_blocks_testimonial_block_testimonial_idx" ON "partners_blocks_testimonial_block" USING btree ("testimonial_id");
  CREATE INDEX "partners_blocks_client_logo_grid_logos_order_idx" ON "partners_blocks_client_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "partners_blocks_client_logo_grid_logos_parent_id_idx" ON "partners_blocks_client_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_client_logo_grid_logos_logo_idx" ON "partners_blocks_client_logo_grid_logos" USING btree ("logo_id");
  CREATE INDEX "partners_blocks_client_logo_grid_order_idx" ON "partners_blocks_client_logo_grid" USING btree ("_order");
  CREATE INDEX "partners_blocks_client_logo_grid_parent_id_idx" ON "partners_blocks_client_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_client_logo_grid_path_idx" ON "partners_blocks_client_logo_grid" USING btree ("_path");
  CREATE INDEX "partners_blocks_cta_section_order_idx" ON "partners_blocks_cta_section" USING btree ("_order");
  CREATE INDEX "partners_blocks_cta_section_parent_id_idx" ON "partners_blocks_cta_section" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_cta_section_path_idx" ON "partners_blocks_cta_section" USING btree ("_path");
  CREATE INDEX "partners_blocks_cta_section_background_image_idx" ON "partners_blocks_cta_section" USING btree ("background_image_id");
  CREATE INDEX "partners_blocks_newsletter_cta_order_idx" ON "partners_blocks_newsletter_cta" USING btree ("_order");
  CREATE INDEX "partners_blocks_newsletter_cta_parent_id_idx" ON "partners_blocks_newsletter_cta" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_newsletter_cta_path_idx" ON "partners_blocks_newsletter_cta" USING btree ("_path");
  CREATE INDEX "partners_blocks_contact_cta_order_idx" ON "partners_blocks_contact_cta" USING btree ("_order");
  CREATE INDEX "partners_blocks_contact_cta_parent_id_idx" ON "partners_blocks_contact_cta" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_contact_cta_path_idx" ON "partners_blocks_contact_cta" USING btree ("_path");
  CREATE INDEX "partners_blocks_case_study_grid_order_idx" ON "partners_blocks_case_study_grid" USING btree ("_order");
  CREATE INDEX "partners_blocks_case_study_grid_parent_id_idx" ON "partners_blocks_case_study_grid" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_case_study_grid_path_idx" ON "partners_blocks_case_study_grid" USING btree ("_path");
  CREATE INDEX "partners_blocks_case_study_grid_industry_idx" ON "partners_blocks_case_study_grid" USING btree ("industry_id");
  CREATE INDEX "partners_blocks_case_study_grid_service_idx" ON "partners_blocks_case_study_grid" USING btree ("service_id");
  CREATE INDEX "partners_blocks_service_cards_order_idx" ON "partners_blocks_service_cards" USING btree ("_order");
  CREATE INDEX "partners_blocks_service_cards_parent_id_idx" ON "partners_blocks_service_cards" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_service_cards_path_idx" ON "partners_blocks_service_cards" USING btree ("_path");
  CREATE INDEX "partners_blocks_service_cards_pillar_idx" ON "partners_blocks_service_cards" USING btree ("pillar_id");
  CREATE INDEX "partners_blocks_service_pillar_cards_order_idx" ON "partners_blocks_service_pillar_cards" USING btree ("_order");
  CREATE INDEX "partners_blocks_service_pillar_cards_parent_id_idx" ON "partners_blocks_service_pillar_cards" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_service_pillar_cards_path_idx" ON "partners_blocks_service_pillar_cards" USING btree ("_path");
  CREATE INDEX "partners_blocks_featured_case_study_order_idx" ON "partners_blocks_featured_case_study" USING btree ("_order");
  CREATE INDEX "partners_blocks_featured_case_study_parent_id_idx" ON "partners_blocks_featured_case_study" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_featured_case_study_path_idx" ON "partners_blocks_featured_case_study" USING btree ("_path");
  CREATE INDEX "partners_blocks_featured_case_study_case_study_idx" ON "partners_blocks_featured_case_study" USING btree ("case_study_id");
  CREATE INDEX "partners_blocks_post_list_order_idx" ON "partners_blocks_post_list" USING btree ("_order");
  CREATE INDEX "partners_blocks_post_list_parent_id_idx" ON "partners_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_post_list_path_idx" ON "partners_blocks_post_list" USING btree ("_path");
  CREATE INDEX "partners_blocks_post_list_category_idx" ON "partners_blocks_post_list" USING btree ("category_id");
  CREATE INDEX "partners_blocks_related_posts_order_idx" ON "partners_blocks_related_posts" USING btree ("_order");
  CREATE INDEX "partners_blocks_related_posts_parent_id_idx" ON "partners_blocks_related_posts" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_related_posts_path_idx" ON "partners_blocks_related_posts" USING btree ("_path");
  CREATE INDEX "partners_blocks_industry_grid_order_idx" ON "partners_blocks_industry_grid" USING btree ("_order");
  CREATE INDEX "partners_blocks_industry_grid_parent_id_idx" ON "partners_blocks_industry_grid" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_industry_grid_path_idx" ON "partners_blocks_industry_grid" USING btree ("_path");
  CREATE INDEX "partners_blocks_locations_list_order_idx" ON "partners_blocks_locations_list" USING btree ("_order");
  CREATE INDEX "partners_blocks_locations_list_parent_id_idx" ON "partners_blocks_locations_list" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_locations_list_path_idx" ON "partners_blocks_locations_list" USING btree ("_path");
  CREATE INDEX "partners_blocks_workshop_list_order_idx" ON "partners_blocks_workshop_list" USING btree ("_order");
  CREATE INDEX "partners_blocks_workshop_list_parent_id_idx" ON "partners_blocks_workshop_list" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_workshop_list_path_idx" ON "partners_blocks_workshop_list" USING btree ("_path");
  CREATE INDEX "partners_blocks_team_grid_order_idx" ON "partners_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "partners_blocks_team_grid_parent_id_idx" ON "partners_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_team_grid_path_idx" ON "partners_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "partners_blocks_video_embed_order_idx" ON "partners_blocks_video_embed" USING btree ("_order");
  CREATE INDEX "partners_blocks_video_embed_parent_id_idx" ON "partners_blocks_video_embed" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_video_embed_path_idx" ON "partners_blocks_video_embed" USING btree ("_path");
  CREATE INDEX "partners_blocks_video_embed_thumbnail_idx" ON "partners_blocks_video_embed" USING btree ("thumbnail_id");
  CREATE INDEX "partners_blocks_faq_items_order_idx" ON "partners_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_faq_items_parent_id_idx" ON "partners_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_faq_order_idx" ON "partners_blocks_faq" USING btree ("_order");
  CREATE INDEX "partners_blocks_faq_parent_id_idx" ON "partners_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_faq_path_idx" ON "partners_blocks_faq" USING btree ("_path");
  CREATE INDEX "partners_blocks_accordion_items_order_idx" ON "partners_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_accordion_items_parent_id_idx" ON "partners_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_accordion_order_idx" ON "partners_blocks_accordion" USING btree ("_order");
  CREATE INDEX "partners_blocks_accordion_parent_id_idx" ON "partners_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_accordion_path_idx" ON "partners_blocks_accordion" USING btree ("_path");
  CREATE INDEX "partners_blocks_tabs_tabs_order_idx" ON "partners_blocks_tabs_tabs" USING btree ("_order");
  CREATE INDEX "partners_blocks_tabs_tabs_parent_id_idx" ON "partners_blocks_tabs_tabs" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_tabs_order_idx" ON "partners_blocks_tabs" USING btree ("_order");
  CREATE INDEX "partners_blocks_tabs_parent_id_idx" ON "partners_blocks_tabs" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_tabs_path_idx" ON "partners_blocks_tabs" USING btree ("_path");
  CREATE INDEX "partners_blocks_map_order_idx" ON "partners_blocks_map" USING btree ("_order");
  CREATE INDEX "partners_blocks_map_parent_id_idx" ON "partners_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_map_path_idx" ON "partners_blocks_map" USING btree ("_path");
  CREATE INDEX "partners_blocks_embed_order_idx" ON "partners_blocks_embed" USING btree ("_order");
  CREATE INDEX "partners_blocks_embed_parent_id_idx" ON "partners_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_embed_path_idx" ON "partners_blocks_embed" USING btree ("_path");
  CREATE INDEX "partners_blocks_download_card_order_idx" ON "partners_blocks_download_card" USING btree ("_order");
  CREATE INDEX "partners_blocks_download_card_parent_id_idx" ON "partners_blocks_download_card" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_download_card_path_idx" ON "partners_blocks_download_card" USING btree ("_path");
  CREATE INDEX "partners_blocks_download_card_cover_image_idx" ON "partners_blocks_download_card" USING btree ("cover_image_id");
  CREATE INDEX "partners_blocks_hubspot_form_order_idx" ON "partners_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "partners_blocks_hubspot_form_parent_id_idx" ON "partners_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_hubspot_form_path_idx" ON "partners_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "partners_blocks_hubspot_meetings_order_idx" ON "partners_blocks_hubspot_meetings" USING btree ("_order");
  CREATE INDEX "partners_blocks_hubspot_meetings_parent_id_idx" ON "partners_blocks_hubspot_meetings" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_hubspot_meetings_path_idx" ON "partners_blocks_hubspot_meetings" USING btree ("_path");
  CREATE INDEX "partners_blocks_brand_teaser_order_idx" ON "partners_blocks_brand_teaser" USING btree ("_order");
  CREATE INDEX "partners_blocks_brand_teaser_parent_id_idx" ON "partners_blocks_brand_teaser" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_brand_teaser_path_idx" ON "partners_blocks_brand_teaser" USING btree ("_path");
  CREATE INDEX "partners_blocks_brand_teaser_image_idx" ON "partners_blocks_brand_teaser" USING btree ("image_id");
  CREATE INDEX "partners_blocks_nav_cards_cards_order_idx" ON "partners_blocks_nav_cards_cards" USING btree ("_order");
  CREATE INDEX "partners_blocks_nav_cards_cards_parent_id_idx" ON "partners_blocks_nav_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_nav_cards_cards_image_idx" ON "partners_blocks_nav_cards_cards" USING btree ("image_id");
  CREATE INDEX "partners_blocks_nav_cards_order_idx" ON "partners_blocks_nav_cards" USING btree ("_order");
  CREATE INDEX "partners_blocks_nav_cards_parent_id_idx" ON "partners_blocks_nav_cards" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_nav_cards_path_idx" ON "partners_blocks_nav_cards" USING btree ("_path");
  CREATE INDEX "partners_blocks_key_takeaways_items_order_idx" ON "partners_blocks_key_takeaways_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_key_takeaways_items_parent_id_idx" ON "partners_blocks_key_takeaways_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_key_takeaways_order_idx" ON "partners_blocks_key_takeaways" USING btree ("_order");
  CREATE INDEX "partners_blocks_key_takeaways_parent_id_idx" ON "partners_blocks_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_key_takeaways_path_idx" ON "partners_blocks_key_takeaways" USING btree ("_path");
  CREATE INDEX "partners_blocks_tech_stack_items_order_idx" ON "partners_blocks_tech_stack_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_tech_stack_items_parent_id_idx" ON "partners_blocks_tech_stack_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_tech_stack_order_idx" ON "partners_blocks_tech_stack" USING btree ("_order");
  CREATE INDEX "partners_blocks_tech_stack_parent_id_idx" ON "partners_blocks_tech_stack" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_tech_stack_path_idx" ON "partners_blocks_tech_stack" USING btree ("_path");
  CREATE UNIQUE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE INDEX "partners_seo_seo_og_image_idx" ON "partners" USING btree ("seo_og_image_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE INDEX "partners__status_idx" ON "partners" USING btree ("_status");
  CREATE INDEX "partners_rels_order_idx" ON "partners_rels" USING btree ("order");
  CREATE INDEX "partners_rels_parent_idx" ON "partners_rels" USING btree ("parent_id");
  CREATE INDEX "partners_rels_path_idx" ON "partners_rels" USING btree ("path");
  CREATE INDEX "partners_rels_testimonials_id_idx" ON "partners_rels" USING btree ("testimonials_id");
  CREATE INDEX "partners_rels_case_studies_id_idx" ON "partners_rels" USING btree ("case_studies_id");
  CREATE INDEX "partners_rels_services_id_idx" ON "partners_rels" USING btree ("services_id");
  CREATE INDEX "partners_rels_service_pillars_id_idx" ON "partners_rels" USING btree ("service_pillars_id");
  CREATE INDEX "partners_rels_posts_id_idx" ON "partners_rels" USING btree ("posts_id");
  CREATE INDEX "partners_rels_industries_id_idx" ON "partners_rels" USING btree ("industries_id");
  CREATE INDEX "partners_rels_locations_id_idx" ON "partners_rels" USING btree ("locations_id");
  CREATE INDEX "partners_rels_workshops_id_idx" ON "partners_rels" USING btree ("workshops_id");
  CREATE INDEX "partners_rels_team_members_id_idx" ON "partners_rels" USING btree ("team_members_id");
  CREATE INDEX "_partners_v_blocks_hero_order_idx" ON "_partners_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_hero_parent_id_idx" ON "_partners_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_hero_path_idx" ON "_partners_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_hero_media_idx" ON "_partners_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_partners_v_blocks_case_study_hero_order_idx" ON "_partners_v_blocks_case_study_hero" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_case_study_hero_parent_id_idx" ON "_partners_v_blocks_case_study_hero" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_case_study_hero_path_idx" ON "_partners_v_blocks_case_study_hero" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_case_study_hero_hero_image_idx" ON "_partners_v_blocks_case_study_hero" USING btree ("hero_image_id");
  CREATE INDEX "_partners_v_blocks_service_pillar_hero_order_idx" ON "_partners_v_blocks_service_pillar_hero" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_service_pillar_hero_parent_id_idx" ON "_partners_v_blocks_service_pillar_hero" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_service_pillar_hero_path_idx" ON "_partners_v_blocks_service_pillar_hero" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_service_pillar_hero_hero_image_idx" ON "_partners_v_blocks_service_pillar_hero" USING btree ("hero_image_id");
  CREATE INDEX "_partners_v_blocks_homepage_hero_order_idx" ON "_partners_v_blocks_homepage_hero" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_homepage_hero_parent_id_idx" ON "_partners_v_blocks_homepage_hero" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_homepage_hero_path_idx" ON "_partners_v_blocks_homepage_hero" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_homepage_hero_background_image_idx" ON "_partners_v_blocks_homepage_hero" USING btree ("background_image_id");
  CREATE INDEX "_partners_v_blocks_content_order_idx" ON "_partners_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_content_parent_id_idx" ON "_partners_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_content_path_idx" ON "_partners_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_two_column_order_idx" ON "_partners_v_blocks_two_column" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_two_column_parent_id_idx" ON "_partners_v_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_two_column_path_idx" ON "_partners_v_blocks_two_column" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_two_column_media_idx" ON "_partners_v_blocks_two_column" USING btree ("media_id");
  CREATE INDEX "_partners_v_blocks_image_order_idx" ON "_partners_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_image_parent_id_idx" ON "_partners_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_image_path_idx" ON "_partners_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_image_image_idx" ON "_partners_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_gallery_items_order_idx" ON "_partners_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_gallery_items_parent_id_idx" ON "_partners_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_gallery_items_image_idx" ON "_partners_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_gallery_order_idx" ON "_partners_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_gallery_parent_id_idx" ON "_partners_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_gallery_path_idx" ON "_partners_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_process_steps_steps_order_idx" ON "_partners_v_blocks_process_steps_steps" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_process_steps_steps_parent_id_idx" ON "_partners_v_blocks_process_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_process_steps_order_idx" ON "_partners_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_process_steps_parent_id_idx" ON "_partners_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_process_steps_path_idx" ON "_partners_v_blocks_process_steps" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_deliverables_items_order_idx" ON "_partners_v_blocks_deliverables_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_deliverables_items_parent_id_idx" ON "_partners_v_blocks_deliverables_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_deliverables_order_idx" ON "_partners_v_blocks_deliverables" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_deliverables_parent_id_idx" ON "_partners_v_blocks_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_deliverables_path_idx" ON "_partners_v_blocks_deliverables" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_comparison_table_columns_order_idx" ON "_partners_v_blocks_comparison_table_columns" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_comparison_table_columns_parent_id_idx" ON "_partners_v_blocks_comparison_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_comparison_table_rows_cells_order_idx" ON "_partners_v_blocks_comparison_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_comparison_table_rows_cells_parent_id_idx" ON "_partners_v_blocks_comparison_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_comparison_table_rows_order_idx" ON "_partners_v_blocks_comparison_table_rows" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_comparison_table_rows_parent_id_idx" ON "_partners_v_blocks_comparison_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_comparison_table_best_for_row_order_idx" ON "_partners_v_blocks_comparison_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_comparison_table_best_for_row_parent_id_idx" ON "_partners_v_blocks_comparison_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_comparison_table_order_idx" ON "_partners_v_blocks_comparison_table" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_comparison_table_parent_id_idx" ON "_partners_v_blocks_comparison_table" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_comparison_table_path_idx" ON "_partners_v_blocks_comparison_table" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_mission_vision_values_values_order_idx" ON "_partners_v_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_mission_vision_values_values_parent_id_idx" ON "_partners_v_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_mission_vision_values_order_idx" ON "_partners_v_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_mission_vision_values_parent_id_idx" ON "_partners_v_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_mission_vision_values_path_idx" ON "_partners_v_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_timeline_items_order_idx" ON "_partners_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_timeline_items_parent_id_idx" ON "_partners_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_timeline_items_image_idx" ON "_partners_v_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_timeline_order_idx" ON "_partners_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_timeline_parent_id_idx" ON "_partners_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_timeline_path_idx" ON "_partners_v_blocks_timeline" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_stats_bar_items_order_idx" ON "_partners_v_blocks_stats_bar_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_stats_bar_items_parent_id_idx" ON "_partners_v_blocks_stats_bar_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_stats_bar_order_idx" ON "_partners_v_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_stats_bar_parent_id_idx" ON "_partners_v_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_stats_bar_path_idx" ON "_partners_v_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_metric_display_order_idx" ON "_partners_v_blocks_metric_display" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_metric_display_parent_id_idx" ON "_partners_v_blocks_metric_display" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_metric_display_path_idx" ON "_partners_v_blocks_metric_display" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_logo_bar_logos_order_idx" ON "_partners_v_blocks_logo_bar_logos" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_logo_bar_logos_parent_id_idx" ON "_partners_v_blocks_logo_bar_logos" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_logo_bar_logos_logo_idx" ON "_partners_v_blocks_logo_bar_logos" USING btree ("logo_id");
  CREATE INDEX "_partners_v_blocks_logo_bar_order_idx" ON "_partners_v_blocks_logo_bar" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_logo_bar_parent_id_idx" ON "_partners_v_blocks_logo_bar" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_logo_bar_path_idx" ON "_partners_v_blocks_logo_bar" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_featured_testimonials_order_idx" ON "_partners_v_blocks_featured_testimonials" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_featured_testimonials_parent_id_idx" ON "_partners_v_blocks_featured_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_featured_testimonials_path_idx" ON "_partners_v_blocks_featured_testimonials" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_testimonial_block_order_idx" ON "_partners_v_blocks_testimonial_block" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_testimonial_block_parent_id_idx" ON "_partners_v_blocks_testimonial_block" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_testimonial_block_path_idx" ON "_partners_v_blocks_testimonial_block" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_testimonial_block_testimonial_idx" ON "_partners_v_blocks_testimonial_block" USING btree ("testimonial_id");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_logos_order_idx" ON "_partners_v_blocks_client_logo_grid_logos" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_logos_parent_id_idx" ON "_partners_v_blocks_client_logo_grid_logos" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_logos_logo_idx" ON "_partners_v_blocks_client_logo_grid_logos" USING btree ("logo_id");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_order_idx" ON "_partners_v_blocks_client_logo_grid" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_parent_id_idx" ON "_partners_v_blocks_client_logo_grid" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_client_logo_grid_path_idx" ON "_partners_v_blocks_client_logo_grid" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_cta_section_order_idx" ON "_partners_v_blocks_cta_section" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_cta_section_parent_id_idx" ON "_partners_v_blocks_cta_section" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_cta_section_path_idx" ON "_partners_v_blocks_cta_section" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_cta_section_background_image_idx" ON "_partners_v_blocks_cta_section" USING btree ("background_image_id");
  CREATE INDEX "_partners_v_blocks_newsletter_cta_order_idx" ON "_partners_v_blocks_newsletter_cta" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_newsletter_cta_parent_id_idx" ON "_partners_v_blocks_newsletter_cta" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_newsletter_cta_path_idx" ON "_partners_v_blocks_newsletter_cta" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_contact_cta_order_idx" ON "_partners_v_blocks_contact_cta" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_contact_cta_parent_id_idx" ON "_partners_v_blocks_contact_cta" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_contact_cta_path_idx" ON "_partners_v_blocks_contact_cta" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_case_study_grid_order_idx" ON "_partners_v_blocks_case_study_grid" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_case_study_grid_parent_id_idx" ON "_partners_v_blocks_case_study_grid" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_case_study_grid_path_idx" ON "_partners_v_blocks_case_study_grid" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_case_study_grid_industry_idx" ON "_partners_v_blocks_case_study_grid" USING btree ("industry_id");
  CREATE INDEX "_partners_v_blocks_case_study_grid_service_idx" ON "_partners_v_blocks_case_study_grid" USING btree ("service_id");
  CREATE INDEX "_partners_v_blocks_service_cards_order_idx" ON "_partners_v_blocks_service_cards" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_service_cards_parent_id_idx" ON "_partners_v_blocks_service_cards" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_service_cards_path_idx" ON "_partners_v_blocks_service_cards" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_service_cards_pillar_idx" ON "_partners_v_blocks_service_cards" USING btree ("pillar_id");
  CREATE INDEX "_partners_v_blocks_service_pillar_cards_order_idx" ON "_partners_v_blocks_service_pillar_cards" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_service_pillar_cards_parent_id_idx" ON "_partners_v_blocks_service_pillar_cards" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_service_pillar_cards_path_idx" ON "_partners_v_blocks_service_pillar_cards" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_featured_case_study_order_idx" ON "_partners_v_blocks_featured_case_study" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_featured_case_study_parent_id_idx" ON "_partners_v_blocks_featured_case_study" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_featured_case_study_path_idx" ON "_partners_v_blocks_featured_case_study" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_featured_case_study_case_study_idx" ON "_partners_v_blocks_featured_case_study" USING btree ("case_study_id");
  CREATE INDEX "_partners_v_blocks_post_list_order_idx" ON "_partners_v_blocks_post_list" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_post_list_parent_id_idx" ON "_partners_v_blocks_post_list" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_post_list_path_idx" ON "_partners_v_blocks_post_list" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_post_list_category_idx" ON "_partners_v_blocks_post_list" USING btree ("category_id");
  CREATE INDEX "_partners_v_blocks_related_posts_order_idx" ON "_partners_v_blocks_related_posts" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_related_posts_parent_id_idx" ON "_partners_v_blocks_related_posts" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_related_posts_path_idx" ON "_partners_v_blocks_related_posts" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_industry_grid_order_idx" ON "_partners_v_blocks_industry_grid" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_industry_grid_parent_id_idx" ON "_partners_v_blocks_industry_grid" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_industry_grid_path_idx" ON "_partners_v_blocks_industry_grid" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_locations_list_order_idx" ON "_partners_v_blocks_locations_list" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_locations_list_parent_id_idx" ON "_partners_v_blocks_locations_list" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_locations_list_path_idx" ON "_partners_v_blocks_locations_list" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_workshop_list_order_idx" ON "_partners_v_blocks_workshop_list" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_workshop_list_parent_id_idx" ON "_partners_v_blocks_workshop_list" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_workshop_list_path_idx" ON "_partners_v_blocks_workshop_list" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_team_grid_order_idx" ON "_partners_v_blocks_team_grid" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_team_grid_parent_id_idx" ON "_partners_v_blocks_team_grid" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_team_grid_path_idx" ON "_partners_v_blocks_team_grid" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_video_embed_order_idx" ON "_partners_v_blocks_video_embed" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_video_embed_parent_id_idx" ON "_partners_v_blocks_video_embed" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_video_embed_path_idx" ON "_partners_v_blocks_video_embed" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_video_embed_thumbnail_idx" ON "_partners_v_blocks_video_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_partners_v_blocks_faq_items_order_idx" ON "_partners_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_faq_items_parent_id_idx" ON "_partners_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_faq_order_idx" ON "_partners_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_faq_parent_id_idx" ON "_partners_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_faq_path_idx" ON "_partners_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_accordion_items_order_idx" ON "_partners_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_accordion_items_parent_id_idx" ON "_partners_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_accordion_order_idx" ON "_partners_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_accordion_parent_id_idx" ON "_partners_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_accordion_path_idx" ON "_partners_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_tabs_tabs_order_idx" ON "_partners_v_blocks_tabs_tabs" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_tabs_tabs_parent_id_idx" ON "_partners_v_blocks_tabs_tabs" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_tabs_order_idx" ON "_partners_v_blocks_tabs" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_tabs_parent_id_idx" ON "_partners_v_blocks_tabs" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_tabs_path_idx" ON "_partners_v_blocks_tabs" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_map_order_idx" ON "_partners_v_blocks_map" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_map_parent_id_idx" ON "_partners_v_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_map_path_idx" ON "_partners_v_blocks_map" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_embed_order_idx" ON "_partners_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_embed_parent_id_idx" ON "_partners_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_embed_path_idx" ON "_partners_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_download_card_order_idx" ON "_partners_v_blocks_download_card" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_download_card_parent_id_idx" ON "_partners_v_blocks_download_card" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_download_card_path_idx" ON "_partners_v_blocks_download_card" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_download_card_cover_image_idx" ON "_partners_v_blocks_download_card" USING btree ("cover_image_id");
  CREATE INDEX "_partners_v_blocks_hubspot_form_order_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_hubspot_form_parent_id_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_hubspot_form_path_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_hubspot_meetings_order_idx" ON "_partners_v_blocks_hubspot_meetings" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_hubspot_meetings_parent_id_idx" ON "_partners_v_blocks_hubspot_meetings" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_hubspot_meetings_path_idx" ON "_partners_v_blocks_hubspot_meetings" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_brand_teaser_order_idx" ON "_partners_v_blocks_brand_teaser" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_brand_teaser_parent_id_idx" ON "_partners_v_blocks_brand_teaser" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_brand_teaser_path_idx" ON "_partners_v_blocks_brand_teaser" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_brand_teaser_image_idx" ON "_partners_v_blocks_brand_teaser" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_nav_cards_cards_order_idx" ON "_partners_v_blocks_nav_cards_cards" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_nav_cards_cards_parent_id_idx" ON "_partners_v_blocks_nav_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_nav_cards_cards_image_idx" ON "_partners_v_blocks_nav_cards_cards" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_nav_cards_order_idx" ON "_partners_v_blocks_nav_cards" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_nav_cards_parent_id_idx" ON "_partners_v_blocks_nav_cards" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_nav_cards_path_idx" ON "_partners_v_blocks_nav_cards" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_key_takeaways_items_order_idx" ON "_partners_v_blocks_key_takeaways_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_key_takeaways_items_parent_id_idx" ON "_partners_v_blocks_key_takeaways_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_key_takeaways_order_idx" ON "_partners_v_blocks_key_takeaways" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_key_takeaways_parent_id_idx" ON "_partners_v_blocks_key_takeaways" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_key_takeaways_path_idx" ON "_partners_v_blocks_key_takeaways" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_tech_stack_items_order_idx" ON "_partners_v_blocks_tech_stack_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_tech_stack_items_parent_id_idx" ON "_partners_v_blocks_tech_stack_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_tech_stack_order_idx" ON "_partners_v_blocks_tech_stack" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_tech_stack_parent_id_idx" ON "_partners_v_blocks_tech_stack" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_tech_stack_path_idx" ON "_partners_v_blocks_tech_stack" USING btree ("_path");
  CREATE INDEX "_partners_v_parent_idx" ON "_partners_v" USING btree ("parent_id");
  CREATE INDEX "_partners_v_version_version_slug_idx" ON "_partners_v" USING btree ("version_slug");
  CREATE INDEX "_partners_v_version_version_logo_idx" ON "_partners_v" USING btree ("version_logo_id");
  CREATE INDEX "_partners_v_version_seo_version_seo_og_image_idx" ON "_partners_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_partners_v_version_version_updated_at_idx" ON "_partners_v" USING btree ("version_updated_at");
  CREATE INDEX "_partners_v_version_version_created_at_idx" ON "_partners_v" USING btree ("version_created_at");
  CREATE INDEX "_partners_v_version_version__status_idx" ON "_partners_v" USING btree ("version__status");
  CREATE INDEX "_partners_v_created_at_idx" ON "_partners_v" USING btree ("created_at");
  CREATE INDEX "_partners_v_updated_at_idx" ON "_partners_v" USING btree ("updated_at");
  CREATE INDEX "_partners_v_latest_idx" ON "_partners_v" USING btree ("latest");
  CREATE INDEX "_partners_v_rels_order_idx" ON "_partners_v_rels" USING btree ("order");
  CREATE INDEX "_partners_v_rels_parent_idx" ON "_partners_v_rels" USING btree ("parent_id");
  CREATE INDEX "_partners_v_rels_path_idx" ON "_partners_v_rels" USING btree ("path");
  CREATE INDEX "_partners_v_rels_testimonials_id_idx" ON "_partners_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_partners_v_rels_case_studies_id_idx" ON "_partners_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_partners_v_rels_services_id_idx" ON "_partners_v_rels" USING btree ("services_id");
  CREATE INDEX "_partners_v_rels_service_pillars_id_idx" ON "_partners_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_partners_v_rels_posts_id_idx" ON "_partners_v_rels" USING btree ("posts_id");
  CREATE INDEX "_partners_v_rels_industries_id_idx" ON "_partners_v_rels" USING btree ("industries_id");
  CREATE INDEX "_partners_v_rels_locations_id_idx" ON "_partners_v_rels" USING btree ("locations_id");
  CREATE INDEX "_partners_v_rels_workshops_id_idx" ON "_partners_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_partners_v_rels_team_members_id_idx" ON "_partners_v_rels" USING btree ("team_members_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "partners_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_case_study_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_service_pillar_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_homepage_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_two_column" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_process_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_deliverables_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_comparison_table_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_comparison_table_rows_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_comparison_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_comparison_table_best_for_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_stats_bar_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_stats_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_metric_display" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_logo_bar_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_logo_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_featured_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_testimonial_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_client_logo_grid_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_client_logo_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_cta_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_newsletter_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_contact_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_case_study_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_service_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_service_pillar_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_featured_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_post_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_related_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_industry_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_locations_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_workshop_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_video_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_accordion_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_accordion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_tabs_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_download_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_hubspot_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_hubspot_meetings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_brand_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_nav_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_nav_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_tech_stack_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_blocks_tech_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_case_study_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_service_pillar_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_homepage_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_two_column" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_process_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_deliverables_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_comparison_table_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_comparison_table_rows_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_comparison_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_comparison_table_best_for_row" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_comparison_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_stats_bar_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_stats_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_metric_display" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_logo_bar_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_logo_bar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_featured_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_testimonial_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_client_logo_grid_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_client_logo_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_cta_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_newsletter_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_contact_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_case_study_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_service_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_service_pillar_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_featured_case_study" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_post_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_related_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_industry_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_locations_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_workshop_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_team_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_video_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_accordion_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_accordion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_tabs_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_tabs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_download_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_hubspot_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_hubspot_meetings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_brand_teaser" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_nav_cards_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_nav_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_tech_stack_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_blocks_tech_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_partners_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "partners_blocks_hero" CASCADE;
  DROP TABLE "partners_blocks_case_study_hero" CASCADE;
  DROP TABLE "partners_blocks_service_pillar_hero" CASCADE;
  DROP TABLE "partners_blocks_homepage_hero" CASCADE;
  DROP TABLE "partners_blocks_content" CASCADE;
  DROP TABLE "partners_blocks_two_column" CASCADE;
  DROP TABLE "partners_blocks_image" CASCADE;
  DROP TABLE "partners_blocks_gallery_items" CASCADE;
  DROP TABLE "partners_blocks_gallery" CASCADE;
  DROP TABLE "partners_blocks_process_steps_steps" CASCADE;
  DROP TABLE "partners_blocks_process_steps" CASCADE;
  DROP TABLE "partners_blocks_deliverables_items" CASCADE;
  DROP TABLE "partners_blocks_deliverables" CASCADE;
  DROP TABLE "partners_blocks_comparison_table_columns" CASCADE;
  DROP TABLE "partners_blocks_comparison_table_rows_cells" CASCADE;
  DROP TABLE "partners_blocks_comparison_table_rows" CASCADE;
  DROP TABLE "partners_blocks_comparison_table_best_for_row" CASCADE;
  DROP TABLE "partners_blocks_comparison_table" CASCADE;
  DROP TABLE "partners_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "partners_blocks_mission_vision_values" CASCADE;
  DROP TABLE "partners_blocks_timeline_items" CASCADE;
  DROP TABLE "partners_blocks_timeline" CASCADE;
  DROP TABLE "partners_blocks_stats_bar_items" CASCADE;
  DROP TABLE "partners_blocks_stats_bar" CASCADE;
  DROP TABLE "partners_blocks_metric_display" CASCADE;
  DROP TABLE "partners_blocks_logo_bar_logos" CASCADE;
  DROP TABLE "partners_blocks_logo_bar" CASCADE;
  DROP TABLE "partners_blocks_featured_testimonials" CASCADE;
  DROP TABLE "partners_blocks_testimonial_block" CASCADE;
  DROP TABLE "partners_blocks_client_logo_grid_logos" CASCADE;
  DROP TABLE "partners_blocks_client_logo_grid" CASCADE;
  DROP TABLE "partners_blocks_cta_section" CASCADE;
  DROP TABLE "partners_blocks_newsletter_cta" CASCADE;
  DROP TABLE "partners_blocks_contact_cta" CASCADE;
  DROP TABLE "partners_blocks_case_study_grid" CASCADE;
  DROP TABLE "partners_blocks_service_cards" CASCADE;
  DROP TABLE "partners_blocks_service_pillar_cards" CASCADE;
  DROP TABLE "partners_blocks_featured_case_study" CASCADE;
  DROP TABLE "partners_blocks_post_list" CASCADE;
  DROP TABLE "partners_blocks_related_posts" CASCADE;
  DROP TABLE "partners_blocks_industry_grid" CASCADE;
  DROP TABLE "partners_blocks_locations_list" CASCADE;
  DROP TABLE "partners_blocks_workshop_list" CASCADE;
  DROP TABLE "partners_blocks_team_grid" CASCADE;
  DROP TABLE "partners_blocks_video_embed" CASCADE;
  DROP TABLE "partners_blocks_faq_items" CASCADE;
  DROP TABLE "partners_blocks_faq" CASCADE;
  DROP TABLE "partners_blocks_accordion_items" CASCADE;
  DROP TABLE "partners_blocks_accordion" CASCADE;
  DROP TABLE "partners_blocks_tabs_tabs" CASCADE;
  DROP TABLE "partners_blocks_tabs" CASCADE;
  DROP TABLE "partners_blocks_map" CASCADE;
  DROP TABLE "partners_blocks_embed" CASCADE;
  DROP TABLE "partners_blocks_download_card" CASCADE;
  DROP TABLE "partners_blocks_hubspot_form" CASCADE;
  DROP TABLE "partners_blocks_hubspot_meetings" CASCADE;
  DROP TABLE "partners_blocks_brand_teaser" CASCADE;
  DROP TABLE "partners_blocks_nav_cards_cards" CASCADE;
  DROP TABLE "partners_blocks_nav_cards" CASCADE;
  DROP TABLE "partners_blocks_key_takeaways_items" CASCADE;
  DROP TABLE "partners_blocks_key_takeaways" CASCADE;
  DROP TABLE "partners_blocks_tech_stack_items" CASCADE;
  DROP TABLE "partners_blocks_tech_stack" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_rels" CASCADE;
  DROP TABLE "_partners_v_blocks_hero" CASCADE;
  DROP TABLE "_partners_v_blocks_case_study_hero" CASCADE;
  DROP TABLE "_partners_v_blocks_service_pillar_hero" CASCADE;
  DROP TABLE "_partners_v_blocks_homepage_hero" CASCADE;
  DROP TABLE "_partners_v_blocks_content" CASCADE;
  DROP TABLE "_partners_v_blocks_two_column" CASCADE;
  DROP TABLE "_partners_v_blocks_image" CASCADE;
  DROP TABLE "_partners_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_partners_v_blocks_gallery" CASCADE;
  DROP TABLE "_partners_v_blocks_process_steps_steps" CASCADE;
  DROP TABLE "_partners_v_blocks_process_steps" CASCADE;
  DROP TABLE "_partners_v_blocks_deliverables_items" CASCADE;
  DROP TABLE "_partners_v_blocks_deliverables" CASCADE;
  DROP TABLE "_partners_v_blocks_comparison_table_columns" CASCADE;
  DROP TABLE "_partners_v_blocks_comparison_table_rows_cells" CASCADE;
  DROP TABLE "_partners_v_blocks_comparison_table_rows" CASCADE;
  DROP TABLE "_partners_v_blocks_comparison_table_best_for_row" CASCADE;
  DROP TABLE "_partners_v_blocks_comparison_table" CASCADE;
  DROP TABLE "_partners_v_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "_partners_v_blocks_mission_vision_values" CASCADE;
  DROP TABLE "_partners_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_partners_v_blocks_timeline" CASCADE;
  DROP TABLE "_partners_v_blocks_stats_bar_items" CASCADE;
  DROP TABLE "_partners_v_blocks_stats_bar" CASCADE;
  DROP TABLE "_partners_v_blocks_metric_display" CASCADE;
  DROP TABLE "_partners_v_blocks_logo_bar_logos" CASCADE;
  DROP TABLE "_partners_v_blocks_logo_bar" CASCADE;
  DROP TABLE "_partners_v_blocks_featured_testimonials" CASCADE;
  DROP TABLE "_partners_v_blocks_testimonial_block" CASCADE;
  DROP TABLE "_partners_v_blocks_client_logo_grid_logos" CASCADE;
  DROP TABLE "_partners_v_blocks_client_logo_grid" CASCADE;
  DROP TABLE "_partners_v_blocks_cta_section" CASCADE;
  DROP TABLE "_partners_v_blocks_newsletter_cta" CASCADE;
  DROP TABLE "_partners_v_blocks_contact_cta" CASCADE;
  DROP TABLE "_partners_v_blocks_case_study_grid" CASCADE;
  DROP TABLE "_partners_v_blocks_service_cards" CASCADE;
  DROP TABLE "_partners_v_blocks_service_pillar_cards" CASCADE;
  DROP TABLE "_partners_v_blocks_featured_case_study" CASCADE;
  DROP TABLE "_partners_v_blocks_post_list" CASCADE;
  DROP TABLE "_partners_v_blocks_related_posts" CASCADE;
  DROP TABLE "_partners_v_blocks_industry_grid" CASCADE;
  DROP TABLE "_partners_v_blocks_locations_list" CASCADE;
  DROP TABLE "_partners_v_blocks_workshop_list" CASCADE;
  DROP TABLE "_partners_v_blocks_team_grid" CASCADE;
  DROP TABLE "_partners_v_blocks_video_embed" CASCADE;
  DROP TABLE "_partners_v_blocks_faq_items" CASCADE;
  DROP TABLE "_partners_v_blocks_faq" CASCADE;
  DROP TABLE "_partners_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_partners_v_blocks_accordion" CASCADE;
  DROP TABLE "_partners_v_blocks_tabs_tabs" CASCADE;
  DROP TABLE "_partners_v_blocks_tabs" CASCADE;
  DROP TABLE "_partners_v_blocks_map" CASCADE;
  DROP TABLE "_partners_v_blocks_embed" CASCADE;
  DROP TABLE "_partners_v_blocks_download_card" CASCADE;
  DROP TABLE "_partners_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_partners_v_blocks_hubspot_meetings" CASCADE;
  DROP TABLE "_partners_v_blocks_brand_teaser" CASCADE;
  DROP TABLE "_partners_v_blocks_nav_cards_cards" CASCADE;
  DROP TABLE "_partners_v_blocks_nav_cards" CASCADE;
  DROP TABLE "_partners_v_blocks_key_takeaways_items" CASCADE;
  DROP TABLE "_partners_v_blocks_key_takeaways" CASCADE;
  DROP TABLE "_partners_v_blocks_tech_stack_items" CASCADE;
  DROP TABLE "_partners_v_blocks_tech_stack" CASCADE;
  DROP TABLE "_partners_v" CASCADE;
  DROP TABLE "_partners_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";
  
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  DROP TYPE "public"."enum_partners_blocks_hero_variant";
  DROP TYPE "public"."enum_partners_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_partners_blocks_hero_alignment";
  DROP TYPE "public"."enum_partners_blocks_content_width";
  DROP TYPE "public"."enum_partners_blocks_content_background";
  DROP TYPE "public"."enum_partners_blocks_two_column_media_position";
  DROP TYPE "public"."enum_partners_blocks_image_width";
  DROP TYPE "public"."enum_partners_blocks_image_alignment";
  DROP TYPE "public"."enum_partners_blocks_gallery_layout";
  DROP TYPE "public"."enum_partners_blocks_gallery_columns";
  DROP TYPE "public"."enum_partners_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum_partners_blocks_stats_bar_source";
  DROP TYPE "public"."enum_partners_blocks_metric_display_background";
  DROP TYPE "public"."enum_partners_blocks_logo_bar_source";
  DROP TYPE "public"."enum_partners_blocks_logo_bar_treatment";
  DROP TYPE "public"."enum_partners_blocks_testimonial_block_layout";
  DROP TYPE "public"."enum_partners_blocks_client_logo_grid_columns";
  DROP TYPE "public"."enum_partners_blocks_cta_section_variant";
  DROP TYPE "public"."enum_partners_blocks_cta_section_background";
  DROP TYPE "public"."enum_partners_blocks_case_study_grid_source";
  DROP TYPE "public"."enum_partners_blocks_service_cards_source";
  DROP TYPE "public"."enum_partners_blocks_post_list_source";
  DROP TYPE "public"."enum_partners_blocks_team_grid_filter";
  DROP TYPE "public"."enum_partners_blocks_team_grid_layout";
  DROP TYPE "public"."enum_partners_blocks_video_embed_provider";
  DROP TYPE "public"."enum_partners_status";
  DROP TYPE "public"."enum__partners_v_blocks_hero_variant";
  DROP TYPE "public"."enum__partners_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__partners_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__partners_v_blocks_content_width";
  DROP TYPE "public"."enum__partners_v_blocks_content_background";
  DROP TYPE "public"."enum__partners_v_blocks_two_column_media_position";
  DROP TYPE "public"."enum__partners_v_blocks_image_width";
  DROP TYPE "public"."enum__partners_v_blocks_image_alignment";
  DROP TYPE "public"."enum__partners_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__partners_v_blocks_gallery_columns";
  DROP TYPE "public"."enum__partners_v_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum__partners_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum__partners_v_blocks_metric_display_background";
  DROP TYPE "public"."enum__partners_v_blocks_logo_bar_source";
  DROP TYPE "public"."enum__partners_v_blocks_logo_bar_treatment";
  DROP TYPE "public"."enum__partners_v_blocks_testimonial_block_layout";
  DROP TYPE "public"."enum__partners_v_blocks_client_logo_grid_columns";
  DROP TYPE "public"."enum__partners_v_blocks_cta_section_variant";
  DROP TYPE "public"."enum__partners_v_blocks_cta_section_background";
  DROP TYPE "public"."enum__partners_v_blocks_case_study_grid_source";
  DROP TYPE "public"."enum__partners_v_blocks_service_cards_source";
  DROP TYPE "public"."enum__partners_v_blocks_post_list_source";
  DROP TYPE "public"."enum__partners_v_blocks_team_grid_filter";
  DROP TYPE "public"."enum__partners_v_blocks_team_grid_layout";
  DROP TYPE "public"."enum__partners_v_blocks_video_embed_provider";
  DROP TYPE "public"."enum__partners_v_version_status";`)
}
