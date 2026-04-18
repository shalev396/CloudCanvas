import { execSync } from "child_process";
import { config } from "dotenv";
import { resolve } from "path";

const stage = process.argv[2];
if (!stage || !["dev", "qa", "prod"].includes(stage)) {
  console.error("Usage: node scripts/deploy.mjs <dev|qa|prod>");
  process.exit(1);
}

const envFile = {
  dev: ".env.development",
  qa: ".env.qa",
  prod: ".env.production",
}[stage];
config({ path: resolve(process.cwd(), envFile) });

const alwaysRequired = [
  "S3_BUCKET_NAME",
  "SERVICES_TABLE_NAME",
  "USERS_TABLE_NAME",
  "CATEGORIES_TABLE_NAME",
];

const prodOnlyRequired = [
  "VERCEL_DOMAIN",
  "CUSTOM_DOMAIN",
  "ACM_CERTIFICATE_ARN",
  "HOSTED_ZONE_ID",
  "VERCEL_TEAM_SLUG",
  "VERCEL_PROJECT_NAME",
  "VERCEL_OIDC_PROVIDER_ARN",
];

const required =
  stage === "prod" ? [...alwaysRequired, ...prodOnlyRequired] : alwaysRequired;

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing in ${envFile}: ${missing.join(", ")}`);
  process.exit(1);
}

const params = [
  `Stage=${stage}`,
  `ImagesBucketName=${process.env.S3_BUCKET_NAME}`,
  `ServicesTableName=${process.env.SERVICES_TABLE_NAME}`,
  `UsersTableName=${process.env.USERS_TABLE_NAME}`,
  `CategoriesTableName=${process.env.CATEGORIES_TABLE_NAME}`,
];

if (stage === "prod") {
  params.push(
    `VercelDomain=${process.env.VERCEL_DOMAIN}`,
    `CustomDomain=${process.env.CUSTOM_DOMAIN}`,
    `ACMCertificateArn=${process.env.ACM_CERTIFICATE_ARN}`,
    `HostedZoneId=${process.env.HOSTED_ZONE_ID}`,
    `VercelTeamSlug=${process.env.VERCEL_TEAM_SLUG}`,
    `VercelProjectName=${process.env.VERCEL_PROJECT_NAME}`,
    `VercelOIDCProviderArn=${process.env.VERCEL_OIDC_PROVIDER_ARN}`,
  );
}

const cmd = [
  "aws cloudformation deploy",
  "--template-file cloudformation.yml",
  `--stack-name cloudcanvas-${stage}`,
  "--capabilities CAPABILITY_NAMED_IAM",
  "--no-fail-on-empty-changeset",
  "--parameter-overrides",
  ...params,
].join(" ");

console.log(`Deploying cloudcanvas-${stage}...`);
execSync(cmd, { stdio: "inherit" });
