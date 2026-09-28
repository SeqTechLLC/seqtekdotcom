import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_pages_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_pages_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_pages_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_pages_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_pages_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_pages_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_pages_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_pages_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_pages_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_pages_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_pages_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_pages_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_pages_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_pages_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_pages_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_pages_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__pages_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__pages_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__pages_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__pages_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__pages_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__pages_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__pages_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__pages_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__pages_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_case_studies_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_case_studies_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_case_studies_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_case_studies_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_case_studies_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_case_studies_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_case_studies_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_case_studies_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_case_studies_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_case_studies_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_case_studies_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_case_studies_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_case_studies_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_case_studies_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_case_studies_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_case_studies_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_case_studies_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_case_studies_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_case_studies_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_case_studies_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_case_studies_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_case_studies_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_case_studies_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_case_studies_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_case_studies_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_case_studies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__case_studies_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__case_studies_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__case_studies_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__case_studies_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__case_studies_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__case_studies_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__case_studies_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__case_studies_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__case_studies_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__case_studies_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__case_studies_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__case_studies_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__case_studies_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__case_studies_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__case_studies_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__case_studies_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__case_studies_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__case_studies_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__case_studies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_services_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_services_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_services_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_services_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_services_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_services_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_services_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_services_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_services_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_services_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_services_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_services_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_services_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_services_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_services_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_services_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_services_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_services_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_services_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_services_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_services_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_services_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_services_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_services_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_services_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_services_tier" AS ENUM('leaf', 'group', 'axis');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__services_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__services_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__services_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__services_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__services_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__services_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__services_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__services_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__services_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__services_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__services_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__services_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__services_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__services_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__services_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__services_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__services_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__services_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__services_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__services_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__services_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__services_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__services_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__services_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__services_v_version_tier" AS ENUM('leaf', 'group', 'axis');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_industries_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_industries_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_industries_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_industries_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_industries_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_industries_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_industries_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_industries_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_industries_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_industries_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_industries_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_industries_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_industries_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_industries_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_industries_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_industries_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_industries_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_industries_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_industries_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_industries_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_industries_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_industries_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_industries_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_industries_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_industries_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_industries_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__industries_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__industries_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__industries_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__industries_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__industries_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__industries_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__industries_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__industries_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__industries_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__industries_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__industries_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__industries_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__industries_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__industries_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__industries_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__industries_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__industries_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__industries_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__industries_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__industries_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__industries_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__industries_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__industries_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__industries_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__industries_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__industries_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_workshops_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_workshops_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_workshops_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_workshops_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_workshops_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_workshops_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_workshops_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_workshops_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_workshops_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_workshops_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_workshops_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_workshops_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_workshops_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_workshops_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_workshops_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_workshops_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_workshops_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_workshops_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_workshops_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_workshops_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_workshops_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_workshops_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_workshops_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_workshops_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_workshops_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_workshops_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__workshops_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__workshops_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__workshops_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__workshops_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__workshops_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__workshops_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__workshops_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__workshops_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__workshops_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__workshops_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__workshops_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__workshops_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__workshops_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__workshops_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__workshops_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__workshops_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__workshops_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__workshops_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__workshops_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__workshops_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__workshops_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__workshops_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__workshops_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__workshops_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__workshops_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__workshops_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_team_members_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_team_members_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_team_members_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_team_members_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_team_members_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_team_members_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_team_members_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_team_members_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_team_members_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_team_members_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_team_members_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_team_members_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_team_members_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_team_members_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_team_members_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_team_members_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_team_members_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_team_members_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_team_members_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_team_members_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_team_members_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_team_members_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_team_members_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_team_members_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_team_members_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_team_members_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__team_members_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__team_members_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__team_members_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__team_members_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__team_members_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__team_members_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__team_members_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__team_members_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__team_members_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__team_members_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__team_members_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__team_members_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__team_members_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__team_members_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__team_members_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__team_members_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__team_members_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__team_members_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__team_members_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__team_members_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__team_members_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__team_members_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__team_members_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__team_members_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__team_members_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__team_members_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_partners_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_partners_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_partners_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_partners_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_partners_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_partners_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_partners_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_partners_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_partners_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_partners_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_partners_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_partners_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_partners_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_partners_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_partners_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_partners_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_partners_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_partners_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_partners_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_partners_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_partners_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_partners_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_partners_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_partners_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_partners_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_partners_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__partners_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__partners_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__partners_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__partners_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__partners_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__partners_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__partners_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__partners_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__partners_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__partners_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__partners_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__partners_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__partners_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__partners_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__partners_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__partners_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__partners_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__partners_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__partners_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__partners_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__partners_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__partners_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_navigation_groups_items_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_groups_link_type" AS ENUM('internal', 'external', 'heading');
  CREATE TYPE "public"."enum_navigation_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_groups_items_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_groups_link_type" AS ENUM('internal', 'external', 'heading');
  CREATE TYPE "public"."enum__navigation_v_version_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_locations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__locations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_homepage_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum_homepage_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_homepage_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum_homepage_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_homepage_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum_homepage_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum_homepage_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum_homepage_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum_homepage_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_homepage_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum_homepage_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum_homepage_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum_homepage_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum_homepage_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum_homepage_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum_homepage_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum_homepage_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum_homepage_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum_homepage_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum_homepage_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum_homepage_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum_homepage_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_homepage_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum_homepage_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero_variant" AS ENUM('text-only', 'split', 'cover', 'with-video');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_width" AS ENUM('narrow', 'standard', 'wide');
  CREATE TYPE "public"."enum__homepage_v_blocks_content_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_media_text_media_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__homepage_v_blocks_media_text_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_items_layout" AS ENUM('grid', 'line', 'list', 'tags');
  CREATE TYPE "public"."enum__homepage_v_blocks_items_markers" AS ENUM('none', 'numbers', 'custom');
  CREATE TYPE "public"."enum__homepage_v_blocks_items_style" AS ENUM('plain', 'card');
  CREATE TYPE "public"."enum__homepage_v_blocks_items_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_image_width" AS ENUM('narrow', 'standard', 'wide', 'full');
  CREATE TYPE "public"."enum__homepage_v_blocks_image_alignment" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__homepage_v_blocks_image_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_gallery_layout" AS ENUM('grid', 'carousel', 'logos');
  CREATE TYPE "public"."enum__homepage_v_blocks_gallery_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_table_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_accordion_display" AS ENUM('accordion', 'tabs');
  CREATE TYPE "public"."enum__homepage_v_blocks_accordion_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_quote_source" AS ENUM('testimonials', 'custom');
  CREATE TYPE "public"."enum__homepage_v_blocks_quote_layout" AS ENUM('centered', 'with-photo-left', 'with-photo-right');
  CREATE TYPE "public"."enum__homepage_v_blocks_quote_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta_action" AS ENUM('buttons', 'meeting', 'newsletter', 'download');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta_variant" AS ENUM('centered', 'split');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta_primary_cta_variant" AS ENUM('primary', 'secondary', 'ghost');
  CREATE TYPE "public"."enum__homepage_v_blocks_cta_background" AS ENUM('none', 'subtle', 'accent', 'inverse', 'brand');
  CREATE TYPE "public"."enum__homepage_v_blocks_cards_collection" AS ENUM('caseStudies', 'posts', 'services', 'industries', 'workshops', 'teamMembers', 'locations', 'partners');
  CREATE TYPE "public"."enum__homepage_v_blocks_cards_source" AS ENUM('all', 'filtered', 'manual');
  CREATE TYPE "public"."enum__homepage_v_blocks_cards_display" AS ENUM('grid', 'featured');
  CREATE TYPE "public"."enum__homepage_v_blocks_cards_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_embed_kind" AS ENUM('video', 'map', 'page');
  CREATE TYPE "public"."enum__homepage_v_blocks_embed_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__homepage_v_blocks_embed_height" AS ENUM('short', 'medium', 'tall');
  CREATE TYPE "public"."enum__homepage_v_blocks_embed_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_blocks_hubspot_form_background" AS ENUM('none', 'subtle', 'accent', 'inverse');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_pages_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_pages_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_pages_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_pages_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_pages_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_pages_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_pages_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_pages_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_pages_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_pages_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_pages_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_pages_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_pages_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_pages_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_pages_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "pages_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "pages_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_pages_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "pages_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_pages_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_pages_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_pages_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_pages_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_pages_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_pages_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_pages_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_pages_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_pages_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_pages_blocks_cards_collection",
  	"source" "enum_pages_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_pages_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_pages_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_pages_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_pages_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_pages_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_pages_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__pages_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__pages_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__pages_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__pages_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__pages_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__pages_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__pages_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__pages_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__pages_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__pages_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__pages_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__pages_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__pages_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__pages_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__pages_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__pages_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__pages_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__pages_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__pages_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__pages_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__pages_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__pages_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__pages_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__pages_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__pages_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__pages_v_blocks_cards_collection",
  	"source" "enum__pages_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__pages_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__pages_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__pages_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__pages_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__pages_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__pages_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"featured_image_id" integer,
  	"author_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"services_id" integer
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"services_id" integer
  );
  
  CREATE TABLE "case_studies_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_case_studies_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_case_studies_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_case_studies_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_case_studies_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_case_studies_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_case_studies_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_case_studies_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "case_studies_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_case_studies_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_case_studies_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_case_studies_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_case_studies_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_case_studies_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_case_studies_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_case_studies_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "case_studies_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_case_studies_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_case_studies_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "case_studies_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "case_studies_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "case_studies_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "case_studies_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_case_studies_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "case_studies_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_case_studies_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_case_studies_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_case_studies_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_case_studies_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_case_studies_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_case_studies_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_case_studies_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_case_studies_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_case_studies_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_case_studies_blocks_cards_collection",
  	"source" "enum_case_studies_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_case_studies_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_case_studies_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_case_studies_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_case_studies_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_case_studies_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_case_studies_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_case_studies_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "case_studies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"subtitle" varchar,
  	"industry_id" integer,
  	"client_name" varchar,
  	"client_logo_id" integer,
  	"client_is_anonymized" boolean DEFAULT false,
  	"hero_image_id" integer,
  	"testimonial_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_case_studies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "case_studies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_case_studies_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__case_studies_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__case_studies_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__case_studies_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__case_studies_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__case_studies_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__case_studies_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__case_studies_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__case_studies_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__case_studies_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__case_studies_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__case_studies_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__case_studies_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__case_studies_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__case_studies_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__case_studies_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__case_studies_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__case_studies_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__case_studies_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__case_studies_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__case_studies_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__case_studies_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__case_studies_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__case_studies_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__case_studies_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__case_studies_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__case_studies_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__case_studies_v_blocks_cards_collection",
  	"source" "enum__case_studies_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__case_studies_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__case_studies_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__case_studies_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__case_studies_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__case_studies_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__case_studies_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__case_studies_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_case_studies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_subtitle" varchar,
  	"version_industry_id" integer,
  	"version_client_name" varchar,
  	"version_client_logo_id" integer,
  	"version_client_is_anonymized" boolean DEFAULT false,
  	"version_hero_image_id" integer,
  	"version_testimonial_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__case_studies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_case_studies_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "services_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_services_blocks_hero_variant" DEFAULT 'split',
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
  
  CREATE TABLE "services_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_services_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_services_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "services_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_services_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_services_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_services_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_services_blocks_items_background" DEFAULT 'none',
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
  	"background" "enum_services_blocks_image_background" DEFAULT 'none',
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
  	"intro" varchar,
  	"layout" "enum_services_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_services_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "services_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "services_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_services_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "services_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_services_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_services_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_services_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_services_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_services_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_services_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_services_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_services_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_services_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_services_blocks_cards_collection",
  	"source" "enum_services_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_services_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_services_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_services_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_services_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_services_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_services_blocks_embed_background" DEFAULT 'none',
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
  	"background" "enum_services_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tier" "enum_services_tier" DEFAULT 'leaf',
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"icon" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"order" numeric,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"case_studies_id" integer,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_services_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__services_v_blocks_hero_variant" DEFAULT 'split',
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
  
  CREATE TABLE "_services_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__services_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__services_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__services_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__services_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__services_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__services_v_blocks_items_background" DEFAULT 'none',
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
  	"background" "enum__services_v_blocks_image_background" DEFAULT 'none',
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
  	"intro" varchar,
  	"layout" "enum__services_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__services_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__services_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__services_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__services_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__services_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__services_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__services_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__services_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__services_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__services_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__services_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__services_v_blocks_cards_collection",
  	"source" "enum__services_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__services_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__services_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__services_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__services_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__services_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__services_v_blocks_embed_background" DEFAULT 'none',
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
  	"background" "enum__services_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tier" "enum__services_v_version_tier" DEFAULT 'leaf',
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_icon" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_order" numeric,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"case_studies_id" integer,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "industries_client_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "industries_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_industries_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_industries_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_industries_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_industries_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_industries_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_industries_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_industries_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "industries_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_industries_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_industries_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_industries_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_industries_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_industries_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_industries_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_industries_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "industries_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_industries_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_industries_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "industries_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "industries_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "industries_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "industries_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_industries_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "industries_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_industries_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_industries_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_industries_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_industries_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_industries_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_industries_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_industries_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_industries_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_industries_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_industries_blocks_cards_collection",
  	"source" "enum_industries_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_industries_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_industries_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_industries_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_industries_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_industries_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_industries_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_industries_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "industries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"description" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_industries_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "industries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_industries_v_version_client_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__industries_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__industries_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__industries_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__industries_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__industries_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__industries_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__industries_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__industries_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__industries_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__industries_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__industries_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__industries_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__industries_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__industries_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__industries_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__industries_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__industries_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__industries_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__industries_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__industries_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__industries_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__industries_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__industries_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__industries_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__industries_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__industries_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__industries_v_blocks_cards_collection",
  	"source" "enum__industries_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__industries_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__industries_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__industries_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__industries_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__industries_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__industries_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__industries_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_industries_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__industries_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_industries_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "workshops_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_workshops_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_workshops_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_workshops_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_workshops_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_workshops_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_workshops_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_workshops_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "workshops_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_workshops_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_workshops_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_workshops_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_workshops_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_workshops_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_workshops_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_workshops_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "workshops_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_workshops_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_workshops_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "workshops_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "workshops_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "workshops_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "workshops_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_workshops_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "workshops_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_workshops_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_workshops_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_workshops_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_workshops_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_workshops_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_workshops_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_workshops_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_workshops_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_workshops_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_workshops_blocks_cards_collection",
  	"source" "enum_workshops_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_workshops_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_workshops_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_workshops_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_workshops_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_workshops_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_workshops_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_workshops_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "workshops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"facilitator_id" integer,
  	"testimonial_id" integer,
  	"order" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_workshops_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "workshops_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_workshops_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__workshops_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__workshops_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__workshops_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__workshops_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__workshops_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__workshops_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__workshops_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__workshops_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__workshops_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__workshops_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__workshops_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__workshops_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__workshops_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__workshops_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__workshops_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__workshops_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__workshops_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__workshops_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__workshops_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__workshops_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__workshops_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__workshops_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__workshops_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__workshops_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__workshops_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__workshops_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__workshops_v_blocks_cards_collection",
  	"source" "enum__workshops_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__workshops_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__workshops_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__workshops_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__workshops_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__workshops_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__workshops_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__workshops_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_workshops_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_facilitator_id" integer,
  	"version_testimonial_id" integer,
  	"version_order" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__workshops_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_workshops_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "team_members_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_team_members_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_team_members_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_team_members_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_team_members_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_team_members_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_team_members_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_team_members_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "team_members_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_team_members_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_team_members_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_team_members_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_team_members_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_team_members_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_team_members_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_team_members_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "team_members_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_team_members_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_team_members_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "team_members_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "team_members_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "team_members_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "team_members_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_team_members_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "team_members_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_team_members_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_team_members_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_team_members_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_team_members_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_team_members_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_team_members_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_team_members_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_team_members_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_team_members_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_team_members_blocks_cards_collection",
  	"source" "enum_team_members_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_team_members_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_team_members_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_team_members_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_team_members_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_team_members_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_team_members_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_team_members_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "team_members_expertise" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"title" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"linkedin_url" varchar,
  	"email" varchar,
  	"is_leadership" boolean DEFAULT false,
  	"order" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_team_members_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "team_members_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_team_members_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__team_members_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__team_members_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__team_members_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__team_members_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__team_members_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__team_members_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__team_members_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__team_members_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__team_members_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__team_members_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__team_members_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__team_members_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__team_members_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__team_members_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__team_members_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__team_members_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__team_members_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__team_members_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__team_members_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__team_members_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__team_members_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__team_members_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__team_members_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__team_members_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__team_members_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__team_members_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__team_members_v_blocks_cards_collection",
  	"source" "enum__team_members_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__team_members_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__team_members_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__team_members_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__team_members_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__team_members_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__team_members_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__team_members_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_team_members_v_version_expertise" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_team_members_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_role" varchar,
  	"version_photo_id" integer,
  	"version_linkedin_url" varchar,
  	"version_email" varchar,
  	"version_is_leadership" boolean DEFAULT false,
  	"version_order" numeric,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__team_members_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_team_members_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "partners_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_partners_blocks_hero_variant" DEFAULT 'split',
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
  
  CREATE TABLE "partners_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_partners_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_partners_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "partners_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_partners_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_partners_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_partners_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_partners_blocks_items_background" DEFAULT 'none',
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
  	"background" "enum_partners_blocks_image_background" DEFAULT 'none',
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
  	"intro" varchar,
  	"layout" "enum_partners_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_partners_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "partners_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "partners_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "partners_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "partners_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_partners_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "partners_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_partners_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_partners_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_partners_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_partners_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_partners_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_partners_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_partners_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_partners_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_partners_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_partners_blocks_cards_collection",
  	"source" "enum_partners_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_partners_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_partners_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_partners_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_partners_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_partners_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_partners_blocks_embed_background" DEFAULT 'none',
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
  	"background" "enum_partners_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"generate_slug" boolean DEFAULT true,
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
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_partners_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__partners_v_blocks_hero_variant" DEFAULT 'split',
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
  
  CREATE TABLE "_partners_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__partners_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__partners_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__partners_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__partners_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__partners_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__partners_v_blocks_items_background" DEFAULT 'none',
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
  	"background" "enum__partners_v_blocks_image_background" DEFAULT 'none',
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
  	"intro" varchar,
  	"layout" "enum__partners_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__partners_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__partners_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__partners_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__partners_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__partners_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__partners_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__partners_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__partners_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__partners_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__partners_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__partners_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__partners_v_blocks_cards_collection",
  	"source" "enum__partners_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__partners_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__partners_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__partners_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__partners_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__partners_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__partners_v_blocks_embed_background" DEFAULT 'none',
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
  	"background" "enum__partners_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_partners_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_generate_slug" boolean DEFAULT true,
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
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'media',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_mobile_webp_url" varchar,
  	"sizes_mobile_webp_width" numeric,
  	"sizes_mobile_webp_height" numeric,
  	"sizes_mobile_webp_mime_type" varchar,
  	"sizes_mobile_webp_filesize" numeric,
  	"sizes_mobile_webp_filename" varchar,
  	"sizes_mobile_jpeg_url" varchar,
  	"sizes_mobile_jpeg_width" numeric,
  	"sizes_mobile_jpeg_height" numeric,
  	"sizes_mobile_jpeg_mime_type" varchar,
  	"sizes_mobile_jpeg_filesize" numeric,
  	"sizes_mobile_jpeg_filename" varchar,
  	"sizes_tablet_webp_url" varchar,
  	"sizes_tablet_webp_width" numeric,
  	"sizes_tablet_webp_height" numeric,
  	"sizes_tablet_webp_mime_type" varchar,
  	"sizes_tablet_webp_filesize" numeric,
  	"sizes_tablet_webp_filename" varchar,
  	"sizes_tablet_jpeg_url" varchar,
  	"sizes_tablet_jpeg_width" numeric,
  	"sizes_tablet_jpeg_height" numeric,
  	"sizes_tablet_jpeg_mime_type" varchar,
  	"sizes_tablet_jpeg_filesize" numeric,
  	"sizes_tablet_jpeg_filename" varchar,
  	"sizes_desktop_webp_url" varchar,
  	"sizes_desktop_webp_width" numeric,
  	"sizes_desktop_webp_height" numeric,
  	"sizes_desktop_webp_mime_type" varchar,
  	"sizes_desktop_webp_filesize" numeric,
  	"sizes_desktop_webp_filename" varchar,
  	"sizes_desktop_jpeg_url" varchar,
  	"sizes_desktop_jpeg_width" numeric,
  	"sizes_desktop_jpeg_height" numeric,
  	"sizes_desktop_jpeg_mime_type" varchar,
  	"sizes_desktop_jpeg_filesize" numeric,
  	"sizes_desktop_jpeg_filename" varchar,
  	"sizes_wide_webp_url" varchar,
  	"sizes_wide_webp_width" numeric,
  	"sizes_wide_webp_height" numeric,
  	"sizes_wide_webp_mime_type" varchar,
  	"sizes_wide_webp_filesize" numeric,
  	"sizes_wide_webp_filename" varchar,
  	"sizes_wide_jpeg_url" varchar,
  	"sizes_wide_jpeg_width" numeric,
  	"sizes_wide_jpeg_height" numeric,
  	"sizes_wide_jpeg_mime_type" varchar,
  	"sizes_wide_jpeg_filesize" numeric,
  	"sizes_wide_jpeg_filename" varchar
  );
  
  CREATE TABLE "navigation_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_groups_items_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "navigation_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_navigation_groups_link_type" DEFAULT 'internal',
  	"link_url" varchar
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_navigation_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_navigation_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "navigation_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"workshops_id" integer,
  	"industries_id" integer,
  	"posts_id" integer,
  	"case_studies_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_navigation_v_version_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__navigation_v_version_groups_items_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v_version_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum__navigation_v_version_groups_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_label" varchar,
  	"version_link_type" "enum__navigation_v_version_link_type" DEFAULT 'internal',
  	"version_link_url" varchar,
  	"version_order" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__navigation_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_navigation_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"workshops_id" integer,
  	"industries_id" integer,
  	"posts_id" integer,
  	"case_studies_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"person_name" varchar NOT NULL,
  	"person_title" varchar,
  	"company" varchar,
  	"photo_id" integer,
  	"case_study_id" integer,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"description" jsonb,
  	"address_street" varchar,
  	"address_city" varchar,
  	"address_state" varchar,
  	"address_zip" varchar,
  	"has_office" boolean DEFAULT false,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_locations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_locations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_city" varchar,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"version_address_street" varchar,
  	"version_address_city" varchar,
  	"version_address_state" varchar,
  	"version_address_zip" varchar,
  	"version_has_office" boolean DEFAULT false,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__locations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"google_sub" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"case_studies_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"partners_id" integer,
  	"media_id" integer,
  	"navigation_id" integer,
  	"testimonials_id" integer,
  	"categories_id" integer,
  	"locations_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_homepage_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_homepage_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum_homepage_blocks_hero_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"width" "enum_homepage_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum_homepage_blocks_content_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_homepage_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum_homepage_blocks_media_text_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "homepage_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_homepage_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum_homepage_blocks_items_markers" DEFAULT 'none',
  	"style" "enum_homepage_blocks_items_style" DEFAULT 'plain',
  	"background" "enum_homepage_blocks_items_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_homepage_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum_homepage_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum_homepage_blocks_image_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "homepage_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum_homepage_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum_homepage_blocks_gallery_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar
  );
  
  CREATE TABLE "homepage_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "homepage_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dimension" varchar
  );
  
  CREATE TABLE "homepage_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "homepage_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum_homepage_blocks_table_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "homepage_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum_homepage_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum_homepage_blocks_accordion_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_homepage_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum_homepage_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum_homepage_blocks_quote_background" DEFAULT 'subtle',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum_homepage_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum_homepage_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum_homepage_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum_homepage_blocks_cta_background" DEFAULT 'brand',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum_homepage_blocks_cards_collection",
  	"source" "enum_homepage_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum_homepage_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum_homepage_blocks_cards_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_homepage_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum_homepage_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum_homepage_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum_homepage_blocks_embed_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum_homepage_blocks_hubspot_form_background" DEFAULT 'none',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_homepage_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__homepage_v_blocks_hero_variant" DEFAULT 'split',
  	"eyebrow" varchar,
  	"headline" varchar,
  	"subheadline" varchar,
  	"media_id" integer,
  	"video_url" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__homepage_v_blocks_hero_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"alignment" "enum__homepage_v_blocks_hero_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"width" "enum__homepage_v_blocks_content_width" DEFAULT 'standard',
  	"body" jsonb,
  	"background" "enum__homepage_v_blocks_content_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_media_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__homepage_v_blocks_media_text_media_position" DEFAULT 'left',
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"background" "enum__homepage_v_blocks_media_text_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_items_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"marker" varchar,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__homepage_v_blocks_items_layout" DEFAULT 'grid',
  	"markers" "enum__homepage_v_blocks_items_markers" DEFAULT 'none',
  	"style" "enum__homepage_v_blocks_items_style" DEFAULT 'plain',
  	"background" "enum__homepage_v_blocks_items_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__homepage_v_blocks_image_width" DEFAULT 'standard',
  	"alignment" "enum__homepage_v_blocks_image_alignment" DEFAULT 'center',
  	"background" "enum__homepage_v_blocks_image_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"layout" "enum__homepage_v_blocks_gallery_layout" DEFAULT 'grid',
  	"background" "enum__homepage_v_blocks_gallery_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"tagline" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"dimension" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_table_best_for_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"background" "enum__homepage_v_blocks_table_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_accordion_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_accordion" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"display" "enum__homepage_v_blocks_accordion_display" DEFAULT 'accordion',
  	"background" "enum__homepage_v_blocks_accordion_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__homepage_v_blocks_quote_source" DEFAULT 'testimonials',
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"layout" "enum__homepage_v_blocks_quote_layout" DEFAULT 'centered',
  	"background" "enum__homepage_v_blocks_quote_background" DEFAULT 'subtle',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"action" "enum__homepage_v_blocks_cta_action" DEFAULT 'buttons',
  	"variant" "enum__homepage_v_blocks_cta_variant" DEFAULT 'centered',
  	"primary_cta_label" varchar,
  	"primary_cta_url" varchar,
  	"primary_cta_variant" "enum__homepage_v_blocks_cta_primary_cta_variant" DEFAULT 'primary',
  	"secondary_cta_label" varchar,
  	"secondary_cta_url" varchar,
  	"meeting_url" varchar,
  	"form_id" varchar,
  	"cover_image_id" integer,
  	"file_url" varchar,
  	"background" "enum__homepage_v_blocks_cta_background" DEFAULT 'brand',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"collection" "enum__homepage_v_blocks_cards_collection",
  	"source" "enum__homepage_v_blocks_cards_source" DEFAULT 'all',
  	"industry_id" integer,
  	"service_id" integer,
  	"category_id" integer,
  	"leadership_only" boolean,
  	"service_group_id" integer,
  	"limit" numeric,
  	"display" "enum__homepage_v_blocks_cards_display" DEFAULT 'grid',
  	"background" "enum__homepage_v_blocks_cards_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__homepage_v_blocks_embed_kind" DEFAULT 'video',
  	"heading" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"provider" "enum__homepage_v_blocks_embed_provider" DEFAULT 'youtube',
  	"video_id" varchar,
  	"thumbnail_id" integer,
  	"url" varchar,
  	"caption" varchar,
  	"height" "enum__homepage_v_blocks_embed_height" DEFAULT 'medium',
  	"background" "enum__homepage_v_blocks_embed_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hubspot_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"form_id" varchar,
  	"background" "enum__homepage_v_blocks_hubspot_form_background" DEFAULT 'none',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer,
  	"case_studies_id" integer,
  	"posts_id" integer,
  	"services_id" integer,
  	"industries_id" integer,
  	"workshops_id" integer,
  	"team_members_id" integer,
  	"locations_id" integer,
  	"partners_id" integer
  );
  
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_text" ADD CONSTRAINT "pages_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_text" ADD CONSTRAINT "pages_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_items_items" ADD CONSTRAINT "pages_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_items_items" ADD CONSTRAINT "pages_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_items" ADD CONSTRAINT "pages_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_items" ADD CONSTRAINT "pages_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery_items" ADD CONSTRAINT "pages_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_columns" ADD CONSTRAINT "pages_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_rows_cells" ADD CONSTRAINT "pages_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_rows" ADD CONSTRAINT "pages_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table_best_for_row" ADD CONSTRAINT "pages_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_table" ADD CONSTRAINT "pages_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_accordion_items" ADD CONSTRAINT "pages_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_accordion" ADD CONSTRAINT "pages_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_quote" ADD CONSTRAINT "pages_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_embed" ADD CONSTRAINT "pages_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_embed" ADD CONSTRAINT "pages_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hubspot_form" ADD CONSTRAINT "pages_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_text" ADD CONSTRAINT "_pages_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_text" ADD CONSTRAINT "_pages_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_items_items" ADD CONSTRAINT "_pages_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_items_items" ADD CONSTRAINT "_pages_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_items" ADD CONSTRAINT "_pages_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_items" ADD CONSTRAINT "_pages_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery_items" ADD CONSTRAINT "_pages_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_columns" ADD CONSTRAINT "_pages_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_rows_cells" ADD CONSTRAINT "_pages_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_rows" ADD CONSTRAINT "_pages_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table_best_for_row" ADD CONSTRAINT "_pages_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_table" ADD CONSTRAINT "_pages_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_accordion_items" ADD CONSTRAINT "_pages_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_accordion" ADD CONSTRAINT "_pages_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_quote" ADD CONSTRAINT "_pages_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_embed" ADD CONSTRAINT "_pages_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_embed" ADD CONSTRAINT "_pages_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hubspot_form" ADD CONSTRAINT "_pages_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_team_members_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_hero" ADD CONSTRAINT "case_studies_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_hero" ADD CONSTRAINT "case_studies_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_content" ADD CONSTRAINT "case_studies_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_media_text" ADD CONSTRAINT "case_studies_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_media_text" ADD CONSTRAINT "case_studies_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_items_items" ADD CONSTRAINT "case_studies_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_items_items" ADD CONSTRAINT "case_studies_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_items" ADD CONSTRAINT "case_studies_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_image" ADD CONSTRAINT "case_studies_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_image" ADD CONSTRAINT "case_studies_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_gallery_items" ADD CONSTRAINT "case_studies_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_gallery_items" ADD CONSTRAINT "case_studies_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_gallery" ADD CONSTRAINT "case_studies_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_table_columns" ADD CONSTRAINT "case_studies_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_table_rows_cells" ADD CONSTRAINT "case_studies_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_table_rows" ADD CONSTRAINT "case_studies_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_table_best_for_row" ADD CONSTRAINT "case_studies_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_table" ADD CONSTRAINT "case_studies_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_accordion_items" ADD CONSTRAINT "case_studies_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_accordion" ADD CONSTRAINT "case_studies_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_quote" ADD CONSTRAINT "case_studies_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cta" ADD CONSTRAINT "case_studies_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cta" ADD CONSTRAINT "case_studies_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cards" ADD CONSTRAINT "case_studies_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cards" ADD CONSTRAINT "case_studies_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cards" ADD CONSTRAINT "case_studies_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cards" ADD CONSTRAINT "case_studies_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_cards" ADD CONSTRAINT "case_studies_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_embed" ADD CONSTRAINT "case_studies_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_embed" ADD CONSTRAINT "case_studies_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_blocks_hubspot_form" ADD CONSTRAINT "case_studies_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_client_logo_id_media_id_fk" FOREIGN KEY ("client_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies_rels" ADD CONSTRAINT "case_studies_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_hero" ADD CONSTRAINT "_case_studies_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_hero" ADD CONSTRAINT "_case_studies_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_content" ADD CONSTRAINT "_case_studies_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_media_text" ADD CONSTRAINT "_case_studies_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_media_text" ADD CONSTRAINT "_case_studies_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_items_items" ADD CONSTRAINT "_case_studies_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_items_items" ADD CONSTRAINT "_case_studies_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_items" ADD CONSTRAINT "_case_studies_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_image" ADD CONSTRAINT "_case_studies_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_image" ADD CONSTRAINT "_case_studies_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_gallery_items" ADD CONSTRAINT "_case_studies_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_gallery_items" ADD CONSTRAINT "_case_studies_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_gallery" ADD CONSTRAINT "_case_studies_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_table_columns" ADD CONSTRAINT "_case_studies_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_table_rows_cells" ADD CONSTRAINT "_case_studies_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_table_rows" ADD CONSTRAINT "_case_studies_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_table_best_for_row" ADD CONSTRAINT "_case_studies_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_table" ADD CONSTRAINT "_case_studies_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_accordion_items" ADD CONSTRAINT "_case_studies_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_accordion" ADD CONSTRAINT "_case_studies_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_quote" ADD CONSTRAINT "_case_studies_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cta" ADD CONSTRAINT "_case_studies_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cta" ADD CONSTRAINT "_case_studies_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cards" ADD CONSTRAINT "_case_studies_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cards" ADD CONSTRAINT "_case_studies_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cards" ADD CONSTRAINT "_case_studies_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cards" ADD CONSTRAINT "_case_studies_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_cards" ADD CONSTRAINT "_case_studies_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_embed" ADD CONSTRAINT "_case_studies_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_embed" ADD CONSTRAINT "_case_studies_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_blocks_hubspot_form" ADD CONSTRAINT "_case_studies_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_industry_id_industries_id_fk" FOREIGN KEY ("version_industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_client_logo_id_media_id_fk" FOREIGN KEY ("version_client_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_testimonial_id_testimonials_id_fk" FOREIGN KEY ("version_testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v_rels" ADD CONSTRAINT "_case_studies_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_content" ADD CONSTRAINT "services_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_media_text" ADD CONSTRAINT "services_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_media_text" ADD CONSTRAINT "services_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_items_items" ADD CONSTRAINT "services_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_items_items" ADD CONSTRAINT "services_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_items" ADD CONSTRAINT "services_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_image" ADD CONSTRAINT "services_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_image" ADD CONSTRAINT "services_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery_items" ADD CONSTRAINT "services_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery_items" ADD CONSTRAINT "services_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_gallery" ADD CONSTRAINT "services_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_table_columns" ADD CONSTRAINT "services_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_table_rows_cells" ADD CONSTRAINT "services_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_table_rows" ADD CONSTRAINT "services_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_table_best_for_row" ADD CONSTRAINT "services_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_table" ADD CONSTRAINT "services_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_accordion_items" ADD CONSTRAINT "services_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_accordion" ADD CONSTRAINT "services_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_quote" ADD CONSTRAINT "services_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_cta" ADD CONSTRAINT "services_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cta" ADD CONSTRAINT "services_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_cards" ADD CONSTRAINT "services_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cards" ADD CONSTRAINT "services_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cards" ADD CONSTRAINT "services_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cards" ADD CONSTRAINT "services_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_cards" ADD CONSTRAINT "services_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_embed" ADD CONSTRAINT "services_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_embed" ADD CONSTRAINT "services_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hubspot_form" ADD CONSTRAINT "services_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_content" ADD CONSTRAINT "_services_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_text" ADD CONSTRAINT "_services_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_text" ADD CONSTRAINT "_services_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_items_items" ADD CONSTRAINT "_services_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_items_items" ADD CONSTRAINT "_services_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_items" ADD CONSTRAINT "_services_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_image" ADD CONSTRAINT "_services_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_image" ADD CONSTRAINT "_services_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery_items" ADD CONSTRAINT "_services_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery_items" ADD CONSTRAINT "_services_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_gallery" ADD CONSTRAINT "_services_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_table_columns" ADD CONSTRAINT "_services_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_table_rows_cells" ADD CONSTRAINT "_services_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_table_rows" ADD CONSTRAINT "_services_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_table_best_for_row" ADD CONSTRAINT "_services_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_table" ADD CONSTRAINT "_services_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_accordion_items" ADD CONSTRAINT "_services_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_accordion" ADD CONSTRAINT "_services_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_quote" ADD CONSTRAINT "_services_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta" ADD CONSTRAINT "_services_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta" ADD CONSTRAINT "_services_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cards" ADD CONSTRAINT "_services_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cards" ADD CONSTRAINT "_services_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cards" ADD CONSTRAINT "_services_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cards" ADD CONSTRAINT "_services_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cards" ADD CONSTRAINT "_services_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_embed" ADD CONSTRAINT "_services_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_embed" ADD CONSTRAINT "_services_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hubspot_form" ADD CONSTRAINT "_services_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_client_logos" ADD CONSTRAINT "industries_client_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_client_logos" ADD CONSTRAINT "industries_client_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_hero" ADD CONSTRAINT "industries_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_hero" ADD CONSTRAINT "industries_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_content" ADD CONSTRAINT "industries_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_media_text" ADD CONSTRAINT "industries_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_media_text" ADD CONSTRAINT "industries_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_items_items" ADD CONSTRAINT "industries_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_items_items" ADD CONSTRAINT "industries_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_items" ADD CONSTRAINT "industries_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_image" ADD CONSTRAINT "industries_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_image" ADD CONSTRAINT "industries_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_gallery_items" ADD CONSTRAINT "industries_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_gallery_items" ADD CONSTRAINT "industries_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_gallery" ADD CONSTRAINT "industries_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_table_columns" ADD CONSTRAINT "industries_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_table_rows_cells" ADD CONSTRAINT "industries_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_table_rows" ADD CONSTRAINT "industries_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_table_best_for_row" ADD CONSTRAINT "industries_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_table" ADD CONSTRAINT "industries_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_accordion_items" ADD CONSTRAINT "industries_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_accordion" ADD CONSTRAINT "industries_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_quote" ADD CONSTRAINT "industries_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_cta" ADD CONSTRAINT "industries_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_cta" ADD CONSTRAINT "industries_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_cards" ADD CONSTRAINT "industries_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_cards" ADD CONSTRAINT "industries_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_cards" ADD CONSTRAINT "industries_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_cards" ADD CONSTRAINT "industries_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_cards" ADD CONSTRAINT "industries_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_embed" ADD CONSTRAINT "industries_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_blocks_embed" ADD CONSTRAINT "industries_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_blocks_hubspot_form" ADD CONSTRAINT "industries_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries" ADD CONSTRAINT "industries_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_rels" ADD CONSTRAINT "industries_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_version_client_logos" ADD CONSTRAINT "_industries_v_version_client_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_version_client_logos" ADD CONSTRAINT "_industries_v_version_client_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_hero" ADD CONSTRAINT "_industries_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_hero" ADD CONSTRAINT "_industries_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_content" ADD CONSTRAINT "_industries_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_media_text" ADD CONSTRAINT "_industries_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_media_text" ADD CONSTRAINT "_industries_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_items_items" ADD CONSTRAINT "_industries_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_items_items" ADD CONSTRAINT "_industries_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_items" ADD CONSTRAINT "_industries_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_image" ADD CONSTRAINT "_industries_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_image" ADD CONSTRAINT "_industries_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_gallery_items" ADD CONSTRAINT "_industries_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_gallery_items" ADD CONSTRAINT "_industries_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_gallery" ADD CONSTRAINT "_industries_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_table_columns" ADD CONSTRAINT "_industries_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_table_rows_cells" ADD CONSTRAINT "_industries_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_table_rows" ADD CONSTRAINT "_industries_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_table_best_for_row" ADD CONSTRAINT "_industries_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_table" ADD CONSTRAINT "_industries_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_accordion_items" ADD CONSTRAINT "_industries_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_accordion" ADD CONSTRAINT "_industries_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_quote" ADD CONSTRAINT "_industries_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cta" ADD CONSTRAINT "_industries_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cta" ADD CONSTRAINT "_industries_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cards" ADD CONSTRAINT "_industries_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cards" ADD CONSTRAINT "_industries_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cards" ADD CONSTRAINT "_industries_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cards" ADD CONSTRAINT "_industries_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_cards" ADD CONSTRAINT "_industries_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_embed" ADD CONSTRAINT "_industries_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_embed" ADD CONSTRAINT "_industries_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_blocks_hubspot_form" ADD CONSTRAINT "_industries_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v" ADD CONSTRAINT "_industries_v_parent_id_industries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v" ADD CONSTRAINT "_industries_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_industries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_industries_v_rels" ADD CONSTRAINT "_industries_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_hero" ADD CONSTRAINT "workshops_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_hero" ADD CONSTRAINT "workshops_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_content" ADD CONSTRAINT "workshops_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_media_text" ADD CONSTRAINT "workshops_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_media_text" ADD CONSTRAINT "workshops_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_items_items" ADD CONSTRAINT "workshops_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_items_items" ADD CONSTRAINT "workshops_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_items" ADD CONSTRAINT "workshops_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_image" ADD CONSTRAINT "workshops_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_image" ADD CONSTRAINT "workshops_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_gallery_items" ADD CONSTRAINT "workshops_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_gallery_items" ADD CONSTRAINT "workshops_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_gallery" ADD CONSTRAINT "workshops_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_table_columns" ADD CONSTRAINT "workshops_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_table_rows_cells" ADD CONSTRAINT "workshops_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_table_rows" ADD CONSTRAINT "workshops_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_table_best_for_row" ADD CONSTRAINT "workshops_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_table" ADD CONSTRAINT "workshops_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_accordion_items" ADD CONSTRAINT "workshops_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_accordion" ADD CONSTRAINT "workshops_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_quote" ADD CONSTRAINT "workshops_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cta" ADD CONSTRAINT "workshops_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cta" ADD CONSTRAINT "workshops_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cards" ADD CONSTRAINT "workshops_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cards" ADD CONSTRAINT "workshops_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cards" ADD CONSTRAINT "workshops_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cards" ADD CONSTRAINT "workshops_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_cards" ADD CONSTRAINT "workshops_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_embed" ADD CONSTRAINT "workshops_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_blocks_embed" ADD CONSTRAINT "workshops_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_blocks_hubspot_form" ADD CONSTRAINT "workshops_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_facilitator_id_team_members_id_fk" FOREIGN KEY ("facilitator_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_testimonial_id_testimonials_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_hero" ADD CONSTRAINT "_workshops_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_hero" ADD CONSTRAINT "_workshops_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_content" ADD CONSTRAINT "_workshops_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_media_text" ADD CONSTRAINT "_workshops_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_media_text" ADD CONSTRAINT "_workshops_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_items_items" ADD CONSTRAINT "_workshops_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_items_items" ADD CONSTRAINT "_workshops_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_items" ADD CONSTRAINT "_workshops_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_image" ADD CONSTRAINT "_workshops_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_image" ADD CONSTRAINT "_workshops_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_gallery_items" ADD CONSTRAINT "_workshops_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_gallery_items" ADD CONSTRAINT "_workshops_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_gallery" ADD CONSTRAINT "_workshops_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_table_columns" ADD CONSTRAINT "_workshops_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_table_rows_cells" ADD CONSTRAINT "_workshops_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_table_rows" ADD CONSTRAINT "_workshops_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_table_best_for_row" ADD CONSTRAINT "_workshops_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_table" ADD CONSTRAINT "_workshops_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_accordion_items" ADD CONSTRAINT "_workshops_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_accordion" ADD CONSTRAINT "_workshops_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_quote" ADD CONSTRAINT "_workshops_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cta" ADD CONSTRAINT "_workshops_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cta" ADD CONSTRAINT "_workshops_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cards" ADD CONSTRAINT "_workshops_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cards" ADD CONSTRAINT "_workshops_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cards" ADD CONSTRAINT "_workshops_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cards" ADD CONSTRAINT "_workshops_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_cards" ADD CONSTRAINT "_workshops_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_embed" ADD CONSTRAINT "_workshops_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_embed" ADD CONSTRAINT "_workshops_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_blocks_hubspot_form" ADD CONSTRAINT "_workshops_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_parent_id_workshops_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_version_facilitator_id_team_members_id_fk" FOREIGN KEY ("version_facilitator_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_version_testimonial_id_testimonials_id_fk" FOREIGN KEY ("version_testimonial_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_hero" ADD CONSTRAINT "team_members_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_hero" ADD CONSTRAINT "team_members_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_content" ADD CONSTRAINT "team_members_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_media_text" ADD CONSTRAINT "team_members_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_media_text" ADD CONSTRAINT "team_members_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_items_items" ADD CONSTRAINT "team_members_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_items_items" ADD CONSTRAINT "team_members_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_items" ADD CONSTRAINT "team_members_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_image" ADD CONSTRAINT "team_members_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_image" ADD CONSTRAINT "team_members_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_gallery_items" ADD CONSTRAINT "team_members_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_gallery_items" ADD CONSTRAINT "team_members_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_gallery" ADD CONSTRAINT "team_members_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_table_columns" ADD CONSTRAINT "team_members_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_table_rows_cells" ADD CONSTRAINT "team_members_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_table_rows" ADD CONSTRAINT "team_members_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_table_best_for_row" ADD CONSTRAINT "team_members_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_table" ADD CONSTRAINT "team_members_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_accordion_items" ADD CONSTRAINT "team_members_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_accordion" ADD CONSTRAINT "team_members_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_quote" ADD CONSTRAINT "team_members_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cta" ADD CONSTRAINT "team_members_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cta" ADD CONSTRAINT "team_members_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cards" ADD CONSTRAINT "team_members_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cards" ADD CONSTRAINT "team_members_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cards" ADD CONSTRAINT "team_members_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cards" ADD CONSTRAINT "team_members_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_cards" ADD CONSTRAINT "team_members_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_embed" ADD CONSTRAINT "team_members_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_blocks_embed" ADD CONSTRAINT "team_members_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_blocks_hubspot_form" ADD CONSTRAINT "team_members_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_expertise" ADD CONSTRAINT "team_members_expertise_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members_rels" ADD CONSTRAINT "team_members_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_hero" ADD CONSTRAINT "_team_members_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_hero" ADD CONSTRAINT "_team_members_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_content" ADD CONSTRAINT "_team_members_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_media_text" ADD CONSTRAINT "_team_members_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_media_text" ADD CONSTRAINT "_team_members_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_items_items" ADD CONSTRAINT "_team_members_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_items_items" ADD CONSTRAINT "_team_members_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_items" ADD CONSTRAINT "_team_members_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_image" ADD CONSTRAINT "_team_members_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_image" ADD CONSTRAINT "_team_members_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_gallery_items" ADD CONSTRAINT "_team_members_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_gallery_items" ADD CONSTRAINT "_team_members_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_gallery" ADD CONSTRAINT "_team_members_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_table_columns" ADD CONSTRAINT "_team_members_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_table_rows_cells" ADD CONSTRAINT "_team_members_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_table_rows" ADD CONSTRAINT "_team_members_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_table_best_for_row" ADD CONSTRAINT "_team_members_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_table" ADD CONSTRAINT "_team_members_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_accordion_items" ADD CONSTRAINT "_team_members_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_accordion" ADD CONSTRAINT "_team_members_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_quote" ADD CONSTRAINT "_team_members_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cta" ADD CONSTRAINT "_team_members_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cta" ADD CONSTRAINT "_team_members_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cards" ADD CONSTRAINT "_team_members_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cards" ADD CONSTRAINT "_team_members_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cards" ADD CONSTRAINT "_team_members_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cards" ADD CONSTRAINT "_team_members_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_cards" ADD CONSTRAINT "_team_members_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_embed" ADD CONSTRAINT "_team_members_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_embed" ADD CONSTRAINT "_team_members_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_blocks_hubspot_form" ADD CONSTRAINT "_team_members_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_version_expertise" ADD CONSTRAINT "_team_members_v_version_expertise_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_parent_id_team_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_team_members_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_team_members_v_rels" ADD CONSTRAINT "_team_members_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_hero" ADD CONSTRAINT "partners_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_hero" ADD CONSTRAINT "partners_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_content" ADD CONSTRAINT "partners_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_media_text" ADD CONSTRAINT "partners_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_media_text" ADD CONSTRAINT "partners_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_items_items" ADD CONSTRAINT "partners_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_items_items" ADD CONSTRAINT "partners_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_items" ADD CONSTRAINT "partners_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_image" ADD CONSTRAINT "partners_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_image" ADD CONSTRAINT "partners_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery_items" ADD CONSTRAINT "partners_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery_items" ADD CONSTRAINT "partners_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_gallery" ADD CONSTRAINT "partners_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_table_columns" ADD CONSTRAINT "partners_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_table_rows_cells" ADD CONSTRAINT "partners_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_table_rows" ADD CONSTRAINT "partners_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_table_best_for_row" ADD CONSTRAINT "partners_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_table" ADD CONSTRAINT "partners_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_accordion_items" ADD CONSTRAINT "partners_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_accordion" ADD CONSTRAINT "partners_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_quote" ADD CONSTRAINT "partners_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_cta" ADD CONSTRAINT "partners_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cta" ADD CONSTRAINT "partners_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_cards" ADD CONSTRAINT "partners_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cards" ADD CONSTRAINT "partners_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cards" ADD CONSTRAINT "partners_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cards" ADD CONSTRAINT "partners_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_cards" ADD CONSTRAINT "partners_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_embed" ADD CONSTRAINT "partners_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_blocks_embed" ADD CONSTRAINT "partners_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_blocks_hubspot_form" ADD CONSTRAINT "partners_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hero" ADD CONSTRAINT "_partners_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hero" ADD CONSTRAINT "_partners_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_content" ADD CONSTRAINT "_partners_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_media_text" ADD CONSTRAINT "_partners_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_media_text" ADD CONSTRAINT "_partners_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_items_items" ADD CONSTRAINT "_partners_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_items_items" ADD CONSTRAINT "_partners_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_items" ADD CONSTRAINT "_partners_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_image" ADD CONSTRAINT "_partners_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_image" ADD CONSTRAINT "_partners_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery_items" ADD CONSTRAINT "_partners_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery_items" ADD CONSTRAINT "_partners_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_gallery" ADD CONSTRAINT "_partners_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_table_columns" ADD CONSTRAINT "_partners_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_table_rows_cells" ADD CONSTRAINT "_partners_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_table_rows" ADD CONSTRAINT "_partners_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_table_best_for_row" ADD CONSTRAINT "_partners_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_table" ADD CONSTRAINT "_partners_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_accordion_items" ADD CONSTRAINT "_partners_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_accordion" ADD CONSTRAINT "_partners_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_quote" ADD CONSTRAINT "_partners_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cta" ADD CONSTRAINT "_partners_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cta" ADD CONSTRAINT "_partners_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cards" ADD CONSTRAINT "_partners_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cards" ADD CONSTRAINT "_partners_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cards" ADD CONSTRAINT "_partners_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cards" ADD CONSTRAINT "_partners_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_cards" ADD CONSTRAINT "_partners_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_embed" ADD CONSTRAINT "_partners_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_embed" ADD CONSTRAINT "_partners_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_blocks_hubspot_form" ADD CONSTRAINT "_partners_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_parent_id_partners_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v" ADD CONSTRAINT "_partners_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_partners_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_partners_v_rels" ADD CONSTRAINT "_partners_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_groups_items" ADD CONSTRAINT "navigation_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_groups" ADD CONSTRAINT "navigation_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_groups_items" ADD CONSTRAINT "_navigation_v_version_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v_version_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_version_groups" ADD CONSTRAINT "_navigation_v_version_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v" ADD CONSTRAINT "_navigation_v_parent_id_navigation_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_navigation_v_rels" ADD CONSTRAINT "_navigation_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations" ADD CONSTRAINT "locations_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_locations_v" ADD CONSTRAINT "_locations_v_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_locations_v" ADD CONSTRAINT "_locations_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_navigation_fk" FOREIGN KEY ("navigation_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content" ADD CONSTRAINT "homepage_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_media_text" ADD CONSTRAINT "homepage_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_media_text" ADD CONSTRAINT "homepage_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_items_items" ADD CONSTRAINT "homepage_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_items_items" ADD CONSTRAINT "homepage_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_items" ADD CONSTRAINT "homepage_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_image" ADD CONSTRAINT "homepage_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_image" ADD CONSTRAINT "homepage_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_gallery_items" ADD CONSTRAINT "homepage_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_gallery_items" ADD CONSTRAINT "homepage_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_gallery" ADD CONSTRAINT "homepage_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_table_columns" ADD CONSTRAINT "homepage_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_table_rows_cells" ADD CONSTRAINT "homepage_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_table_rows" ADD CONSTRAINT "homepage_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_table_best_for_row" ADD CONSTRAINT "homepage_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_table" ADD CONSTRAINT "homepage_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_accordion_items" ADD CONSTRAINT "homepage_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_accordion" ADD CONSTRAINT "homepage_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_quote" ADD CONSTRAINT "homepage_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta" ADD CONSTRAINT "homepage_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta" ADD CONSTRAINT "homepage_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cards" ADD CONSTRAINT "homepage_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cards" ADD CONSTRAINT "homepage_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cards" ADD CONSTRAINT "homepage_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cards" ADD CONSTRAINT "homepage_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cards" ADD CONSTRAINT "homepage_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_embed" ADD CONSTRAINT "homepage_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_embed" ADD CONSTRAINT "homepage_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hubspot_form" ADD CONSTRAINT "homepage_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_content" ADD CONSTRAINT "_homepage_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_media_text" ADD CONSTRAINT "_homepage_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_media_text" ADD CONSTRAINT "_homepage_v_blocks_media_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_items_items" ADD CONSTRAINT "_homepage_v_blocks_items_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_items_items" ADD CONSTRAINT "_homepage_v_blocks_items_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_items" ADD CONSTRAINT "_homepage_v_blocks_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_image" ADD CONSTRAINT "_homepage_v_blocks_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_image" ADD CONSTRAINT "_homepage_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_gallery_items" ADD CONSTRAINT "_homepage_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_gallery_items" ADD CONSTRAINT "_homepage_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_gallery" ADD CONSTRAINT "_homepage_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_table_columns" ADD CONSTRAINT "_homepage_v_blocks_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_table_rows_cells" ADD CONSTRAINT "_homepage_v_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_table_rows" ADD CONSTRAINT "_homepage_v_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_table_best_for_row" ADD CONSTRAINT "_homepage_v_blocks_table_best_for_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_table" ADD CONSTRAINT "_homepage_v_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_accordion_items" ADD CONSTRAINT "_homepage_v_blocks_accordion_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_accordion"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_accordion" ADD CONSTRAINT "_homepage_v_blocks_accordion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_quote" ADD CONSTRAINT "_homepage_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta" ADD CONSTRAINT "_homepage_v_blocks_cta_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cta" ADD CONSTRAINT "_homepage_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cards" ADD CONSTRAINT "_homepage_v_blocks_cards_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cards" ADD CONSTRAINT "_homepage_v_blocks_cards_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cards" ADD CONSTRAINT "_homepage_v_blocks_cards_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cards" ADD CONSTRAINT "_homepage_v_blocks_cards_service_group_id_services_id_fk" FOREIGN KEY ("service_group_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_cards" ADD CONSTRAINT "_homepage_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_embed" ADD CONSTRAINT "_homepage_v_blocks_embed_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_embed" ADD CONSTRAINT "_homepage_v_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hubspot_form" ADD CONSTRAINT "_homepage_v_blocks_hubspot_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_media_idx" ON "pages_blocks_hero" USING btree ("media_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_text_order_idx" ON "pages_blocks_media_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_text_parent_id_idx" ON "pages_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_text_path_idx" ON "pages_blocks_media_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_text_media_idx" ON "pages_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "pages_blocks_items_items_order_idx" ON "pages_blocks_items_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_items_items_parent_id_idx" ON "pages_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_items_items_image_idx" ON "pages_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_items_order_idx" ON "pages_blocks_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_items_parent_id_idx" ON "pages_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_items_path_idx" ON "pages_blocks_items" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_order_idx" ON "pages_blocks_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_parent_id_idx" ON "pages_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_path_idx" ON "pages_blocks_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_image_idx" ON "pages_blocks_image" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_items_order_idx" ON "pages_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_items_parent_id_idx" ON "pages_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_items_image_idx" ON "pages_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_table_columns_order_idx" ON "pages_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_columns_parent_id_idx" ON "pages_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_rows_cells_order_idx" ON "pages_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_rows_cells_parent_id_idx" ON "pages_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_rows_order_idx" ON "pages_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_rows_parent_id_idx" ON "pages_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_best_for_row_order_idx" ON "pages_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_best_for_row_parent_id_idx" ON "pages_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_order_idx" ON "pages_blocks_table" USING btree ("_order");
  CREATE INDEX "pages_blocks_table_parent_id_idx" ON "pages_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_table_path_idx" ON "pages_blocks_table" USING btree ("_path");
  CREATE INDEX "pages_blocks_accordion_items_order_idx" ON "pages_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_accordion_items_parent_id_idx" ON "pages_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_accordion_order_idx" ON "pages_blocks_accordion" USING btree ("_order");
  CREATE INDEX "pages_blocks_accordion_parent_id_idx" ON "pages_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_accordion_path_idx" ON "pages_blocks_accordion" USING btree ("_path");
  CREATE INDEX "pages_blocks_quote_order_idx" ON "pages_blocks_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_quote_parent_id_idx" ON "pages_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_quote_path_idx" ON "pages_blocks_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_cover_image_idx" ON "pages_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "pages_blocks_cards_order_idx" ON "pages_blocks_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_parent_id_idx" ON "pages_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_path_idx" ON "pages_blocks_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_cards_industry_idx" ON "pages_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "pages_blocks_cards_service_idx" ON "pages_blocks_cards" USING btree ("service_id");
  CREATE INDEX "pages_blocks_cards_category_idx" ON "pages_blocks_cards" USING btree ("category_id");
  CREATE INDEX "pages_blocks_cards_service_group_idx" ON "pages_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "pages_blocks_embed_order_idx" ON "pages_blocks_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_embed_parent_id_idx" ON "pages_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_embed_path_idx" ON "pages_blocks_embed" USING btree ("_path");
  CREATE INDEX "pages_blocks_embed_thumbnail_idx" ON "pages_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "pages_blocks_hubspot_form_order_idx" ON "pages_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_hubspot_form_parent_id_idx" ON "pages_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hubspot_form_path_idx" ON "pages_blocks_hubspot_form" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_testimonials_id_idx" ON "pages_rels" USING btree ("testimonials_id");
  CREATE INDEX "pages_rels_case_studies_id_idx" ON "pages_rels" USING btree ("case_studies_id");
  CREATE INDEX "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id");
  CREATE INDEX "pages_rels_services_id_idx" ON "pages_rels" USING btree ("services_id");
  CREATE INDEX "pages_rels_industries_id_idx" ON "pages_rels" USING btree ("industries_id");
  CREATE INDEX "pages_rels_workshops_id_idx" ON "pages_rels" USING btree ("workshops_id");
  CREATE INDEX "pages_rels_team_members_id_idx" ON "pages_rels" USING btree ("team_members_id");
  CREATE INDEX "pages_rels_locations_id_idx" ON "pages_rels" USING btree ("locations_id");
  CREATE INDEX "pages_rels_partners_id_idx" ON "pages_rels" USING btree ("partners_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_media_idx" ON "_pages_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_text_order_idx" ON "_pages_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_text_parent_id_idx" ON "_pages_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_text_path_idx" ON "_pages_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_text_media_idx" ON "_pages_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_items_items_order_idx" ON "_pages_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_items_items_parent_id_idx" ON "_pages_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_items_items_image_idx" ON "_pages_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_items_order_idx" ON "_pages_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_items_parent_id_idx" ON "_pages_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_items_path_idx" ON "_pages_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_order_idx" ON "_pages_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_parent_id_idx" ON "_pages_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_path_idx" ON "_pages_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_image_idx" ON "_pages_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_gallery_items_order_idx" ON "_pages_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_items_parent_id_idx" ON "_pages_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_items_image_idx" ON "_pages_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_table_columns_order_idx" ON "_pages_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_columns_parent_id_idx" ON "_pages_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_rows_cells_order_idx" ON "_pages_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_rows_cells_parent_id_idx" ON "_pages_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_rows_order_idx" ON "_pages_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_rows_parent_id_idx" ON "_pages_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_best_for_row_order_idx" ON "_pages_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_best_for_row_parent_id_idx" ON "_pages_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_order_idx" ON "_pages_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_table_parent_id_idx" ON "_pages_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_table_path_idx" ON "_pages_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_accordion_items_order_idx" ON "_pages_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_accordion_items_parent_id_idx" ON "_pages_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_accordion_order_idx" ON "_pages_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_accordion_parent_id_idx" ON "_pages_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_accordion_path_idx" ON "_pages_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_quote_order_idx" ON "_pages_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_quote_parent_id_idx" ON "_pages_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_quote_path_idx" ON "_pages_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_cover_image_idx" ON "_pages_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_pages_v_blocks_cards_order_idx" ON "_pages_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_parent_id_idx" ON "_pages_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_path_idx" ON "_pages_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cards_industry_idx" ON "_pages_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_pages_v_blocks_cards_service_idx" ON "_pages_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_pages_v_blocks_cards_category_idx" ON "_pages_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_cards_service_group_idx" ON "_pages_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_pages_v_blocks_embed_order_idx" ON "_pages_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_embed_parent_id_idx" ON "_pages_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_embed_path_idx" ON "_pages_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_embed_thumbnail_idx" ON "_pages_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_pages_v_blocks_hubspot_form_order_idx" ON "_pages_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hubspot_form_parent_id_idx" ON "_pages_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hubspot_form_path_idx" ON "_pages_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_testimonials_id_idx" ON "_pages_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_pages_v_rels_case_studies_id_idx" ON "_pages_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_pages_v_rels_posts_id_idx" ON "_pages_v_rels" USING btree ("posts_id");
  CREATE INDEX "_pages_v_rels_services_id_idx" ON "_pages_v_rels" USING btree ("services_id");
  CREATE INDEX "_pages_v_rels_industries_id_idx" ON "_pages_v_rels" USING btree ("industries_id");
  CREATE INDEX "_pages_v_rels_workshops_id_idx" ON "_pages_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_pages_v_rels_team_members_id_idx" ON "_pages_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_pages_v_rels_locations_id_idx" ON "_pages_v_rels" USING btree ("locations_id");
  CREATE INDEX "_pages_v_rels_partners_id_idx" ON "_pages_v_rels" USING btree ("partners_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_featured_image_idx" ON "posts" USING btree ("featured_image_id");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_seo_seo_og_image_idx" ON "posts" USING btree ("seo_og_image_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE INDEX "posts_rels_services_id_idx" ON "posts_rels" USING btree ("services_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_featured_image_idx" ON "_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_posts_v_version_seo_version_seo_og_image_idx" ON "_posts_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_categories_id_idx" ON "_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX "_posts_v_rels_services_id_idx" ON "_posts_v_rels" USING btree ("services_id");
  CREATE INDEX "case_studies_blocks_hero_order_idx" ON "case_studies_blocks_hero" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_hero_parent_id_idx" ON "case_studies_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_hero_path_idx" ON "case_studies_blocks_hero" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_hero_media_idx" ON "case_studies_blocks_hero" USING btree ("media_id");
  CREATE INDEX "case_studies_blocks_content_order_idx" ON "case_studies_blocks_content" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_content_parent_id_idx" ON "case_studies_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_content_path_idx" ON "case_studies_blocks_content" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_media_text_order_idx" ON "case_studies_blocks_media_text" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_media_text_parent_id_idx" ON "case_studies_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_media_text_path_idx" ON "case_studies_blocks_media_text" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_media_text_media_idx" ON "case_studies_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "case_studies_blocks_items_items_order_idx" ON "case_studies_blocks_items_items" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_items_items_parent_id_idx" ON "case_studies_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_items_items_image_idx" ON "case_studies_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "case_studies_blocks_items_order_idx" ON "case_studies_blocks_items" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_items_parent_id_idx" ON "case_studies_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_items_path_idx" ON "case_studies_blocks_items" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_image_order_idx" ON "case_studies_blocks_image" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_image_parent_id_idx" ON "case_studies_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_image_path_idx" ON "case_studies_blocks_image" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_image_image_idx" ON "case_studies_blocks_image" USING btree ("image_id");
  CREATE INDEX "case_studies_blocks_gallery_items_order_idx" ON "case_studies_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_gallery_items_parent_id_idx" ON "case_studies_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_gallery_items_image_idx" ON "case_studies_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "case_studies_blocks_gallery_order_idx" ON "case_studies_blocks_gallery" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_gallery_parent_id_idx" ON "case_studies_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_gallery_path_idx" ON "case_studies_blocks_gallery" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_table_columns_order_idx" ON "case_studies_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_table_columns_parent_id_idx" ON "case_studies_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_table_rows_cells_order_idx" ON "case_studies_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_table_rows_cells_parent_id_idx" ON "case_studies_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_table_rows_order_idx" ON "case_studies_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_table_rows_parent_id_idx" ON "case_studies_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_table_best_for_row_order_idx" ON "case_studies_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_table_best_for_row_parent_id_idx" ON "case_studies_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_table_order_idx" ON "case_studies_blocks_table" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_table_parent_id_idx" ON "case_studies_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_table_path_idx" ON "case_studies_blocks_table" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_accordion_items_order_idx" ON "case_studies_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_accordion_items_parent_id_idx" ON "case_studies_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_accordion_order_idx" ON "case_studies_blocks_accordion" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_accordion_parent_id_idx" ON "case_studies_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_accordion_path_idx" ON "case_studies_blocks_accordion" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_quote_order_idx" ON "case_studies_blocks_quote" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_quote_parent_id_idx" ON "case_studies_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_quote_path_idx" ON "case_studies_blocks_quote" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_cta_order_idx" ON "case_studies_blocks_cta" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_cta_parent_id_idx" ON "case_studies_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_cta_path_idx" ON "case_studies_blocks_cta" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_cta_cover_image_idx" ON "case_studies_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "case_studies_blocks_cards_order_idx" ON "case_studies_blocks_cards" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_cards_parent_id_idx" ON "case_studies_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_cards_path_idx" ON "case_studies_blocks_cards" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_cards_industry_idx" ON "case_studies_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "case_studies_blocks_cards_service_idx" ON "case_studies_blocks_cards" USING btree ("service_id");
  CREATE INDEX "case_studies_blocks_cards_category_idx" ON "case_studies_blocks_cards" USING btree ("category_id");
  CREATE INDEX "case_studies_blocks_cards_service_group_idx" ON "case_studies_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "case_studies_blocks_embed_order_idx" ON "case_studies_blocks_embed" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_embed_parent_id_idx" ON "case_studies_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_embed_path_idx" ON "case_studies_blocks_embed" USING btree ("_path");
  CREATE INDEX "case_studies_blocks_embed_thumbnail_idx" ON "case_studies_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "case_studies_blocks_hubspot_form_order_idx" ON "case_studies_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "case_studies_blocks_hubspot_form_parent_id_idx" ON "case_studies_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "case_studies_blocks_hubspot_form_path_idx" ON "case_studies_blocks_hubspot_form" USING btree ("_path");
  CREATE UNIQUE INDEX "case_studies_slug_idx" ON "case_studies" USING btree ("slug");
  CREATE INDEX "case_studies_industry_idx" ON "case_studies" USING btree ("industry_id");
  CREATE INDEX "case_studies_client_client_logo_idx" ON "case_studies" USING btree ("client_logo_id");
  CREATE INDEX "case_studies_hero_image_idx" ON "case_studies" USING btree ("hero_image_id");
  CREATE INDEX "case_studies_testimonial_idx" ON "case_studies" USING btree ("testimonial_id");
  CREATE INDEX "case_studies_seo_seo_og_image_idx" ON "case_studies" USING btree ("seo_og_image_id");
  CREATE INDEX "case_studies_updated_at_idx" ON "case_studies" USING btree ("updated_at");
  CREATE INDEX "case_studies_created_at_idx" ON "case_studies" USING btree ("created_at");
  CREATE INDEX "case_studies__status_idx" ON "case_studies" USING btree ("_status");
  CREATE INDEX "case_studies_rels_order_idx" ON "case_studies_rels" USING btree ("order");
  CREATE INDEX "case_studies_rels_parent_idx" ON "case_studies_rels" USING btree ("parent_id");
  CREATE INDEX "case_studies_rels_path_idx" ON "case_studies_rels" USING btree ("path");
  CREATE INDEX "case_studies_rels_services_id_idx" ON "case_studies_rels" USING btree ("services_id");
  CREATE INDEX "case_studies_rels_testimonials_id_idx" ON "case_studies_rels" USING btree ("testimonials_id");
  CREATE INDEX "case_studies_rels_case_studies_id_idx" ON "case_studies_rels" USING btree ("case_studies_id");
  CREATE INDEX "case_studies_rels_posts_id_idx" ON "case_studies_rels" USING btree ("posts_id");
  CREATE INDEX "case_studies_rels_industries_id_idx" ON "case_studies_rels" USING btree ("industries_id");
  CREATE INDEX "case_studies_rels_workshops_id_idx" ON "case_studies_rels" USING btree ("workshops_id");
  CREATE INDEX "case_studies_rels_team_members_id_idx" ON "case_studies_rels" USING btree ("team_members_id");
  CREATE INDEX "case_studies_rels_locations_id_idx" ON "case_studies_rels" USING btree ("locations_id");
  CREATE INDEX "case_studies_rels_partners_id_idx" ON "case_studies_rels" USING btree ("partners_id");
  CREATE INDEX "_case_studies_v_blocks_hero_order_idx" ON "_case_studies_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_hero_parent_id_idx" ON "_case_studies_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_hero_path_idx" ON "_case_studies_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_hero_media_idx" ON "_case_studies_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_case_studies_v_blocks_content_order_idx" ON "_case_studies_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_content_parent_id_idx" ON "_case_studies_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_content_path_idx" ON "_case_studies_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_media_text_order_idx" ON "_case_studies_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_media_text_parent_id_idx" ON "_case_studies_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_media_text_path_idx" ON "_case_studies_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_media_text_media_idx" ON "_case_studies_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_case_studies_v_blocks_items_items_order_idx" ON "_case_studies_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_items_items_parent_id_idx" ON "_case_studies_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_items_items_image_idx" ON "_case_studies_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_case_studies_v_blocks_items_order_idx" ON "_case_studies_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_items_parent_id_idx" ON "_case_studies_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_items_path_idx" ON "_case_studies_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_image_order_idx" ON "_case_studies_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_image_parent_id_idx" ON "_case_studies_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_image_path_idx" ON "_case_studies_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_image_image_idx" ON "_case_studies_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_case_studies_v_blocks_gallery_items_order_idx" ON "_case_studies_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_gallery_items_parent_id_idx" ON "_case_studies_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_gallery_items_image_idx" ON "_case_studies_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_case_studies_v_blocks_gallery_order_idx" ON "_case_studies_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_gallery_parent_id_idx" ON "_case_studies_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_gallery_path_idx" ON "_case_studies_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_table_columns_order_idx" ON "_case_studies_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_table_columns_parent_id_idx" ON "_case_studies_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_table_rows_cells_order_idx" ON "_case_studies_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_table_rows_cells_parent_id_idx" ON "_case_studies_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_table_rows_order_idx" ON "_case_studies_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_table_rows_parent_id_idx" ON "_case_studies_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_table_best_for_row_order_idx" ON "_case_studies_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_table_best_for_row_parent_id_idx" ON "_case_studies_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_table_order_idx" ON "_case_studies_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_table_parent_id_idx" ON "_case_studies_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_table_path_idx" ON "_case_studies_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_accordion_items_order_idx" ON "_case_studies_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_accordion_items_parent_id_idx" ON "_case_studies_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_accordion_order_idx" ON "_case_studies_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_accordion_parent_id_idx" ON "_case_studies_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_accordion_path_idx" ON "_case_studies_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_quote_order_idx" ON "_case_studies_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_quote_parent_id_idx" ON "_case_studies_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_quote_path_idx" ON "_case_studies_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_cta_order_idx" ON "_case_studies_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_cta_parent_id_idx" ON "_case_studies_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_cta_path_idx" ON "_case_studies_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_cta_cover_image_idx" ON "_case_studies_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_case_studies_v_blocks_cards_order_idx" ON "_case_studies_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_cards_parent_id_idx" ON "_case_studies_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_cards_path_idx" ON "_case_studies_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_cards_industry_idx" ON "_case_studies_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_case_studies_v_blocks_cards_service_idx" ON "_case_studies_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_case_studies_v_blocks_cards_category_idx" ON "_case_studies_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_case_studies_v_blocks_cards_service_group_idx" ON "_case_studies_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_case_studies_v_blocks_embed_order_idx" ON "_case_studies_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_embed_parent_id_idx" ON "_case_studies_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_embed_path_idx" ON "_case_studies_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_case_studies_v_blocks_embed_thumbnail_idx" ON "_case_studies_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_case_studies_v_blocks_hubspot_form_order_idx" ON "_case_studies_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_case_studies_v_blocks_hubspot_form_parent_id_idx" ON "_case_studies_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_blocks_hubspot_form_path_idx" ON "_case_studies_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_case_studies_v_parent_idx" ON "_case_studies_v" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_version_slug_idx" ON "_case_studies_v" USING btree ("version_slug");
  CREATE INDEX "_case_studies_v_version_version_industry_idx" ON "_case_studies_v" USING btree ("version_industry_id");
  CREATE INDEX "_case_studies_v_version_client_version_client_logo_idx" ON "_case_studies_v" USING btree ("version_client_logo_id");
  CREATE INDEX "_case_studies_v_version_version_hero_image_idx" ON "_case_studies_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_case_studies_v_version_version_testimonial_idx" ON "_case_studies_v" USING btree ("version_testimonial_id");
  CREATE INDEX "_case_studies_v_version_seo_version_seo_og_image_idx" ON "_case_studies_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_case_studies_v_version_version_updated_at_idx" ON "_case_studies_v" USING btree ("version_updated_at");
  CREATE INDEX "_case_studies_v_version_version_created_at_idx" ON "_case_studies_v" USING btree ("version_created_at");
  CREATE INDEX "_case_studies_v_version_version__status_idx" ON "_case_studies_v" USING btree ("version__status");
  CREATE INDEX "_case_studies_v_created_at_idx" ON "_case_studies_v" USING btree ("created_at");
  CREATE INDEX "_case_studies_v_updated_at_idx" ON "_case_studies_v" USING btree ("updated_at");
  CREATE INDEX "_case_studies_v_latest_idx" ON "_case_studies_v" USING btree ("latest");
  CREATE INDEX "_case_studies_v_rels_order_idx" ON "_case_studies_v_rels" USING btree ("order");
  CREATE INDEX "_case_studies_v_rels_parent_idx" ON "_case_studies_v_rels" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_rels_path_idx" ON "_case_studies_v_rels" USING btree ("path");
  CREATE INDEX "_case_studies_v_rels_services_id_idx" ON "_case_studies_v_rels" USING btree ("services_id");
  CREATE INDEX "_case_studies_v_rels_testimonials_id_idx" ON "_case_studies_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_case_studies_v_rels_case_studies_id_idx" ON "_case_studies_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_case_studies_v_rels_posts_id_idx" ON "_case_studies_v_rels" USING btree ("posts_id");
  CREATE INDEX "_case_studies_v_rels_industries_id_idx" ON "_case_studies_v_rels" USING btree ("industries_id");
  CREATE INDEX "_case_studies_v_rels_workshops_id_idx" ON "_case_studies_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_case_studies_v_rels_team_members_id_idx" ON "_case_studies_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_case_studies_v_rels_locations_id_idx" ON "_case_studies_v_rels" USING btree ("locations_id");
  CREATE INDEX "_case_studies_v_rels_partners_id_idx" ON "_case_studies_v_rels" USING btree ("partners_id");
  CREATE INDEX "services_blocks_hero_order_idx" ON "services_blocks_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_hero_parent_id_idx" ON "services_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hero_path_idx" ON "services_blocks_hero" USING btree ("_path");
  CREATE INDEX "services_blocks_hero_media_idx" ON "services_blocks_hero" USING btree ("media_id");
  CREATE INDEX "services_blocks_content_order_idx" ON "services_blocks_content" USING btree ("_order");
  CREATE INDEX "services_blocks_content_parent_id_idx" ON "services_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_content_path_idx" ON "services_blocks_content" USING btree ("_path");
  CREATE INDEX "services_blocks_media_text_order_idx" ON "services_blocks_media_text" USING btree ("_order");
  CREATE INDEX "services_blocks_media_text_parent_id_idx" ON "services_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_media_text_path_idx" ON "services_blocks_media_text" USING btree ("_path");
  CREATE INDEX "services_blocks_media_text_media_idx" ON "services_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "services_blocks_items_items_order_idx" ON "services_blocks_items_items" USING btree ("_order");
  CREATE INDEX "services_blocks_items_items_parent_id_idx" ON "services_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_items_items_image_idx" ON "services_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "services_blocks_items_order_idx" ON "services_blocks_items" USING btree ("_order");
  CREATE INDEX "services_blocks_items_parent_id_idx" ON "services_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_items_path_idx" ON "services_blocks_items" USING btree ("_path");
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
  CREATE INDEX "services_blocks_table_columns_order_idx" ON "services_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "services_blocks_table_columns_parent_id_idx" ON "services_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_table_rows_cells_order_idx" ON "services_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "services_blocks_table_rows_cells_parent_id_idx" ON "services_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_table_rows_order_idx" ON "services_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "services_blocks_table_rows_parent_id_idx" ON "services_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_table_best_for_row_order_idx" ON "services_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "services_blocks_table_best_for_row_parent_id_idx" ON "services_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_table_order_idx" ON "services_blocks_table" USING btree ("_order");
  CREATE INDEX "services_blocks_table_parent_id_idx" ON "services_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_table_path_idx" ON "services_blocks_table" USING btree ("_path");
  CREATE INDEX "services_blocks_accordion_items_order_idx" ON "services_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "services_blocks_accordion_items_parent_id_idx" ON "services_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_accordion_order_idx" ON "services_blocks_accordion" USING btree ("_order");
  CREATE INDEX "services_blocks_accordion_parent_id_idx" ON "services_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_accordion_path_idx" ON "services_blocks_accordion" USING btree ("_path");
  CREATE INDEX "services_blocks_quote_order_idx" ON "services_blocks_quote" USING btree ("_order");
  CREATE INDEX "services_blocks_quote_parent_id_idx" ON "services_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_quote_path_idx" ON "services_blocks_quote" USING btree ("_path");
  CREATE INDEX "services_blocks_cta_order_idx" ON "services_blocks_cta" USING btree ("_order");
  CREATE INDEX "services_blocks_cta_parent_id_idx" ON "services_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_cta_path_idx" ON "services_blocks_cta" USING btree ("_path");
  CREATE INDEX "services_blocks_cta_cover_image_idx" ON "services_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "services_blocks_cards_order_idx" ON "services_blocks_cards" USING btree ("_order");
  CREATE INDEX "services_blocks_cards_parent_id_idx" ON "services_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_cards_path_idx" ON "services_blocks_cards" USING btree ("_path");
  CREATE INDEX "services_blocks_cards_industry_idx" ON "services_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "services_blocks_cards_service_idx" ON "services_blocks_cards" USING btree ("service_id");
  CREATE INDEX "services_blocks_cards_category_idx" ON "services_blocks_cards" USING btree ("category_id");
  CREATE INDEX "services_blocks_cards_service_group_idx" ON "services_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "services_blocks_embed_order_idx" ON "services_blocks_embed" USING btree ("_order");
  CREATE INDEX "services_blocks_embed_parent_id_idx" ON "services_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_embed_path_idx" ON "services_blocks_embed" USING btree ("_path");
  CREATE INDEX "services_blocks_embed_thumbnail_idx" ON "services_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "services_blocks_hubspot_form_order_idx" ON "services_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "services_blocks_hubspot_form_parent_id_idx" ON "services_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hubspot_form_path_idx" ON "services_blocks_hubspot_form" USING btree ("_path");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_seo_seo_og_image_idx" ON "services" USING btree ("seo_og_image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_case_studies_id_idx" ON "services_rels" USING btree ("case_studies_id");
  CREATE INDEX "services_rels_services_id_idx" ON "services_rels" USING btree ("services_id");
  CREATE INDEX "services_rels_testimonials_id_idx" ON "services_rels" USING btree ("testimonials_id");
  CREATE INDEX "services_rels_posts_id_idx" ON "services_rels" USING btree ("posts_id");
  CREATE INDEX "services_rels_industries_id_idx" ON "services_rels" USING btree ("industries_id");
  CREATE INDEX "services_rels_workshops_id_idx" ON "services_rels" USING btree ("workshops_id");
  CREATE INDEX "services_rels_team_members_id_idx" ON "services_rels" USING btree ("team_members_id");
  CREATE INDEX "services_rels_locations_id_idx" ON "services_rels" USING btree ("locations_id");
  CREATE INDEX "services_rels_partners_id_idx" ON "services_rels" USING btree ("partners_id");
  CREATE INDEX "_services_v_blocks_hero_order_idx" ON "_services_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hero_parent_id_idx" ON "_services_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hero_path_idx" ON "_services_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_hero_media_idx" ON "_services_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_content_order_idx" ON "_services_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_content_parent_id_idx" ON "_services_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_content_path_idx" ON "_services_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_media_text_order_idx" ON "_services_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_media_text_parent_id_idx" ON "_services_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_media_text_path_idx" ON "_services_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_media_text_media_idx" ON "_services_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_items_items_order_idx" ON "_services_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_items_items_parent_id_idx" ON "_services_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_items_items_image_idx" ON "_services_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_items_order_idx" ON "_services_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_items_parent_id_idx" ON "_services_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_items_path_idx" ON "_services_v_blocks_items" USING btree ("_path");
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
  CREATE INDEX "_services_v_blocks_table_columns_order_idx" ON "_services_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_table_columns_parent_id_idx" ON "_services_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_table_rows_cells_order_idx" ON "_services_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_table_rows_cells_parent_id_idx" ON "_services_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_table_rows_order_idx" ON "_services_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_table_rows_parent_id_idx" ON "_services_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_table_best_for_row_order_idx" ON "_services_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_table_best_for_row_parent_id_idx" ON "_services_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_table_order_idx" ON "_services_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_table_parent_id_idx" ON "_services_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_table_path_idx" ON "_services_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_accordion_items_order_idx" ON "_services_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_accordion_items_parent_id_idx" ON "_services_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_accordion_order_idx" ON "_services_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_accordion_parent_id_idx" ON "_services_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_accordion_path_idx" ON "_services_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_quote_order_idx" ON "_services_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_quote_parent_id_idx" ON "_services_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_quote_path_idx" ON "_services_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_cta_order_idx" ON "_services_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_cta_parent_id_idx" ON "_services_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_cta_path_idx" ON "_services_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_cta_cover_image_idx" ON "_services_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_services_v_blocks_cards_order_idx" ON "_services_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_cards_parent_id_idx" ON "_services_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_cards_path_idx" ON "_services_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_cards_industry_idx" ON "_services_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_services_v_blocks_cards_service_idx" ON "_services_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_services_v_blocks_cards_category_idx" ON "_services_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_services_v_blocks_cards_service_group_idx" ON "_services_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_services_v_blocks_embed_order_idx" ON "_services_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_embed_parent_id_idx" ON "_services_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_embed_path_idx" ON "_services_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_embed_thumbnail_idx" ON "_services_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_services_v_blocks_hubspot_form_order_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hubspot_form_parent_id_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hubspot_form_path_idx" ON "_services_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
  CREATE INDEX "_services_v_version_seo_version_seo_og_image_idx" ON "_services_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE INDEX "_services_v_rels_order_idx" ON "_services_v_rels" USING btree ("order");
  CREATE INDEX "_services_v_rels_parent_idx" ON "_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_v_rels_path_idx" ON "_services_v_rels" USING btree ("path");
  CREATE INDEX "_services_v_rels_case_studies_id_idx" ON "_services_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_services_v_rels_services_id_idx" ON "_services_v_rels" USING btree ("services_id");
  CREATE INDEX "_services_v_rels_testimonials_id_idx" ON "_services_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_services_v_rels_posts_id_idx" ON "_services_v_rels" USING btree ("posts_id");
  CREATE INDEX "_services_v_rels_industries_id_idx" ON "_services_v_rels" USING btree ("industries_id");
  CREATE INDEX "_services_v_rels_workshops_id_idx" ON "_services_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_services_v_rels_team_members_id_idx" ON "_services_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_services_v_rels_locations_id_idx" ON "_services_v_rels" USING btree ("locations_id");
  CREATE INDEX "_services_v_rels_partners_id_idx" ON "_services_v_rels" USING btree ("partners_id");
  CREATE INDEX "industries_client_logos_order_idx" ON "industries_client_logos" USING btree ("_order");
  CREATE INDEX "industries_client_logos_parent_id_idx" ON "industries_client_logos" USING btree ("_parent_id");
  CREATE INDEX "industries_client_logos_logo_idx" ON "industries_client_logos" USING btree ("logo_id");
  CREATE INDEX "industries_blocks_hero_order_idx" ON "industries_blocks_hero" USING btree ("_order");
  CREATE INDEX "industries_blocks_hero_parent_id_idx" ON "industries_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_hero_path_idx" ON "industries_blocks_hero" USING btree ("_path");
  CREATE INDEX "industries_blocks_hero_media_idx" ON "industries_blocks_hero" USING btree ("media_id");
  CREATE INDEX "industries_blocks_content_order_idx" ON "industries_blocks_content" USING btree ("_order");
  CREATE INDEX "industries_blocks_content_parent_id_idx" ON "industries_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_content_path_idx" ON "industries_blocks_content" USING btree ("_path");
  CREATE INDEX "industries_blocks_media_text_order_idx" ON "industries_blocks_media_text" USING btree ("_order");
  CREATE INDEX "industries_blocks_media_text_parent_id_idx" ON "industries_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_media_text_path_idx" ON "industries_blocks_media_text" USING btree ("_path");
  CREATE INDEX "industries_blocks_media_text_media_idx" ON "industries_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "industries_blocks_items_items_order_idx" ON "industries_blocks_items_items" USING btree ("_order");
  CREATE INDEX "industries_blocks_items_items_parent_id_idx" ON "industries_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_items_items_image_idx" ON "industries_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "industries_blocks_items_order_idx" ON "industries_blocks_items" USING btree ("_order");
  CREATE INDEX "industries_blocks_items_parent_id_idx" ON "industries_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_items_path_idx" ON "industries_blocks_items" USING btree ("_path");
  CREATE INDEX "industries_blocks_image_order_idx" ON "industries_blocks_image" USING btree ("_order");
  CREATE INDEX "industries_blocks_image_parent_id_idx" ON "industries_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_image_path_idx" ON "industries_blocks_image" USING btree ("_path");
  CREATE INDEX "industries_blocks_image_image_idx" ON "industries_blocks_image" USING btree ("image_id");
  CREATE INDEX "industries_blocks_gallery_items_order_idx" ON "industries_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "industries_blocks_gallery_items_parent_id_idx" ON "industries_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_gallery_items_image_idx" ON "industries_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "industries_blocks_gallery_order_idx" ON "industries_blocks_gallery" USING btree ("_order");
  CREATE INDEX "industries_blocks_gallery_parent_id_idx" ON "industries_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_gallery_path_idx" ON "industries_blocks_gallery" USING btree ("_path");
  CREATE INDEX "industries_blocks_table_columns_order_idx" ON "industries_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "industries_blocks_table_columns_parent_id_idx" ON "industries_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_table_rows_cells_order_idx" ON "industries_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "industries_blocks_table_rows_cells_parent_id_idx" ON "industries_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_table_rows_order_idx" ON "industries_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "industries_blocks_table_rows_parent_id_idx" ON "industries_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_table_best_for_row_order_idx" ON "industries_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "industries_blocks_table_best_for_row_parent_id_idx" ON "industries_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_table_order_idx" ON "industries_blocks_table" USING btree ("_order");
  CREATE INDEX "industries_blocks_table_parent_id_idx" ON "industries_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_table_path_idx" ON "industries_blocks_table" USING btree ("_path");
  CREATE INDEX "industries_blocks_accordion_items_order_idx" ON "industries_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "industries_blocks_accordion_items_parent_id_idx" ON "industries_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_accordion_order_idx" ON "industries_blocks_accordion" USING btree ("_order");
  CREATE INDEX "industries_blocks_accordion_parent_id_idx" ON "industries_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_accordion_path_idx" ON "industries_blocks_accordion" USING btree ("_path");
  CREATE INDEX "industries_blocks_quote_order_idx" ON "industries_blocks_quote" USING btree ("_order");
  CREATE INDEX "industries_blocks_quote_parent_id_idx" ON "industries_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_quote_path_idx" ON "industries_blocks_quote" USING btree ("_path");
  CREATE INDEX "industries_blocks_cta_order_idx" ON "industries_blocks_cta" USING btree ("_order");
  CREATE INDEX "industries_blocks_cta_parent_id_idx" ON "industries_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_cta_path_idx" ON "industries_blocks_cta" USING btree ("_path");
  CREATE INDEX "industries_blocks_cta_cover_image_idx" ON "industries_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "industries_blocks_cards_order_idx" ON "industries_blocks_cards" USING btree ("_order");
  CREATE INDEX "industries_blocks_cards_parent_id_idx" ON "industries_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_cards_path_idx" ON "industries_blocks_cards" USING btree ("_path");
  CREATE INDEX "industries_blocks_cards_industry_idx" ON "industries_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "industries_blocks_cards_service_idx" ON "industries_blocks_cards" USING btree ("service_id");
  CREATE INDEX "industries_blocks_cards_category_idx" ON "industries_blocks_cards" USING btree ("category_id");
  CREATE INDEX "industries_blocks_cards_service_group_idx" ON "industries_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "industries_blocks_embed_order_idx" ON "industries_blocks_embed" USING btree ("_order");
  CREATE INDEX "industries_blocks_embed_parent_id_idx" ON "industries_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_embed_path_idx" ON "industries_blocks_embed" USING btree ("_path");
  CREATE INDEX "industries_blocks_embed_thumbnail_idx" ON "industries_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "industries_blocks_hubspot_form_order_idx" ON "industries_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "industries_blocks_hubspot_form_parent_id_idx" ON "industries_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "industries_blocks_hubspot_form_path_idx" ON "industries_blocks_hubspot_form" USING btree ("_path");
  CREATE UNIQUE INDEX "industries_slug_idx" ON "industries" USING btree ("slug");
  CREATE INDEX "industries_seo_seo_og_image_idx" ON "industries" USING btree ("seo_og_image_id");
  CREATE INDEX "industries_updated_at_idx" ON "industries" USING btree ("updated_at");
  CREATE INDEX "industries_created_at_idx" ON "industries" USING btree ("created_at");
  CREATE INDEX "industries__status_idx" ON "industries" USING btree ("_status");
  CREATE INDEX "industries_rels_order_idx" ON "industries_rels" USING btree ("order");
  CREATE INDEX "industries_rels_parent_idx" ON "industries_rels" USING btree ("parent_id");
  CREATE INDEX "industries_rels_path_idx" ON "industries_rels" USING btree ("path");
  CREATE INDEX "industries_rels_services_id_idx" ON "industries_rels" USING btree ("services_id");
  CREATE INDEX "industries_rels_testimonials_id_idx" ON "industries_rels" USING btree ("testimonials_id");
  CREATE INDEX "industries_rels_case_studies_id_idx" ON "industries_rels" USING btree ("case_studies_id");
  CREATE INDEX "industries_rels_posts_id_idx" ON "industries_rels" USING btree ("posts_id");
  CREATE INDEX "industries_rels_industries_id_idx" ON "industries_rels" USING btree ("industries_id");
  CREATE INDEX "industries_rels_workshops_id_idx" ON "industries_rels" USING btree ("workshops_id");
  CREATE INDEX "industries_rels_team_members_id_idx" ON "industries_rels" USING btree ("team_members_id");
  CREATE INDEX "industries_rels_locations_id_idx" ON "industries_rels" USING btree ("locations_id");
  CREATE INDEX "industries_rels_partners_id_idx" ON "industries_rels" USING btree ("partners_id");
  CREATE INDEX "_industries_v_version_client_logos_order_idx" ON "_industries_v_version_client_logos" USING btree ("_order");
  CREATE INDEX "_industries_v_version_client_logos_parent_id_idx" ON "_industries_v_version_client_logos" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_version_client_logos_logo_idx" ON "_industries_v_version_client_logos" USING btree ("logo_id");
  CREATE INDEX "_industries_v_blocks_hero_order_idx" ON "_industries_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_hero_parent_id_idx" ON "_industries_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_hero_path_idx" ON "_industries_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_hero_media_idx" ON "_industries_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_industries_v_blocks_content_order_idx" ON "_industries_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_content_parent_id_idx" ON "_industries_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_content_path_idx" ON "_industries_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_media_text_order_idx" ON "_industries_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_media_text_parent_id_idx" ON "_industries_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_media_text_path_idx" ON "_industries_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_media_text_media_idx" ON "_industries_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_industries_v_blocks_items_items_order_idx" ON "_industries_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_items_items_parent_id_idx" ON "_industries_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_items_items_image_idx" ON "_industries_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_industries_v_blocks_items_order_idx" ON "_industries_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_items_parent_id_idx" ON "_industries_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_items_path_idx" ON "_industries_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_image_order_idx" ON "_industries_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_image_parent_id_idx" ON "_industries_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_image_path_idx" ON "_industries_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_image_image_idx" ON "_industries_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_industries_v_blocks_gallery_items_order_idx" ON "_industries_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_gallery_items_parent_id_idx" ON "_industries_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_gallery_items_image_idx" ON "_industries_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_industries_v_blocks_gallery_order_idx" ON "_industries_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_gallery_parent_id_idx" ON "_industries_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_gallery_path_idx" ON "_industries_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_table_columns_order_idx" ON "_industries_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_table_columns_parent_id_idx" ON "_industries_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_table_rows_cells_order_idx" ON "_industries_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_table_rows_cells_parent_id_idx" ON "_industries_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_table_rows_order_idx" ON "_industries_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_table_rows_parent_id_idx" ON "_industries_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_table_best_for_row_order_idx" ON "_industries_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_table_best_for_row_parent_id_idx" ON "_industries_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_table_order_idx" ON "_industries_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_table_parent_id_idx" ON "_industries_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_table_path_idx" ON "_industries_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_accordion_items_order_idx" ON "_industries_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_accordion_items_parent_id_idx" ON "_industries_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_accordion_order_idx" ON "_industries_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_accordion_parent_id_idx" ON "_industries_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_accordion_path_idx" ON "_industries_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_quote_order_idx" ON "_industries_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_quote_parent_id_idx" ON "_industries_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_quote_path_idx" ON "_industries_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_cta_order_idx" ON "_industries_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_cta_parent_id_idx" ON "_industries_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_cta_path_idx" ON "_industries_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_cta_cover_image_idx" ON "_industries_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_industries_v_blocks_cards_order_idx" ON "_industries_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_cards_parent_id_idx" ON "_industries_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_cards_path_idx" ON "_industries_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_cards_industry_idx" ON "_industries_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_industries_v_blocks_cards_service_idx" ON "_industries_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_industries_v_blocks_cards_category_idx" ON "_industries_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_industries_v_blocks_cards_service_group_idx" ON "_industries_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_industries_v_blocks_embed_order_idx" ON "_industries_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_embed_parent_id_idx" ON "_industries_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_embed_path_idx" ON "_industries_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_industries_v_blocks_embed_thumbnail_idx" ON "_industries_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_industries_v_blocks_hubspot_form_order_idx" ON "_industries_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_industries_v_blocks_hubspot_form_parent_id_idx" ON "_industries_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_industries_v_blocks_hubspot_form_path_idx" ON "_industries_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_industries_v_parent_idx" ON "_industries_v" USING btree ("parent_id");
  CREATE INDEX "_industries_v_version_version_slug_idx" ON "_industries_v" USING btree ("version_slug");
  CREATE INDEX "_industries_v_version_seo_version_seo_og_image_idx" ON "_industries_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_industries_v_version_version_updated_at_idx" ON "_industries_v" USING btree ("version_updated_at");
  CREATE INDEX "_industries_v_version_version_created_at_idx" ON "_industries_v" USING btree ("version_created_at");
  CREATE INDEX "_industries_v_version_version__status_idx" ON "_industries_v" USING btree ("version__status");
  CREATE INDEX "_industries_v_created_at_idx" ON "_industries_v" USING btree ("created_at");
  CREATE INDEX "_industries_v_updated_at_idx" ON "_industries_v" USING btree ("updated_at");
  CREATE INDEX "_industries_v_latest_idx" ON "_industries_v" USING btree ("latest");
  CREATE INDEX "_industries_v_rels_order_idx" ON "_industries_v_rels" USING btree ("order");
  CREATE INDEX "_industries_v_rels_parent_idx" ON "_industries_v_rels" USING btree ("parent_id");
  CREATE INDEX "_industries_v_rels_path_idx" ON "_industries_v_rels" USING btree ("path");
  CREATE INDEX "_industries_v_rels_services_id_idx" ON "_industries_v_rels" USING btree ("services_id");
  CREATE INDEX "_industries_v_rels_testimonials_id_idx" ON "_industries_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_industries_v_rels_case_studies_id_idx" ON "_industries_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_industries_v_rels_posts_id_idx" ON "_industries_v_rels" USING btree ("posts_id");
  CREATE INDEX "_industries_v_rels_industries_id_idx" ON "_industries_v_rels" USING btree ("industries_id");
  CREATE INDEX "_industries_v_rels_workshops_id_idx" ON "_industries_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_industries_v_rels_team_members_id_idx" ON "_industries_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_industries_v_rels_locations_id_idx" ON "_industries_v_rels" USING btree ("locations_id");
  CREATE INDEX "_industries_v_rels_partners_id_idx" ON "_industries_v_rels" USING btree ("partners_id");
  CREATE INDEX "workshops_blocks_hero_order_idx" ON "workshops_blocks_hero" USING btree ("_order");
  CREATE INDEX "workshops_blocks_hero_parent_id_idx" ON "workshops_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_hero_path_idx" ON "workshops_blocks_hero" USING btree ("_path");
  CREATE INDEX "workshops_blocks_hero_media_idx" ON "workshops_blocks_hero" USING btree ("media_id");
  CREATE INDEX "workshops_blocks_content_order_idx" ON "workshops_blocks_content" USING btree ("_order");
  CREATE INDEX "workshops_blocks_content_parent_id_idx" ON "workshops_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_content_path_idx" ON "workshops_blocks_content" USING btree ("_path");
  CREATE INDEX "workshops_blocks_media_text_order_idx" ON "workshops_blocks_media_text" USING btree ("_order");
  CREATE INDEX "workshops_blocks_media_text_parent_id_idx" ON "workshops_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_media_text_path_idx" ON "workshops_blocks_media_text" USING btree ("_path");
  CREATE INDEX "workshops_blocks_media_text_media_idx" ON "workshops_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "workshops_blocks_items_items_order_idx" ON "workshops_blocks_items_items" USING btree ("_order");
  CREATE INDEX "workshops_blocks_items_items_parent_id_idx" ON "workshops_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_items_items_image_idx" ON "workshops_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "workshops_blocks_items_order_idx" ON "workshops_blocks_items" USING btree ("_order");
  CREATE INDEX "workshops_blocks_items_parent_id_idx" ON "workshops_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_items_path_idx" ON "workshops_blocks_items" USING btree ("_path");
  CREATE INDEX "workshops_blocks_image_order_idx" ON "workshops_blocks_image" USING btree ("_order");
  CREATE INDEX "workshops_blocks_image_parent_id_idx" ON "workshops_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_image_path_idx" ON "workshops_blocks_image" USING btree ("_path");
  CREATE INDEX "workshops_blocks_image_image_idx" ON "workshops_blocks_image" USING btree ("image_id");
  CREATE INDEX "workshops_blocks_gallery_items_order_idx" ON "workshops_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "workshops_blocks_gallery_items_parent_id_idx" ON "workshops_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_gallery_items_image_idx" ON "workshops_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "workshops_blocks_gallery_order_idx" ON "workshops_blocks_gallery" USING btree ("_order");
  CREATE INDEX "workshops_blocks_gallery_parent_id_idx" ON "workshops_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_gallery_path_idx" ON "workshops_blocks_gallery" USING btree ("_path");
  CREATE INDEX "workshops_blocks_table_columns_order_idx" ON "workshops_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "workshops_blocks_table_columns_parent_id_idx" ON "workshops_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_table_rows_cells_order_idx" ON "workshops_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "workshops_blocks_table_rows_cells_parent_id_idx" ON "workshops_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_table_rows_order_idx" ON "workshops_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "workshops_blocks_table_rows_parent_id_idx" ON "workshops_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_table_best_for_row_order_idx" ON "workshops_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "workshops_blocks_table_best_for_row_parent_id_idx" ON "workshops_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_table_order_idx" ON "workshops_blocks_table" USING btree ("_order");
  CREATE INDEX "workshops_blocks_table_parent_id_idx" ON "workshops_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_table_path_idx" ON "workshops_blocks_table" USING btree ("_path");
  CREATE INDEX "workshops_blocks_accordion_items_order_idx" ON "workshops_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "workshops_blocks_accordion_items_parent_id_idx" ON "workshops_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_accordion_order_idx" ON "workshops_blocks_accordion" USING btree ("_order");
  CREATE INDEX "workshops_blocks_accordion_parent_id_idx" ON "workshops_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_accordion_path_idx" ON "workshops_blocks_accordion" USING btree ("_path");
  CREATE INDEX "workshops_blocks_quote_order_idx" ON "workshops_blocks_quote" USING btree ("_order");
  CREATE INDEX "workshops_blocks_quote_parent_id_idx" ON "workshops_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_quote_path_idx" ON "workshops_blocks_quote" USING btree ("_path");
  CREATE INDEX "workshops_blocks_cta_order_idx" ON "workshops_blocks_cta" USING btree ("_order");
  CREATE INDEX "workshops_blocks_cta_parent_id_idx" ON "workshops_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_cta_path_idx" ON "workshops_blocks_cta" USING btree ("_path");
  CREATE INDEX "workshops_blocks_cta_cover_image_idx" ON "workshops_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "workshops_blocks_cards_order_idx" ON "workshops_blocks_cards" USING btree ("_order");
  CREATE INDEX "workshops_blocks_cards_parent_id_idx" ON "workshops_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_cards_path_idx" ON "workshops_blocks_cards" USING btree ("_path");
  CREATE INDEX "workshops_blocks_cards_industry_idx" ON "workshops_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "workshops_blocks_cards_service_idx" ON "workshops_blocks_cards" USING btree ("service_id");
  CREATE INDEX "workshops_blocks_cards_category_idx" ON "workshops_blocks_cards" USING btree ("category_id");
  CREATE INDEX "workshops_blocks_cards_service_group_idx" ON "workshops_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "workshops_blocks_embed_order_idx" ON "workshops_blocks_embed" USING btree ("_order");
  CREATE INDEX "workshops_blocks_embed_parent_id_idx" ON "workshops_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_embed_path_idx" ON "workshops_blocks_embed" USING btree ("_path");
  CREATE INDEX "workshops_blocks_embed_thumbnail_idx" ON "workshops_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "workshops_blocks_hubspot_form_order_idx" ON "workshops_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "workshops_blocks_hubspot_form_parent_id_idx" ON "workshops_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "workshops_blocks_hubspot_form_path_idx" ON "workshops_blocks_hubspot_form" USING btree ("_path");
  CREATE UNIQUE INDEX "workshops_slug_idx" ON "workshops" USING btree ("slug");
  CREATE INDEX "workshops_facilitator_idx" ON "workshops" USING btree ("facilitator_id");
  CREATE INDEX "workshops_testimonial_idx" ON "workshops" USING btree ("testimonial_id");
  CREATE INDEX "workshops_seo_seo_og_image_idx" ON "workshops" USING btree ("seo_og_image_id");
  CREATE INDEX "workshops_updated_at_idx" ON "workshops" USING btree ("updated_at");
  CREATE INDEX "workshops_created_at_idx" ON "workshops" USING btree ("created_at");
  CREATE INDEX "workshops__status_idx" ON "workshops" USING btree ("_status");
  CREATE INDEX "workshops_rels_order_idx" ON "workshops_rels" USING btree ("order");
  CREATE INDEX "workshops_rels_parent_idx" ON "workshops_rels" USING btree ("parent_id");
  CREATE INDEX "workshops_rels_path_idx" ON "workshops_rels" USING btree ("path");
  CREATE INDEX "workshops_rels_testimonials_id_idx" ON "workshops_rels" USING btree ("testimonials_id");
  CREATE INDEX "workshops_rels_case_studies_id_idx" ON "workshops_rels" USING btree ("case_studies_id");
  CREATE INDEX "workshops_rels_posts_id_idx" ON "workshops_rels" USING btree ("posts_id");
  CREATE INDEX "workshops_rels_services_id_idx" ON "workshops_rels" USING btree ("services_id");
  CREATE INDEX "workshops_rels_industries_id_idx" ON "workshops_rels" USING btree ("industries_id");
  CREATE INDEX "workshops_rels_workshops_id_idx" ON "workshops_rels" USING btree ("workshops_id");
  CREATE INDEX "workshops_rels_team_members_id_idx" ON "workshops_rels" USING btree ("team_members_id");
  CREATE INDEX "workshops_rels_locations_id_idx" ON "workshops_rels" USING btree ("locations_id");
  CREATE INDEX "workshops_rels_partners_id_idx" ON "workshops_rels" USING btree ("partners_id");
  CREATE INDEX "_workshops_v_blocks_hero_order_idx" ON "_workshops_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_hero_parent_id_idx" ON "_workshops_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_hero_path_idx" ON "_workshops_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_hero_media_idx" ON "_workshops_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_workshops_v_blocks_content_order_idx" ON "_workshops_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_content_parent_id_idx" ON "_workshops_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_content_path_idx" ON "_workshops_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_media_text_order_idx" ON "_workshops_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_media_text_parent_id_idx" ON "_workshops_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_media_text_path_idx" ON "_workshops_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_media_text_media_idx" ON "_workshops_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_workshops_v_blocks_items_items_order_idx" ON "_workshops_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_items_items_parent_id_idx" ON "_workshops_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_items_items_image_idx" ON "_workshops_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_workshops_v_blocks_items_order_idx" ON "_workshops_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_items_parent_id_idx" ON "_workshops_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_items_path_idx" ON "_workshops_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_image_order_idx" ON "_workshops_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_image_parent_id_idx" ON "_workshops_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_image_path_idx" ON "_workshops_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_image_image_idx" ON "_workshops_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_workshops_v_blocks_gallery_items_order_idx" ON "_workshops_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_gallery_items_parent_id_idx" ON "_workshops_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_gallery_items_image_idx" ON "_workshops_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_workshops_v_blocks_gallery_order_idx" ON "_workshops_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_gallery_parent_id_idx" ON "_workshops_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_gallery_path_idx" ON "_workshops_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_table_columns_order_idx" ON "_workshops_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_table_columns_parent_id_idx" ON "_workshops_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_table_rows_cells_order_idx" ON "_workshops_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_table_rows_cells_parent_id_idx" ON "_workshops_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_table_rows_order_idx" ON "_workshops_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_table_rows_parent_id_idx" ON "_workshops_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_table_best_for_row_order_idx" ON "_workshops_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_table_best_for_row_parent_id_idx" ON "_workshops_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_table_order_idx" ON "_workshops_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_table_parent_id_idx" ON "_workshops_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_table_path_idx" ON "_workshops_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_accordion_items_order_idx" ON "_workshops_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_accordion_items_parent_id_idx" ON "_workshops_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_accordion_order_idx" ON "_workshops_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_accordion_parent_id_idx" ON "_workshops_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_accordion_path_idx" ON "_workshops_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_quote_order_idx" ON "_workshops_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_quote_parent_id_idx" ON "_workshops_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_quote_path_idx" ON "_workshops_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_cta_order_idx" ON "_workshops_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_cta_parent_id_idx" ON "_workshops_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_cta_path_idx" ON "_workshops_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_cta_cover_image_idx" ON "_workshops_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_workshops_v_blocks_cards_order_idx" ON "_workshops_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_cards_parent_id_idx" ON "_workshops_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_cards_path_idx" ON "_workshops_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_cards_industry_idx" ON "_workshops_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_workshops_v_blocks_cards_service_idx" ON "_workshops_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_workshops_v_blocks_cards_category_idx" ON "_workshops_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_workshops_v_blocks_cards_service_group_idx" ON "_workshops_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_workshops_v_blocks_embed_order_idx" ON "_workshops_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_embed_parent_id_idx" ON "_workshops_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_embed_path_idx" ON "_workshops_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_workshops_v_blocks_embed_thumbnail_idx" ON "_workshops_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_workshops_v_blocks_hubspot_form_order_idx" ON "_workshops_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_workshops_v_blocks_hubspot_form_parent_id_idx" ON "_workshops_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_blocks_hubspot_form_path_idx" ON "_workshops_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_workshops_v_parent_idx" ON "_workshops_v" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_version_version_slug_idx" ON "_workshops_v" USING btree ("version_slug");
  CREATE INDEX "_workshops_v_version_version_facilitator_idx" ON "_workshops_v" USING btree ("version_facilitator_id");
  CREATE INDEX "_workshops_v_version_version_testimonial_idx" ON "_workshops_v" USING btree ("version_testimonial_id");
  CREATE INDEX "_workshops_v_version_seo_version_seo_og_image_idx" ON "_workshops_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_workshops_v_version_version_updated_at_idx" ON "_workshops_v" USING btree ("version_updated_at");
  CREATE INDEX "_workshops_v_version_version_created_at_idx" ON "_workshops_v" USING btree ("version_created_at");
  CREATE INDEX "_workshops_v_version_version__status_idx" ON "_workshops_v" USING btree ("version__status");
  CREATE INDEX "_workshops_v_created_at_idx" ON "_workshops_v" USING btree ("created_at");
  CREATE INDEX "_workshops_v_updated_at_idx" ON "_workshops_v" USING btree ("updated_at");
  CREATE INDEX "_workshops_v_latest_idx" ON "_workshops_v" USING btree ("latest");
  CREATE INDEX "_workshops_v_rels_order_idx" ON "_workshops_v_rels" USING btree ("order");
  CREATE INDEX "_workshops_v_rels_parent_idx" ON "_workshops_v_rels" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_rels_path_idx" ON "_workshops_v_rels" USING btree ("path");
  CREATE INDEX "_workshops_v_rels_testimonials_id_idx" ON "_workshops_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_workshops_v_rels_case_studies_id_idx" ON "_workshops_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_workshops_v_rels_posts_id_idx" ON "_workshops_v_rels" USING btree ("posts_id");
  CREATE INDEX "_workshops_v_rels_services_id_idx" ON "_workshops_v_rels" USING btree ("services_id");
  CREATE INDEX "_workshops_v_rels_industries_id_idx" ON "_workshops_v_rels" USING btree ("industries_id");
  CREATE INDEX "_workshops_v_rels_workshops_id_idx" ON "_workshops_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_workshops_v_rels_team_members_id_idx" ON "_workshops_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_workshops_v_rels_locations_id_idx" ON "_workshops_v_rels" USING btree ("locations_id");
  CREATE INDEX "_workshops_v_rels_partners_id_idx" ON "_workshops_v_rels" USING btree ("partners_id");
  CREATE INDEX "team_members_blocks_hero_order_idx" ON "team_members_blocks_hero" USING btree ("_order");
  CREATE INDEX "team_members_blocks_hero_parent_id_idx" ON "team_members_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_hero_path_idx" ON "team_members_blocks_hero" USING btree ("_path");
  CREATE INDEX "team_members_blocks_hero_media_idx" ON "team_members_blocks_hero" USING btree ("media_id");
  CREATE INDEX "team_members_blocks_content_order_idx" ON "team_members_blocks_content" USING btree ("_order");
  CREATE INDEX "team_members_blocks_content_parent_id_idx" ON "team_members_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_content_path_idx" ON "team_members_blocks_content" USING btree ("_path");
  CREATE INDEX "team_members_blocks_media_text_order_idx" ON "team_members_blocks_media_text" USING btree ("_order");
  CREATE INDEX "team_members_blocks_media_text_parent_id_idx" ON "team_members_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_media_text_path_idx" ON "team_members_blocks_media_text" USING btree ("_path");
  CREATE INDEX "team_members_blocks_media_text_media_idx" ON "team_members_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "team_members_blocks_items_items_order_idx" ON "team_members_blocks_items_items" USING btree ("_order");
  CREATE INDEX "team_members_blocks_items_items_parent_id_idx" ON "team_members_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_items_items_image_idx" ON "team_members_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "team_members_blocks_items_order_idx" ON "team_members_blocks_items" USING btree ("_order");
  CREATE INDEX "team_members_blocks_items_parent_id_idx" ON "team_members_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_items_path_idx" ON "team_members_blocks_items" USING btree ("_path");
  CREATE INDEX "team_members_blocks_image_order_idx" ON "team_members_blocks_image" USING btree ("_order");
  CREATE INDEX "team_members_blocks_image_parent_id_idx" ON "team_members_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_image_path_idx" ON "team_members_blocks_image" USING btree ("_path");
  CREATE INDEX "team_members_blocks_image_image_idx" ON "team_members_blocks_image" USING btree ("image_id");
  CREATE INDEX "team_members_blocks_gallery_items_order_idx" ON "team_members_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "team_members_blocks_gallery_items_parent_id_idx" ON "team_members_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_gallery_items_image_idx" ON "team_members_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "team_members_blocks_gallery_order_idx" ON "team_members_blocks_gallery" USING btree ("_order");
  CREATE INDEX "team_members_blocks_gallery_parent_id_idx" ON "team_members_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_gallery_path_idx" ON "team_members_blocks_gallery" USING btree ("_path");
  CREATE INDEX "team_members_blocks_table_columns_order_idx" ON "team_members_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "team_members_blocks_table_columns_parent_id_idx" ON "team_members_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_table_rows_cells_order_idx" ON "team_members_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "team_members_blocks_table_rows_cells_parent_id_idx" ON "team_members_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_table_rows_order_idx" ON "team_members_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "team_members_blocks_table_rows_parent_id_idx" ON "team_members_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_table_best_for_row_order_idx" ON "team_members_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "team_members_blocks_table_best_for_row_parent_id_idx" ON "team_members_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_table_order_idx" ON "team_members_blocks_table" USING btree ("_order");
  CREATE INDEX "team_members_blocks_table_parent_id_idx" ON "team_members_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_table_path_idx" ON "team_members_blocks_table" USING btree ("_path");
  CREATE INDEX "team_members_blocks_accordion_items_order_idx" ON "team_members_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "team_members_blocks_accordion_items_parent_id_idx" ON "team_members_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_accordion_order_idx" ON "team_members_blocks_accordion" USING btree ("_order");
  CREATE INDEX "team_members_blocks_accordion_parent_id_idx" ON "team_members_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_accordion_path_idx" ON "team_members_blocks_accordion" USING btree ("_path");
  CREATE INDEX "team_members_blocks_quote_order_idx" ON "team_members_blocks_quote" USING btree ("_order");
  CREATE INDEX "team_members_blocks_quote_parent_id_idx" ON "team_members_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_quote_path_idx" ON "team_members_blocks_quote" USING btree ("_path");
  CREATE INDEX "team_members_blocks_cta_order_idx" ON "team_members_blocks_cta" USING btree ("_order");
  CREATE INDEX "team_members_blocks_cta_parent_id_idx" ON "team_members_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_cta_path_idx" ON "team_members_blocks_cta" USING btree ("_path");
  CREATE INDEX "team_members_blocks_cta_cover_image_idx" ON "team_members_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "team_members_blocks_cards_order_idx" ON "team_members_blocks_cards" USING btree ("_order");
  CREATE INDEX "team_members_blocks_cards_parent_id_idx" ON "team_members_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_cards_path_idx" ON "team_members_blocks_cards" USING btree ("_path");
  CREATE INDEX "team_members_blocks_cards_industry_idx" ON "team_members_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "team_members_blocks_cards_service_idx" ON "team_members_blocks_cards" USING btree ("service_id");
  CREATE INDEX "team_members_blocks_cards_category_idx" ON "team_members_blocks_cards" USING btree ("category_id");
  CREATE INDEX "team_members_blocks_cards_service_group_idx" ON "team_members_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "team_members_blocks_embed_order_idx" ON "team_members_blocks_embed" USING btree ("_order");
  CREATE INDEX "team_members_blocks_embed_parent_id_idx" ON "team_members_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_embed_path_idx" ON "team_members_blocks_embed" USING btree ("_path");
  CREATE INDEX "team_members_blocks_embed_thumbnail_idx" ON "team_members_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "team_members_blocks_hubspot_form_order_idx" ON "team_members_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "team_members_blocks_hubspot_form_parent_id_idx" ON "team_members_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "team_members_blocks_hubspot_form_path_idx" ON "team_members_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "team_members_expertise_order_idx" ON "team_members_expertise" USING btree ("_order");
  CREATE INDEX "team_members_expertise_parent_id_idx" ON "team_members_expertise" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "team_members_slug_idx" ON "team_members" USING btree ("slug");
  CREATE INDEX "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
  CREATE INDEX "team_members_seo_seo_og_image_idx" ON "team_members" USING btree ("seo_og_image_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE INDEX "team_members__status_idx" ON "team_members" USING btree ("_status");
  CREATE INDEX "team_members_rels_order_idx" ON "team_members_rels" USING btree ("order");
  CREATE INDEX "team_members_rels_parent_idx" ON "team_members_rels" USING btree ("parent_id");
  CREATE INDEX "team_members_rels_path_idx" ON "team_members_rels" USING btree ("path");
  CREATE INDEX "team_members_rels_testimonials_id_idx" ON "team_members_rels" USING btree ("testimonials_id");
  CREATE INDEX "team_members_rels_case_studies_id_idx" ON "team_members_rels" USING btree ("case_studies_id");
  CREATE INDEX "team_members_rels_posts_id_idx" ON "team_members_rels" USING btree ("posts_id");
  CREATE INDEX "team_members_rels_services_id_idx" ON "team_members_rels" USING btree ("services_id");
  CREATE INDEX "team_members_rels_industries_id_idx" ON "team_members_rels" USING btree ("industries_id");
  CREATE INDEX "team_members_rels_workshops_id_idx" ON "team_members_rels" USING btree ("workshops_id");
  CREATE INDEX "team_members_rels_team_members_id_idx" ON "team_members_rels" USING btree ("team_members_id");
  CREATE INDEX "team_members_rels_locations_id_idx" ON "team_members_rels" USING btree ("locations_id");
  CREATE INDEX "team_members_rels_partners_id_idx" ON "team_members_rels" USING btree ("partners_id");
  CREATE INDEX "_team_members_v_blocks_hero_order_idx" ON "_team_members_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_hero_parent_id_idx" ON "_team_members_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_hero_path_idx" ON "_team_members_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_hero_media_idx" ON "_team_members_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_team_members_v_blocks_content_order_idx" ON "_team_members_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_content_parent_id_idx" ON "_team_members_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_content_path_idx" ON "_team_members_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_media_text_order_idx" ON "_team_members_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_media_text_parent_id_idx" ON "_team_members_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_media_text_path_idx" ON "_team_members_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_media_text_media_idx" ON "_team_members_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_team_members_v_blocks_items_items_order_idx" ON "_team_members_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_items_items_parent_id_idx" ON "_team_members_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_items_items_image_idx" ON "_team_members_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_team_members_v_blocks_items_order_idx" ON "_team_members_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_items_parent_id_idx" ON "_team_members_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_items_path_idx" ON "_team_members_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_image_order_idx" ON "_team_members_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_image_parent_id_idx" ON "_team_members_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_image_path_idx" ON "_team_members_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_image_image_idx" ON "_team_members_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_team_members_v_blocks_gallery_items_order_idx" ON "_team_members_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_gallery_items_parent_id_idx" ON "_team_members_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_gallery_items_image_idx" ON "_team_members_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_team_members_v_blocks_gallery_order_idx" ON "_team_members_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_gallery_parent_id_idx" ON "_team_members_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_gallery_path_idx" ON "_team_members_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_table_columns_order_idx" ON "_team_members_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_table_columns_parent_id_idx" ON "_team_members_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_table_rows_cells_order_idx" ON "_team_members_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_table_rows_cells_parent_id_idx" ON "_team_members_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_table_rows_order_idx" ON "_team_members_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_table_rows_parent_id_idx" ON "_team_members_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_table_best_for_row_order_idx" ON "_team_members_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_table_best_for_row_parent_id_idx" ON "_team_members_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_table_order_idx" ON "_team_members_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_table_parent_id_idx" ON "_team_members_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_table_path_idx" ON "_team_members_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_accordion_items_order_idx" ON "_team_members_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_accordion_items_parent_id_idx" ON "_team_members_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_accordion_order_idx" ON "_team_members_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_accordion_parent_id_idx" ON "_team_members_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_accordion_path_idx" ON "_team_members_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_quote_order_idx" ON "_team_members_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_quote_parent_id_idx" ON "_team_members_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_quote_path_idx" ON "_team_members_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_cta_order_idx" ON "_team_members_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_cta_parent_id_idx" ON "_team_members_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_cta_path_idx" ON "_team_members_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_cta_cover_image_idx" ON "_team_members_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_team_members_v_blocks_cards_order_idx" ON "_team_members_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_cards_parent_id_idx" ON "_team_members_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_cards_path_idx" ON "_team_members_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_cards_industry_idx" ON "_team_members_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_team_members_v_blocks_cards_service_idx" ON "_team_members_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_team_members_v_blocks_cards_category_idx" ON "_team_members_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_team_members_v_blocks_cards_service_group_idx" ON "_team_members_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_team_members_v_blocks_embed_order_idx" ON "_team_members_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_embed_parent_id_idx" ON "_team_members_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_embed_path_idx" ON "_team_members_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_team_members_v_blocks_embed_thumbnail_idx" ON "_team_members_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_team_members_v_blocks_hubspot_form_order_idx" ON "_team_members_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_team_members_v_blocks_hubspot_form_parent_id_idx" ON "_team_members_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_blocks_hubspot_form_path_idx" ON "_team_members_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_team_members_v_version_expertise_order_idx" ON "_team_members_v_version_expertise" USING btree ("_order");
  CREATE INDEX "_team_members_v_version_expertise_parent_id_idx" ON "_team_members_v_version_expertise" USING btree ("_parent_id");
  CREATE INDEX "_team_members_v_parent_idx" ON "_team_members_v" USING btree ("parent_id");
  CREATE INDEX "_team_members_v_version_version_slug_idx" ON "_team_members_v" USING btree ("version_slug");
  CREATE INDEX "_team_members_v_version_version_photo_idx" ON "_team_members_v" USING btree ("version_photo_id");
  CREATE INDEX "_team_members_v_version_seo_version_seo_og_image_idx" ON "_team_members_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_team_members_v_version_version_updated_at_idx" ON "_team_members_v" USING btree ("version_updated_at");
  CREATE INDEX "_team_members_v_version_version_created_at_idx" ON "_team_members_v" USING btree ("version_created_at");
  CREATE INDEX "_team_members_v_version_version__status_idx" ON "_team_members_v" USING btree ("version__status");
  CREATE INDEX "_team_members_v_created_at_idx" ON "_team_members_v" USING btree ("created_at");
  CREATE INDEX "_team_members_v_updated_at_idx" ON "_team_members_v" USING btree ("updated_at");
  CREATE INDEX "_team_members_v_latest_idx" ON "_team_members_v" USING btree ("latest");
  CREATE INDEX "_team_members_v_rels_order_idx" ON "_team_members_v_rels" USING btree ("order");
  CREATE INDEX "_team_members_v_rels_parent_idx" ON "_team_members_v_rels" USING btree ("parent_id");
  CREATE INDEX "_team_members_v_rels_path_idx" ON "_team_members_v_rels" USING btree ("path");
  CREATE INDEX "_team_members_v_rels_testimonials_id_idx" ON "_team_members_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_team_members_v_rels_case_studies_id_idx" ON "_team_members_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_team_members_v_rels_posts_id_idx" ON "_team_members_v_rels" USING btree ("posts_id");
  CREATE INDEX "_team_members_v_rels_services_id_idx" ON "_team_members_v_rels" USING btree ("services_id");
  CREATE INDEX "_team_members_v_rels_industries_id_idx" ON "_team_members_v_rels" USING btree ("industries_id");
  CREATE INDEX "_team_members_v_rels_workshops_id_idx" ON "_team_members_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_team_members_v_rels_team_members_id_idx" ON "_team_members_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_team_members_v_rels_locations_id_idx" ON "_team_members_v_rels" USING btree ("locations_id");
  CREATE INDEX "_team_members_v_rels_partners_id_idx" ON "_team_members_v_rels" USING btree ("partners_id");
  CREATE INDEX "partners_blocks_hero_order_idx" ON "partners_blocks_hero" USING btree ("_order");
  CREATE INDEX "partners_blocks_hero_parent_id_idx" ON "partners_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_hero_path_idx" ON "partners_blocks_hero" USING btree ("_path");
  CREATE INDEX "partners_blocks_hero_media_idx" ON "partners_blocks_hero" USING btree ("media_id");
  CREATE INDEX "partners_blocks_content_order_idx" ON "partners_blocks_content" USING btree ("_order");
  CREATE INDEX "partners_blocks_content_parent_id_idx" ON "partners_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_content_path_idx" ON "partners_blocks_content" USING btree ("_path");
  CREATE INDEX "partners_blocks_media_text_order_idx" ON "partners_blocks_media_text" USING btree ("_order");
  CREATE INDEX "partners_blocks_media_text_parent_id_idx" ON "partners_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_media_text_path_idx" ON "partners_blocks_media_text" USING btree ("_path");
  CREATE INDEX "partners_blocks_media_text_media_idx" ON "partners_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "partners_blocks_items_items_order_idx" ON "partners_blocks_items_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_items_items_parent_id_idx" ON "partners_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_items_items_image_idx" ON "partners_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "partners_blocks_items_order_idx" ON "partners_blocks_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_items_parent_id_idx" ON "partners_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_items_path_idx" ON "partners_blocks_items" USING btree ("_path");
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
  CREATE INDEX "partners_blocks_table_columns_order_idx" ON "partners_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "partners_blocks_table_columns_parent_id_idx" ON "partners_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_table_rows_cells_order_idx" ON "partners_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "partners_blocks_table_rows_cells_parent_id_idx" ON "partners_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_table_rows_order_idx" ON "partners_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "partners_blocks_table_rows_parent_id_idx" ON "partners_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_table_best_for_row_order_idx" ON "partners_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "partners_blocks_table_best_for_row_parent_id_idx" ON "partners_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_table_order_idx" ON "partners_blocks_table" USING btree ("_order");
  CREATE INDEX "partners_blocks_table_parent_id_idx" ON "partners_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_table_path_idx" ON "partners_blocks_table" USING btree ("_path");
  CREATE INDEX "partners_blocks_accordion_items_order_idx" ON "partners_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "partners_blocks_accordion_items_parent_id_idx" ON "partners_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_accordion_order_idx" ON "partners_blocks_accordion" USING btree ("_order");
  CREATE INDEX "partners_blocks_accordion_parent_id_idx" ON "partners_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_accordion_path_idx" ON "partners_blocks_accordion" USING btree ("_path");
  CREATE INDEX "partners_blocks_quote_order_idx" ON "partners_blocks_quote" USING btree ("_order");
  CREATE INDEX "partners_blocks_quote_parent_id_idx" ON "partners_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_quote_path_idx" ON "partners_blocks_quote" USING btree ("_path");
  CREATE INDEX "partners_blocks_cta_order_idx" ON "partners_blocks_cta" USING btree ("_order");
  CREATE INDEX "partners_blocks_cta_parent_id_idx" ON "partners_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_cta_path_idx" ON "partners_blocks_cta" USING btree ("_path");
  CREATE INDEX "partners_blocks_cta_cover_image_idx" ON "partners_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "partners_blocks_cards_order_idx" ON "partners_blocks_cards" USING btree ("_order");
  CREATE INDEX "partners_blocks_cards_parent_id_idx" ON "partners_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_cards_path_idx" ON "partners_blocks_cards" USING btree ("_path");
  CREATE INDEX "partners_blocks_cards_industry_idx" ON "partners_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "partners_blocks_cards_service_idx" ON "partners_blocks_cards" USING btree ("service_id");
  CREATE INDEX "partners_blocks_cards_category_idx" ON "partners_blocks_cards" USING btree ("category_id");
  CREATE INDEX "partners_blocks_cards_service_group_idx" ON "partners_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "partners_blocks_embed_order_idx" ON "partners_blocks_embed" USING btree ("_order");
  CREATE INDEX "partners_blocks_embed_parent_id_idx" ON "partners_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_embed_path_idx" ON "partners_blocks_embed" USING btree ("_path");
  CREATE INDEX "partners_blocks_embed_thumbnail_idx" ON "partners_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "partners_blocks_hubspot_form_order_idx" ON "partners_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "partners_blocks_hubspot_form_parent_id_idx" ON "partners_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "partners_blocks_hubspot_form_path_idx" ON "partners_blocks_hubspot_form" USING btree ("_path");
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
  CREATE INDEX "partners_rels_posts_id_idx" ON "partners_rels" USING btree ("posts_id");
  CREATE INDEX "partners_rels_services_id_idx" ON "partners_rels" USING btree ("services_id");
  CREATE INDEX "partners_rels_industries_id_idx" ON "partners_rels" USING btree ("industries_id");
  CREATE INDEX "partners_rels_workshops_id_idx" ON "partners_rels" USING btree ("workshops_id");
  CREATE INDEX "partners_rels_team_members_id_idx" ON "partners_rels" USING btree ("team_members_id");
  CREATE INDEX "partners_rels_locations_id_idx" ON "partners_rels" USING btree ("locations_id");
  CREATE INDEX "partners_rels_partners_id_idx" ON "partners_rels" USING btree ("partners_id");
  CREATE INDEX "_partners_v_blocks_hero_order_idx" ON "_partners_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_hero_parent_id_idx" ON "_partners_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_hero_path_idx" ON "_partners_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_hero_media_idx" ON "_partners_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_partners_v_blocks_content_order_idx" ON "_partners_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_content_parent_id_idx" ON "_partners_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_content_path_idx" ON "_partners_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_media_text_order_idx" ON "_partners_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_media_text_parent_id_idx" ON "_partners_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_media_text_path_idx" ON "_partners_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_media_text_media_idx" ON "_partners_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_partners_v_blocks_items_items_order_idx" ON "_partners_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_items_items_parent_id_idx" ON "_partners_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_items_items_image_idx" ON "_partners_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_partners_v_blocks_items_order_idx" ON "_partners_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_items_parent_id_idx" ON "_partners_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_items_path_idx" ON "_partners_v_blocks_items" USING btree ("_path");
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
  CREATE INDEX "_partners_v_blocks_table_columns_order_idx" ON "_partners_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_table_columns_parent_id_idx" ON "_partners_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_table_rows_cells_order_idx" ON "_partners_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_table_rows_cells_parent_id_idx" ON "_partners_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_table_rows_order_idx" ON "_partners_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_table_rows_parent_id_idx" ON "_partners_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_table_best_for_row_order_idx" ON "_partners_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_table_best_for_row_parent_id_idx" ON "_partners_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_table_order_idx" ON "_partners_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_table_parent_id_idx" ON "_partners_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_table_path_idx" ON "_partners_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_accordion_items_order_idx" ON "_partners_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_accordion_items_parent_id_idx" ON "_partners_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_accordion_order_idx" ON "_partners_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_accordion_parent_id_idx" ON "_partners_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_accordion_path_idx" ON "_partners_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_quote_order_idx" ON "_partners_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_quote_parent_id_idx" ON "_partners_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_quote_path_idx" ON "_partners_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_cta_order_idx" ON "_partners_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_cta_parent_id_idx" ON "_partners_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_cta_path_idx" ON "_partners_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_cta_cover_image_idx" ON "_partners_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_partners_v_blocks_cards_order_idx" ON "_partners_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_cards_parent_id_idx" ON "_partners_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_cards_path_idx" ON "_partners_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_cards_industry_idx" ON "_partners_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_partners_v_blocks_cards_service_idx" ON "_partners_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_partners_v_blocks_cards_category_idx" ON "_partners_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_partners_v_blocks_cards_service_group_idx" ON "_partners_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_partners_v_blocks_embed_order_idx" ON "_partners_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_embed_parent_id_idx" ON "_partners_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_embed_path_idx" ON "_partners_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_partners_v_blocks_embed_thumbnail_idx" ON "_partners_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_partners_v_blocks_hubspot_form_order_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_partners_v_blocks_hubspot_form_parent_id_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_partners_v_blocks_hubspot_form_path_idx" ON "_partners_v_blocks_hubspot_form" USING btree ("_path");
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
  CREATE INDEX "_partners_v_rels_posts_id_idx" ON "_partners_v_rels" USING btree ("posts_id");
  CREATE INDEX "_partners_v_rels_services_id_idx" ON "_partners_v_rels" USING btree ("services_id");
  CREATE INDEX "_partners_v_rels_industries_id_idx" ON "_partners_v_rels" USING btree ("industries_id");
  CREATE INDEX "_partners_v_rels_workshops_id_idx" ON "_partners_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_partners_v_rels_team_members_id_idx" ON "_partners_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_partners_v_rels_locations_id_idx" ON "_partners_v_rels" USING btree ("locations_id");
  CREATE INDEX "_partners_v_rels_partners_id_idx" ON "_partners_v_rels" USING btree ("partners_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_mobile_webp_sizes_mobile_webp_filename_idx" ON "media" USING btree ("sizes_mobile_webp_filename");
  CREATE INDEX "media_sizes_mobile_jpeg_sizes_mobile_jpeg_filename_idx" ON "media" USING btree ("sizes_mobile_jpeg_filename");
  CREATE INDEX "media_sizes_tablet_webp_sizes_tablet_webp_filename_idx" ON "media" USING btree ("sizes_tablet_webp_filename");
  CREATE INDEX "media_sizes_tablet_jpeg_sizes_tablet_jpeg_filename_idx" ON "media" USING btree ("sizes_tablet_jpeg_filename");
  CREATE INDEX "media_sizes_desktop_webp_sizes_desktop_webp_filename_idx" ON "media" USING btree ("sizes_desktop_webp_filename");
  CREATE INDEX "media_sizes_desktop_jpeg_sizes_desktop_jpeg_filename_idx" ON "media" USING btree ("sizes_desktop_jpeg_filename");
  CREATE INDEX "media_sizes_wide_webp_sizes_wide_webp_filename_idx" ON "media" USING btree ("sizes_wide_webp_filename");
  CREATE INDEX "media_sizes_wide_jpeg_sizes_wide_jpeg_filename_idx" ON "media" USING btree ("sizes_wide_jpeg_filename");
  CREATE INDEX "navigation_groups_items_order_idx" ON "navigation_groups_items" USING btree ("_order");
  CREATE INDEX "navigation_groups_items_parent_id_idx" ON "navigation_groups_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_groups_order_idx" ON "navigation_groups" USING btree ("_order");
  CREATE INDEX "navigation_groups_parent_id_idx" ON "navigation_groups" USING btree ("_parent_id");
  CREATE INDEX "navigation_updated_at_idx" ON "navigation" USING btree ("updated_at");
  CREATE INDEX "navigation_created_at_idx" ON "navigation" USING btree ("created_at");
  CREATE INDEX "navigation__status_idx" ON "navigation" USING btree ("_status");
  CREATE INDEX "navigation_rels_order_idx" ON "navigation_rels" USING btree ("order");
  CREATE INDEX "navigation_rels_parent_idx" ON "navigation_rels" USING btree ("parent_id");
  CREATE INDEX "navigation_rels_path_idx" ON "navigation_rels" USING btree ("path");
  CREATE INDEX "navigation_rels_pages_id_idx" ON "navigation_rels" USING btree ("pages_id");
  CREATE INDEX "navigation_rels_services_id_idx" ON "navigation_rels" USING btree ("services_id");
  CREATE INDEX "navigation_rels_workshops_id_idx" ON "navigation_rels" USING btree ("workshops_id");
  CREATE INDEX "navigation_rels_industries_id_idx" ON "navigation_rels" USING btree ("industries_id");
  CREATE INDEX "navigation_rels_posts_id_idx" ON "navigation_rels" USING btree ("posts_id");
  CREATE INDEX "navigation_rels_case_studies_id_idx" ON "navigation_rels" USING btree ("case_studies_id");
  CREATE INDEX "navigation_rels_partners_id_idx" ON "navigation_rels" USING btree ("partners_id");
  CREATE INDEX "_navigation_v_version_groups_items_order_idx" ON "_navigation_v_version_groups_items" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_groups_items_parent_id_idx" ON "_navigation_v_version_groups_items" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_groups_order_idx" ON "_navigation_v_version_groups" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_groups_parent_id_idx" ON "_navigation_v_version_groups" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_parent_idx" ON "_navigation_v" USING btree ("parent_id");
  CREATE INDEX "_navigation_v_version_version_updated_at_idx" ON "_navigation_v" USING btree ("version_updated_at");
  CREATE INDEX "_navigation_v_version_version_created_at_idx" ON "_navigation_v" USING btree ("version_created_at");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_latest_idx" ON "_navigation_v" USING btree ("latest");
  CREATE INDEX "_navigation_v_rels_order_idx" ON "_navigation_v_rels" USING btree ("order");
  CREATE INDEX "_navigation_v_rels_parent_idx" ON "_navigation_v_rels" USING btree ("parent_id");
  CREATE INDEX "_navigation_v_rels_path_idx" ON "_navigation_v_rels" USING btree ("path");
  CREATE INDEX "_navigation_v_rels_pages_id_idx" ON "_navigation_v_rels" USING btree ("pages_id");
  CREATE INDEX "_navigation_v_rels_services_id_idx" ON "_navigation_v_rels" USING btree ("services_id");
  CREATE INDEX "_navigation_v_rels_workshops_id_idx" ON "_navigation_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_navigation_v_rels_industries_id_idx" ON "_navigation_v_rels" USING btree ("industries_id");
  CREATE INDEX "_navigation_v_rels_posts_id_idx" ON "_navigation_v_rels" USING btree ("posts_id");
  CREATE INDEX "_navigation_v_rels_case_studies_id_idx" ON "_navigation_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_navigation_v_rels_partners_id_idx" ON "_navigation_v_rels" USING btree ("partners_id");
  CREATE INDEX "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX "testimonials_case_study_idx" ON "testimonials" USING btree ("case_study_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "locations_slug_idx" ON "locations" USING btree ("slug");
  CREATE INDEX "locations_seo_seo_og_image_idx" ON "locations" USING btree ("seo_og_image_id");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE INDEX "locations__status_idx" ON "locations" USING btree ("_status");
  CREATE INDEX "_locations_v_parent_idx" ON "_locations_v" USING btree ("parent_id");
  CREATE INDEX "_locations_v_version_version_slug_idx" ON "_locations_v" USING btree ("version_slug");
  CREATE INDEX "_locations_v_version_seo_version_seo_og_image_idx" ON "_locations_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_locations_v_version_version_updated_at_idx" ON "_locations_v" USING btree ("version_updated_at");
  CREATE INDEX "_locations_v_version_version_created_at_idx" ON "_locations_v" USING btree ("version_created_at");
  CREATE INDEX "_locations_v_version_version__status_idx" ON "_locations_v" USING btree ("version__status");
  CREATE INDEX "_locations_v_created_at_idx" ON "_locations_v" USING btree ("created_at");
  CREATE INDEX "_locations_v_updated_at_idx" ON "_locations_v" USING btree ("updated_at");
  CREATE INDEX "_locations_v_latest_idx" ON "_locations_v" USING btree ("latest");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_google_sub_idx" ON "users" USING btree ("google_sub");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_case_studies_id_idx" ON "payload_locked_documents_rels" USING btree ("case_studies_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_industries_id_idx" ON "payload_locked_documents_rels" USING btree ("industries_id");
  CREATE INDEX "payload_locked_documents_rels_workshops_id_idx" ON "payload_locked_documents_rels" USING btree ("workshops_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_navigation_id_idx" ON "payload_locked_documents_rels" USING btree ("navigation_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_media_idx" ON "homepage_blocks_hero" USING btree ("media_id");
  CREATE INDEX "homepage_blocks_content_order_idx" ON "homepage_blocks_content" USING btree ("_order");
  CREATE INDEX "homepage_blocks_content_parent_id_idx" ON "homepage_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_content_path_idx" ON "homepage_blocks_content" USING btree ("_path");
  CREATE INDEX "homepage_blocks_media_text_order_idx" ON "homepage_blocks_media_text" USING btree ("_order");
  CREATE INDEX "homepage_blocks_media_text_parent_id_idx" ON "homepage_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_media_text_path_idx" ON "homepage_blocks_media_text" USING btree ("_path");
  CREATE INDEX "homepage_blocks_media_text_media_idx" ON "homepage_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "homepage_blocks_items_items_order_idx" ON "homepage_blocks_items_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_items_items_parent_id_idx" ON "homepage_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_items_items_image_idx" ON "homepage_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_items_order_idx" ON "homepage_blocks_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_items_parent_id_idx" ON "homepage_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_items_path_idx" ON "homepage_blocks_items" USING btree ("_path");
  CREATE INDEX "homepage_blocks_image_order_idx" ON "homepage_blocks_image" USING btree ("_order");
  CREATE INDEX "homepage_blocks_image_parent_id_idx" ON "homepage_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_image_path_idx" ON "homepage_blocks_image" USING btree ("_path");
  CREATE INDEX "homepage_blocks_image_image_idx" ON "homepage_blocks_image" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_gallery_items_order_idx" ON "homepage_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_gallery_items_parent_id_idx" ON "homepage_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_gallery_items_image_idx" ON "homepage_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_gallery_order_idx" ON "homepage_blocks_gallery" USING btree ("_order");
  CREATE INDEX "homepage_blocks_gallery_parent_id_idx" ON "homepage_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_gallery_path_idx" ON "homepage_blocks_gallery" USING btree ("_path");
  CREATE INDEX "homepage_blocks_table_columns_order_idx" ON "homepage_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "homepage_blocks_table_columns_parent_id_idx" ON "homepage_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_table_rows_cells_order_idx" ON "homepage_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "homepage_blocks_table_rows_cells_parent_id_idx" ON "homepage_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_table_rows_order_idx" ON "homepage_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "homepage_blocks_table_rows_parent_id_idx" ON "homepage_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_table_best_for_row_order_idx" ON "homepage_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "homepage_blocks_table_best_for_row_parent_id_idx" ON "homepage_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_table_order_idx" ON "homepage_blocks_table" USING btree ("_order");
  CREATE INDEX "homepage_blocks_table_parent_id_idx" ON "homepage_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_table_path_idx" ON "homepage_blocks_table" USING btree ("_path");
  CREATE INDEX "homepage_blocks_accordion_items_order_idx" ON "homepage_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_accordion_items_parent_id_idx" ON "homepage_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_accordion_order_idx" ON "homepage_blocks_accordion" USING btree ("_order");
  CREATE INDEX "homepage_blocks_accordion_parent_id_idx" ON "homepage_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_accordion_path_idx" ON "homepage_blocks_accordion" USING btree ("_path");
  CREATE INDEX "homepage_blocks_quote_order_idx" ON "homepage_blocks_quote" USING btree ("_order");
  CREATE INDEX "homepage_blocks_quote_parent_id_idx" ON "homepage_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_quote_path_idx" ON "homepage_blocks_quote" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta_order_idx" ON "homepage_blocks_cta" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta_parent_id_idx" ON "homepage_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta_path_idx" ON "homepage_blocks_cta" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta_cover_image_idx" ON "homepage_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "homepage_blocks_cards_order_idx" ON "homepage_blocks_cards" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cards_parent_id_idx" ON "homepage_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cards_path_idx" ON "homepage_blocks_cards" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cards_industry_idx" ON "homepage_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "homepage_blocks_cards_service_idx" ON "homepage_blocks_cards" USING btree ("service_id");
  CREATE INDEX "homepage_blocks_cards_category_idx" ON "homepage_blocks_cards" USING btree ("category_id");
  CREATE INDEX "homepage_blocks_cards_service_group_idx" ON "homepage_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "homepage_blocks_embed_order_idx" ON "homepage_blocks_embed" USING btree ("_order");
  CREATE INDEX "homepage_blocks_embed_parent_id_idx" ON "homepage_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_embed_path_idx" ON "homepage_blocks_embed" USING btree ("_path");
  CREATE INDEX "homepage_blocks_embed_thumbnail_idx" ON "homepage_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "homepage_blocks_hubspot_form_order_idx" ON "homepage_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hubspot_form_parent_id_idx" ON "homepage_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hubspot_form_path_idx" ON "homepage_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_testimonials_id_idx" ON "homepage_rels" USING btree ("testimonials_id");
  CREATE INDEX "homepage_rels_case_studies_id_idx" ON "homepage_rels" USING btree ("case_studies_id");
  CREATE INDEX "homepage_rels_posts_id_idx" ON "homepage_rels" USING btree ("posts_id");
  CREATE INDEX "homepage_rels_services_id_idx" ON "homepage_rels" USING btree ("services_id");
  CREATE INDEX "homepage_rels_industries_id_idx" ON "homepage_rels" USING btree ("industries_id");
  CREATE INDEX "homepage_rels_workshops_id_idx" ON "homepage_rels" USING btree ("workshops_id");
  CREATE INDEX "homepage_rels_team_members_id_idx" ON "homepage_rels" USING btree ("team_members_id");
  CREATE INDEX "homepage_rels_locations_id_idx" ON "homepage_rels" USING btree ("locations_id");
  CREATE INDEX "homepage_rels_partners_id_idx" ON "homepage_rels" USING btree ("partners_id");
  CREATE INDEX "_homepage_v_blocks_hero_order_idx" ON "_homepage_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero_parent_id_idx" ON "_homepage_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero_path_idx" ON "_homepage_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero_media_idx" ON "_homepage_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_homepage_v_blocks_content_order_idx" ON "_homepage_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_content_parent_id_idx" ON "_homepage_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_content_path_idx" ON "_homepage_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_media_text_order_idx" ON "_homepage_v_blocks_media_text" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_media_text_parent_id_idx" ON "_homepage_v_blocks_media_text" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_media_text_path_idx" ON "_homepage_v_blocks_media_text" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_media_text_media_idx" ON "_homepage_v_blocks_media_text" USING btree ("media_id");
  CREATE INDEX "_homepage_v_blocks_items_items_order_idx" ON "_homepage_v_blocks_items_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_items_items_parent_id_idx" ON "_homepage_v_blocks_items_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_items_items_image_idx" ON "_homepage_v_blocks_items_items" USING btree ("image_id");
  CREATE INDEX "_homepage_v_blocks_items_order_idx" ON "_homepage_v_blocks_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_items_parent_id_idx" ON "_homepage_v_blocks_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_items_path_idx" ON "_homepage_v_blocks_items" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_image_order_idx" ON "_homepage_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_image_parent_id_idx" ON "_homepage_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_image_path_idx" ON "_homepage_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_image_image_idx" ON "_homepage_v_blocks_image" USING btree ("image_id");
  CREATE INDEX "_homepage_v_blocks_gallery_items_order_idx" ON "_homepage_v_blocks_gallery_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_gallery_items_parent_id_idx" ON "_homepage_v_blocks_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_gallery_items_image_idx" ON "_homepage_v_blocks_gallery_items" USING btree ("image_id");
  CREATE INDEX "_homepage_v_blocks_gallery_order_idx" ON "_homepage_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_gallery_parent_id_idx" ON "_homepage_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_gallery_path_idx" ON "_homepage_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_table_columns_order_idx" ON "_homepage_v_blocks_table_columns" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_table_columns_parent_id_idx" ON "_homepage_v_blocks_table_columns" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_table_rows_cells_order_idx" ON "_homepage_v_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_table_rows_cells_parent_id_idx" ON "_homepage_v_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_table_rows_order_idx" ON "_homepage_v_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_table_rows_parent_id_idx" ON "_homepage_v_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_table_best_for_row_order_idx" ON "_homepage_v_blocks_table_best_for_row" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_table_best_for_row_parent_id_idx" ON "_homepage_v_blocks_table_best_for_row" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_table_order_idx" ON "_homepage_v_blocks_table" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_table_parent_id_idx" ON "_homepage_v_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_table_path_idx" ON "_homepage_v_blocks_table" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_accordion_items_order_idx" ON "_homepage_v_blocks_accordion_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_accordion_items_parent_id_idx" ON "_homepage_v_blocks_accordion_items" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_accordion_order_idx" ON "_homepage_v_blocks_accordion" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_accordion_parent_id_idx" ON "_homepage_v_blocks_accordion" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_accordion_path_idx" ON "_homepage_v_blocks_accordion" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_quote_order_idx" ON "_homepage_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_quote_parent_id_idx" ON "_homepage_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_quote_path_idx" ON "_homepage_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cta_order_idx" ON "_homepage_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cta_parent_id_idx" ON "_homepage_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cta_path_idx" ON "_homepage_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cta_cover_image_idx" ON "_homepage_v_blocks_cta" USING btree ("cover_image_id");
  CREATE INDEX "_homepage_v_blocks_cards_order_idx" ON "_homepage_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_cards_parent_id_idx" ON "_homepage_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_cards_path_idx" ON "_homepage_v_blocks_cards" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_cards_industry_idx" ON "_homepage_v_blocks_cards" USING btree ("industry_id");
  CREATE INDEX "_homepage_v_blocks_cards_service_idx" ON "_homepage_v_blocks_cards" USING btree ("service_id");
  CREATE INDEX "_homepage_v_blocks_cards_category_idx" ON "_homepage_v_blocks_cards" USING btree ("category_id");
  CREATE INDEX "_homepage_v_blocks_cards_service_group_idx" ON "_homepage_v_blocks_cards" USING btree ("service_group_id");
  CREATE INDEX "_homepage_v_blocks_embed_order_idx" ON "_homepage_v_blocks_embed" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_embed_parent_id_idx" ON "_homepage_v_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_embed_path_idx" ON "_homepage_v_blocks_embed" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_embed_thumbnail_idx" ON "_homepage_v_blocks_embed" USING btree ("thumbnail_id");
  CREATE INDEX "_homepage_v_blocks_hubspot_form_order_idx" ON "_homepage_v_blocks_hubspot_form" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hubspot_form_parent_id_idx" ON "_homepage_v_blocks_hubspot_form" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hubspot_form_path_idx" ON "_homepage_v_blocks_hubspot_form" USING btree ("_path");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_testimonials_id_idx" ON "_homepage_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "_homepage_v_rels_case_studies_id_idx" ON "_homepage_v_rels" USING btree ("case_studies_id");
  CREATE INDEX "_homepage_v_rels_posts_id_idx" ON "_homepage_v_rels" USING btree ("posts_id");
  CREATE INDEX "_homepage_v_rels_services_id_idx" ON "_homepage_v_rels" USING btree ("services_id");
  CREATE INDEX "_homepage_v_rels_industries_id_idx" ON "_homepage_v_rels" USING btree ("industries_id");
  CREATE INDEX "_homepage_v_rels_workshops_id_idx" ON "_homepage_v_rels" USING btree ("workshops_id");
  CREATE INDEX "_homepage_v_rels_team_members_id_idx" ON "_homepage_v_rels" USING btree ("team_members_id");
  CREATE INDEX "_homepage_v_rels_locations_id_idx" ON "_homepage_v_rels" USING btree ("locations_id");
  CREATE INDEX "_homepage_v_rels_partners_id_idx" ON "_homepage_v_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_content" CASCADE;
  DROP TABLE "pages_blocks_media_text" CASCADE;
  DROP TABLE "pages_blocks_items_items" CASCADE;
  DROP TABLE "pages_blocks_items" CASCADE;
  DROP TABLE "pages_blocks_image" CASCADE;
  DROP TABLE "pages_blocks_gallery_items" CASCADE;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_table_columns" CASCADE;
  DROP TABLE "pages_blocks_table_rows_cells" CASCADE;
  DROP TABLE "pages_blocks_table_rows" CASCADE;
  DROP TABLE "pages_blocks_table_best_for_row" CASCADE;
  DROP TABLE "pages_blocks_table" CASCADE;
  DROP TABLE "pages_blocks_accordion_items" CASCADE;
  DROP TABLE "pages_blocks_accordion" CASCADE;
  DROP TABLE "pages_blocks_quote" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_cards" CASCADE;
  DROP TABLE "pages_blocks_embed" CASCADE;
  DROP TABLE "pages_blocks_hubspot_form" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_content" CASCADE;
  DROP TABLE "_pages_v_blocks_media_text" CASCADE;
  DROP TABLE "_pages_v_blocks_items_items" CASCADE;
  DROP TABLE "_pages_v_blocks_items" CASCADE;
  DROP TABLE "_pages_v_blocks_image" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_table_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_pages_v_blocks_table_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_pages_v_blocks_table" CASCADE;
  DROP TABLE "_pages_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_pages_v_blocks_accordion" CASCADE;
  DROP TABLE "_pages_v_blocks_quote" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_embed" CASCADE;
  DROP TABLE "_pages_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "case_studies_blocks_hero" CASCADE;
  DROP TABLE "case_studies_blocks_content" CASCADE;
  DROP TABLE "case_studies_blocks_media_text" CASCADE;
  DROP TABLE "case_studies_blocks_items_items" CASCADE;
  DROP TABLE "case_studies_blocks_items" CASCADE;
  DROP TABLE "case_studies_blocks_image" CASCADE;
  DROP TABLE "case_studies_blocks_gallery_items" CASCADE;
  DROP TABLE "case_studies_blocks_gallery" CASCADE;
  DROP TABLE "case_studies_blocks_table_columns" CASCADE;
  DROP TABLE "case_studies_blocks_table_rows_cells" CASCADE;
  DROP TABLE "case_studies_blocks_table_rows" CASCADE;
  DROP TABLE "case_studies_blocks_table_best_for_row" CASCADE;
  DROP TABLE "case_studies_blocks_table" CASCADE;
  DROP TABLE "case_studies_blocks_accordion_items" CASCADE;
  DROP TABLE "case_studies_blocks_accordion" CASCADE;
  DROP TABLE "case_studies_blocks_quote" CASCADE;
  DROP TABLE "case_studies_blocks_cta" CASCADE;
  DROP TABLE "case_studies_blocks_cards" CASCADE;
  DROP TABLE "case_studies_blocks_embed" CASCADE;
  DROP TABLE "case_studies_blocks_hubspot_form" CASCADE;
  DROP TABLE "case_studies" CASCADE;
  DROP TABLE "case_studies_rels" CASCADE;
  DROP TABLE "_case_studies_v_blocks_hero" CASCADE;
  DROP TABLE "_case_studies_v_blocks_content" CASCADE;
  DROP TABLE "_case_studies_v_blocks_media_text" CASCADE;
  DROP TABLE "_case_studies_v_blocks_items_items" CASCADE;
  DROP TABLE "_case_studies_v_blocks_items" CASCADE;
  DROP TABLE "_case_studies_v_blocks_image" CASCADE;
  DROP TABLE "_case_studies_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_case_studies_v_blocks_gallery" CASCADE;
  DROP TABLE "_case_studies_v_blocks_table_columns" CASCADE;
  DROP TABLE "_case_studies_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_case_studies_v_blocks_table_rows" CASCADE;
  DROP TABLE "_case_studies_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_case_studies_v_blocks_table" CASCADE;
  DROP TABLE "_case_studies_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_case_studies_v_blocks_accordion" CASCADE;
  DROP TABLE "_case_studies_v_blocks_quote" CASCADE;
  DROP TABLE "_case_studies_v_blocks_cta" CASCADE;
  DROP TABLE "_case_studies_v_blocks_cards" CASCADE;
  DROP TABLE "_case_studies_v_blocks_embed" CASCADE;
  DROP TABLE "_case_studies_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_case_studies_v" CASCADE;
  DROP TABLE "_case_studies_v_rels" CASCADE;
  DROP TABLE "services_blocks_hero" CASCADE;
  DROP TABLE "services_blocks_content" CASCADE;
  DROP TABLE "services_blocks_media_text" CASCADE;
  DROP TABLE "services_blocks_items_items" CASCADE;
  DROP TABLE "services_blocks_items" CASCADE;
  DROP TABLE "services_blocks_image" CASCADE;
  DROP TABLE "services_blocks_gallery_items" CASCADE;
  DROP TABLE "services_blocks_gallery" CASCADE;
  DROP TABLE "services_blocks_table_columns" CASCADE;
  DROP TABLE "services_blocks_table_rows_cells" CASCADE;
  DROP TABLE "services_blocks_table_rows" CASCADE;
  DROP TABLE "services_blocks_table_best_for_row" CASCADE;
  DROP TABLE "services_blocks_table" CASCADE;
  DROP TABLE "services_blocks_accordion_items" CASCADE;
  DROP TABLE "services_blocks_accordion" CASCADE;
  DROP TABLE "services_blocks_quote" CASCADE;
  DROP TABLE "services_blocks_cta" CASCADE;
  DROP TABLE "services_blocks_cards" CASCADE;
  DROP TABLE "services_blocks_embed" CASCADE;
  DROP TABLE "services_blocks_hubspot_form" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "_services_v_blocks_hero" CASCADE;
  DROP TABLE "_services_v_blocks_content" CASCADE;
  DROP TABLE "_services_v_blocks_media_text" CASCADE;
  DROP TABLE "_services_v_blocks_items_items" CASCADE;
  DROP TABLE "_services_v_blocks_items" CASCADE;
  DROP TABLE "_services_v_blocks_image" CASCADE;
  DROP TABLE "_services_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_services_v_blocks_gallery" CASCADE;
  DROP TABLE "_services_v_blocks_table_columns" CASCADE;
  DROP TABLE "_services_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_services_v_blocks_table_rows" CASCADE;
  DROP TABLE "_services_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_services_v_blocks_table" CASCADE;
  DROP TABLE "_services_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_services_v_blocks_accordion" CASCADE;
  DROP TABLE "_services_v_blocks_quote" CASCADE;
  DROP TABLE "_services_v_blocks_cta" CASCADE;
  DROP TABLE "_services_v_blocks_cards" CASCADE;
  DROP TABLE "_services_v_blocks_embed" CASCADE;
  DROP TABLE "_services_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_rels" CASCADE;
  DROP TABLE "industries_client_logos" CASCADE;
  DROP TABLE "industries_blocks_hero" CASCADE;
  DROP TABLE "industries_blocks_content" CASCADE;
  DROP TABLE "industries_blocks_media_text" CASCADE;
  DROP TABLE "industries_blocks_items_items" CASCADE;
  DROP TABLE "industries_blocks_items" CASCADE;
  DROP TABLE "industries_blocks_image" CASCADE;
  DROP TABLE "industries_blocks_gallery_items" CASCADE;
  DROP TABLE "industries_blocks_gallery" CASCADE;
  DROP TABLE "industries_blocks_table_columns" CASCADE;
  DROP TABLE "industries_blocks_table_rows_cells" CASCADE;
  DROP TABLE "industries_blocks_table_rows" CASCADE;
  DROP TABLE "industries_blocks_table_best_for_row" CASCADE;
  DROP TABLE "industries_blocks_table" CASCADE;
  DROP TABLE "industries_blocks_accordion_items" CASCADE;
  DROP TABLE "industries_blocks_accordion" CASCADE;
  DROP TABLE "industries_blocks_quote" CASCADE;
  DROP TABLE "industries_blocks_cta" CASCADE;
  DROP TABLE "industries_blocks_cards" CASCADE;
  DROP TABLE "industries_blocks_embed" CASCADE;
  DROP TABLE "industries_blocks_hubspot_form" CASCADE;
  DROP TABLE "industries" CASCADE;
  DROP TABLE "industries_rels" CASCADE;
  DROP TABLE "_industries_v_version_client_logos" CASCADE;
  DROP TABLE "_industries_v_blocks_hero" CASCADE;
  DROP TABLE "_industries_v_blocks_content" CASCADE;
  DROP TABLE "_industries_v_blocks_media_text" CASCADE;
  DROP TABLE "_industries_v_blocks_items_items" CASCADE;
  DROP TABLE "_industries_v_blocks_items" CASCADE;
  DROP TABLE "_industries_v_blocks_image" CASCADE;
  DROP TABLE "_industries_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_industries_v_blocks_gallery" CASCADE;
  DROP TABLE "_industries_v_blocks_table_columns" CASCADE;
  DROP TABLE "_industries_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_industries_v_blocks_table_rows" CASCADE;
  DROP TABLE "_industries_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_industries_v_blocks_table" CASCADE;
  DROP TABLE "_industries_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_industries_v_blocks_accordion" CASCADE;
  DROP TABLE "_industries_v_blocks_quote" CASCADE;
  DROP TABLE "_industries_v_blocks_cta" CASCADE;
  DROP TABLE "_industries_v_blocks_cards" CASCADE;
  DROP TABLE "_industries_v_blocks_embed" CASCADE;
  DROP TABLE "_industries_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_industries_v" CASCADE;
  DROP TABLE "_industries_v_rels" CASCADE;
  DROP TABLE "workshops_blocks_hero" CASCADE;
  DROP TABLE "workshops_blocks_content" CASCADE;
  DROP TABLE "workshops_blocks_media_text" CASCADE;
  DROP TABLE "workshops_blocks_items_items" CASCADE;
  DROP TABLE "workshops_blocks_items" CASCADE;
  DROP TABLE "workshops_blocks_image" CASCADE;
  DROP TABLE "workshops_blocks_gallery_items" CASCADE;
  DROP TABLE "workshops_blocks_gallery" CASCADE;
  DROP TABLE "workshops_blocks_table_columns" CASCADE;
  DROP TABLE "workshops_blocks_table_rows_cells" CASCADE;
  DROP TABLE "workshops_blocks_table_rows" CASCADE;
  DROP TABLE "workshops_blocks_table_best_for_row" CASCADE;
  DROP TABLE "workshops_blocks_table" CASCADE;
  DROP TABLE "workshops_blocks_accordion_items" CASCADE;
  DROP TABLE "workshops_blocks_accordion" CASCADE;
  DROP TABLE "workshops_blocks_quote" CASCADE;
  DROP TABLE "workshops_blocks_cta" CASCADE;
  DROP TABLE "workshops_blocks_cards" CASCADE;
  DROP TABLE "workshops_blocks_embed" CASCADE;
  DROP TABLE "workshops_blocks_hubspot_form" CASCADE;
  DROP TABLE "workshops" CASCADE;
  DROP TABLE "workshops_rels" CASCADE;
  DROP TABLE "_workshops_v_blocks_hero" CASCADE;
  DROP TABLE "_workshops_v_blocks_content" CASCADE;
  DROP TABLE "_workshops_v_blocks_media_text" CASCADE;
  DROP TABLE "_workshops_v_blocks_items_items" CASCADE;
  DROP TABLE "_workshops_v_blocks_items" CASCADE;
  DROP TABLE "_workshops_v_blocks_image" CASCADE;
  DROP TABLE "_workshops_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_workshops_v_blocks_gallery" CASCADE;
  DROP TABLE "_workshops_v_blocks_table_columns" CASCADE;
  DROP TABLE "_workshops_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_workshops_v_blocks_table_rows" CASCADE;
  DROP TABLE "_workshops_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_workshops_v_blocks_table" CASCADE;
  DROP TABLE "_workshops_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_workshops_v_blocks_accordion" CASCADE;
  DROP TABLE "_workshops_v_blocks_quote" CASCADE;
  DROP TABLE "_workshops_v_blocks_cta" CASCADE;
  DROP TABLE "_workshops_v_blocks_cards" CASCADE;
  DROP TABLE "_workshops_v_blocks_embed" CASCADE;
  DROP TABLE "_workshops_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_workshops_v" CASCADE;
  DROP TABLE "_workshops_v_rels" CASCADE;
  DROP TABLE "team_members_blocks_hero" CASCADE;
  DROP TABLE "team_members_blocks_content" CASCADE;
  DROP TABLE "team_members_blocks_media_text" CASCADE;
  DROP TABLE "team_members_blocks_items_items" CASCADE;
  DROP TABLE "team_members_blocks_items" CASCADE;
  DROP TABLE "team_members_blocks_image" CASCADE;
  DROP TABLE "team_members_blocks_gallery_items" CASCADE;
  DROP TABLE "team_members_blocks_gallery" CASCADE;
  DROP TABLE "team_members_blocks_table_columns" CASCADE;
  DROP TABLE "team_members_blocks_table_rows_cells" CASCADE;
  DROP TABLE "team_members_blocks_table_rows" CASCADE;
  DROP TABLE "team_members_blocks_table_best_for_row" CASCADE;
  DROP TABLE "team_members_blocks_table" CASCADE;
  DROP TABLE "team_members_blocks_accordion_items" CASCADE;
  DROP TABLE "team_members_blocks_accordion" CASCADE;
  DROP TABLE "team_members_blocks_quote" CASCADE;
  DROP TABLE "team_members_blocks_cta" CASCADE;
  DROP TABLE "team_members_blocks_cards" CASCADE;
  DROP TABLE "team_members_blocks_embed" CASCADE;
  DROP TABLE "team_members_blocks_hubspot_form" CASCADE;
  DROP TABLE "team_members_expertise" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "team_members_rels" CASCADE;
  DROP TABLE "_team_members_v_blocks_hero" CASCADE;
  DROP TABLE "_team_members_v_blocks_content" CASCADE;
  DROP TABLE "_team_members_v_blocks_media_text" CASCADE;
  DROP TABLE "_team_members_v_blocks_items_items" CASCADE;
  DROP TABLE "_team_members_v_blocks_items" CASCADE;
  DROP TABLE "_team_members_v_blocks_image" CASCADE;
  DROP TABLE "_team_members_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_team_members_v_blocks_gallery" CASCADE;
  DROP TABLE "_team_members_v_blocks_table_columns" CASCADE;
  DROP TABLE "_team_members_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_team_members_v_blocks_table_rows" CASCADE;
  DROP TABLE "_team_members_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_team_members_v_blocks_table" CASCADE;
  DROP TABLE "_team_members_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_team_members_v_blocks_accordion" CASCADE;
  DROP TABLE "_team_members_v_blocks_quote" CASCADE;
  DROP TABLE "_team_members_v_blocks_cta" CASCADE;
  DROP TABLE "_team_members_v_blocks_cards" CASCADE;
  DROP TABLE "_team_members_v_blocks_embed" CASCADE;
  DROP TABLE "_team_members_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_team_members_v_version_expertise" CASCADE;
  DROP TABLE "_team_members_v" CASCADE;
  DROP TABLE "_team_members_v_rels" CASCADE;
  DROP TABLE "partners_blocks_hero" CASCADE;
  DROP TABLE "partners_blocks_content" CASCADE;
  DROP TABLE "partners_blocks_media_text" CASCADE;
  DROP TABLE "partners_blocks_items_items" CASCADE;
  DROP TABLE "partners_blocks_items" CASCADE;
  DROP TABLE "partners_blocks_image" CASCADE;
  DROP TABLE "partners_blocks_gallery_items" CASCADE;
  DROP TABLE "partners_blocks_gallery" CASCADE;
  DROP TABLE "partners_blocks_table_columns" CASCADE;
  DROP TABLE "partners_blocks_table_rows_cells" CASCADE;
  DROP TABLE "partners_blocks_table_rows" CASCADE;
  DROP TABLE "partners_blocks_table_best_for_row" CASCADE;
  DROP TABLE "partners_blocks_table" CASCADE;
  DROP TABLE "partners_blocks_accordion_items" CASCADE;
  DROP TABLE "partners_blocks_accordion" CASCADE;
  DROP TABLE "partners_blocks_quote" CASCADE;
  DROP TABLE "partners_blocks_cta" CASCADE;
  DROP TABLE "partners_blocks_cards" CASCADE;
  DROP TABLE "partners_blocks_embed" CASCADE;
  DROP TABLE "partners_blocks_hubspot_form" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_rels" CASCADE;
  DROP TABLE "_partners_v_blocks_hero" CASCADE;
  DROP TABLE "_partners_v_blocks_content" CASCADE;
  DROP TABLE "_partners_v_blocks_media_text" CASCADE;
  DROP TABLE "_partners_v_blocks_items_items" CASCADE;
  DROP TABLE "_partners_v_blocks_items" CASCADE;
  DROP TABLE "_partners_v_blocks_image" CASCADE;
  DROP TABLE "_partners_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_partners_v_blocks_gallery" CASCADE;
  DROP TABLE "_partners_v_blocks_table_columns" CASCADE;
  DROP TABLE "_partners_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_partners_v_blocks_table_rows" CASCADE;
  DROP TABLE "_partners_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_partners_v_blocks_table" CASCADE;
  DROP TABLE "_partners_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_partners_v_blocks_accordion" CASCADE;
  DROP TABLE "_partners_v_blocks_quote" CASCADE;
  DROP TABLE "_partners_v_blocks_cta" CASCADE;
  DROP TABLE "_partners_v_blocks_cards" CASCADE;
  DROP TABLE "_partners_v_blocks_embed" CASCADE;
  DROP TABLE "_partners_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_partners_v" CASCADE;
  DROP TABLE "_partners_v_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "navigation_groups_items" CASCADE;
  DROP TABLE "navigation_groups" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_rels" CASCADE;
  DROP TABLE "_navigation_v_version_groups_items" CASCADE;
  DROP TABLE "_navigation_v_version_groups" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TABLE "_navigation_v_rels" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "_locations_v" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_content" CASCADE;
  DROP TABLE "homepage_blocks_media_text" CASCADE;
  DROP TABLE "homepage_blocks_items_items" CASCADE;
  DROP TABLE "homepage_blocks_items" CASCADE;
  DROP TABLE "homepage_blocks_image" CASCADE;
  DROP TABLE "homepage_blocks_gallery_items" CASCADE;
  DROP TABLE "homepage_blocks_gallery" CASCADE;
  DROP TABLE "homepage_blocks_table_columns" CASCADE;
  DROP TABLE "homepage_blocks_table_rows_cells" CASCADE;
  DROP TABLE "homepage_blocks_table_rows" CASCADE;
  DROP TABLE "homepage_blocks_table_best_for_row" CASCADE;
  DROP TABLE "homepage_blocks_table" CASCADE;
  DROP TABLE "homepage_blocks_accordion_items" CASCADE;
  DROP TABLE "homepage_blocks_accordion" CASCADE;
  DROP TABLE "homepage_blocks_quote" CASCADE;
  DROP TABLE "homepage_blocks_cta" CASCADE;
  DROP TABLE "homepage_blocks_cards" CASCADE;
  DROP TABLE "homepage_blocks_embed" CASCADE;
  DROP TABLE "homepage_blocks_hubspot_form" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero" CASCADE;
  DROP TABLE "_homepage_v_blocks_content" CASCADE;
  DROP TABLE "_homepage_v_blocks_media_text" CASCADE;
  DROP TABLE "_homepage_v_blocks_items_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_image" CASCADE;
  DROP TABLE "_homepage_v_blocks_gallery_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_gallery" CASCADE;
  DROP TABLE "_homepage_v_blocks_table_columns" CASCADE;
  DROP TABLE "_homepage_v_blocks_table_rows_cells" CASCADE;
  DROP TABLE "_homepage_v_blocks_table_rows" CASCADE;
  DROP TABLE "_homepage_v_blocks_table_best_for_row" CASCADE;
  DROP TABLE "_homepage_v_blocks_table" CASCADE;
  DROP TABLE "_homepage_v_blocks_accordion_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_accordion" CASCADE;
  DROP TABLE "_homepage_v_blocks_quote" CASCADE;
  DROP TABLE "_homepage_v_blocks_cta" CASCADE;
  DROP TABLE "_homepage_v_blocks_cards" CASCADE;
  DROP TABLE "_homepage_v_blocks_embed" CASCADE;
  DROP TABLE "_homepage_v_blocks_hubspot_form" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_rels" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_hero_alignment";
  DROP TYPE "public"."enum_pages_blocks_content_width";
  DROP TYPE "public"."enum_pages_blocks_content_background";
  DROP TYPE "public"."enum_pages_blocks_media_text_media_position";
  DROP TYPE "public"."enum_pages_blocks_media_text_background";
  DROP TYPE "public"."enum_pages_blocks_items_layout";
  DROP TYPE "public"."enum_pages_blocks_items_markers";
  DROP TYPE "public"."enum_pages_blocks_items_style";
  DROP TYPE "public"."enum_pages_blocks_items_background";
  DROP TYPE "public"."enum_pages_blocks_image_width";
  DROP TYPE "public"."enum_pages_blocks_image_alignment";
  DROP TYPE "public"."enum_pages_blocks_image_background";
  DROP TYPE "public"."enum_pages_blocks_gallery_layout";
  DROP TYPE "public"."enum_pages_blocks_gallery_background";
  DROP TYPE "public"."enum_pages_blocks_table_background";
  DROP TYPE "public"."enum_pages_blocks_accordion_display";
  DROP TYPE "public"."enum_pages_blocks_accordion_background";
  DROP TYPE "public"."enum_pages_blocks_quote_source";
  DROP TYPE "public"."enum_pages_blocks_quote_layout";
  DROP TYPE "public"."enum_pages_blocks_quote_background";
  DROP TYPE "public"."enum_pages_blocks_cta_action";
  DROP TYPE "public"."enum_pages_blocks_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_background";
  DROP TYPE "public"."enum_pages_blocks_cards_collection";
  DROP TYPE "public"."enum_pages_blocks_cards_source";
  DROP TYPE "public"."enum_pages_blocks_cards_display";
  DROP TYPE "public"."enum_pages_blocks_cards_background";
  DROP TYPE "public"."enum_pages_blocks_embed_kind";
  DROP TYPE "public"."enum_pages_blocks_embed_provider";
  DROP TYPE "public"."enum_pages_blocks_embed_height";
  DROP TYPE "public"."enum_pages_blocks_embed_background";
  DROP TYPE "public"."enum_pages_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_variant";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_content_width";
  DROP TYPE "public"."enum__pages_v_blocks_content_background";
  DROP TYPE "public"."enum__pages_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__pages_v_blocks_media_text_background";
  DROP TYPE "public"."enum__pages_v_blocks_items_layout";
  DROP TYPE "public"."enum__pages_v_blocks_items_markers";
  DROP TYPE "public"."enum__pages_v_blocks_items_style";
  DROP TYPE "public"."enum__pages_v_blocks_items_background";
  DROP TYPE "public"."enum__pages_v_blocks_image_width";
  DROP TYPE "public"."enum__pages_v_blocks_image_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_image_background";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_background";
  DROP TYPE "public"."enum__pages_v_blocks_table_background";
  DROP TYPE "public"."enum__pages_v_blocks_accordion_display";
  DROP TYPE "public"."enum__pages_v_blocks_accordion_background";
  DROP TYPE "public"."enum__pages_v_blocks_quote_source";
  DROP TYPE "public"."enum__pages_v_blocks_quote_layout";
  DROP TYPE "public"."enum__pages_v_blocks_quote_background";
  DROP TYPE "public"."enum__pages_v_blocks_cta_action";
  DROP TYPE "public"."enum__pages_v_blocks_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__pages_v_blocks_cta_background";
  DROP TYPE "public"."enum__pages_v_blocks_cards_collection";
  DROP TYPE "public"."enum__pages_v_blocks_cards_source";
  DROP TYPE "public"."enum__pages_v_blocks_cards_display";
  DROP TYPE "public"."enum__pages_v_blocks_cards_background";
  DROP TYPE "public"."enum__pages_v_blocks_embed_kind";
  DROP TYPE "public"."enum__pages_v_blocks_embed_provider";
  DROP TYPE "public"."enum__pages_v_blocks_embed_height";
  DROP TYPE "public"."enum__pages_v_blocks_embed_background";
  DROP TYPE "public"."enum__pages_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_case_studies_blocks_hero_variant";
  DROP TYPE "public"."enum_case_studies_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_case_studies_blocks_hero_alignment";
  DROP TYPE "public"."enum_case_studies_blocks_content_width";
  DROP TYPE "public"."enum_case_studies_blocks_content_background";
  DROP TYPE "public"."enum_case_studies_blocks_media_text_media_position";
  DROP TYPE "public"."enum_case_studies_blocks_media_text_background";
  DROP TYPE "public"."enum_case_studies_blocks_items_layout";
  DROP TYPE "public"."enum_case_studies_blocks_items_markers";
  DROP TYPE "public"."enum_case_studies_blocks_items_style";
  DROP TYPE "public"."enum_case_studies_blocks_items_background";
  DROP TYPE "public"."enum_case_studies_blocks_image_width";
  DROP TYPE "public"."enum_case_studies_blocks_image_alignment";
  DROP TYPE "public"."enum_case_studies_blocks_image_background";
  DROP TYPE "public"."enum_case_studies_blocks_gallery_layout";
  DROP TYPE "public"."enum_case_studies_blocks_gallery_background";
  DROP TYPE "public"."enum_case_studies_blocks_table_background";
  DROP TYPE "public"."enum_case_studies_blocks_accordion_display";
  DROP TYPE "public"."enum_case_studies_blocks_accordion_background";
  DROP TYPE "public"."enum_case_studies_blocks_quote_source";
  DROP TYPE "public"."enum_case_studies_blocks_quote_layout";
  DROP TYPE "public"."enum_case_studies_blocks_quote_background";
  DROP TYPE "public"."enum_case_studies_blocks_cta_action";
  DROP TYPE "public"."enum_case_studies_blocks_cta_variant";
  DROP TYPE "public"."enum_case_studies_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_case_studies_blocks_cta_background";
  DROP TYPE "public"."enum_case_studies_blocks_cards_collection";
  DROP TYPE "public"."enum_case_studies_blocks_cards_source";
  DROP TYPE "public"."enum_case_studies_blocks_cards_display";
  DROP TYPE "public"."enum_case_studies_blocks_cards_background";
  DROP TYPE "public"."enum_case_studies_blocks_embed_kind";
  DROP TYPE "public"."enum_case_studies_blocks_embed_provider";
  DROP TYPE "public"."enum_case_studies_blocks_embed_height";
  DROP TYPE "public"."enum_case_studies_blocks_embed_background";
  DROP TYPE "public"."enum_case_studies_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_case_studies_status";
  DROP TYPE "public"."enum__case_studies_v_blocks_hero_variant";
  DROP TYPE "public"."enum__case_studies_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__case_studies_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__case_studies_v_blocks_content_width";
  DROP TYPE "public"."enum__case_studies_v_blocks_content_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__case_studies_v_blocks_media_text_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_items_layout";
  DROP TYPE "public"."enum__case_studies_v_blocks_items_markers";
  DROP TYPE "public"."enum__case_studies_v_blocks_items_style";
  DROP TYPE "public"."enum__case_studies_v_blocks_items_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_image_width";
  DROP TYPE "public"."enum__case_studies_v_blocks_image_alignment";
  DROP TYPE "public"."enum__case_studies_v_blocks_image_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__case_studies_v_blocks_gallery_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_table_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_accordion_display";
  DROP TYPE "public"."enum__case_studies_v_blocks_accordion_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_quote_source";
  DROP TYPE "public"."enum__case_studies_v_blocks_quote_layout";
  DROP TYPE "public"."enum__case_studies_v_blocks_quote_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_cta_action";
  DROP TYPE "public"."enum__case_studies_v_blocks_cta_variant";
  DROP TYPE "public"."enum__case_studies_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__case_studies_v_blocks_cta_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_cards_collection";
  DROP TYPE "public"."enum__case_studies_v_blocks_cards_source";
  DROP TYPE "public"."enum__case_studies_v_blocks_cards_display";
  DROP TYPE "public"."enum__case_studies_v_blocks_cards_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_embed_kind";
  DROP TYPE "public"."enum__case_studies_v_blocks_embed_provider";
  DROP TYPE "public"."enum__case_studies_v_blocks_embed_height";
  DROP TYPE "public"."enum__case_studies_v_blocks_embed_background";
  DROP TYPE "public"."enum__case_studies_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__case_studies_v_version_status";
  DROP TYPE "public"."enum_services_blocks_hero_variant";
  DROP TYPE "public"."enum_services_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_services_blocks_hero_alignment";
  DROP TYPE "public"."enum_services_blocks_content_width";
  DROP TYPE "public"."enum_services_blocks_content_background";
  DROP TYPE "public"."enum_services_blocks_media_text_media_position";
  DROP TYPE "public"."enum_services_blocks_media_text_background";
  DROP TYPE "public"."enum_services_blocks_items_layout";
  DROP TYPE "public"."enum_services_blocks_items_markers";
  DROP TYPE "public"."enum_services_blocks_items_style";
  DROP TYPE "public"."enum_services_blocks_items_background";
  DROP TYPE "public"."enum_services_blocks_image_width";
  DROP TYPE "public"."enum_services_blocks_image_alignment";
  DROP TYPE "public"."enum_services_blocks_image_background";
  DROP TYPE "public"."enum_services_blocks_gallery_layout";
  DROP TYPE "public"."enum_services_blocks_gallery_background";
  DROP TYPE "public"."enum_services_blocks_table_background";
  DROP TYPE "public"."enum_services_blocks_accordion_display";
  DROP TYPE "public"."enum_services_blocks_accordion_background";
  DROP TYPE "public"."enum_services_blocks_quote_source";
  DROP TYPE "public"."enum_services_blocks_quote_layout";
  DROP TYPE "public"."enum_services_blocks_quote_background";
  DROP TYPE "public"."enum_services_blocks_cta_action";
  DROP TYPE "public"."enum_services_blocks_cta_variant";
  DROP TYPE "public"."enum_services_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_services_blocks_cta_background";
  DROP TYPE "public"."enum_services_blocks_cards_collection";
  DROP TYPE "public"."enum_services_blocks_cards_source";
  DROP TYPE "public"."enum_services_blocks_cards_display";
  DROP TYPE "public"."enum_services_blocks_cards_background";
  DROP TYPE "public"."enum_services_blocks_embed_kind";
  DROP TYPE "public"."enum_services_blocks_embed_provider";
  DROP TYPE "public"."enum_services_blocks_embed_height";
  DROP TYPE "public"."enum_services_blocks_embed_background";
  DROP TYPE "public"."enum_services_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_services_tier";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_blocks_hero_variant";
  DROP TYPE "public"."enum__services_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__services_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__services_v_blocks_content_width";
  DROP TYPE "public"."enum__services_v_blocks_content_background";
  DROP TYPE "public"."enum__services_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__services_v_blocks_media_text_background";
  DROP TYPE "public"."enum__services_v_blocks_items_layout";
  DROP TYPE "public"."enum__services_v_blocks_items_markers";
  DROP TYPE "public"."enum__services_v_blocks_items_style";
  DROP TYPE "public"."enum__services_v_blocks_items_background";
  DROP TYPE "public"."enum__services_v_blocks_image_width";
  DROP TYPE "public"."enum__services_v_blocks_image_alignment";
  DROP TYPE "public"."enum__services_v_blocks_image_background";
  DROP TYPE "public"."enum__services_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__services_v_blocks_gallery_background";
  DROP TYPE "public"."enum__services_v_blocks_table_background";
  DROP TYPE "public"."enum__services_v_blocks_accordion_display";
  DROP TYPE "public"."enum__services_v_blocks_accordion_background";
  DROP TYPE "public"."enum__services_v_blocks_quote_source";
  DROP TYPE "public"."enum__services_v_blocks_quote_layout";
  DROP TYPE "public"."enum__services_v_blocks_quote_background";
  DROP TYPE "public"."enum__services_v_blocks_cta_action";
  DROP TYPE "public"."enum__services_v_blocks_cta_variant";
  DROP TYPE "public"."enum__services_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__services_v_blocks_cta_background";
  DROP TYPE "public"."enum__services_v_blocks_cards_collection";
  DROP TYPE "public"."enum__services_v_blocks_cards_source";
  DROP TYPE "public"."enum__services_v_blocks_cards_display";
  DROP TYPE "public"."enum__services_v_blocks_cards_background";
  DROP TYPE "public"."enum__services_v_blocks_embed_kind";
  DROP TYPE "public"."enum__services_v_blocks_embed_provider";
  DROP TYPE "public"."enum__services_v_blocks_embed_height";
  DROP TYPE "public"."enum__services_v_blocks_embed_background";
  DROP TYPE "public"."enum__services_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__services_v_version_tier";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum_industries_blocks_hero_variant";
  DROP TYPE "public"."enum_industries_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_industries_blocks_hero_alignment";
  DROP TYPE "public"."enum_industries_blocks_content_width";
  DROP TYPE "public"."enum_industries_blocks_content_background";
  DROP TYPE "public"."enum_industries_blocks_media_text_media_position";
  DROP TYPE "public"."enum_industries_blocks_media_text_background";
  DROP TYPE "public"."enum_industries_blocks_items_layout";
  DROP TYPE "public"."enum_industries_blocks_items_markers";
  DROP TYPE "public"."enum_industries_blocks_items_style";
  DROP TYPE "public"."enum_industries_blocks_items_background";
  DROP TYPE "public"."enum_industries_blocks_image_width";
  DROP TYPE "public"."enum_industries_blocks_image_alignment";
  DROP TYPE "public"."enum_industries_blocks_image_background";
  DROP TYPE "public"."enum_industries_blocks_gallery_layout";
  DROP TYPE "public"."enum_industries_blocks_gallery_background";
  DROP TYPE "public"."enum_industries_blocks_table_background";
  DROP TYPE "public"."enum_industries_blocks_accordion_display";
  DROP TYPE "public"."enum_industries_blocks_accordion_background";
  DROP TYPE "public"."enum_industries_blocks_quote_source";
  DROP TYPE "public"."enum_industries_blocks_quote_layout";
  DROP TYPE "public"."enum_industries_blocks_quote_background";
  DROP TYPE "public"."enum_industries_blocks_cta_action";
  DROP TYPE "public"."enum_industries_blocks_cta_variant";
  DROP TYPE "public"."enum_industries_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_industries_blocks_cta_background";
  DROP TYPE "public"."enum_industries_blocks_cards_collection";
  DROP TYPE "public"."enum_industries_blocks_cards_source";
  DROP TYPE "public"."enum_industries_blocks_cards_display";
  DROP TYPE "public"."enum_industries_blocks_cards_background";
  DROP TYPE "public"."enum_industries_blocks_embed_kind";
  DROP TYPE "public"."enum_industries_blocks_embed_provider";
  DROP TYPE "public"."enum_industries_blocks_embed_height";
  DROP TYPE "public"."enum_industries_blocks_embed_background";
  DROP TYPE "public"."enum_industries_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_industries_status";
  DROP TYPE "public"."enum__industries_v_blocks_hero_variant";
  DROP TYPE "public"."enum__industries_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__industries_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__industries_v_blocks_content_width";
  DROP TYPE "public"."enum__industries_v_blocks_content_background";
  DROP TYPE "public"."enum__industries_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__industries_v_blocks_media_text_background";
  DROP TYPE "public"."enum__industries_v_blocks_items_layout";
  DROP TYPE "public"."enum__industries_v_blocks_items_markers";
  DROP TYPE "public"."enum__industries_v_blocks_items_style";
  DROP TYPE "public"."enum__industries_v_blocks_items_background";
  DROP TYPE "public"."enum__industries_v_blocks_image_width";
  DROP TYPE "public"."enum__industries_v_blocks_image_alignment";
  DROP TYPE "public"."enum__industries_v_blocks_image_background";
  DROP TYPE "public"."enum__industries_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__industries_v_blocks_gallery_background";
  DROP TYPE "public"."enum__industries_v_blocks_table_background";
  DROP TYPE "public"."enum__industries_v_blocks_accordion_display";
  DROP TYPE "public"."enum__industries_v_blocks_accordion_background";
  DROP TYPE "public"."enum__industries_v_blocks_quote_source";
  DROP TYPE "public"."enum__industries_v_blocks_quote_layout";
  DROP TYPE "public"."enum__industries_v_blocks_quote_background";
  DROP TYPE "public"."enum__industries_v_blocks_cta_action";
  DROP TYPE "public"."enum__industries_v_blocks_cta_variant";
  DROP TYPE "public"."enum__industries_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__industries_v_blocks_cta_background";
  DROP TYPE "public"."enum__industries_v_blocks_cards_collection";
  DROP TYPE "public"."enum__industries_v_blocks_cards_source";
  DROP TYPE "public"."enum__industries_v_blocks_cards_display";
  DROP TYPE "public"."enum__industries_v_blocks_cards_background";
  DROP TYPE "public"."enum__industries_v_blocks_embed_kind";
  DROP TYPE "public"."enum__industries_v_blocks_embed_provider";
  DROP TYPE "public"."enum__industries_v_blocks_embed_height";
  DROP TYPE "public"."enum__industries_v_blocks_embed_background";
  DROP TYPE "public"."enum__industries_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__industries_v_version_status";
  DROP TYPE "public"."enum_workshops_blocks_hero_variant";
  DROP TYPE "public"."enum_workshops_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_workshops_blocks_hero_alignment";
  DROP TYPE "public"."enum_workshops_blocks_content_width";
  DROP TYPE "public"."enum_workshops_blocks_content_background";
  DROP TYPE "public"."enum_workshops_blocks_media_text_media_position";
  DROP TYPE "public"."enum_workshops_blocks_media_text_background";
  DROP TYPE "public"."enum_workshops_blocks_items_layout";
  DROP TYPE "public"."enum_workshops_blocks_items_markers";
  DROP TYPE "public"."enum_workshops_blocks_items_style";
  DROP TYPE "public"."enum_workshops_blocks_items_background";
  DROP TYPE "public"."enum_workshops_blocks_image_width";
  DROP TYPE "public"."enum_workshops_blocks_image_alignment";
  DROP TYPE "public"."enum_workshops_blocks_image_background";
  DROP TYPE "public"."enum_workshops_blocks_gallery_layout";
  DROP TYPE "public"."enum_workshops_blocks_gallery_background";
  DROP TYPE "public"."enum_workshops_blocks_table_background";
  DROP TYPE "public"."enum_workshops_blocks_accordion_display";
  DROP TYPE "public"."enum_workshops_blocks_accordion_background";
  DROP TYPE "public"."enum_workshops_blocks_quote_source";
  DROP TYPE "public"."enum_workshops_blocks_quote_layout";
  DROP TYPE "public"."enum_workshops_blocks_quote_background";
  DROP TYPE "public"."enum_workshops_blocks_cta_action";
  DROP TYPE "public"."enum_workshops_blocks_cta_variant";
  DROP TYPE "public"."enum_workshops_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_workshops_blocks_cta_background";
  DROP TYPE "public"."enum_workshops_blocks_cards_collection";
  DROP TYPE "public"."enum_workshops_blocks_cards_source";
  DROP TYPE "public"."enum_workshops_blocks_cards_display";
  DROP TYPE "public"."enum_workshops_blocks_cards_background";
  DROP TYPE "public"."enum_workshops_blocks_embed_kind";
  DROP TYPE "public"."enum_workshops_blocks_embed_provider";
  DROP TYPE "public"."enum_workshops_blocks_embed_height";
  DROP TYPE "public"."enum_workshops_blocks_embed_background";
  DROP TYPE "public"."enum_workshops_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_workshops_status";
  DROP TYPE "public"."enum__workshops_v_blocks_hero_variant";
  DROP TYPE "public"."enum__workshops_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__workshops_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__workshops_v_blocks_content_width";
  DROP TYPE "public"."enum__workshops_v_blocks_content_background";
  DROP TYPE "public"."enum__workshops_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__workshops_v_blocks_media_text_background";
  DROP TYPE "public"."enum__workshops_v_blocks_items_layout";
  DROP TYPE "public"."enum__workshops_v_blocks_items_markers";
  DROP TYPE "public"."enum__workshops_v_blocks_items_style";
  DROP TYPE "public"."enum__workshops_v_blocks_items_background";
  DROP TYPE "public"."enum__workshops_v_blocks_image_width";
  DROP TYPE "public"."enum__workshops_v_blocks_image_alignment";
  DROP TYPE "public"."enum__workshops_v_blocks_image_background";
  DROP TYPE "public"."enum__workshops_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__workshops_v_blocks_gallery_background";
  DROP TYPE "public"."enum__workshops_v_blocks_table_background";
  DROP TYPE "public"."enum__workshops_v_blocks_accordion_display";
  DROP TYPE "public"."enum__workshops_v_blocks_accordion_background";
  DROP TYPE "public"."enum__workshops_v_blocks_quote_source";
  DROP TYPE "public"."enum__workshops_v_blocks_quote_layout";
  DROP TYPE "public"."enum__workshops_v_blocks_quote_background";
  DROP TYPE "public"."enum__workshops_v_blocks_cta_action";
  DROP TYPE "public"."enum__workshops_v_blocks_cta_variant";
  DROP TYPE "public"."enum__workshops_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__workshops_v_blocks_cta_background";
  DROP TYPE "public"."enum__workshops_v_blocks_cards_collection";
  DROP TYPE "public"."enum__workshops_v_blocks_cards_source";
  DROP TYPE "public"."enum__workshops_v_blocks_cards_display";
  DROP TYPE "public"."enum__workshops_v_blocks_cards_background";
  DROP TYPE "public"."enum__workshops_v_blocks_embed_kind";
  DROP TYPE "public"."enum__workshops_v_blocks_embed_provider";
  DROP TYPE "public"."enum__workshops_v_blocks_embed_height";
  DROP TYPE "public"."enum__workshops_v_blocks_embed_background";
  DROP TYPE "public"."enum__workshops_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__workshops_v_version_status";
  DROP TYPE "public"."enum_team_members_blocks_hero_variant";
  DROP TYPE "public"."enum_team_members_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_team_members_blocks_hero_alignment";
  DROP TYPE "public"."enum_team_members_blocks_content_width";
  DROP TYPE "public"."enum_team_members_blocks_content_background";
  DROP TYPE "public"."enum_team_members_blocks_media_text_media_position";
  DROP TYPE "public"."enum_team_members_blocks_media_text_background";
  DROP TYPE "public"."enum_team_members_blocks_items_layout";
  DROP TYPE "public"."enum_team_members_blocks_items_markers";
  DROP TYPE "public"."enum_team_members_blocks_items_style";
  DROP TYPE "public"."enum_team_members_blocks_items_background";
  DROP TYPE "public"."enum_team_members_blocks_image_width";
  DROP TYPE "public"."enum_team_members_blocks_image_alignment";
  DROP TYPE "public"."enum_team_members_blocks_image_background";
  DROP TYPE "public"."enum_team_members_blocks_gallery_layout";
  DROP TYPE "public"."enum_team_members_blocks_gallery_background";
  DROP TYPE "public"."enum_team_members_blocks_table_background";
  DROP TYPE "public"."enum_team_members_blocks_accordion_display";
  DROP TYPE "public"."enum_team_members_blocks_accordion_background";
  DROP TYPE "public"."enum_team_members_blocks_quote_source";
  DROP TYPE "public"."enum_team_members_blocks_quote_layout";
  DROP TYPE "public"."enum_team_members_blocks_quote_background";
  DROP TYPE "public"."enum_team_members_blocks_cta_action";
  DROP TYPE "public"."enum_team_members_blocks_cta_variant";
  DROP TYPE "public"."enum_team_members_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_team_members_blocks_cta_background";
  DROP TYPE "public"."enum_team_members_blocks_cards_collection";
  DROP TYPE "public"."enum_team_members_blocks_cards_source";
  DROP TYPE "public"."enum_team_members_blocks_cards_display";
  DROP TYPE "public"."enum_team_members_blocks_cards_background";
  DROP TYPE "public"."enum_team_members_blocks_embed_kind";
  DROP TYPE "public"."enum_team_members_blocks_embed_provider";
  DROP TYPE "public"."enum_team_members_blocks_embed_height";
  DROP TYPE "public"."enum_team_members_blocks_embed_background";
  DROP TYPE "public"."enum_team_members_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_team_members_status";
  DROP TYPE "public"."enum__team_members_v_blocks_hero_variant";
  DROP TYPE "public"."enum__team_members_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__team_members_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__team_members_v_blocks_content_width";
  DROP TYPE "public"."enum__team_members_v_blocks_content_background";
  DROP TYPE "public"."enum__team_members_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__team_members_v_blocks_media_text_background";
  DROP TYPE "public"."enum__team_members_v_blocks_items_layout";
  DROP TYPE "public"."enum__team_members_v_blocks_items_markers";
  DROP TYPE "public"."enum__team_members_v_blocks_items_style";
  DROP TYPE "public"."enum__team_members_v_blocks_items_background";
  DROP TYPE "public"."enum__team_members_v_blocks_image_width";
  DROP TYPE "public"."enum__team_members_v_blocks_image_alignment";
  DROP TYPE "public"."enum__team_members_v_blocks_image_background";
  DROP TYPE "public"."enum__team_members_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__team_members_v_blocks_gallery_background";
  DROP TYPE "public"."enum__team_members_v_blocks_table_background";
  DROP TYPE "public"."enum__team_members_v_blocks_accordion_display";
  DROP TYPE "public"."enum__team_members_v_blocks_accordion_background";
  DROP TYPE "public"."enum__team_members_v_blocks_quote_source";
  DROP TYPE "public"."enum__team_members_v_blocks_quote_layout";
  DROP TYPE "public"."enum__team_members_v_blocks_quote_background";
  DROP TYPE "public"."enum__team_members_v_blocks_cta_action";
  DROP TYPE "public"."enum__team_members_v_blocks_cta_variant";
  DROP TYPE "public"."enum__team_members_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__team_members_v_blocks_cta_background";
  DROP TYPE "public"."enum__team_members_v_blocks_cards_collection";
  DROP TYPE "public"."enum__team_members_v_blocks_cards_source";
  DROP TYPE "public"."enum__team_members_v_blocks_cards_display";
  DROP TYPE "public"."enum__team_members_v_blocks_cards_background";
  DROP TYPE "public"."enum__team_members_v_blocks_embed_kind";
  DROP TYPE "public"."enum__team_members_v_blocks_embed_provider";
  DROP TYPE "public"."enum__team_members_v_blocks_embed_height";
  DROP TYPE "public"."enum__team_members_v_blocks_embed_background";
  DROP TYPE "public"."enum__team_members_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__team_members_v_version_status";
  DROP TYPE "public"."enum_partners_blocks_hero_variant";
  DROP TYPE "public"."enum_partners_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_partners_blocks_hero_alignment";
  DROP TYPE "public"."enum_partners_blocks_content_width";
  DROP TYPE "public"."enum_partners_blocks_content_background";
  DROP TYPE "public"."enum_partners_blocks_media_text_media_position";
  DROP TYPE "public"."enum_partners_blocks_media_text_background";
  DROP TYPE "public"."enum_partners_blocks_items_layout";
  DROP TYPE "public"."enum_partners_blocks_items_markers";
  DROP TYPE "public"."enum_partners_blocks_items_style";
  DROP TYPE "public"."enum_partners_blocks_items_background";
  DROP TYPE "public"."enum_partners_blocks_image_width";
  DROP TYPE "public"."enum_partners_blocks_image_alignment";
  DROP TYPE "public"."enum_partners_blocks_image_background";
  DROP TYPE "public"."enum_partners_blocks_gallery_layout";
  DROP TYPE "public"."enum_partners_blocks_gallery_background";
  DROP TYPE "public"."enum_partners_blocks_table_background";
  DROP TYPE "public"."enum_partners_blocks_accordion_display";
  DROP TYPE "public"."enum_partners_blocks_accordion_background";
  DROP TYPE "public"."enum_partners_blocks_quote_source";
  DROP TYPE "public"."enum_partners_blocks_quote_layout";
  DROP TYPE "public"."enum_partners_blocks_quote_background";
  DROP TYPE "public"."enum_partners_blocks_cta_action";
  DROP TYPE "public"."enum_partners_blocks_cta_variant";
  DROP TYPE "public"."enum_partners_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_partners_blocks_cta_background";
  DROP TYPE "public"."enum_partners_blocks_cards_collection";
  DROP TYPE "public"."enum_partners_blocks_cards_source";
  DROP TYPE "public"."enum_partners_blocks_cards_display";
  DROP TYPE "public"."enum_partners_blocks_cards_background";
  DROP TYPE "public"."enum_partners_blocks_embed_kind";
  DROP TYPE "public"."enum_partners_blocks_embed_provider";
  DROP TYPE "public"."enum_partners_blocks_embed_height";
  DROP TYPE "public"."enum_partners_blocks_embed_background";
  DROP TYPE "public"."enum_partners_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_partners_status";
  DROP TYPE "public"."enum__partners_v_blocks_hero_variant";
  DROP TYPE "public"."enum__partners_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__partners_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__partners_v_blocks_content_width";
  DROP TYPE "public"."enum__partners_v_blocks_content_background";
  DROP TYPE "public"."enum__partners_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__partners_v_blocks_media_text_background";
  DROP TYPE "public"."enum__partners_v_blocks_items_layout";
  DROP TYPE "public"."enum__partners_v_blocks_items_markers";
  DROP TYPE "public"."enum__partners_v_blocks_items_style";
  DROP TYPE "public"."enum__partners_v_blocks_items_background";
  DROP TYPE "public"."enum__partners_v_blocks_image_width";
  DROP TYPE "public"."enum__partners_v_blocks_image_alignment";
  DROP TYPE "public"."enum__partners_v_blocks_image_background";
  DROP TYPE "public"."enum__partners_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__partners_v_blocks_gallery_background";
  DROP TYPE "public"."enum__partners_v_blocks_table_background";
  DROP TYPE "public"."enum__partners_v_blocks_accordion_display";
  DROP TYPE "public"."enum__partners_v_blocks_accordion_background";
  DROP TYPE "public"."enum__partners_v_blocks_quote_source";
  DROP TYPE "public"."enum__partners_v_blocks_quote_layout";
  DROP TYPE "public"."enum__partners_v_blocks_quote_background";
  DROP TYPE "public"."enum__partners_v_blocks_cta_action";
  DROP TYPE "public"."enum__partners_v_blocks_cta_variant";
  DROP TYPE "public"."enum__partners_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__partners_v_blocks_cta_background";
  DROP TYPE "public"."enum__partners_v_blocks_cards_collection";
  DROP TYPE "public"."enum__partners_v_blocks_cards_source";
  DROP TYPE "public"."enum__partners_v_blocks_cards_display";
  DROP TYPE "public"."enum__partners_v_blocks_cards_background";
  DROP TYPE "public"."enum__partners_v_blocks_embed_kind";
  DROP TYPE "public"."enum__partners_v_blocks_embed_provider";
  DROP TYPE "public"."enum__partners_v_blocks_embed_height";
  DROP TYPE "public"."enum__partners_v_blocks_embed_background";
  DROP TYPE "public"."enum__partners_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__partners_v_version_status";
  DROP TYPE "public"."enum_navigation_groups_items_link_type";
  DROP TYPE "public"."enum_navigation_groups_link_type";
  DROP TYPE "public"."enum_navigation_link_type";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_groups_items_link_type";
  DROP TYPE "public"."enum__navigation_v_version_groups_link_type";
  DROP TYPE "public"."enum__navigation_v_version_link_type";
  DROP TYPE "public"."enum__navigation_v_version_status";
  DROP TYPE "public"."enum_locations_status";
  DROP TYPE "public"."enum__locations_v_version_status";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_homepage_blocks_hero_variant";
  DROP TYPE "public"."enum_homepage_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum_homepage_blocks_hero_alignment";
  DROP TYPE "public"."enum_homepage_blocks_content_width";
  DROP TYPE "public"."enum_homepage_blocks_content_background";
  DROP TYPE "public"."enum_homepage_blocks_media_text_media_position";
  DROP TYPE "public"."enum_homepage_blocks_media_text_background";
  DROP TYPE "public"."enum_homepage_blocks_items_layout";
  DROP TYPE "public"."enum_homepage_blocks_items_markers";
  DROP TYPE "public"."enum_homepage_blocks_items_style";
  DROP TYPE "public"."enum_homepage_blocks_items_background";
  DROP TYPE "public"."enum_homepage_blocks_image_width";
  DROP TYPE "public"."enum_homepage_blocks_image_alignment";
  DROP TYPE "public"."enum_homepage_blocks_image_background";
  DROP TYPE "public"."enum_homepage_blocks_gallery_layout";
  DROP TYPE "public"."enum_homepage_blocks_gallery_background";
  DROP TYPE "public"."enum_homepage_blocks_table_background";
  DROP TYPE "public"."enum_homepage_blocks_accordion_display";
  DROP TYPE "public"."enum_homepage_blocks_accordion_background";
  DROP TYPE "public"."enum_homepage_blocks_quote_source";
  DROP TYPE "public"."enum_homepage_blocks_quote_layout";
  DROP TYPE "public"."enum_homepage_blocks_quote_background";
  DROP TYPE "public"."enum_homepage_blocks_cta_action";
  DROP TYPE "public"."enum_homepage_blocks_cta_variant";
  DROP TYPE "public"."enum_homepage_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum_homepage_blocks_cta_background";
  DROP TYPE "public"."enum_homepage_blocks_cards_collection";
  DROP TYPE "public"."enum_homepage_blocks_cards_source";
  DROP TYPE "public"."enum_homepage_blocks_cards_display";
  DROP TYPE "public"."enum_homepage_blocks_cards_background";
  DROP TYPE "public"."enum_homepage_blocks_embed_kind";
  DROP TYPE "public"."enum_homepage_blocks_embed_provider";
  DROP TYPE "public"."enum_homepage_blocks_embed_height";
  DROP TYPE "public"."enum_homepage_blocks_embed_background";
  DROP TYPE "public"."enum_homepage_blocks_hubspot_form_background";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_blocks_hero_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_hero_primary_cta_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_hero_alignment";
  DROP TYPE "public"."enum__homepage_v_blocks_content_width";
  DROP TYPE "public"."enum__homepage_v_blocks_content_background";
  DROP TYPE "public"."enum__homepage_v_blocks_media_text_media_position";
  DROP TYPE "public"."enum__homepage_v_blocks_media_text_background";
  DROP TYPE "public"."enum__homepage_v_blocks_items_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_items_markers";
  DROP TYPE "public"."enum__homepage_v_blocks_items_style";
  DROP TYPE "public"."enum__homepage_v_blocks_items_background";
  DROP TYPE "public"."enum__homepage_v_blocks_image_width";
  DROP TYPE "public"."enum__homepage_v_blocks_image_alignment";
  DROP TYPE "public"."enum__homepage_v_blocks_image_background";
  DROP TYPE "public"."enum__homepage_v_blocks_gallery_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_gallery_background";
  DROP TYPE "public"."enum__homepage_v_blocks_table_background";
  DROP TYPE "public"."enum__homepage_v_blocks_accordion_display";
  DROP TYPE "public"."enum__homepage_v_blocks_accordion_background";
  DROP TYPE "public"."enum__homepage_v_blocks_quote_source";
  DROP TYPE "public"."enum__homepage_v_blocks_quote_layout";
  DROP TYPE "public"."enum__homepage_v_blocks_quote_background";
  DROP TYPE "public"."enum__homepage_v_blocks_cta_action";
  DROP TYPE "public"."enum__homepage_v_blocks_cta_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_cta_primary_cta_variant";
  DROP TYPE "public"."enum__homepage_v_blocks_cta_background";
  DROP TYPE "public"."enum__homepage_v_blocks_cards_collection";
  DROP TYPE "public"."enum__homepage_v_blocks_cards_source";
  DROP TYPE "public"."enum__homepage_v_blocks_cards_display";
  DROP TYPE "public"."enum__homepage_v_blocks_cards_background";
  DROP TYPE "public"."enum__homepage_v_blocks_embed_kind";
  DROP TYPE "public"."enum__homepage_v_blocks_embed_provider";
  DROP TYPE "public"."enum__homepage_v_blocks_embed_height";
  DROP TYPE "public"."enum__homepage_v_blocks_embed_background";
  DROP TYPE "public"."enum__homepage_v_blocks_hubspot_form_background";
  DROP TYPE "public"."enum__homepage_v_version_status";`)
}
