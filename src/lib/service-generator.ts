import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { AwsService } from "./types";

/**
 * Derive a human-readable display name from a category id.
 * e.g. "Application-Integration" → "Application Integration"
 */
export function deriveCategoryDisplayName(categoryId: string): string {
  return categoryId.replace(/-/g, " ");
}

/**
 * Derive a short description from a category display name.
 */
export function deriveCategoryDescription(displayName: string): string {
  return `AWS ${displayName} services`;
}

/**
 * Extract a category id from a service folder name.
 * e.g. "Arch_Analytics" → "Analytics", "Arch_Business-Applications" → "Business-Applications"
 */
export function extractCategoryIdFromFolder(folderName: string): string | null {
  if (!folderName.startsWith("Arch_")) return null;
  return folderName.slice("Arch_".length);
}

/**
 * Extract a category id from a category icon filename.
 * e.g. "Arch-Category_Analytics_64.svg" → "Analytics"
 */
export function extractCategoryIdFromIconFile(fileName: string): string | null {
  const match = fileName.match(/^Arch-Category_(.+)_64\.svg$/);
  return match ? match[1] : null;
}

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
 * Build a full AwsService record from a filename, zip folder name, and resolved category id.
 */
export function buildServiceRecord(
  svgFileName: string,
  categoryFolderName: string,
  categoryId: string
): AwsService {
  const displayName = getServiceDisplayName(svgFileName);
  const slug = getServiceSlug(displayName);
  const iconPath = `/images/aws/Architecture-Service/${categoryFolderName}/${svgFileName}`;
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
