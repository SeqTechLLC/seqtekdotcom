import * as migration_20260531_134923_init from './20260531_134923_init'

export const migrations = [
  {
    up: migration_20260531_134923_init.up,
    down: migration_20260531_134923_init.down,
    name: '20260531_134923_init',
  },
]
