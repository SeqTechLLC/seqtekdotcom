import { randomUUID } from 'node:crypto'

/**
 * CloudFront path invalidation wrapper. Lazily imports the AWS SDK so dev
 * boots and unit tests don't pay the bundle cost when CLOUDFRONT_DISTRIBUTION_ID
 * is unset (R-03, R-18). AWS credentials come from the EC2 instance profile
 * via the default credential chain — never static keys.
 */
export interface InvalidateResult {
  invalidated: number
  skipped: boolean
  reason?: string
}

const dedupe = (paths: string[]): string[] => Array.from(new Set(paths.filter(Boolean)))

export async function invalidateCloudFrontPaths(paths: string[]): Promise<InvalidateResult> {
  const unique = dedupe(paths)
  if (unique.length === 0) return { invalidated: 0, skipped: true, reason: 'empty path list' }

  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) {
    return { invalidated: 0, skipped: true, reason: 'CLOUDFRONT_DISTRIBUTION_ID unset' }
  }

  const { CloudFrontClient, CreateInvalidationCommand } = await import('@aws-sdk/client-cloudfront')
  const client = new CloudFrontClient({ region: process.env.AWS_REGION ?? 'us-east-1' })
  await client.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        // randomUUID gives 122 bits of entropy. A previous timestamp + 8-char
        // Math.random() suffix could collide when multiple revalidate-hook
        // invocations fired in the same millisecond, and CloudFront rejects
        // duplicates with InvalidationBatchAlreadyExists — silently dropping
        // the second invalidation under the catch-block above.
        CallerReference: randomUUID(),
        Paths: { Quantity: unique.length, Items: unique },
      },
    }),
  )
  return { invalidated: unique.length, skipped: false }
}
