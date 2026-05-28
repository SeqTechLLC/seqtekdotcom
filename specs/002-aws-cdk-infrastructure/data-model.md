# Phase 1: Data Model — AWS CDK Infrastructure & Blue-Green CI/CD

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

For an infrastructure feature, the "data model" is the resource topology — what gets created, how it's referenced across stacks, and how it varies per environment. Three sections follow: the **stack construct tree**, the **per-env sizing table**, and the **IAM role inventory**.

---

## 1. Stack construct tree

Five CDK stacks. Cross-stack references are one-directional to avoid CloudFormation update conflicts. Source: ARCHITECTURE.md §13.

```text
SeqtekProd / SeqtekStaging  (stack-name prefix from `-c env=...`)
│
├── *Network        ───────►  no upstream deps
│   ├── Vpc (cidr: 10.0.0.0/16, 2 AZs)
│   │   ├── PublicSubnet × 2
│   │   ├── PrivateSubnet × 2     (egress via NAT)
│   │   └── IsolatedSubnet × 2    (RDS only, no internet route)
│   ├── NatGateway × 1             (single-AZ; tradeoff noted in research.md §loose ends)
│   ├── SecurityGroup: AlbSg       (ingress 443 from CloudFront managed prefix list only)
│   ├── SecurityGroup: AppSg       (ingress 3000 from AlbSg only)
│   ├── SecurityGroup: RdsSg       (ingress 5432 from AppSg only)
│   └── SecurityGroup: LambdaSg    (no ingress; Slack notifier egress to internet via NAT)
│
├── *Data           ───────►  depends on: Network
│   ├── DatabaseInstance (RDS Postgres 16, db.t3.small, single-AZ, gp3 50GB / 3000 IOPS)
│   │   ├── In: IsolatedSubnet
│   │   ├── SG: RdsSg
│   │   ├── Backup: 7d retention, 06:00-07:00 UTC window
│   │   ├── DeletionProtection: true (prod), false (staging)
│   │   └── CredentialsManaged: Secrets Manager auto-rotated master password mirrored to Parameter Store
│   ├── Bucket: seqtek-media-{env}
│   │   ├── BlockPublicAccess: ALL_ON
│   │   ├── ObjectOwnership: BUCKET_OWNER_ENFORCED
│   │   ├── Encryption: S3_MANAGED
│   │   ├── Versioning: ENABLED
│   │   ├── LifecycleRules:
│   │   │   ├── Noncurrent → Glacier IR after 90d
│   │   │   ├── Noncurrent expire after 365d
│   │   │   └── AbortIncompleteMultipartUploads after 7d
│   │   └── Policy: SourceArn-pinned to the CloudFront distribution (added in *Edge)
│   ├── StringParameter × N (per Parameter Store namespace table in research.md §8)
│   └── Outputs:
│       ├── DatabaseEndpoint (referenced by *Compute)
│       ├── MediaBucketName (referenced by *Compute + *Edge)
│       └── ParameterPathPrefix (referenced by *Compute)
│
├── *Compute        ───────►  depends on: Network, Data
│   ├── Repository: seqtek-website (ECR; shared across envs — created once in prod stack, referenced by name in staging)
│   │   └── LifecycleRules: keep last 10 tagged, untagged 7d
│   ├── ApplicationLoadBalancer
│   │   ├── In: PublicSubnet
│   │   ├── SG: AlbSg
│   │   ├── Listener: 443 (TLS 1.2+)
│   │   │   ├── Cert: from *Edge (cross-stack ref)
│   │   │   └── DefaultAction: forward → AppTargetGroup
│   │   └── Listener: 80 (redirect to 443, 301)
│   ├── ApplicationTargetGroup: AppTargetGroup
│   │   ├── Protocol: HTTP, Port: 3000
│   │   ├── HealthCheck: GET /api/health, interval 30s, threshold 3 healthy / 2 unhealthy
│   │   ├── DeregistrationDelay: 120s (research.md §2)
│   │   └── StickinessCookieDuration: none (admin sessions live in cookies, not server)
│   ├── LaunchTemplate
│   │   ├── InstanceType: t3.small
│   │   ├── ImageId: Amazon Linux 2023 (latest SSM parameter)
│   │   ├── UserData:
│   │   │   ├── Install Docker + CloudWatch Agent
│   │   │   ├── docker pull <ecr-uri>:latest
│   │   │   ├── Load env from Parameter Store (instance profile)
│   │   │   └── docker run --restart=unless-stopped -p 3000:3000 <image>
│   │   ├── MetadataOptions: IMDSv2 required, HttpPutResponseHopLimit: 2
│   │   └── IamRole: AppInstanceRole (defined in §3 below)
│   ├── AutoScalingGroup
│   │   ├── In: PrivateSubnet (both AZs)
│   │   ├── SG: AppSg
│   │   ├── LaunchTemplate: ↑
│   │   ├── MinCapacity: 2 (prod) / 1 (staging)
│   │   ├── DesiredCapacity: 2 (prod) / 1 (staging)
│   │   ├── MaxCapacity: 3 (prod) / 2 (staging)
│   │   ├── HealthCheckType: ELB (ASG defers to ALB target-group health)
│   │   ├── HealthCheckGracePeriod: 180s (cold-start headroom for Payload + Docker pull)
│   │   ├── UpdatePolicy: rollingUpdate with MinHealthyPercentage: 100, InstanceWarmup: 180s
│   │   └── TargetGroup attachment ↑
│   └── Outputs:
│       ├── EcrRepositoryUri (referenced by GitHub Actions deploy workflow)
│       ├── AsgName (referenced by deploy workflow for instance refresh)
│       ├── AlbDnsName (referenced by *Edge)
│       └── AlbCanonicalHostedZoneId (referenced by *Edge for Route53 alias)
│
├── *Edge           ───────►  depends on: Compute (for ALB origin) + Data (for S3 origin)
│   ├── Certificate (ACM in us-east-1)
│   │   ├── DomainName: from EnvConfig
│   │   ├── ValidationMethod: DNS (auto-validated when hostedZoneId provided)
│   │   └── SubjectAlternativeNames: [www.<domain>]
│   ├── OriginAccessControl: MediaBucketOac (SigV4, S3)
│   ├── Distribution
│   │   ├── ViewerCertificate: ↑ ACM cert
│   │   ├── PriceClass: PRICE_CLASS_100 (US, CA, EU edges — covers all SEQTEK markets)
│   │   ├── Origins:
│   │   │   ├── AlbOrigin: HTTPS to AlbDnsName, custom origin
│   │   │   └── MediaOrigin: regional S3 endpoint of seqtek-media-{env}, OAC attached
│   │   ├── DefaultBehavior: ALB origin
│   │   │   ├── ViewerProtocolPolicy: REDIRECT_TO_HTTPS
│   │   │   ├── AllowedMethods: ALL (admin needs POST/PUT/DELETE)
│   │   │   └── CachePolicy: per ARCHITECTURE.md §3 — differentiated by AdditionalBehavior below
│   │   ├── AdditionalBehaviors:
│   │   │   ├── /admin/* → no caching (cache disabled, all methods forwarded)
│   │   │   ├── /api/* → no caching (cache disabled)
│   │   │   ├── /_next/static/* → CachingOptimized (long TTL, immutable)
│   │   │   ├── /media/* → MediaOrigin, CachingOptimized
│   │   │   └── default → ISR-friendly (cache-control header honored)
│   │   └── ErrorResponses: 403 → 404 for missing media (per §5 OAC pattern)
│   ├── ARecord (Route53, when hostedZoneId provided) → Alias to Distribution
│   ├── ARecord (Route53, www subdomain → CloudFront)
│   └── Bucket policy update (back-reference to *Data's bucket; SourceArn pinned to this distribution's ARN)
│
└── *Observability  ───────►  depends on: Compute (ALB/ASG metrics), Data (RDS metrics), Edge (CloudFront metrics)
    ├── Topic: AlarmTopic (SNS, encrypted)
    ├── Function: SlackNotifier (NodejsFunction, esbuild-bundled, ~40 LOC)
    │   ├── In: PrivateSubnet (egress via NAT for webhook POST)
    │   ├── SG: LambdaSg
    │   ├── EnvVars: WEBHOOK_PARAMETER_PATH=/seqtek/website/{env}/slack_webhook_url
    │   ├── IamRole: SlackNotifierRole (defined in §3 below)
    │   └── Subscription: AlarmTopic → this Lambda
    ├── Alarm × 8 (per ARCHITECTURE.md §8):
    │   ├── AlbFiveXx (HTTPCode_Target_5XX > 5 in 5min)
    │   ├── AlbUnhealthyHost (UnHealthyHostCount > 0 for 2min)
    │   ├── Ec2CpuHigh (CPUUtilization > 80% sustained 10min)
    │   ├── Ec2MemoryHigh (mem_used_percent > 85% sustained 10min — needs CloudWatch Agent metric)
    │   ├── Ec2DiskHigh (disk_used_percent > 80%)
    │   ├── RdsCpuHigh (CPUUtilization > 80% sustained 10min)
    │   ├── RdsFreeStorageLow (FreeStorageSpace < 2GB)
    │   ├── RdsConnectionsHigh (DatabaseConnections > 80% of max)
    │   └── CloudFrontErrorRate (5xxErrorRate > 1% in 5min)
    └── HeartbeatRule (EventBridge schedule: every 6h → SNS test message → SlackNotifier with [HEARTBEAT] prefix; covers FR-022)
```

### Cross-stack reference rules

- Only one direction: Observability → (Compute, Data, Edge); Edge → (Compute, Data); Compute → (Network, Data); Data → Network.
- Cross-stack references use CloudFormation exports (default CDK behavior). No `valueFromLookup` for cross-stack — that's reserved for context lookups (account, region).
- The ECR repository is the only construct that's "shared across envs" — created in `SeqtekProdCompute` and referenced by name from `SeqtekStagingCompute` via `Repository.fromRepositoryName()`.

---

## 2. Per-env sizing table

| Setting                  | Prod                                                                                          | Staging                                                        | Justification                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| AWS Account              | (same account)                                                                                | (same account)                                                 | Stack-name prefix isolation; no separate account needed for our scale.                  |
| Region                   | us-east-1                                                                                     | us-east-1                                                      | research.md §1                                                                          |
| Instance class / size    | t3.small                                                                                      | t3.small                                                       | Match for parity; staging cost-control comes from `desired=1`, not smaller instances.   |
| ASG min/desired/max      | 2 / 2 / 3                                                                                     | 1 / 1 / 2                                                      | Prod = AZ fault tolerance + SLA; staging = single instance is enough for smoke testing. |
| RDS class                | db.t3.small                                                                                   | db.t3.small (logical DB on same instance)                      | ARCHITECTURE.md §5 — single shared RDS, separate logical databases.                     |
| RDS Multi-AZ             | **false** (Phase 5.5 flip)                                                                    | false                                                          | Spec Clarifications Q2.                                                                 |
| RDS storage              | gp3, 50GB, 3000 IOPS                                                                          | (shared)                                                       | research.md §6                                                                          |
| RDS deletion protection  | true                                                                                          | false                                                          | Prod is precious; staging is disposable.                                                |
| RDS backup retention     | 7d                                                                                            | 7d (shared backup)                                             | Per ARCHITECTURE.md §9.                                                                 |
| NAT gateway count        | 1                                                                                             | 1                                                              | Single-AZ NAT acceptable at cost tier; revisit at multi-AZ-RDS flip.                    |
| ECR repo                 | `seqtek-website` (shared)                                                                     | (references shared)                                            | One image, two deploy targets.                                                          |
| ECR retention            | keep 10 tagged + 7d untagged                                                                  | (same)                                                         | research.md §7                                                                          |
| CloudFront price class   | PRICE_CLASS_100                                                                               | PRICE_CLASS_100                                                | US/CA/EU edges cover SEQTEK markets.                                                    |
| CloudWatch log retention | 90d                                                                                           | 14d                                                            | Prod is audit-load-bearing; staging is debug-only.                                      |
| Alarm thresholds         | per ARCHITECTURE.md §8                                                                        | per ARCHITECTURE.md §8                                         | Same alarms, same thresholds — staging exercises the alerting path.                     |
| Domain                   | `seqtek.com` (when DNS available pre-cutover; else CloudFront default)                        | CloudFront default                                             | Phase 6 cutover sets the seqtek.com Route53 record.                                     |
| Cost estimate (monthly)  | ~$95 (2× t3.small + db.t3.small + ALB + 1× NAT + CloudFront baseline + ~$5 SSM/SNS/CW/Lambda) | ~$20 (1× t3.small + shared RDS marginal + ALB + 1× NAT shared) | Staging hits SC-006 (≤25% of prod).                                                     |

---

## 3. IAM role inventory

Three roles, all least-privilege. No `*` on `cloudformation:`, `iam:`, `s3:`, `ssm:`, `kms:`.

### `SeqtekProdDeploy` / `SeqtekStagingDeploy` (CI deploy roles)

- **Trust**: GitHub OIDC, scoped to:
  - Prod: `repo:SeqTechLLC/seqtekdotcom:ref:refs/heads/main`
  - Staging: `repo:SeqTechLLC/seqtekdotcom:*` (any branch — engineers can `cdk diff` staging mid-PR)
- **Permissions** (per env, ARN-pinned to that env's stacks):
  - `cloudformation:CreateStack | UpdateStack | DescribeStacks | GetTemplate | ValidateTemplate | DeleteStack` on `arn:aws:cloudformation:us-east-1:<acct>:stack/Seqtek{Prod|Staging}*`
  - `iam:PassRole` on the CDK execution role created by `cdk bootstrap`
  - `ssm:GetParameter | GetParameters | PutParameter` on `arn:aws:ssm:us-east-1:<acct>:parameter/cdk-bootstrap/*` (for CDK toolkit)
  - `s3:GetObject | PutObject | GetBucketLocation` on the CDK toolkit asset bucket
  - `ecr:BatchCheckLayerAvailability | BatchGetImage | GetDownloadUrlForLayer | PutImage | UploadLayerPart | InitiateLayerUpload | CompleteLayerUpload | GetAuthorizationToken` on `arn:aws:ecr:us-east-1:<acct>:repository/seqtek-website`
  - `autoscaling:StartInstanceRefresh | DescribeInstanceRefreshes` on the env's ASG ARN
- **Session duration**: 1 hour (default).

### `AppInstanceRole` (EC2 instance profile)

- **Trust**: `ec2.amazonaws.com`.
- **Permissions** (per env, ARN-pinned):
  - `ssm:GetParameters` on `arn:aws:ssm:us-east-1:<acct>:parameter/seqtek/website/{env}/*`
  - `ssm:DescribeParameters` on `*` (DescribeParameters cannot be ARN-scoped per IAM service)
  - `s3:PutObject | GetObject | DeleteObject` on `arn:aws:s3:::seqtek-media-{env}/*`
  - `s3:ListBucket` on `arn:aws:s3:::seqtek-media-{env}`
  - `ecr:BatchCheckLayerAvailability | BatchGetImage | GetDownloadUrlForLayer | GetAuthorizationToken` on the shared ECR repo
  - `logs:CreateLogGroup | CreateLogStream | PutLogEvents` on `arn:aws:logs:us-east-1:<acct>:log-group:/seqtek/website/{env}/*`
  - `cloudwatch:PutMetricData` on `*` (CloudWatch Agent needs this; cannot be ARN-scoped per service)
- **Managed policies**: none (we don't use `AmazonSSMManagedInstanceCore` — adds session-manager surface we don't need).

### `SlackNotifierRole` (Lambda execution role)

- **Trust**: `lambda.amazonaws.com`.
- **Permissions**:
  - `ssm:GetParameter` on `arn:aws:ssm:us-east-1:<acct>:parameter/seqtek/website/{env}/slack_webhook_url`
  - `logs:CreateLogGroup | CreateLogStream | PutLogEvents` on `arn:aws:logs:us-east-1:<acct>:log-group:/aws/lambda/SeqtekProdObservability-SlackNotifier*`
  - VPC ENI permissions via the `AWSLambdaVPCAccessExecutionRole` managed policy (Lambda runs in private subnet for outbound through NAT) — this is the one place we accept a managed policy because it's the canonical "Lambda in VPC" set.
- **Session duration**: N/A (Lambda execution role, not assumable by humans).

### Assertion-tested IAM invariants

`infra/test/` includes assertions that fail the synth if:

- Any `iam.PolicyStatement` has `Resource: ['*']` AND `Action` contains any of `s3:*`, `ssm:*`, `iam:*`, `kms:*`, `cloudformation:*`, `ec2:*`.
- Any `iam.PolicyStatement` has `Action: ['*']`.
- Any role's trust policy lacks a condition that scopes to expected principals (specifically the OIDC deploy roles must have the `token.actions.githubusercontent.com:sub` condition pinning the repo/ref).
- The EC2 instance profile does not include `AmazonSSMManagedInstanceCore` (Session Manager is a separate authorization decision we'd make explicitly if needed).

---

## Verification matrix (FR → assertion or test)

| FR                                                    | Verified by                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| FR-001 (single declarative source, no manual console) | quickstart.md walkthrough completes without console steps after one-time bootstrap            |
| FR-002 (staging parameterized for cost)               | per-env sizing table; SC-006 cost projection                                                  |
| FR-003 (DB/app in private subnets)                    | `network-stack.test.ts` asserts subnet placement                                              |
| FR-004 (HTTPS-only via ACM)                           | `edge-stack.test.ts` asserts ALB listener TLS policy + 80→443 redirect                        |
| FR-005 (CloudFront cache differentiation)             | `edge-stack.test.ts` asserts behaviors-per-path-pattern                                       |
| FR-006 (container from ECR, not built on instance)    | `compute-stack.test.ts` asserts LaunchTemplate UserData does `docker pull` not `docker build` |
| FR-007 (managed Postgres + backups)                   | `data-stack.test.ts` asserts backupRetention ≥ 7d                                             |
| FR-008 (private S3 + OAC)                             | `data-stack.test.ts` + `edge-stack.test.ts` co-assert                                         |
| FR-009 (least-privilege IAM)                          | `infra/test/iam-invariants.test.ts` asserts wildcards                                         |
| FR-010 (image from repo Dockerfile)                   | `deploy.yml` workflow uses repo's Dockerfile; Dockerfile audit lands in P1 task               |
| FR-011 (image tag = git SHA)                          | `deploy.yml` workflow asserted in `contracts/github-workflows.md`                             |
| FR-012 (ECR retention)                                | `compute-stack.test.ts` asserts lifecycle rule                                                |
| FR-013 (PR comment on infra-touching PRs)             | `infra-diff.yml` workflow, contract in `contracts/github-workflows.md`                        |
| FR-014 (zero-downtime deploy)                         | `compute-stack.test.ts` asserts MinHealthyPercentage=100 + min/desired/max + multi-AZ         |
| FR-015 (failed deploy keeps previous serving)         | quickstart §alarm simulation: deliberately push broken image, observe rollback                |
| FR-016 (no concurrent-deploy corruption)              | CloudFormation native lock; documented in quickstart §troubleshooting                         |
| FR-017 (secrets in Parameter Store)                   | `data-stack.test.ts` asserts SecureString for sensitive paths                                 |
| FR-018 (rotation without code/CDK deploy)             | quickstart §secret rotation: documented procedure per category                                |
| FR-019 (CI principal scoped, OIDC)                    | `infra/test/iam-invariants.test.ts` asserts deploy-role trust policy                          |
| FR-020 (alarms per ARCHITECTURE.md §8)                | `observability-stack.test.ts` asserts alarm count + dimensions                                |
| FR-021 (alarm → Slack)                                | `slack-lambda.test.ts` (payload format) + quickstart §alarm simulation                        |
| FR-022 (notification path verifiable)                 | EventBridge HeartbeatRule + alarm simulation                                                  |
| FR-023 (CloudWatch logs with retention)               | `compute-stack.test.ts` asserts log group + retention per env                                 |
| FR-024 (HTTPS URL observable in one place)            | CDK outputs from `SeqtekProdEdge` printed at deploy time                                      |
| FR-025 (clean tear-down)                              | quickstart §tear-down procedure with verification step                                        |
| FR-026 (deploy from fresh clone + creds)              | quickstart §first-time bootstrap                                                              |

---

**Output**: Data model complete. Proceed to contracts/.
