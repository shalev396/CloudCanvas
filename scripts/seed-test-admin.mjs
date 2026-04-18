#!/usr/bin/env node
/**
 * Idempotently provisions a known admin user for E2E tests.
 *
 * Required env (read from process env or .env.{stage}):
 *   STAGE                 dev | qa | prod  (default: qa)
 *   TEST_ADMIN_EMAIL
 *   TEST_ADMIN_PASSWORD
 *   AWS_REGION
 *   USERS_TABLE_NAME
 *
 * AWS credentials come from the default credential chain.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const stage = process.env.STAGE ?? "qa";
const envFile = {
  dev: ".env.development",
  qa: ".env.qa",
  prod: ".env.production",
}[stage];
if (!envFile) {
  console.error(`Unknown STAGE: ${stage}`);
  process.exit(1);
}
config({ path: resolve(process.cwd(), envFile) });

const required = [
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
  "AWS_REGION",
  "USERS_TABLE_NAME",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;
const tableName = process.env.USERS_TABLE_NAME;

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

const existing = await docClient.send(
  new ScanCommand({
    TableName: tableName,
    FilterExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
    Limit: 1,
  })
);

const id = existing.Items?.[0]?.id ?? randomUUID();
const createdAt = existing.Items?.[0]?.createdAt ?? new Date().toISOString();
const passwordHash = await bcrypt.hash(password, 12);

await docClient.send(
  new PutCommand({
    TableName: tableName,
    Item: {
      id,
      email,
      name: "QA Test Admin",
      passwordHash,
      isAdmin: true,
      favorites: [],
      createdAt,
      updatedAt: new Date().toISOString(),
    },
  })
);

console.log(
  `[${stage}] Seeded admin ${email} (id=${id}) into ${tableName}${
    existing.Items?.length ? " — updated existing" : " — created new"
  }`
);
