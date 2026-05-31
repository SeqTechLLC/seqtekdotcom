import * as migration_20260531_141253_init from './20260531_141253_init'

export const migrations = [
  {
    up: migration_20260531_141253_init.up,
    down: migration_20260531_141253_init.down,
    name: '20260531_141253_init',
  },
]
