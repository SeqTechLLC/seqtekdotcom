import * as migration_20260924_200338_baseline from './20260924_200338_baseline'

export const migrations = [
  {
    up: migration_20260924_200338_baseline.up,
    down: migration_20260924_200338_baseline.down,
    name: '20260924_200338_baseline',
  },
]
