export type FixtureOutcome = 'success' | 'domain-rejected'

export interface OauthFixture {
  key: string
  email: string
  name: string
  sub: string
  hd?: string
  expectedRole?: 'admin' | 'editor'
  expectedOutcome: FixtureOutcome
}

export const FIXTURES: Record<string, OauthFixture> = {
  'bootstrap-admin': {
    key: 'bootstrap-admin',
    email: 'kenn@seqtechllc.com',
    name: 'Kenn Williamson',
    sub: 'fixture-bootstrap-admin-sub',
    hd: 'seqtechllc.com',
    expectedRole: 'admin',
    expectedOutcome: 'success',
  },
  editor: {
    key: 'editor',
    email: 'editor@seqtechllc.com',
    name: 'Test Editor',
    sub: 'fixture-editor-sub',
    hd: 'seqtechllc.com',
    expectedRole: 'editor',
    expectedOutcome: 'success',
  },
  intruder: {
    key: 'intruder',
    email: 'intruder@gmail.com',
    name: 'Random Person',
    sub: 'fixture-intruder-sub',
    expectedOutcome: 'domain-rejected',
  },
  'wrong-workspace': {
    key: 'wrong-workspace',
    email: 'someone@otherco.com',
    name: 'Other Worker',
    sub: 'fixture-wrong-workspace-sub',
    hd: 'otherco.com',
    expectedOutcome: 'domain-rejected',
  },
}
