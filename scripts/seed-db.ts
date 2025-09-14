#!/usr/bin/env node

/**
 * Seed Database Script for Cloud Canvas
 *
 * This script seeds the DynamoDB tables with AWS services data.
 * Run this after deploying with serverless.
 *
 * Usage:
 *   npm run seed:dev           # Seeds dev environment (clears existing data first)
 *   npm run seed:prod          # Seeds prod environment (clears existing data first)
 */

import * as fs from "fs/promises";
import * as path from "path";
import { loadEnvironment } from "./load-env";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  markdownContent: string;
  iconPath: string;
  enabled: boolean;
  awsDocsUrl: string;
  diagramUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  favorites: string[];
  createdAt: string;
  updatedAt: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const stage = args.find((arg) => !arg.startsWith("--")) || "dev";

// Load environment variables based on stage
let environment: string;
switch (stage) {
  case "prod":
    environment = "prod";
    break;
  case "dev":
    environment = "dev";
    break;
  default:
    environment = "dev";
}

console.log(`🚀 Seeding ${stage} stage using ${environment} environment...`);
console.log("🧹 Clean mode enabled - will delete existing data before seeding");

loadEnvironment(environment);

// Validate required environment variables
const requiredEnvVars = [
  "AWS_REGION",
  "SERVICES_TABLE_NAME",
  "USERS_TABLE_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_NAME",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

// Configuration from environment
const region = process.env.AWS_REGION!;

// Configure DynamoDB
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLES = {
  SERVICES: process.env.SERVICES_TABLE_NAME!,
  USERS: process.env.USERS_TABLE_NAME!,
};

/**
 * Load services data from JSON file
 */
async function loadServicesData(): Promise<ServiceData[]> {
  try {
    const dataPath = path.join(__dirname, "aws-services-seed.json");
    const rawData = await fs.readFile(dataPath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("❌ Failed to load services data:", (error as Error).message);
    console.log("💡 Make sure to run the generation script first:");
    console.log("   npm run generate:services");
    process.exit(1);
  }
}

/**
 * Clear existing services from database
 */
async function clearExistingServices(): Promise<void> {
  try {
    console.log("🧹 Clearing existing services...");
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.SERVICES,
        ProjectionExpression: "id",
      })
    );

    if (result.Items && result.Items.length > 0) {
      const deleteRequests = result.Items.map((item) => ({
        DeleteRequest: { Key: { id: item.id } },
      }));

      // Process in batches of 25 (DynamoDB limit)
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await dynamodb.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLES.SERVICES]: batch,
            },
          })
        );
        console.log(
          `   Deleted batch ${Math.floor(i / 25) + 1}/${Math.ceil(
            deleteRequests.length / 25
          )}`
        );
      }
      console.log(`✅ Cleared ${result.Items.length} existing services`);
    } else {
      console.log("✅ No existing services to clear");
    }
  } catch (error) {
    console.error("❌ Error clearing services:", (error as Error).message);
    throw error;
  }
}

/**
 * Clear existing users from database
 */
async function clearExistingUsers(): Promise<void> {
  try {
    console.log("🧹 Clearing existing users...");
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLES.USERS,
        ProjectionExpression: "id",
      })
    );

    if (result.Items && result.Items.length > 0) {
      const deleteRequests = result.Items.map((item) => ({
        DeleteRequest: { Key: { id: item.id } },
      }));

      // Process in batches of 25 (DynamoDB limit)
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await dynamodb.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLES.USERS]: batch,
            },
          })
        );
        console.log(
          `   Deleted batch ${Math.floor(i / 25) + 1}/${Math.ceil(
            deleteRequests.length / 25
          )}`
        );
      }
      console.log(`✅ Cleared ${result.Items.length} existing users`);
    } else {
      console.log("✅ No existing users to clear");
    }
  } catch (error) {
    console.error("❌ Error clearing users:", (error as Error).message);
    throw error;
  }
}

/**
 * Seed services into database
 */
async function seedServices(services: ServiceData[]): Promise<void> {
  try {
    console.log(`📝 Seeding ${services.length} services...`);

    // Prepare write requests
    const writeRequests = services.map((service) => ({
      PutRequest: { Item: service },
    }));

    let seeded = 0;
    // Process in batches of 25 (DynamoDB limit)
    for (let i = 0; i < writeRequests.length; i += 25) {
      const batch = writeRequests.slice(i, i + 25);
      await dynamodb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLES.SERVICES]: batch,
          },
        })
      );
      seeded += batch.length;
      console.log(`   Seeded ${seeded}/${services.length} services...`);
    }

    console.log(`✅ Successfully seeded ${services.length} services`);
  } catch (error) {
    console.error("❌ Error seeding services:", (error as Error).message);
    throw error;
  }
}

/**
 * Create admin user from environment variables
 */
async function createAdminUser(): Promise<void> {
  try {
    console.log("👤 Creating admin user...");

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 12);
    const adminUser: UserData = {
      id: uuidv4(),
      email: process.env.ADMIN_EMAIL!,
      name: process.env.ADMIN_NAME!,
      passwordHash,
      isAdmin: true,
      favorites: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: adminUser,
        ConditionExpression: "attribute_not_exists(email)", // Only create if doesn't exist
      })
    );

    console.log("✅ Admin user created successfully");
    console.log(`📧 Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`👤 Name: ${process.env.ADMIN_NAME}`);
    console.log("⚠️  Password is set from environment variable");
    console.log("⚠️  Please change the password after first login if needed!");
  } catch (error) {
    if ((error as any).name === "ConditionalCheckFailedException") {
      console.log("✅ Admin user already exists, skipping...");
    } else {
      console.error("❌ Error creating admin user:", (error as Error).message);
      throw error;
    }
  }
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  try {
    console.log("🚀 Starting database seeding...");
    console.log(`📊 Target tables:`);
    console.log(`   Services: ${TABLES.SERVICES}`);
    console.log(`   Users: ${TABLES.USERS}`);
    console.log("");

    // Load services data
    const services = await loadServicesData();
    console.log(`📦 Loaded ${services.length} services from seed file`);

    // Always clear existing data to prevent duplicates
    console.log("🧹 Cleaning existing data...");
    await clearExistingServices();
    await clearExistingUsers();
    console.log("✅ Existing data cleared");

    // Seed services
    await seedServices(services);

    // Create admin user only (no test user as requested)
    await createAdminUser();

    console.log("");
    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("🔗 Next steps:");
    console.log(
      "   1. Update your .env.local with the AWS credentials from serverless outputs"
    );
    console.log("   2. Run: npm run dev");
    console.log("   3. Visit: http://localhost:3000");
    console.log("");
  } catch (error) {
    console.error("💥 Seeding failed:", (error as Error).message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { main };
