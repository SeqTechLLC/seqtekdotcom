import * as migration_20260924_200338_baseline from './20260924_200338_baseline'
import * as migration_20261015_182531_cards_tabs_and_heading_button from './20261015_182531_cards_tabs_and_heading_button'

export const migrations = [
  {
    up: migration_20260924_200338_baseline.up,
    down: migration_20260924_200338_baseline.down,
    name: '20260924_200338_baseline',
  },
  {
    up: migration_20261015_182531_cards_tabs_and_heading_button.up,
    down: migration_20261015_182531_cards_tabs_and_heading_button.down,
    name: '20261015_182531_cards_tabs_and_heading_button',
  },
]
