import * as migration_20260531_141253_init from './20260531_141253_init'
import * as migration_20260608_223927_add_s3_media_columns from './20260608_223927_add_s3_media_columns'
import * as migration_20260611_201340_add_workshop_proof_section from './20260611_201340_add_workshop_proof_section'
import * as migration_20260612_233107_add_video_embed_eyebrow from './20260612_233107_add_video_embed_eyebrow'
import * as migration_20260614_223447_add_image_gallery_blocks from './20260614_223447_add_image_gallery_blocks'
import * as migration_20260614_225002_add_layout_workshops from './20260614_225002_add_layout_workshops'

export const migrations = [
  {
    up: migration_20260531_141253_init.up,
    down: migration_20260531_141253_init.down,
    name: '20260531_141253_init',
  },
  {
    up: migration_20260608_223927_add_s3_media_columns.up,
    down: migration_20260608_223927_add_s3_media_columns.down,
    name: '20260608_223927_add_s3_media_columns',
  },
  {
    up: migration_20260611_201340_add_workshop_proof_section.up,
    down: migration_20260611_201340_add_workshop_proof_section.down,
    name: '20260611_201340_add_workshop_proof_section',
  },
  {
    up: migration_20260612_233107_add_video_embed_eyebrow.up,
    down: migration_20260612_233107_add_video_embed_eyebrow.down,
    name: '20260612_233107_add_video_embed_eyebrow',
  },
  {
    up: migration_20260614_223447_add_image_gallery_blocks.up,
    down: migration_20260614_223447_add_image_gallery_blocks.down,
    name: '20260614_223447_add_image_gallery_blocks',
  },
  {
    up: migration_20260614_225002_add_layout_workshops.up,
    down: migration_20260614_225002_add_layout_workshops.down,
    name: '20260614_225002_add_layout_workshops',
  },
]
