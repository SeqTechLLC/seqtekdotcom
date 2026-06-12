import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video_embed" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_video_embed" ADD COLUMN "eyebrow" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_video_embed" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_video_embed" DROP COLUMN "eyebrow";`)
}
