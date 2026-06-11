import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workshops_video_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum__workshops_v_version_video_provider" AS ENUM('youtube', 'vimeo');
  CREATE TABLE "workshops_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "_workshops_v_version_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT 'media';
  ALTER TABLE "workshops" ADD COLUMN "video_provider" "enum_workshops_video_provider" DEFAULT 'youtube';
  ALTER TABLE "workshops" ADD COLUMN "video_video_id" varchar;
  ALTER TABLE "workshops" ADD COLUMN "video_title" varchar;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_provider" "enum__workshops_v_version_video_provider" DEFAULT 'youtube';
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_video_id" varchar;
  ALTER TABLE "_workshops_v" ADD COLUMN "version_video_title" varchar;
  ALTER TABLE "workshops_photos" ADD CONSTRAINT "workshops_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_photos" ADD CONSTRAINT "workshops_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_version_photos" ADD CONSTRAINT "_workshops_v_version_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_version_photos" ADD CONSTRAINT "_workshops_v_version_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "workshops_photos_order_idx" ON "workshops_photos" USING btree ("_order");
  CREATE INDEX "workshops_photos_parent_id_idx" ON "workshops_photos" USING btree ("_parent_id");
  CREATE INDEX "workshops_photos_image_idx" ON "workshops_photos" USING btree ("image_id");
  CREATE INDEX "_workshops_v_version_photos_order_idx" ON "_workshops_v_version_photos" USING btree ("_order");
  CREATE INDEX "_workshops_v_version_photos_parent_id_idx" ON "_workshops_v_version_photos" USING btree ("_parent_id");
  CREATE INDEX "_workshops_v_version_photos_image_idx" ON "_workshops_v_version_photos" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workshops_photos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshops_v_version_photos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "workshops_photos" CASCADE;
  DROP TABLE "_workshops_v_version_photos" CASCADE;
  ALTER TABLE "media" ALTER COLUMN "prefix" SET DEFAULT '';
  ALTER TABLE "workshops" DROP COLUMN "video_provider";
  ALTER TABLE "workshops" DROP COLUMN "video_video_id";
  ALTER TABLE "workshops" DROP COLUMN "video_title";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_provider";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_video_id";
  ALTER TABLE "_workshops_v" DROP COLUMN "version_video_title";
  DROP TYPE "public"."enum_workshops_video_provider";
  DROP TYPE "public"."enum__workshops_v_version_video_provider";`)
}
