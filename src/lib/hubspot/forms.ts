// The provisioned Workshop Inquiry HubSpot form (INTEGRATIONS.md §1.2). The GUID
// is public (it ships in the rendered form embed), so a constant fallback is safe
// and keeps the composer + renderer deterministic when
// NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID is unset (CI, tests).
export const WORKSHOP_FORM_ID =
  process.env.NEXT_PUBLIC_HUBSPOT_WORKSHOP_FORM_ID || '66dba2bf-f099-44d5-8c6e-f24292cefe53'
