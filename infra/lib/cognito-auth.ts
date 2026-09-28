import { readFileSync } from 'fs'
import { join } from 'path'
import { Duration, SecretValue, Stack } from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'
import type { EnvName } from './construct-utils'

// The DEMO | ENVIRONMENT lockup that sits at the top of the sign-in card,
// read once at synth time and shipped as a base64 `FORM_LOGO` asset on the
// managed-login branding resource below. Managed login takes real image
// assets, so unlike the classic Hosted UI this is not a CSS
// `background-image` data URI — the classic UI's separate raster
// `ImageFile` upload was dropped and CSS was the only way to place a logo;
// that constraint is gone here.
const LOGO_PATH = join(__dirname, '..', '..', 'public', 'brand', 'demo-environment.png')
const LOGO_BASE64 = readFileSync(LOGO_PATH).toString('base64')

// docs/DESIGN_SYSTEM.md §14 / tailwind.config.mjs — brand-navy-800 and
// brand-green-500/600, hex-baked the same way tailwind.config.mjs bakes
// them (the branding document is flat JSON with no access to CSS custom
// properties or theme tokens).
//
// Managed login wants 8-digit RGBA hex with NO leading `#` — `1f3265ff`,
// not `#1F3265`. A `#`-prefixed value is silently rejected, so these are
// stored in the branding form and converted for nothing else.
const BRAND_NAVY_800 = '1f3265ff'
const BRAND_GREEN_500 = '72b94dff'
const BRAND_GREEN_600 = '5a9c3bff'
const WHITE = 'ffffffff'

export interface CognitoAuthGateProps {
  envName: EnvName
  /**
   * Every hostname the ALB will present a login-gated action for — e.g.
   * `['preview.seqtek.com', 'ww3.seqtek.com']`. Cognito's App Client
   * needs a callback/logout URL PER hostname (ALB's authenticate-cognito
   * action redirects to a fixed `/oauth2/idpresponse` path on whichever
   * host the request arrived on).
   */
  gatedHostnames: string[]
  /** `${data.parameterPathPrefix}` — where the manually-seeded
   * `cognito_google_client_id` SSM param for THIS gate lives (the
   * matching client SECRET lives in Secrets Manager instead — see the
   * constructor). Deliberately separate from `google_client_id`/
   * `google_client_secret` (the app's OWN OAuth client for the Payload
   * admin login) — different Google Cloud OAuth client, different
   * purpose. Manual-seed steps: INFRASTRUCTURE_RUNBOOK.md §1.3a.
   */
  parameterPathPrefix: string
}

/**
 * A Cognito User Pool that gates an ALB listener action behind Google
 * Workspace SSO — "hide this lane from the public internet" without
 * touching the app itself. Staff sign in with Google, and that path
 * relies on the Google Cloud OAuth client being configured as "Internal"
 * (restricted to the seqtechllc.com Workspace) for the actual
 * @seqtechllc.com restriction — Cognito itself does not enforce a
 * hosted-domain filter.
 *
 * The App Client ALSO offers the pool's own user directory, so an
 * external reviewer with no Workspace identity can be let in one account
 * at a time (see `supportedIdentityProviders` below). Creating those
 * accounts is admin-only; there is no self-service path in.
 *
 * Uses the default Cognito-hosted domain (`<prefix>.auth.<region>.
 * amazoncognito.com`), not a custom domain — avoids any new ACM
 * cert/Route53 record, which would add real DNS-touching surface area
 * for what's meant to be a low-risk perimeter gate.
 */
export class CognitoAuthGate {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient
  public readonly userPoolDomain: cognito.UserPoolDomain

  constructor(scope: Construct, id: string, props: CognitoAuthGateProps) {
    const { envName, gatedHostnames, parameterPathPrefix } = props

    this.userPool = new cognito.UserPool(scope, `${id}UserPool`, {
      userPoolName: `seqtek-${envName}-gate`,
      selfSignUpEnabled: false,
    })

    // Manually seeded (see INFRASTRUCTURE_RUNBOOK.md §1.3a) — a Google
    // Cloud OAuth client dedicated to this gate, distinct from the app's
    // own `google_client_id`/`google_client_secret`. Client ID is not
    // sensitive (plain SSM String). The secret is NOT an SSM SecureString
    // like every other manually-seeded secret in this codebase — deploy
    // failed with "SSM Secure reference is not supported in:
    // [AWS::Cognito::UserPoolIdentityProvider/Properties/ProviderDetails/
    // client_secret]" (2026-08-12). `ProviderDetails` is a generic
    // string map CloudFormation only resolves `{{resolve:secretsmanager:
    // ...}}` dynamic references in, not `{{resolve:ssm-secure:...}}` —
    // Secrets Manager it is, matching how every OTHER sensitive value in
    // data-stack.ts is already stored anyway.
    const googleClientId = ssm.StringParameter.valueForStringParameter(
      scope,
      `${parameterPathPrefix}/cognito_google_client_id`,
    )
    const googleClientSecret = SecretValue.secretsManager(
      `seqtek-website/${envName}/cognito-google-client-secret`,
    )

    const googleIdp = new cognito.UserPoolIdentityProviderGoogle(scope, `${id}GoogleIdp`, {
      userPool: this.userPool,
      clientId: googleClientId,
      clientSecretValue: googleClientSecret,
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
      },
    })

    // NEWER_MANAGED_LOGIN (version 2) rather than the classic Hosted UI.
    // The two are different products, not a theme switch: managed login is
    // the one that renders the full-bleed background with a centred card,
    // and it IGNORES `UserPoolUICustomizationAttachment` CSS entirely.
    // Branding moves to the `CfnManagedLoginBranding` document below.
    this.userPoolDomain = this.userPool.addDomain(`${id}Domain`, {
      cognitoDomain: { domainPrefix: `seqtek-${envName}-gate` },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    })

    this.userPoolClient = this.userPool.addClient(`${id}Client`, {
      generateSecret: true, // required for ALB's authenticate-cognito action
      // Google for staff, plus the pool's OWN user directory for the
      // occasional external reviewer (agency, client) who has no
      // @seqtechllc.com Google identity and must not be given one. The
      // Hosted UI shows the "Sign in with Google" button AND a username/
      // password form; the CSS below already styles the form's selectors.
      // This does NOT open the gate up — `selfSignUpEnabled: false` and
      // the pool's `AllowAdminCreateUserOnly` mean the only native users
      // are ones an admin creates by hand, one at a time.
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: gatedHostnames.map((h) => `https://${h}/oauth2/idpresponse`),
        logoutUrls: gatedHostnames.map((h) => `https://${h}/`),
      },
      accessTokenValidity: Duration.hours(8),
      idTokenValidity: Duration.hours(8),
      refreshTokenValidity: Duration.days(30),
    })
    // The client references the Google IdP by name (supportedIdentityProviders)
    // — CFN needs the IdP resource to exist first, which dependency
    // ordering alone doesn't guarantee since it's a string reference, not
    // a Ref/GetAtt. Well-known CDK gotcha for this construct pairing.
    this.userPoolClient.node.addDependency(googleIdp)

    // ----- SEQTEK-branded managed login -----
    // Managed login's style document. Only the values that differ from
    // Cognito's defaults are listed: the API "preserves existing style
    // settings that you don't specify", so a partial document is the
    // supported shape, not a shortcut. Everything omitted here — the input
    // fields, the "Show password" control, the links, the dark-mode
    // palette — keeps Cognito's default, which already reads correctly
    // against a white card.
    const brandingSettings = {
      categories: {
        // The gate is a light-mode page on a navy field. Pinning LIGHT
        // stops a viewer's OS dark-mode preference from flipping the card
        // to Cognito's dark palette, which would put a dark card on the
        // dark navy background.
        global: {
          colorSchemeMode: 'LIGHT',
          pageHeader: { enabled: false },
          pageFooter: { enabled: false },
        },
        form: {
          displayGraphics: true,
          location: { horizontal: 'CENTER', vertical: 'CENTER' },
        },
      },
      components: {
        // Navy fills the whole page; the card sits on top of it.
        pageBackground: {
          image: { enabled: false },
          lightMode: { color: BRAND_NAVY_800 },
        },
        // White card, and the FORM_LOGO asset placed inside it at the top.
        // `formInclusion: 'IN'` is what puts the logo inside the card
        // rather than floating above it.
        form: {
          backgroundImage: { enabled: false },
          lightMode: { backgroundColor: WHITE },
          logo: { enabled: true, formInclusion: 'IN', location: 'CENTER', position: 'TOP' },
        },
        primaryButton: {
          lightMode: {
            defaults: { backgroundColor: BRAND_GREEN_500, textColor: WHITE },
            hover: { backgroundColor: BRAND_GREEN_600, textColor: WHITE },
            active: { backgroundColor: BRAND_GREEN_600, textColor: WHITE },
          },
        },
      },
    }

    const branding = new cognito.CfnManagedLoginBranding(scope, `${id}Branding`, {
      userPoolId: this.userPool.userPoolId,
      clientId: this.userPoolClient.userPoolClientId,
      // false — this style IS customized. Setting it true is mutually
      // exclusive with `settings`/`assets` and the deploy is rejected.
      useCognitoProvidedValues: false,
      returnMergedResources: false,
      settings: brandingSettings,
      // One asset PER colour mode. `DYNAMIC` looks like it should serve
      // both and does not: the page requests the variant for the mode it
      // is rendering, finds no LIGHT asset, and silently falls back to
      // Cognito's stock `cognito-image-logo-light.svg` placeholder — a
      // deploy that reports success and shows the wrong logo (observed on
      // preview, 2026-09-25). LIGHT is the one that renders today because
      // colorSchemeMode is pinned to LIGHT above; DARK is supplied so that
      // unpinning it later does not silently reintroduce the placeholder.
      assets: [
        {
          category: 'FORM_LOGO',
          colorMode: 'LIGHT',
          extension: 'PNG',
          bytes: LOGO_BASE64,
        },
        {
          category: 'FORM_LOGO',
          colorMode: 'DARK',
          extension: 'PNG',
          bytes: LOGO_BASE64,
        },
      ],
    })
    // Same "string reference, not a Ref/GetAtt" ordering gap as the IdP
    // dependency above — the branding is attached to a client and a
    // domain that both have to exist first.
    branding.node.addDependency(this.userPoolClient)
    branding.node.addDependency(this.userPoolDomain)
  }

  /**
   * Wraps `next` in an ALB `authenticate-oidc` action pointed at this
   * User Pool's Hosted UI. There is no `ListenerAction.authenticateCognito`
   * in this CDK version (removed upstream) — Cognito's Hosted UI is
   * itself a standard OIDC provider, so pointing `authenticateOidc`
   * directly at its `/oauth2/*` endpoints is the current recommended
   * replacement, not a workaround. ALB still applies its own
   * Cognito-aware behavior server-side; this only changes which CDK API
   * shape configures it.
   */
  public authenticateAndForward(next: elbv2.ListenerAction): elbv2.ListenerAction {
    const region = Stack.of(this.userPool).region
    const base = this.userPoolDomain.baseUrl()
    return elbv2.ListenerAction.authenticateOidc({
      next,
      issuer: `https://cognito-idp.${region}.amazonaws.com/${this.userPool.userPoolId}`,
      authorizationEndpoint: `${base}/oauth2/authorize`,
      tokenEndpoint: `${base}/oauth2/token`,
      userInfoEndpoint: `${base}/oauth2/userInfo`,
      clientId: this.userPoolClient.userPoolClientId,
      clientSecret: this.userPoolClient.userPoolClientSecret,
      scope: 'openid email profile',
    })
  }
}
