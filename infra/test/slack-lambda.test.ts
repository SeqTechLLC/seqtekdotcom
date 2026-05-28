import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type CloudWatchAlarmMessage,
  formatAlarmBlocks,
  type SlackBlock,
} from '../lambda/slack-notifier/format'

const FIXTURE_DIR = join(__dirname, '..', 'lambda', 'slack-notifier', '__fixtures__')

function loadFixture(name: string): CloudWatchAlarmMessage {
  const raw = readFileSync(join(FIXTURE_DIR, name), 'utf8')
  return JSON.parse(raw) as CloudWatchAlarmMessage
}

function findBlock(blocks: SlackBlock[], type: string): SlackBlock | undefined {
  return blocks.find((b) => b.type === type)
}

describe('formatAlarmBlocks', () => {
  describe('ALARM (alarm-fired.json)', () => {
    const blocks = formatAlarmBlocks(loadFixture('alarm-fired.json'))

    it('emits a header with the 🚨 icon', () => {
      const header = findBlock(blocks, 'header')
      expect(header).toBeDefined()
      const text = (header?.text as { text: string }).text
      expect(text).toMatch(/^🚨/)
      expect(text).toContain('SeqtekStagingObservability')
    })

    it('emits a fields section with State / Dimension / Threshold / Observed', () => {
      const section = findBlock(blocks, 'section')
      const fields = section?.fields as { text: string }[]
      expect(fields).toHaveLength(4)
      expect(fields.map((f) => f.text)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('*State*\nALARM (was OK)'),
          expect.stringContaining('*Dimension*\nALB'),
          expect.stringContaining('*Threshold*\n> 5'),
          expect.stringContaining('*Observed*\n12.0'),
        ]),
      )
    })

    it('includes the NewStateReason in a separate section', () => {
      const sections = blocks.filter((b) => b.type === 'section')
      const reasonBlock = sections.find((s) =>
        ((s.text as { text: string } | undefined)?.text ?? '').startsWith('*Reason*'),
      )
      expect(reasonBlock).toBeDefined()
    })

    it('emits an actions block with two CloudWatch console links', () => {
      const actions = findBlock(blocks, 'actions')
      expect(actions).toBeDefined()
      const elements = actions?.elements as { url: string; text: { text: string } }[]
      expect(elements).toHaveLength(2)
      expect(elements[0].url).toContain('cloudwatch/home')
      expect(elements[0].url).toContain('alarm=SeqtekStagingObservability-AlbFiveXx')
      expect(elements[1].url).toContain('alb-access')
    })

    it('emits a trailing context block with account / region / timestamp', () => {
      const context = blocks.filter((b) => b.type === 'context').at(-1)
      const element = (context?.elements as { text: string }[])[0]
      expect(element.text).toContain('600881993295')
      expect(element.text).toContain('us-east-1')
      expect(element.text).toContain('2026-05-28T18:00:12')
    })
  })

  describe('OK (alarm-recovered.json)', () => {
    const blocks = formatAlarmBlocks(loadFixture('alarm-recovered.json'))

    it('emits a header with the ✅ icon', () => {
      const header = findBlock(blocks, 'header')
      const text = (header?.text as { text: string }).text
      expect(text).toMatch(/^✅/)
    })

    it('omits the actions block on recovery (no buttons to spam on green)', () => {
      expect(findBlock(blocks, 'actions')).toBeUndefined()
    })

    it('still includes the State / Dimension fields', () => {
      const section = findBlock(blocks, 'section')
      const fields = section?.fields as { text: string }[]
      expect(fields.map((f) => f.text)).toEqual(
        expect.arrayContaining([expect.stringContaining('*State*\nOK (was ALARM)')]),
      )
    })
  })

  describe('INSUFFICIENT_DATA (alarm-insufficient-data.json)', () => {
    const blocks = formatAlarmBlocks(loadFixture('alarm-insufficient-data.json'))

    it('emits a header with the ⚠️ icon', () => {
      const header = findBlock(blocks, 'header')
      const text = (header?.text as { text: string }).text
      expect(text).toMatch(/^⚠️/)
    })

    it('includes action buttons (operator may need to investigate stale metrics)', () => {
      expect(findBlock(blocks, 'actions')).toBeDefined()
    })

    it('resolves the RDS dimension from the metric namespace', () => {
      const section = findBlock(blocks, 'section')
      const fields = section?.fields as { text: string }[]
      expect(fields.some((f) => f.text === '*Dimension*\nRDS')).toBe(true)
    })
  })

  describe('HEARTBEAT (heartbeat.json)', () => {
    const blocks = formatAlarmBlocks(loadFixture('heartbeat.json'))

    it('emits exactly one context block', () => {
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('context')
    })

    it('uses the ⚙️ icon and "alert pipeline is healthy" copy', () => {
      const element = (blocks[0].elements as { text: string }[])[0]
      expect(element.text).toMatch(/^⚙️/)
      expect(element.text).toContain('alert pipeline is healthy')
    })

    it('does NOT emit a header or action buttons (heartbeats are quiet)', () => {
      expect(findBlock(blocks, 'header')).toBeUndefined()
      expect(findBlock(blocks, 'actions')).toBeUndefined()
    })
  })

  describe('malformed input', () => {
    it('throws on missing AlarmName', () => {
      expect(() =>
        formatAlarmBlocks({ NewStateValue: 'ALARM' } as unknown as CloudWatchAlarmMessage),
      ).toThrow(/Malformed/)
    })

    it('throws on missing NewStateValue', () => {
      expect(() =>
        formatAlarmBlocks({ AlarmName: 'X' } as unknown as CloudWatchAlarmMessage),
      ).toThrow(/Malformed/)
    })

    it('throws on unrecognized state', () => {
      expect(() =>
        formatAlarmBlocks({
          AlarmName: 'X',
          NewStateValue: 'BOGUS',
          AWSAccountId: '1',
          StateChangeTime: 't',
          Region: 'us-east-1',
          AlarmArn: 'a',
        } as unknown as CloudWatchAlarmMessage),
      ).toThrow(/Unrecognized alarm state/)
    })
  })
})
