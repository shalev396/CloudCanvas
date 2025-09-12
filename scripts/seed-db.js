#!/usr/bin/env node

/**
 * Seed Database Script for Cloud Canvas
 *
 * This script seeds the DynamoDB tables with AWS services data.
 * Run this after deploying with serverless.
 *
 * Usage:
 *   npm run seed:dev    # Seeds dev environment
 *   npm run seed:prod   # Seeds prod environment
 */

const fs = require("fs").promises;
const path = require("path");
const { loadEnvironment } = require("./load-env");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

// Load environment variables based on stage
const stage = process.argv[2] || "dev";
let environment;
switch (stage) {
  case "prod":
    environment = "prod";
    break;
  case "dev":
    environment = "dev";
    break;
}

console.log(`🚀 Seeding ${stage} stage using ${environment} environment...`);
loadEnvironment(environment);

// Validate required environment variables
if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION environment variable is required");
}
if (!process.env.SERVICES_TABLE_NAME) {
  throw new Error("SERVICES_TABLE_NAME environment variable is required");
}
if (!process.env.USERS_TABLE_NAME) {
  throw new Error("USERS_TABLE_NAME environment variable is required");
}
if (!process.env.ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL environment variable is required");
}
if (!process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required");
}
if (!process.env.ADMIN_NAME) {
  throw new Error("ADMIN_NAME environment variable is required");
}

// Configuration from environment
const region = process.env.AWS_REGION;

// Configure DynamoDB
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLES = {
  SERVICES: process.env.SERVICES_TABLE_NAME,
  USERS: process.env.USERS_TABLE_NAME,
};

async function loadServicesData() {
  try {
    const dataPath = path.join(__dirname, "aws-services-seed.json");
    const rawData = await fs.readFile(dataPath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    console.error("❌ Failed to load services data:", error.message);
    console.log("💡 Make sure to run the PowerShell script first:");
    console.log(
      "   powershell -ExecutionPolicy Bypass -File scripts/generate-services-data.ps1"
    );
    process.exit(1);
  }
}

async function clearExistingServices() {
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
    console.error("❌ Error clearing services:", error.message);
    throw error;
  }
}

async function seedServices(services) {
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
    console.error("❌ Error seeding services:", error.message);
    throw error;
  }
}

async function createAdminUser() {
  try {
    console.log("👤 Creating admin user...");

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const adminUser = {
      id: uuidv4(),
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME,
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
    console.log("📧 Email: admin@cloudcanvas.dev");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log("✅ Admin user already exists, skipping...");
    } else {
      console.error("❌ Error creating admin user:", error.message);
      throw error;
    }
  }
}

async function createTestUser() {
  try {
    console.log("👤 Creating test user...");

    const passwordHash = await bcrypt.hash("test123", 12);
    const testUser = {
      id: uuidv4(),
      email: "test@cloudcanvas.dev",
      name: "Test User",
      passwordHash,
      isAdmin: false,
      favorites: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: testUser,
        ConditionExpression: "attribute_not_exists(email)",
      })
    );

    console.log("✅ Test user created successfully");
    console.log("📧 Email: test@cloudcanvas.dev");
    console.log("🔑 Password: test123");
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log("✅ Test user already exists, skipping...");
    } else {
      console.error("❌ Error creating test user:", error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log("🚀 Starting database seeding...");
    console.log(`📊 Target tables:`);
    console.log(`   Services: ${TABLES.SERVICES}`);
    console.log(`   Users: ${TABLES.USERS}`);
    console.log("");

    // Load services data
    const services = await loadServicesData();
    console.log(`📦 Loaded ${services.length} services from seed file`);

    // Clear and seed services
    await clearExistingServices();
    await seedServices(services);

    // Create users
    await createAdminUser();
    await createTestUser();

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
    console.error("💥 Seeding failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
