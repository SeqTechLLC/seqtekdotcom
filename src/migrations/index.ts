import * as migration_20260531_141253_init from './20260531_141253_init'
import * as migration_20260608_223927_add_s3_media_columns from './20260608_223927_add_s3_media_columns'

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
]
