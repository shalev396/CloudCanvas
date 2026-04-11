import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { AwsService } from "./types";

/**
 * Maps both existing on-disk folder names (public/aws/Architecture-Service/)
 * AND AWS icon zip folder names to canonical app category IDs.
 */
export const categoryMapping: Record<string, string> = {
  Arch_Analytics: "Analytics",
  "Arch_App-Integration": "Application-Integration",
  "Arch_Application-Integration": "Application-Integration",
  "Arch_Artificial-Intelligence": "Artificial-Intelligence",
  Arch_Blockchain: "Blockchain",
  "Arch_Business-Applications": "Business-Applications",
  "Arch_Cloud-Financial-Management": "Cloud-Financial-Management",
  Arch_Compute: "Compute",
  Arch_Containers: "Containers",
  "Arch_Customer-Enablement": "Customer-Enablement",
  Arch_Database: "Database",
  Arch_Databases: "Database",
  "Arch_Developer-Tools": "Developer-Tools",
  "Arch_End-User-Computing": "End-User-Computing",
  "Arch_Front-End-Web-Mobile": "Front-End-Web-Mobile",
  Arch_Games: "Games",
  "Arch_Internet-of-Things": "Internet-of-Things",
  "Arch_Management-Governance": "Management-Governance",
  "Arch_Management-Tools": "Management-Governance",
  "Arch_Media-Services": "Media-Services",
  "Arch_Migration-Modernization": "Migration-Modernization",
  "Arch_Networking-Content-Delivery": "Networking-Content-Delivery",
  "Arch_Quantum-Technologies": "Quantum-Technologies",
  Arch_Satellite: "Satellite",
  "Arch_Security-Identity-Compliance": "Security-Identity-Compliance",
  "Arch_Security-Identity": "Security-Identity-Compliance",
  Arch_Storage: "Storage",
};

export function getServiceDisplayName(fileName: string): string {
  let name = path.parse(fileName).name;
  name = name.replace(/^Arch_/, "");
  name = name.replace(/_64$/, "").replace(/_32$/, "");
  name = name.replace(/[-_]/g, " ");
  name = name.replace(/\bAWS\b/gi, "").trim();
  name = name.replace(/\s+/g, " ");
  return name;
}

export function getServiceSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getServiceDescription(serviceName: string, category: string): string {
  return `${serviceName} service in the ${category} category. Learn more about this service and its capabilities.`;
}

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

function getAwsDocsUrl(serviceName: string): string {
  const serviceSlug = serviceName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://docs.aws.amazon.com/${serviceSlug}/`;
}

/**
 * Build a full AwsService record from a filename and category folder name,
 * exactly matching the structure produced by scripts/generate-services-data.ts.
 */
export function buildServiceRecord(
  svgFileName: string,
  categoryFolderName: string
): AwsService | null {
  const categoryId = categoryMapping[categoryFolderName];
  if (!categoryId) return null;

  const displayName = getServiceDisplayName(svgFileName);
  const slug = getServiceSlug(displayName);
  const iconPath = `/aws/Architecture-Service/${categoryFolderName}/${svgFileName}`;
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    name: displayName,
    slug,
    category: categoryId,
    summary: `${displayName} service`,
    description: getServiceDescription(displayName, categoryId),
    markdownContent: getServiceMarkdownContent(displayName, categoryId),
    iconPath,
    enabled: false,
    awsDocsUrl: getAwsDocsUrl(displayName),
    diagramUrl: "",
    createdAt: now,
    updatedAt: now,
  };
}
