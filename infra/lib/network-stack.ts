import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import type { Construct } from 'constructs'
import type { EnvConfig, EnvName } from './construct-utils'
import { DeployRoles } from './deploy-role'

export interface NetworkStackProps extends StackProps {
  envName: EnvName
  cfg: EnvConfig
}

/**
 * VPC, subnets, NAT gateway, security groups, and the GitHub OIDC deploy
 * role. Lives in the rare-change-rate stack per ARCHITECTURE.md §13.
 *
 * Outputs are consumed by Data (for RDS subnet placement + RDS SG),
 * Compute (for ALB/ASG subnets + their SGs), and Observability (for
 * Lambda VPC + LambdaSg).
 */
export class NetworkStack extends Stack {
  public readonly vpc: ec2.IVpc
  public readonly albSecurityGroup: ec2.ISecurityGroup
  public readonly appSecurityGroup: ec2.ISecurityGroup
  public readonly rdsSecurityGroup: ec2.ISecurityGroup
  public readonly lambdaSecurityGroup: ec2.ISecurityGroup

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props)

    if (props.cfg.existingVpc) {
      // ----- Import + extend an EXISTING VPC (see EnvConfig.existingVpc doc) -----
      //
      // Reuses the account's existing VPC + Internet Gateway (both already at
      // their account-level quota) instead of creating new ones. Only adds
      // what's actually missing: one subnet pair in a SECOND az, because the
      // existing VPC's subnets are all in one AZ, and both the ALB and RDS's
      // subnet group independently require 2. Nothing about the VPC's
      // existing subnets, route tables, or default security group is
      // touched — other infrastructure already lives in this VPC.
      const ev = props.cfg.existingVpc

      const newPublicSubnet = new ec2.CfnSubnet(this, 'SecondaryPublicSubnet', {
        vpcId: ev.vpcId,
        cidrBlock: ev.secondaryPublicCidr,
        availabilityZone: ev.secondaryAz,
        mapPublicIpOnLaunch: true,
        tags: [{ key: 'Name', value: `${this.stackName}-public-${ev.secondaryAz}` }],
      })
      const newPublicRouteTable = new ec2.CfnRouteTable(this, 'SecondaryPublicRouteTable', {
        vpcId: ev.vpcId,
        tags: [{ key: 'Name', value: `${this.stackName}-public-${ev.secondaryAz}` }],
      })
      new ec2.CfnRoute(this, 'SecondaryPublicDefaultRoute', {
        routeTableId: newPublicRouteTable.ref,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: ev.igwId,
      })
      new ec2.CfnSubnetRouteTableAssociation(this, 'SecondaryPublicRouteTableAssoc', {
        subnetId: newPublicSubnet.ref,
        routeTableId: newPublicRouteTable.ref,
      })

      const newIsolatedSubnet = new ec2.CfnSubnet(this, 'SecondaryIsolatedSubnet', {
        vpcId: ev.vpcId,
        cidrBlock: ev.secondaryIsolatedCidr,
        availabilityZone: ev.secondaryAz,
        mapPublicIpOnLaunch: false,
        tags: [{ key: 'Name', value: `${this.stackName}-isolated-${ev.secondaryAz}` }],
      })
      const newIsolatedRouteTable = new ec2.CfnRouteTable(this, 'SecondaryIsolatedRouteTable', {
        vpcId: ev.vpcId,
        tags: [{ key: 'Name', value: `${this.stackName}-isolated-${ev.secondaryAz}` }],
      })
      // No default route on this table — matches PRIVATE_ISOLATED semantics
      // (RDS has no need to reach the internet).
      new ec2.CfnSubnetRouteTableAssociation(this, 'SecondaryIsolatedRouteTableAssoc', {
        subnetId: newIsolatedSubnet.ref,
        routeTableId: newIsolatedRouteTable.ref,
      })

      // `fromVpcAttributes` with explicit per-AZ subnet ID arrays makes
      // `vpcSubnets: { subnetType: PUBLIC | PRIVATE_ISOLATED }` in
      // data-stack.ts / compute-stack.ts resolve to [existing, new] for
      // each tier automatically — no changes needed at those call sites.
      this.vpc = ec2.Vpc.fromVpcAttributes(this, 'Vpc', {
        vpcId: ev.vpcId,
        availabilityZones: [ev.primaryAz, ev.secondaryAz],
        publicSubnetIds: [ev.publicSubnetId, newPublicSubnet.ref],
        isolatedSubnetIds: [ev.isolatedSubnetId, newIsolatedSubnet.ref],
      })
    } else {
      // 10.0.0.0/16 per env, 2 AZs, public + isolated tiers only.
      // No NAT gateway during the validation period (Clarifications Session
      // 2026-05-26): ASG runs in public subnets with strictly-scoped SGs.
      // Before public launch, add a PRIVATE_WITH_EGRESS tier + NAT (or VPC
      // endpoints) and flip the compute subnet placement — see ROADMAP P3,
      // "Production network posture" (the wording there predates Fargate).
      this.vpc = new ec2.Vpc(this, 'Vpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 2,
        natGateways: 0,
        restrictDefaultSecurityGroup: true,
        subnetConfiguration: [
          {
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
        ],
      })
    }

    // ALB — ingress only from the CloudFront managed prefix list. 443
    // is the viewer-facing path (TLS terminates at CloudFront, plaintext
    // forwarded to the ALB). 80 is the validation-period path while
    // CloudFront origin uses HTTP; remove at Phase 5.5 when we add
    // end-to-end TLS between CloudFront and ALB.
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      description: 'ALB ingress: 443 from CloudFront managed prefix list only',
      allowAllOutbound: true,
    })
    const cloudFrontPrefix = ec2.Peer.prefixList('pl-3b927c52') // CloudFront us-east-1
    // NB: SG ingress rule descriptions only accept characters from the
    // set `a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*`. That set excludes `>` and
    // any non-ASCII character — no `->` arrow, no Unicode `→`. Stick to
    // plain words like "to" / "from".
    //
    // Validation-period topology: only ONE port's ingress rule here,
    // never both. CloudFront normally terminates TLS for viewers and uses
    // HTTP_ONLY to the ALB origin (compute-stack has only a port-80
    // listener) — a single rule with the CloudFront managed prefix list
    // consumes ~55 of the 60 default rules-per-SG quota, so keeping BOTH
    // 80 and 443 rules simultaneously isn't practical without a quota
    // increase. `cognitoAuthEnabled` (added 2026-08-12) pulls forward
    // exactly the swap this comment used to describe as "Phase 5.5":
    // ALB's authenticate-oidc action (the Cognito gate) only works on
    // HTTPS listeners, so a gated env needs CloudFront talking to the ALB
    // over 443 instead of 80 — see compute-stack.ts's listener and
    // edge-stack.ts's origin protocol, both keyed on the SAME flag.
    this.albSecurityGroup.addIngressRule(
      cloudFrontPrefix,
      props.cfg.cognitoAuthEnabled ? ec2.Port.tcp(443) : ec2.Port.tcp(80),
      props.cfg.cognitoAuthEnabled
        ? 'CloudFront to ALB on 443 (cognitoAuthEnabled requires HTTPS for the auth action)'
        : 'CloudFront to ALB on 80 (validation-period; flips to 443 when cognitoAuthEnabled)',
    )

    // App — ingress 3000 from AlbSg only.
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: this.vpc,
      description: 'EC2 app instances ingress: 3000 from AlbSg only',
      allowAllOutbound: true,
    })
    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'ALB to app on port 3000',
    )

    // RDS — ingress 5432 from AppSg only.
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc: this.vpc,
      description: 'RDS ingress: 5432 from AppSg only',
      allowAllOutbound: false,
    })
    this.rdsSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'App to RDS on Postgres port',
    )

    // Slack notifier Lambda SG — defined for completeness. Phase 5 (T042)
    // will likely run the Lambda outside the VPC since there's no NAT in
    // the validation-period topology and Slack's webhook lives on the
    // public internet. If the Lambda ever needs VPC placement (e.g., to
    // reach a VPC-private resource), this SG is here.
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Slack notifier Lambda SG (unused in validation-period topology)',
      allowAllOutbound: true,
    })

    // GitHub OIDC + per-env deploy role (account-wide; lives in the
    // rare-change-rate stack so deploy-role rotations don't pull the
    // VPC through a CloudFormation change-set diff).
    new DeployRoles(this, 'Deploy', {
      envName: props.envName,
      ownsAccountOidcProvider: props.cfg.ownsAccountOidcProvider,
    })

    // Outputs for cross-stack consumption + human convenience
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for this environment',
      exportName: `${this.stackName}-VpcId`,
    })
    new CfnOutput(this, 'AlbSgId', {
      value: this.albSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-AlbSgId`,
    })
    new CfnOutput(this, 'AppSgId', {
      value: this.appSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-AppSgId`,
    })
    new CfnOutput(this, 'RdsSgId', {
      value: this.rdsSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-RdsSgId`,
    })
    new CfnOutput(this, 'LambdaSgId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      exportName: `${this.stackName}-LambdaSgId`,
    })
  }
}
