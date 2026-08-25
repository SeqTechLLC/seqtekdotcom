import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies_technologies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_technologies" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "services_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_timeline" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "services_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "services_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_faq" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "_services_v_blocks_mission_vision_values_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_mission_vision_values" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_timeline_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_timeline" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "_services_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
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
  ALTER TABLE "_services_v_version_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members_certifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members_education" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members_personal_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_team_members_v_version_certifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_team_members_v_version_education" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_team_members_v_version_personal_facts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workshops_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workshops_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshops_v_version_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshops_v_version_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_main_nav_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_main_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_nav_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_main_nav_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_main_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_footer_nav_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_footer_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_client_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_version_client_logos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "case_studies_metrics" CASCADE;
  DROP TABLE "case_studies_technologies" CASCADE;
  DROP TABLE "_case_studies_v_version_metrics" CASCADE;
  DROP TABLE "_case_studies_v_version_technologies" CASCADE;
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
  DROP TABLE "services_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "services_blocks_mission_vision_values" CASCADE;
  DROP TABLE "services_blocks_timeline_items" CASCADE;
  DROP TABLE "services_blocks_timeline" CASCADE;
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
  DROP TABLE "services_blocks_faq_items" CASCADE;
  DROP TABLE "services_blocks_faq" CASCADE;
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
  DROP TABLE "services_deliverables" CASCADE;
  DROP TABLE "services_faq" CASCADE;
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
  DROP TABLE "_services_v_blocks_mission_vision_values_values" CASCADE;
  DROP TABLE "_services_v_blocks_mission_vision_values" CASCADE;
  DROP TABLE "_services_v_blocks_timeline_items" CASCADE;
  DROP TABLE "_services_v_blocks_timeline" CASCADE;
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
  DROP TABLE "_services_v_blocks_faq_items" CASCADE;
  DROP TABLE "_services_v_blocks_faq" CASCADE;
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
  DROP TABLE "_services_v_version_deliverables" CASCADE;
  DROP TABLE "_services_v_version_faq" CASCADE;
  DROP TABLE "team_members_certifications" CASCADE;
  DROP TABLE "team_members_education" CASCADE;
  DROP TABLE "team_members_personal_facts" CASCADE;
  DROP TABLE "_team_members_v_version_certifications" CASCADE;
  DROP TABLE "_team_members_v_version_education" CASCADE;
  DROP TABLE "_team_members_v_version_personal_facts" CASCADE;
  DROP TABLE "workshops_deliverables" CASCADE;
  DROP TABLE "workshops_photos" CASCADE;
  DROP TABLE "_workshops_v_version_deliverables" CASCADE;
  DROP TABLE "_workshops_v_version_photos" CASCADE;
  DROP TABLE "site_settings_stats" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "_site_settings_v_version_stats" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "navigation_main_nav_children" CASCADE;
  DROP TABLE "navigation_main_nav" CASCADE;
  DROP TABLE "navigation_footer_nav_children" CASCADE;
  DROP TABLE "navigation_footer_nav" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "_navigation_v_version_main_nav_children" CASCADE;
  DROP TABLE "_navigation_v_version_main_nav" CASCADE;
  DROP TABLE "_navigation_v_version_footer_nav_children" CASCADE;
  DROP TABLE "_navigation_v_version_footer_nav" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TABLE "homepage_stats" CASCADE;
  DROP TABLE "homepage_client_logos" CASCADE;
  DROP TABLE "_homepage_v_version_stats" CASCADE;
  DROP TABLE "_homepage_v_version_client_logos" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_hero_background_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_hero_background_image_id_media_id_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_testimonials_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_services_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_service_pillars_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_posts_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_industries_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_locations_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_workshops_fk";
  
  ALTER TABLE "services_rels" DROP CONSTRAINT "services_rels_team_members_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_testimonials_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_services_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_service_pillars_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_posts_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_industries_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_locations_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_workshops_fk";
  
  ALTER TABLE "_services_v_rels" DROP CONSTRAINT "_services_v_rels_team_members_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_hero_background_image_id_media_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_featured_case_study_id_case_studies_id_fk";
  
  ALTER TABLE "homepage" DROP CONSTRAINT "homepage_brand_teaser_image_id_media_id_fk";
  
  ALTER TABLE "_homepage_v" DROP CONSTRAINT "_homepage_v_version_hero_background_image_id_media_id_fk";
  
  ALTER TABLE "_homepage_v" DROP CONSTRAINT "_homepage_v_version_featured_case_study_id_case_studies_id_fk";
  
  ALTER TABLE "_homepage_v" DROP CONSTRAINT "_homepage_v_version_brand_teaser_image_id_media_id_fk";
  
  DROP INDEX "pages_hero_hero_background_image_idx";
  DROP INDEX "_pages_v_version_hero_version_hero_background_image_idx";
  DROP INDEX "services_rels_testimonials_id_idx";
  DROP INDEX "services_rels_services_id_idx";
  DROP INDEX "services_rels_service_pillars_id_idx";
  DROP INDEX "services_rels_posts_id_idx";
  DROP INDEX "services_rels_industries_id_idx";
  DROP INDEX "services_rels_locations_id_idx";
  DROP INDEX "services_rels_workshops_id_idx";
  DROP INDEX "services_rels_team_members_id_idx";
  DROP INDEX "_services_v_rels_testimonials_id_idx";
  DROP INDEX "_services_v_rels_services_id_idx";
  DROP INDEX "_services_v_rels_service_pillars_id_idx";
  DROP INDEX "_services_v_rels_posts_id_idx";
  DROP INDEX "_services_v_rels_industries_id_idx";
  DROP INDEX "_services_v_rels_locations_id_idx";
  DROP INDEX "_services_v_rels_workshops_id_idx";
  DROP INDEX "_services_v_rels_team_members_id_idx";
  DROP INDEX "homepage_hero_hero_background_image_idx";
  DROP INDEX "homepage_featured_case_study_idx";
  DROP INDEX "homepage_brand_teaser_brand_teaser_image_idx";
  DROP INDEX "_homepage_v_version_hero_version_hero_background_image_idx";
  DROP INDEX "_homepage_v_version_version_featured_case_study_idx";
  DROP INDEX "_homepage_v_version_brand_teaser_version_brand_teaser_im_idx";
  ALTER TABLE "pages" DROP COLUMN "hero_headline";
  ALTER TABLE "pages" DROP COLUMN "hero_subheadline";
  ALTER TABLE "pages" DROP COLUMN "hero_background_image_id";
  ALTER TABLE "pages" DROP COLUMN "hero_cta_label";
  ALTER TABLE "pages" DROP COLUMN "hero_cta_url";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_headline";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_subheadline";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_background_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_cta_label";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_cta_url";
  ALTER TABLE "case_studies" DROP COLUMN "problem";
  ALTER TABLE "case_studies" DROP COLUMN "solution";
  ALTER TABLE "case_studies" DROP COLUMN "impact";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_problem";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_solution";
  ALTER TABLE "_case_studies_v" DROP COLUMN "version_impact";
  ALTER TABLE "services" DROP COLUMN "description";
  ALTER TABLE "services" DROP COLUMN "approach";
  ALTER TABLE "services_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "services_rels" DROP COLUMN "services_id";
  ALTER TABLE "services_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "services_rels" DROP COLUMN "posts_id";
  ALTER TABLE "services_rels" DROP COLUMN "industries_id";
  ALTER TABLE "services_rels" DROP COLUMN "locations_id";
  ALTER TABLE "services_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "services_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_description";
  ALTER TABLE "_services_v" DROP COLUMN "version_approach";
  ALTER TABLE "_services_v_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "services_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "service_pillars_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "posts_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "industries_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "locations_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "_services_v_rels" DROP COLUMN "team_members_id";
  ALTER TABLE "team_members" DROP COLUMN "bio";
  ALTER TABLE "team_members" DROP COLUMN "quote";
  ALTER TABLE "_team_members_v" DROP COLUMN "version_bio";
  ALTER TABLE "_team_members_v" DROP COLUMN "version_quote";
  ALTER TABLE "workshops" DROP COLUMN "description";
  ALTER TABLE "workshops" DROP COLUMN "format";
  ALTER TABLE "workshops" DROP COLUMN "audience";
  ALTER TABLE "workshops" DROP COLUMN "video_provider";
  ALTER TABLE "workshops" DROP COLUMN "video_video_id";
  ALTER TABLE "workshops" DROP COLUMN "video_title";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_description";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_format";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_audience";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_provider";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_video_id";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_title";
  ALTER TABLE "homepage" DROP COLUMN "hero_headline";
  ALTER TABLE "homepage" DROP COLUMN "hero_subheadline";
  ALTER TABLE "homepage" DROP COLUMN "hero_background_image_id";
  ALTER TABLE "homepage" DROP COLUMN "hero_cta_label";
  ALTER TABLE "homepage" DROP COLUMN "hero_cta_url";
  ALTER TABLE "homepage" DROP COLUMN "featured_case_study_id";
  ALTER TABLE "homepage" DROP COLUMN "brand_teaser_headline";
  ALTER TABLE "homepage" DROP COLUMN "brand_teaser_body";
  ALTER TABLE "homepage" DROP COLUMN "brand_teaser_link_label";
  ALTER TABLE "homepage" DROP COLUMN "brand_teaser_link_url";
  ALTER TABLE "homepage" DROP COLUMN "brand_teaser_image_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_headline";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_subheadline";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_background_image_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_cta_label";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_hero_cta_url";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_featured_case_study_id";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_brand_teaser_headline";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_brand_teaser_body";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_brand_teaser_link_label";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_brand_teaser_link_url";
  ALTER TABLE "_homepage_v" DROP COLUMN "version_brand_teaser_image_id";
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
  DROP TYPE "public"."enum_services_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum_services_blocks_stats_bar_source";
  DROP TYPE "public"."enum_services_blocks_metric_display_background";
  DROP TYPE "public"."enum_services_blocks_logo_bar_source";
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
  DROP TYPE "public"."enum__services_v_blocks_mission_vision_values_layout";
  DROP TYPE "public"."enum__services_v_blocks_stats_bar_source";
  DROP TYPE "public"."enum__services_v_blocks_metric_display_background";
  DROP TYPE "public"."enum__services_v_blocks_logo_bar_source";
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
  DROP TYPE "public"."enum_workshops_video_provider";
  DROP TYPE "public"."enum__workshops_v_version_video_provider";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
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
  CREATE TYPE "public"."enum_services_blocks_mission_vision_values_layout" AS ENUM('tabs', 'grid', 'stacked');
  CREATE TYPE "public"."enum_services_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum_services_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum_services_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum_services_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_services_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum_services_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum_services_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum_services_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum_services_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum_services_blocks_team_grid_filter" AS ENUM('leadership-only', 'featured', 'all');
  CREATE TYPE "public"."enum_services_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum_services_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
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
  CREATE TYPE "public"."enum__services_v_blocks_mission_vision_values_layout" AS ENUM('tabs', 'grid', 'stacked');
  CREATE TYPE "public"."enum__services_v_blocks_stats_bar_source" AS ENUM('inline', 'from-site-settings');
  CREATE TYPE "public"."enum__services_v_blocks_metric_display_background" AS ENUM('accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_logo_bar_source" AS ENUM('inline', 'from-homepage');
  CREATE TYPE "public"."enum__services_v_blocks_logo_bar_treatment" AS ENUM('grayscale-on-color-hover', 'color');
  CREATE TYPE "public"."enum__services_v_blocks_testimonial_block_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__services_v_blocks_client_logo_grid_columns" AS ENUM('3', '4', '6');
  CREATE TYPE "public"."enum__services_v_blocks_cta_section_variant" AS ENUM('centered', 'split', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_cta_section_background" AS ENUM('default', 'accent', 'image');
  CREATE TYPE "public"."enum__services_v_blocks_case_study_grid_source" AS ENUM('manual', 'latest', 'by-industry', 'by-service');
  CREATE TYPE "public"."enum__services_v_blocks_service_cards_source" AS ENUM('by-pillar', 'manual');
  CREATE TYPE "public"."enum__services_v_blocks_post_list_source" AS ENUM('latest', 'by-category', 'manual');
  CREATE TYPE "public"."enum__services_v_blocks_team_grid_filter" AS ENUM('leadership-only', 'featured', 'all');
  CREATE TYPE "public"."enum__services_v_blocks_team_grid_layout" AS ENUM('cards', 'compact');
  CREATE TYPE "public"."enum__services_v_blocks_video_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_workshops_video_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__workshops_v_version_video_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "case_studies_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar
  );
  
  CREATE TABLE "case_studies_technologies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"context" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_version_technologies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
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
  	"source" "enum_services_blocks_stats_bar_source" DEFAULT 'inline',
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
  	"source" "enum_services_blocks_logo_bar_source" DEFAULT 'inline',
  	"treatment" "enum_services_blocks_logo_bar_treatment" DEFAULT 'grayscale-on-color-hover',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_featured_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"autoplay" boolean DEFAULT false,
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
  	"submit_redirect" varchar,
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
  
  CREATE TABLE "services_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "services_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
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
  	"source" "enum__services_v_blocks_stats_bar_source" DEFAULT 'inline',
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
  	"source" "enum__services_v_blocks_logo_bar_source" DEFAULT 'inline',
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
  	"autoplay" boolean DEFAULT false,
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
  	"submit_redirect" varchar,
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
  
  CREATE TABLE "_services_v_version_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "team_members_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "team_members_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"degree" varchar,
  	"institution" varchar
  );
  
  CREATE TABLE "team_members_personal_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "_team_members_v_version_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_version_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"degree" varchar,
  	"institution" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_version_personal_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "workshops_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "workshops_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "_workshops_v_version_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_version_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_settings_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name" varchar,
  	"tagline" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"address_street" varchar,
  	"address_city" varchar,
  	"address_state" varchar,
  	"address_zip" varchar,
  	"social_links_linkedin_url" varchar,
  	"social_links_twitter_url" varchar,
  	"social_links_facebook_url" varchar,
  	"footer_text" varchar,
  	"_status" "enum_site_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_site_settings_v_version_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_company_name" varchar,
  	"version_tagline" varchar,
  	"version_phone" varchar,
  	"version_email" varchar,
  	"version_address_street" varchar,
  	"version_address_city" varchar,
  	"version_address_state" varchar,
  	"version_address_zip" varchar,
  	"version_social_links_linkedin_url" varchar,
  	"version_social_links_twitter_url" varchar,
  	"version_social_links_facebook_url" varchar,
  	"version_footer_text" varchar,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "navigation_main_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_main_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_footer_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_footer_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cta_button_label" varchar,
  	"cta_button_url" varchar,
  	"_status" "enum_navigation_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_navigation_v_version_main_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_main_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_footer_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_cta_button_label" varchar,
  	"version_cta_button_url" varchar,
  	"version__status" "enum__navigation_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "homepage_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar
  );
  
  CREATE TABLE "homepage_client_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "_homepage_v_version_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"label" varchar,
  	"suffix" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_version_client_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages" ADD COLUMN "hero_headline" varchar;
  ALTER TABLE "pages" ADD COLUMN "hero_subheadline" varchar;
  ALTER TABLE "pages" ADD COLUMN "hero_background_image_id" integer;
  ALTER TABLE "pages" ADD COLUMN "hero_cta_label" varchar;
  ALTER TABLE "pages" ADD COLUMN "hero_cta_url" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_headline" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_subheadline" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_background_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_cta_label" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_cta_url" varchar;
  ALTER TABLE "case_studies" ADD COLUMN "problem" jsonb;
  ALTER TABLE "case_studies" ADD COLUMN "solution" jsonb;
  ALTER TABLE "case_studies" ADD COLUMN "impact" jsonb;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_problem" jsonb;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_solution" jsonb;
  ALTER TABLE "_case_studies_v" ADD COLUMN "version_impact" jsonb;
  ALTER TABLE "services" ADD COLUMN "description" jsonb;
  ALTER TABLE "services" ADD COLUMN "approach" jsonb;
  ALTER TABLE "services_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "industries_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "services_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_description" jsonb;
  ALTER TABLE "_services_v" ADD COLUMN "version_approach" jsonb;
  ALTER TABLE "_services_v_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "service_pillars_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "industries_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "locations_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "_services_v_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "team_members" ADD COLUMN "bio" jsonb;
  ALTER TABLE "team_members" ADD COLUMN "quote" varchar;
  ALTER TABLE "_team_members_v" ADD COLUMN "version_bio" jsonb;
  ALTER TABLE "_team_members_v" ADD COLUMN "version_quote" varchar;
  ALTER TABLE "workshops" ADD COLUMN "description" jsonb;
  ALTER TABLE "workshops" ADD COLUMN "format" jsonb;
  ALTER TABLE "workshops" ADD COLUMN "audience" jsonb;
  ALTER TABLE "workshops" ADD COLUMN "video_provider" "enum_workshops_video_provider" DEFAULT 'youtube';
  ALTER TABLE "workshops" ADD COLUMN "video_video_id" varchar;
  ALTER TABLE "workshops" ADD COLUMN "video_title" varchar;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_description" jsonb;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_format" jsonb;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_audience" jsonb;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_provider" "enum__workshops_v_version_video_provider" DEFAULT 'youtube';
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_video_id" varchar;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_title" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_headline" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_subheadline" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_background_image_id" integer;
  ALTER TABLE "homepage" ADD COLUMN "hero_cta_label" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_cta_url" varchar;
  ALTER TABLE "homepage" ADD COLUMN "featured_case_study_id" integer;
  ALTER TABLE "homepage" ADD COLUMN "brand_teaser_headline" varchar;
  ALTER TABLE "homepage" ADD COLUMN "brand_teaser_body" varchar;
  ALTER TABLE "homepage" ADD COLUMN "brand_teaser_link_label" varchar;
  ALTER TABLE "homepage" ADD COLUMN "brand_teaser_link_url" varchar;
  ALTER TABLE "homepage" ADD COLUMN "brand_teaser_image_id" integer;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_headline" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_subheadline" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_background_image_id" integer;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_cta_label" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_hero_cta_url" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_featured_case_study_id" integer;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_brand_teaser_headline" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_brand_teaser_body" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_brand_teaser_link_label" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_brand_teaser_link_url" varchar;
  ALTER TABLE "_homepage_v" ADD COLUMN "version_brand_teaser_image_id" integer;
  ALTER TABLE "case_studies_metrics" ADD CONSTRAINT "case_studies_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_technologies" ADD CONSTRAINT "case_studies_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_metrics" ADD CONSTRAINT "_case_studies_v_version_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_technologies" ADD CONSTRAINT "_case_studies_v_version_technologies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "services_blocks_mission_vision_values_values" ADD CONSTRAINT "services_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_mission_vision_values" ADD CONSTRAINT "services_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline_items" ADD CONSTRAINT "services_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline_items" ADD CONSTRAINT "services_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_timeline" ADD CONSTRAINT "services_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "services_blocks_service_cards" ADD CONSTRAINT "services_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
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
  ALTER TABLE "services_blocks_faq_items" ADD CONSTRAINT "services_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq" ADD CONSTRAINT "services_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "services_deliverables" ADD CONSTRAINT "services_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_faq" ADD CONSTRAINT "services_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "_services_v_blocks_mission_vision_values_values" ADD CONSTRAINT "_services_v_blocks_mission_vision_values_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_mission_vision_values"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_mission_vision_values" ADD CONSTRAINT "_services_v_blocks_mission_vision_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline_items" ADD CONSTRAINT "_services_v_blocks_timeline_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline_items" ADD CONSTRAINT "_services_v_blocks_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_timeline" ADD CONSTRAINT "_services_v_blocks_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "_services_v_blocks_service_cards" ADD CONSTRAINT "_services_v_blocks_service_cards_pillar_id_service_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."service_pillars"("id") ON DELETE set null ON UPDATE no action;
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
  ALTER TABLE "_services_v_blocks_faq_items" ADD CONSTRAINT "_services_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq" ADD CONSTRAINT "_services_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "_services_v_version_deliverables" ADD CONSTRAINT "_services_v_version_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_faq" ADD CONSTRAINT "_services_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_certifications" ADD CONSTRAINT "team_members_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_education" ADD CONSTRAINT "team_members_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_personal_facts" ADD CONSTRAINT "team_members_personal_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_version_certifications" ADD CONSTRAINT "_team_members_v_version_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_version_education" ADD CONSTRAINT "_team_members_v_version_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_version_personal_facts" ADD CONSTRAINT "_team_members_v_version_personal_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_deliverables" ADD CONSTRAINT "workshops_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_photos" ADD CONSTRAINT "workshops_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_photos" ADD CONSTRAINT "workshops_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_version_deliverables" ADD CONSTRAINT "_workshops_v_version_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_version_photos" ADD CONSTRAINT "_workshops_v_version_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_version_photos" ADD CONSTRAINT "_workshops_v_version_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_stats" ADD CONSTRAINT "site_settings_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_stats" ADD CONSTRAINT "_site_settings_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav_children" ADD CONSTRAINT "navigation_main_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav" ADD CONSTRAINT "navigation_main_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_nav_children" ADD CONSTRAINT "navigation_footer_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_nav" ADD CONSTRAINT "navigation_footer_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_nav_children" ADD CONSTRAINT "_navigation_v_version_main_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_main_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_main_nav" ADD CONSTRAINT "_navigation_v_version_main_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_nav_children" ADD CONSTRAINT "_navigation_v_version_footer_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_footer_nav" ADD CONSTRAINT "_navigation_v_version_footer_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_stats" ADD CONSTRAINT "homepage_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_client_logos" ADD CONSTRAINT "homepage_client_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_client_logos" ADD CONSTRAINT "homepage_client_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_stats" ADD CONSTRAINT "_homepage_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_client_logos" ADD CONSTRAINT "_homepage_v_version_client_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_version_client_logos" ADD CONSTRAINT "_homepage_v_version_client_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "case_studies_metrics_order_idx" ON "case_studies_metrics" USING btree ("_order");
  CREATE INDEX "case_studies_metrics_parent_id_idx" ON "case_studies_metrics" USING btree ("_parent_id");
  CREATE INDEX "case_studies_technologies_order_idx" ON "case_studies_technologies" USING btree ("_order");
  CREATE INDEX "case_studies_technologies_parent_id_idx" ON "case_studies_technologies" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_version_metrics_order_idx" ON "_case_studies_v_version_metrics" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_metrics_parent_id_idx" ON "_case_studies_v_version_metrics" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_version_technologies_order_idx" ON "_case_studies_v_version_technologies" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_technologies_parent_id_idx" ON "_case_studies_v_version_technologies" USING btree ("_parent_id");
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
  CREATE INDEX "services_blocks_mission_vision_values_values_order_idx" ON "services_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "services_blocks_mission_vision_values_values_parent_id_idx" ON "services_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_mission_vision_values_order_idx" ON "services_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "services_blocks_mission_vision_values_parent_id_idx" ON "services_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_mission_vision_values_path_idx" ON "services_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "services_blocks_timeline_items_order_idx" ON "services_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "services_blocks_timeline_items_parent_id_idx" ON "services_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_timeline_items_image_idx" ON "services_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "services_blocks_timeline_order_idx" ON "services_blocks_timeline" USING btree ("_order");
  CREATE INDEX "services_blocks_timeline_parent_id_idx" ON "services_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_timeline_path_idx" ON "services_blocks_timeline" USING btree ("_path");
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
  CREATE INDEX "services_blocks_faq_items_order_idx" ON "services_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_items_parent_id_idx" ON "services_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_order_idx" ON "services_blocks_faq" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_parent_id_idx" ON "services_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_path_idx" ON "services_blocks_faq" USING btree ("_path");
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
  CREATE INDEX "services_deliverables_order_idx" ON "services_deliverables" USING btree ("_order");
  CREATE INDEX "services_deliverables_parent_id_idx" ON "services_deliverables" USING btree ("_parent_id");
  CREATE INDEX "services_faq_order_idx" ON "services_faq" USING btree ("_order");
  CREATE INDEX "services_faq_parent_id_idx" ON "services_faq" USING btree ("_parent_id");
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
  CREATE INDEX "_services_v_blocks_mission_vision_values_values_order_idx" ON "_services_v_blocks_mission_vision_values_values" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_mission_vision_values_values_parent_id_idx" ON "_services_v_blocks_mission_vision_values_values" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_mission_vision_values_order_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_mission_vision_values_parent_id_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_mission_vision_values_path_idx" ON "_services_v_blocks_mission_vision_values" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_timeline_items_order_idx" ON "_services_v_blocks_timeline_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_timeline_items_parent_id_idx" ON "_services_v_blocks_timeline_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_timeline_items_image_idx" ON "_services_v_blocks_timeline_items" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_timeline_order_idx" ON "_services_v_blocks_timeline" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_timeline_parent_id_idx" ON "_services_v_blocks_timeline" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_timeline_path_idx" ON "_services_v_blocks_timeline" USING btree ("_path");
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
  CREATE INDEX "_services_v_blocks_faq_items_order_idx" ON "_services_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_items_parent_id_idx" ON "_services_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_order_idx" ON "_services_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_parent_id_idx" ON "_services_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_path_idx" ON "_services_v_blocks_faq" USING btree ("_path");
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
  CREATE INDEX "_services_v_version_deliverables_order_idx" ON "_services_v_version_deliverables" USING btree ("_order");
  CREATE INDEX "_services_v_version_deliverables_parent_id_idx" ON "_services_v_version_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_faq_order_idx" ON "_services_v_version_faq" USING btree ("_order");
  CREATE INDEX "_services_v_version_faq_parent_id_idx" ON "_services_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "team_members_certifications_order_idx" ON "team_members_certifications" USING btree ("_order");
  CREATE INDEX "team_members_certifications_parent_id_idx" ON "team_members_certifications" USING btree ("_parent_id");
  CREATE INDEX "team_members_education_order_idx" ON "team_members_education" USING btree ("_order");
  CREATE INDEX "team_members_education_parent_id_idx" ON "team_members_education" USING btree ("_parent_id");
  CREATE INDEX "team_members_personal_facts_order_idx" ON "team_members_personal_facts" USING btree ("_order");
  CREATE INDEX "team_members_personal_facts_parent_id_idx" ON "team_members_personal_facts" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_version_certifications_order_idx" ON "_team_members_v_version_certifications" USING btree ("_order");
  CREATE INDEX "_team_members_v_version_certifications_parent_id_idx" ON "_team_members_v_version_certifications" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_version_education_order_idx" ON "_team_members_v_version_education" USING btree ("_order");
  CREATE INDEX "_team_members_v_version_education_parent_id_idx" ON "_team_members_v_version_education" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_version_personal_facts_order_idx" ON "_team_members_v_version_personal_facts" USING btree ("_order");
  CREATE INDEX "_team_members_v_version_personal_facts_parent_id_idx" ON "_team_members_v_version_personal_facts" USING btree ("_parent_id");
  CREATE INDEX "workshops_deliverables_order_idx" ON "workshops_deliverables" USING btree ("_order");
  CREATE INDEX "workshops_deliverables_parent_id_idx" ON "workshops_deliverables" USING btree ("_parent_id");
  CREATE INDEX "workshops_photos_order_idx" ON "workshops_photos" USING btree ("_order");
  CREATE INDEX "workshops_photos_parent_id_idx" ON "workshops_photos" USING btree ("_parent_id");
  CREATE INDEX "workshops_photos_image_idx" ON "workshops_photos" USING btree ("image_id");
  CREATE INDEX "_workshops_v_version_deliverables_order_idx" ON "_workshops_v_version_deliverables" USING btree ("_order");
  CREATE INDEX "_workshops_v_version_deliverables_parent_id_idx" ON "_workshops_v_version_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_version_photos_order_idx" ON "_workshops_v_version_photos" USING btree ("_order");
  CREATE INDEX "_workshops_v_version_photos_parent_id_idx" ON "_workshops_v_version_photos" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_version_photos_image_idx" ON "_workshops_v_version_photos" USING btree ("image_id");
  CREATE INDEX "site_settings_stats_order_idx" ON "site_settings_stats" USING btree ("_order");
  CREATE INDEX "site_settings_stats_parent_id_idx" ON "site_settings_stats" USING btree ("_parent_id");
  CREATE INDEX "site_settings__status_idx" ON "site_settings" USING btree ("_status");
  CREATE INDEX "_site_settings_v_version_stats_order_idx" ON "_site_settings_v_version_stats" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_stats_parent_id_idx" ON "_site_settings_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v" USING btree ("version__status");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "navigation_main_nav_children_order_idx" ON "navigation_main_nav_children" USING btree ("_order");
  CREATE INDEX "navigation_main_nav_children_parent_id_idx" ON "navigation_main_nav_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_nav_order_idx" ON "navigation_main_nav" USING btree ("_order");
  CREATE INDEX "navigation_main_nav_parent_id_idx" ON "navigation_main_nav" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_nav_children_order_idx" ON "navigation_footer_nav_children" USING btree ("_order");
  CREATE INDEX "navigation_footer_nav_children_parent_id_idx" ON "navigation_footer_nav_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_nav_order_idx" ON "navigation_footer_nav" USING btree ("_order");
  CREATE INDEX "navigation_footer_nav_parent_id_idx" ON "navigation_footer_nav" USING btree ("_parent_id");
  CREATE INDEX "navigation__status_idx" ON "navigation" USING btree ("_status");
  CREATE INDEX "_navigation_v_version_main_nav_children_order_idx" ON "_navigation_v_version_main_nav_children" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_main_nav_children_parent_id_idx" ON "_navigation_v_version_main_nav_children" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_main_nav_order_idx" ON "_navigation_v_version_main_nav" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_main_nav_parent_id_idx" ON "_navigation_v_version_main_nav" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_nav_children_order_idx" ON "_navigation_v_version_footer_nav_children" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_nav_children_parent_id_idx" ON "_navigation_v_version_footer_nav_children" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_footer_nav_order_idx" ON "_navigation_v_version_footer_nav" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_nav_parent_id_idx" ON "_navigation_v_version_footer_nav" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_latest_idx" ON "_navigation_v" USING btree ("latest");
  CREATE INDEX "homepage_stats_order_idx" ON "homepage_stats" USING btree ("_order");
  CREATE INDEX "homepage_stats_parent_id_idx" ON "homepage_stats" USING btree ("_parent_id");
  CREATE INDEX "homepage_client_logos_order_idx" ON "homepage_client_logos" USING btree ("_order");
  CREATE INDEX "homepage_client_logos_parent_id_idx" ON "homepage_client_logos" USING btree ("_parent_id");
  CREATE INDEX "homepage_client_logos_logo_idx" ON "homepage_client_logos" USING btree ("logo_id");
  CREATE INDEX "_homepage_v_version_stats_order_idx" ON "_homepage_v_version_stats" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_stats_parent_id_idx" ON "_homepage_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_client_logos_order_idx" ON "_homepage_v_version_client_logos" USING btree ("_order");
  CREATE INDEX "_homepage_v_version_client_logos_parent_id_idx" ON "_homepage_v_version_client_logos" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_version_client_logos_logo_idx" ON "_homepage_v_version_client_logos" USING btree ("logo_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_background_image_id_media_id_fk" FOREIGN KEY ("version_hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_service_pillars_fk" FOREIGN KEY ("service_pillars_id") REFERENCES "public"."service_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_featured_case_study_id_case_studies_id_fk" FOREIGN KEY ("featured_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("brand_teaser_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_hero_background_image_id_media_id_fk" FOREIGN KEY ("version_hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_featured_case_study_id_case_studies_id_fk" FOREIGN KEY ("version_featured_case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_brand_teaser_image_id_media_id_fk" FOREIGN KEY ("version_brand_teaser_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_hero_hero_background_image_idx" ON "pages" USING btree ("hero_background_image_id");
  CREATE INDEX "_pages_v_version_hero_version_hero_background_image_idx" ON "_pages_v" USING btree ("version_hero_background_image_id");
  CREATE INDEX "services_rels_testimonials_id_idx" ON "services_rels" USING btree ("testimonials_id");
  CREATE INDEX "services_rels_services_id_idx" ON "services_rels" USING btree ("services_id");
  CREATE INDEX "services_rels_service_pillars_id_idx" ON "services_rels" USING btree ("service_pillars_id");
  CREATE INDEX "services_rels_posts_id_idx" ON "services_rels" USING btree ("posts_id");
  CREATE INDEX "services_rels_industries_id_idx" ON "services_rels" USING btree ("industries_id");
  CREATE INDEX "services_rels_locations_id_idx" ON "services_rels" USING btree ("locations_id");
  CREATE INDEX "services_rels_workshops_id_idx" ON "services_rels" USING btree ("workshops_id");
  CREATE INDEX "services_rels_team_members_id_idx" ON "services_rels" USING btree ("team_members_id");
  CREATE INDEX "_services_v_rels_testimonials_id_idx" ON "_services_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_services_v_rels_services_id_idx" ON "_services_v_rels" USING btree ("services_id");
  CREATE INDEX "_services_v_rels_service_pillars_id_idx" ON "_services_v_rels" USING btree ("service_pillars_id");
  CREATE INDEX "_services_v_rels_posts_id_idx" ON "_services_v_rels" USING btree ("posts_id");
  CREATE INDEX "_services_v_rels_industries_id_idx" ON "_services_v_rels" USING btree ("industries_id");
  CREATE INDEX "_services_v_rels_locations_id_idx" ON "_services_v_rels" USING btree ("locations_id");
  CREATE INDEX "_services_v_rels_workshops_id_idx" ON "_services_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_services_v_rels_team_members_id_idx" ON "_services_v_rels" USING btree ("team_members_id");
  CREATE INDEX "homepage_hero_hero_background_image_idx" ON "homepage" USING btree ("hero_background_image_id");
  CREATE INDEX "homepage_featured_case_study_idx" ON "homepage" USING btree ("featured_case_study_id");
  CREATE INDEX "homepage_brand_teaser_brand_teaser_image_idx" ON "homepage" USING btree ("brand_teaser_image_id");
  CREATE INDEX "_homepage_v_version_hero_version_hero_background_image_idx" ON "_homepage_v" USING btree ("version_hero_background_image_id");
  CREATE INDEX "_homepage_v_version_version_featured_case_study_idx" ON "_homepage_v" USING btree ("version_featured_case_study_id");
  CREATE INDEX "_homepage_v_version_brand_teaser_version_brand_teaser_im_idx" ON "_homepage_v" USING btree ("version_brand_teaser_image_id");`)
}
