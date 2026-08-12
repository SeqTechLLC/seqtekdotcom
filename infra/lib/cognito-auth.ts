import { readFileSync } from 'fs'
import { join } from 'path'
import { Duration, SecretValue, Stack } from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import type { Construct } from 'constructs'
import type { EnvName } from './construct-utils'

// SEQTEK's own white wordmark (no tagline — compact enough for the Hosted
// UI's banner strip), read once at synth time and inlined into the CSS
// customization below as a data URI. `AWS::Cognito::
// UserPoolUICustomizationAttachment` dropped the separate raster
// `ImageFile` upload the classic Hosted UI used to support (AWS steered
// that toward the newer, non-CloudFormation "Managed Login" branding API
// instead) — a CSS `background-image` on `.banner-customizable` is the
// current way to place a logo without leaving CDK/CloudFormation for a
// custom resource.
const LOGO_PATH = join(
  __dirname,
  '..',
  '..',
  'public',
  'brand',
  'White-logo-w-o-tagline-transparent-background.png',
)
const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`

// docs/DESIGN_SYSTEM.md §14 / tailwind.config.mjs — brand-navy-800 and
// brand-green-500/600. Hex-baked here the same way tailwind.config.mjs
// bakes them (Cognito's Hosted UI CSS customization has no access to CSS
// custom properties/theme tokens, just a flat stylesheet).
const BRAND_NAVY_800 = '#1F3265'
const BRAND_GREEN_500 = '#72B94D'
const BRAND_GREEN_600 = '#5A9C3B'

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
 * touching the app itself. The App Client is Google-only (no username/
 * password option ever appears on the Hosted UI) and relies on the
 * Google Cloud OAuth client being configured as "Internal" (restricted to
 * the seqtechllc.com Workspace) for the actual @seqtechllc.com
 * restriction — Cognito itself does not enforce a hosted-domain filter.
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

    this.userPoolDomain = this.userPool.addDomain(`${id}Domain`, {
      cognitoDomain: { domainPrefix: `seqtek-${envName}-gate` },
    })

    this.userPoolClient = this.userPool.addClient(`${id}Client`, {
      generateSecret: true, // required for ALB's authenticate-cognito action
      // GOOGLE-ONLY — the Hosted UI shows a single "Sign in with Google"
      // button, no username/password form, since that flow was never
      // enabled above.
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.GOOGLE],
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

    // ----- SEQTEK-branded classic Hosted UI -----
    // Selectors are Cognito's fixed, documented set for the classic Hosted
    // UI (not arbitrary CSS scoping) — there is no separate class for the
    // white sign-in card itself; it's white by Cognito's own built-in
    // stylesheet already, which happens to match the target design as-is.
    const css = `
      .background-customizable {
        background-color: ${BRAND_NAVY_800};
      }
      .banner-customizable {
        background-color: #ffffff;
        background-image: url('${LOGO_DATA_URI}');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        height: 64px;
        padding: 0;
      }
      .submitButton-customizable {
        font-size: 14px;
        font-weight: bold;
        height: 40px;
        width: 100%;
        color: #fff;
        background-color: ${BRAND_GREEN_500};
        border-radius: 6px;
      }
      .submitButton-customizable:hover {
        color: #fff;
        background-color: ${BRAND_GREEN_600};
      }
      .idpButton-customizable {
        height: 40px;
        width: 100%;
        color: #fff;
        background-color: ${BRAND_GREEN_500};
        border-radius: 6px;
      }
      .idpButton-customizable:hover {
        color: #fff;
        background-color: ${BRAND_GREEN_600};
      }
      .inputField-customizable {
        width: 100%;
        height: 34px;
        color: #555;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .inputField-customizable:focus {
        border-color: ${BRAND_NAVY_800};
      }
      .errorMessage-customizable {
        padding: 5px;
        font-size: 14px;
        width: 100%;
        background: #f5f5f5;
        border: 2px solid #d12c29;
        color: #d12c29;
      }
    `
    const uiCustomization = new cognito.CfnUserPoolUICustomizationAttachment(
      scope,
      `${id}UiCustomization`,
      {
        userPoolId: this.userPool.userPoolId,
        clientId: this.userPoolClient.userPoolClientId,
        css,
      },
    )
    // The customization targets this specific client and needs the
    // Hosted UI domain to exist first — same "string reference, not a
    // Ref/GetAtt" ordering gap as the IdP dependency above.
    uiCustomization.node.addDependency(this.userPoolClient)
    uiCustomization.node.addDependency(this.userPoolDomain)
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
