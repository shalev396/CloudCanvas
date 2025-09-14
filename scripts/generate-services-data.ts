#!/usr/bin/env node

/**
 * TypeScript script to generate AWS services data from folder structure
 * This script reads the AWS assets folder structure and creates a JSON file with all services
 */

import * as fs from "fs/promises";
import * as path from "path";
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

const OUTPUT_PATH = "scripts/aws-services-seed.json";
const ROOT_PATH = "public/aws/Architecture-Service";

// Category mapping to match our frontend configuration
const categoryMapping: Record<string, string> = {
  Arch_Analytics: "Analytics",
  "Arch_App-Integration": "Application-Integration",
  "Arch_Artificial-Intelligence": "Artificial-Intelligence",
  Arch_Blockchain: "Blockchain",
  "Arch_Business-Applications": "Business-Applications",
  "Arch_Cloud-Financial-Management": "Cloud-Financial-Management",
  Arch_Compute: "Compute",
  Arch_Containers: "Containers",
  "Arch_Customer-Enablement": "Customer-Enablement",
  Arch_Database: "Database",
  "Arch_Developer-Tools": "Developer-Tools",
  "Arch_End-User-Computing": "End-User-Computing",
  "Arch_Front-End-Web-Mobile": "Front-End-Web-Mobile",
  Arch_Games: "Games",
  "Arch_General-Icons": "General-Icons",
  "Arch_Internet-of-Things": "Internet-of-Things",
  "Arch_Management-Governance": "Management-Governance",
  "Arch_Media-Services": "Media-Services",
  "Arch_Migration-Modernization": "Migration-Modernization",
  "Arch_Networking-Content-Delivery": "Networking-Content-Delivery",
  "Arch_Quantum-Technologies": "Quantum-Technologies",
  Arch_Satellite: "Satellite",
  "Arch_Security-Identity-Compliance": "Security-Identity-Compliance",
  Arch_Storage: "Storage",
};

/**
 * Convert service filename to display name
 */
function getServiceDisplayName(fileName: string): string {
  let name = path.parse(fileName).name;
  // Remove "Arch_" prefix
  name = name.replace(/^Arch_/, "");
  // Remove _64, _32 and similar suffixes
  name = name.replace(/_64$/, "").replace(/_32$/, "");
  // Replace hyphens and underscores with spaces
  name = name.replace(/[-_]/g, " ");
  // Remove "AWS" from the service name (case insensitive)
  name = name.replace(/\bAWS\b/gi, "").trim();
  // Clean up extra spaces
  name = name.replace(/\s+/g, " ");
  return name;
}

/**
 * Create URL-friendly slug
 */
function getServiceSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Generate service description
 */
function getServiceDescription(serviceName: string, category: string): string {
  return `${serviceName} service in the ${category} category. Learn more about this service and its capabilities.`;
}

/**
 * Generate markdown content for service
 */
function getServiceMarkdownContent(
  serviceName: string,
  category: string
): string {
  return `# ${serviceName}

Detailed documentation for ${serviceName} will be added here. This service is part of the ${category} category.

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Use Cases

Common use cases and scenarios for ${serviceName}.

## Getting Started

Instructions for getting started with ${serviceName}.

## Best Practices

- Best practice 1
- Best practice 2
- Best practice 3
`;
}

/**
 * Generate AWS documentation URL
 */
function getAwsDocsUrl(serviceName: string): string {
  // Convert service name to AWS docs format (lowercase, hyphens)
  const serviceSlug = serviceName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://docs.aws.amazon.com/${serviceSlug}/`;
}

/**
 * Generate diagram URL placeholder
 */
function getDiagramUrl(): string {
  return ""; // Empty by default, can be populated later
}

/**
 * Main function to generate services data
 */
async function generateServicesData(): Promise<void> {
  console.log("🚀 Generating AWS services data from folder structure...");
  console.log(`📂 Scanning: ${ROOT_PATH}`);

  try {
    // Check if root path exists
    await fs.access(ROOT_PATH);
  } catch (error) {
    console.error(`❌ Root path not found: ${ROOT_PATH}`);
    process.exit(1);
  }

  const services: ServiceData[] = [];

  try {
    // Get all category directories
    const items = await fs.readdir(ROOT_PATH, { withFileTypes: true });
    const categoryDirs = items.filter(
      (item) => item.isDirectory() && item.name.startsWith("Arch_")
    );

    console.log(`📁 Found ${categoryDirs.length} categories`);

    for (const categoryDir of categoryDirs) {
      const categoryName = categoryMapping[categoryDir.name];

      if (!categoryName) {
        console.warn(
          `⚠️  No mapping found for category: ${categoryDir.name}, skipping...`
        );
        continue;
      }

      console.log(`🔄 Processing category: ${categoryName}`);

      const categoryPath = path.join(ROOT_PATH, categoryDir.name);

      try {
        // Get all SVG files in the category directory (only SVGs)
        const files = await fs.readdir(categoryPath);
        const svgFiles = files.filter((file) =>
          file.toLowerCase().endsWith(".svg")
        );

        console.log(`   📄 Found ${svgFiles.length} SVG services`);

        for (const svgFile of svgFiles) {
          const displayName = getServiceDisplayName(svgFile);
          const slug = getServiceSlug(displayName);
          const serviceId = uuidv4(); // Use UUID instead of category-slug
          const iconPath = `/aws/Architecture-Service/${categoryDir.name}/${svgFile}`;
          const currentTime = new Date().toISOString();

          const service: ServiceData = {
            id: serviceId,
            name: displayName,
            slug,
            category: categoryName,
            summary: `${displayName} service`,
            description: getServiceDescription(displayName, categoryName),
            markdownContent: getServiceMarkdownContent(
              displayName,
              categoryName
            ),
            iconPath,
            enabled: false, // Set to false by default as requested
            awsDocsUrl: getAwsDocsUrl(displayName),
            diagramUrl: getDiagramUrl(),
            createdAt: currentTime,
            updatedAt: currentTime,
          };

          services.push(service);
          console.log(`     ✅ Added: ${displayName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing category ${categoryName}:`, error);
        continue;
      }
    }

    console.log(`📊 Total services generated: ${services.length}`);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(OUTPUT_PATH);
    await fs.mkdir(outputDir, { recursive: true });

    // Save to JSON file
    const jsonOutput = JSON.stringify(services, null, 2);
    await fs.writeFile(OUTPUT_PATH, jsonOutput, "utf8");

    console.log(`💾 Services data saved to: ${OUTPUT_PATH}`);
    console.log(
      "✅ You can now use this JSON file to seed your DynamoDB database."
    );

    // Display summary by category
    console.log("\n📈 Summary by Category:");
    const categorySummary = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categorySummary)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} services`);
      });
  } catch (error) {
    console.error("💥 Error generating services data:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  generateServicesData();
}

export { generateServicesData };
