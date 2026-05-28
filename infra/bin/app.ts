#!/usr/bin/env -S npx tsx
import { Annotations, App, Tags } from 'aws-cdk-lib'
import { ComputeStack } from '../lib/compute-stack'
import { resolveEnv, stackEnv, stackName } from '../lib/construct-utils'
import { DataStack } from '../lib/data-stack'
import { EdgeStack } from '../lib/edge-stack'
import { NetworkStack } from '../lib/network-stack'
import { ObservabilityStack } from '../lib/observability-stack'

const app = new App()

// Acknowledge intentional CDK warnings.
// - updateImportedBucketPolicyOac: EdgeStack imports the media bucket
//   by attributes and manages its policy manually to break the
//   Data ↔ Edge dependency cycle. See lib/edge-stack.ts for full
//   rationale.
Annotations.of(app).acknowledgeWarning(
  '@aws-cdk/aws-cloudfront-origins:updateImportedBucketPolicyOac',
  'Intentional: bucket policy is managed manually in EdgeStack to break the Data ↔ Edge dependency cycle. See infra/lib/edge-stack.ts.',
)

const { env: envName, cfg } = resolveEnv(app)
const awsEnv = stackEnv(cfg)

const network = new NetworkStack(app, stackName(envName, 'Network'), {
  env: awsEnv,
  envName,
  cfg,
})

const data = new DataStack(app, stackName(envName, 'Data'), {
  env: awsEnv,
  envName,
  cfg,
  network,
})
data.addDependency(network)

const compute = new ComputeStack(app, stackName(envName, 'Compute'), {
  env: awsEnv,
  envName,
  cfg,
  network,
  data,
})
compute.addDependency(network)
compute.addDependency(data)

const edge = new EdgeStack(app, stackName(envName, 'Edge'), {
  env: awsEnv,
  envName,
  cfg,
  compute,
  data,
})
edge.addDependency(compute)
edge.addDependency(data)

const observability = new ObservabilityStack(app, stackName(envName, 'Observability'), {
  env: awsEnv,
  envName,
  cfg,
  network,
  data,
  compute,
  edge,
})
observability.addDependency(network)
observability.addDependency(data)
observability.addDependency(compute)
observability.addDependency(edge)

// Project-wide tags applied to every taggable resource.
Tags.of(app).add('Project', 'seqtek-website')
Tags.of(app).add('Environment', envName)
Tags.of(app).add('ManagedBy', 'cdk')
Tags.of(app).add('Repo', 'SeqTechLLC/seqtekdotcom')

app.synth()
