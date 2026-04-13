import { awsCredentialsProvider } from "@vercel/functions/oidc";
import type { AwsCredentialIdentityProvider } from "@aws-sdk/types";

let cached: AwsCredentialIdentityProvider | undefined;

export function getAwsCredentials(): AwsCredentialIdentityProvider | undefined {
  const roleArn = process.env.AWS_ROLE_ARN;
  if (!roleArn) return undefined;
  if (!cached) cached = awsCredentialsProvider({ roleArn });
  return cached;
}
