import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigation_groups_items_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_groups_link_type" AS ENUM('internal', 'external', 'heading');
  CREATE TYPE "public"."enum_navigation_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__navigation_v_version_groups_items_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_groups_link_type" AS ENUM('internal', 'external', 'heading');
  CREATE TYPE "public"."enum__navigation_v_version_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
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
  	"link_url" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_navigation_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_label" varchar,
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
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_label" varchar,
  	"version_link_type" "enum__navigation_v_version_link_type" DEFAULT 'internal',
  	"version_link_url" varchar,
  	"version_link_label" varchar,
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
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "navigation_id" integer;
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
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_navigation_fk" FOREIGN KEY ("navigation_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_navigation_id_idx" ON "payload_locked_documents_rels" USING btree ("navigation_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation_groups_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_groups_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_version_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_navigation_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "navigation_groups_items" CASCADE;
  DROP TABLE "navigation_groups" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_rels" CASCADE;
  DROP TABLE "_navigation_v_version_groups_items" CASCADE;
  DROP TABLE "_navigation_v_version_groups" CASCADE;
  DROP TABLE "_navigation_v" CASCADE;
  DROP TABLE "_navigation_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_navigation_fk";
  
  DROP INDEX "payload_locked_documents_rels_navigation_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "navigation_id";
  DROP TYPE "public"."enum_navigation_groups_items_link_type";
  DROP TYPE "public"."enum_navigation_groups_link_type";
  DROP TYPE "public"."enum_navigation_link_type";
  DROP TYPE "public"."enum_navigation_status";
  DROP TYPE "public"."enum__navigation_v_version_groups_items_link_type";
  DROP TYPE "public"."enum__navigation_v_version_groups_link_type";
  DROP TYPE "public"."enum__navigation_v_version_link_type";
  DROP TYPE "public"."enum__navigation_v_version_status";`)
}
