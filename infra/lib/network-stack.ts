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

    // 10.0.0.0/16 per env, 2 AZs, public + isolated tiers only.
    // No NAT gateway during the validation period (Clarifications Session
    // 2026-05-26): ASG runs in public subnets with strictly-scoped SGs.
    // At Phase 5.5 launch readiness, add a PRIVATE_WITH_EGRESS tier + NAT
    // (or VPC endpoints) and flip the ASG subnet placement — see
    // ROADMAP §4 Phase 5.5.
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
    this.albSecurityGroup.addIngressRule(
      cloudFrontPrefix,
      ec2.Port.tcp(443),
      'CloudFront → ALB on 443',
    )
    this.albSecurityGroup.addIngressRule(
      cloudFrontPrefix,
      ec2.Port.tcp(80),
      'CloudFront → ALB on 80 (validation-period; remove at Phase 5.5)',
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
      'ALB -> app on port 3000',
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
      'App -> RDS on Postgres port',
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
    new DeployRoles(this, 'Deploy', { envName: props.envName })

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
