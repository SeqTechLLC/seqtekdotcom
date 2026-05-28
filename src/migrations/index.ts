import * as migration_20260526_225009 from './20260526_225009'

export const migrations = [
  {
    up: migration_20260526_225009.up,
    down: migration_20260526_225009.down,
    name: '20260526_225009',
  },
]
