import { CategoryConfig, CloudProvider } from "./types";

// AWS Categories based on the folder structure
export const AWS_CATEGORIES: CategoryConfig[] = [
  {
    id: "Analytics",
    name: "Analytics",
    displayName: "Analytics",
    iconPath: "/aws/Category/Arch-Category_Analytics_64.svg",
    description: "Data analytics and business intelligence services",
    enabled: true,
  },
  {
    id: "Application-Integration",
    name: "App-Integration",
    displayName: "Application Integration",
    iconPath: "/aws/Category/Arch-Category_Application-Integration_64.svg",
    description: "Connect and coordinate distributed applications",
    enabled: true,
  },
  {
    id: "Artificial-Intelligence",
    name: "Artificial-Intelligence",
    displayName: "AI & Machine Learning",
    iconPath: "/aws/Category/Arch-Category_Artificial-Intelligence_64.svg",
    description: "Machine learning and AI services",
    enabled: true,
  },
  {
    id: "Blockchain",
    name: "Blockchain",
    displayName: "Blockchain",
    iconPath: "/aws/Category/Arch-Category_Blockchain_64.svg",
    description: "Blockchain and distributed ledger services",
    enabled: true,
  },
  {
    id: "Business-Applications",
    name: "Business-Applications",
    displayName: "Business Applications",
    iconPath: "/aws/Category/Arch-Category_Business-Applications_64.svg",
    description: "Enterprise business applications",
    enabled: true,
  },
  {
    id: "Cloud-Financial-Management",
    name: "Cloud-Financial-Management",
    displayName: "Cloud Financial Management",
    iconPath: "/aws/Category/Arch-Category_Cloud-Financial-Management_64.svg",
    description: "Cost management and billing optimization",
    enabled: true,
  },
  {
    id: "Compute",
    name: "Compute",
    displayName: "Compute",
    iconPath: "/aws/Category/Arch-Category_Compute_64.svg",
    description: "Virtual servers, containers, and serverless compute",
    enabled: true,
  },
  {
    id: "Containers",
    name: "Containers",
    displayName: "Containers",
    iconPath: "/aws/Category/Arch-Category_Containers_64.svg",
    description: "Container orchestration and management",
    enabled: true,
  },
  {
    id: "Customer-Enablement",
    name: "Customer-Enablement",
    displayName: "Customer Enablement",
    iconPath: "/aws/Category/Arch-Category_Customer-Enablement_64.svg",
    description: "Customer support and enablement services",
    enabled: true,
  },
  {
    id: "Database",
    name: "Database",
    displayName: "Database",
    iconPath: "/aws/Category/Arch-Category_Database_64.svg",
    description: "Managed database services",
    enabled: true,
  },
  {
    id: "Developer-Tools",
    name: "Developer-Tools",
    displayName: "Developer Tools",
    iconPath: "/aws/Category/Arch-Category_Developer-Tools_64.svg",
    description: "Development, testing, and deployment tools",
    enabled: true,
  },
  {
    id: "End-User-Computing",
    name: "End-User-Computing",
    displayName: "End User Computing",
    iconPath: "/aws/Category/Arch-Category_End-User-Computing_64.svg",
    description: "Desktop and application streaming",
    enabled: true,
  },
  {
    id: "Front-End-Web-Mobile",
    name: "Front-End-Web-Mobile",
    displayName: "Frontend Web & Mobile",
    iconPath: "/aws/Category/Arch-Category_Front-End-Web-Mobile_64.svg",
    description: "Frontend development and mobile services",
    enabled: true,
  },
  {
    id: "Games",
    name: "Games",
    displayName: "Game Tech",
    iconPath: "/aws/Category/Arch-Category_Games_64.svg",
    description: "Game development and hosting services",
    enabled: true,
  },
  {
    id: "Internet-of-Things",
    name: "Internet-of-Things",
    displayName: "Internet of Things",
    iconPath: "/aws/Category/Arch-Category_Internet-of-Things_64.svg",
    description: "IoT device management and analytics",
    enabled: true,
  },
  {
    id: "Management-Governance",
    name: "Management-Governance",
    displayName: "Management & Governance",
    iconPath: "/aws/Category/Arch-Category_Management-Governance_64.svg",
    description: "Cloud management and governance tools",
    enabled: true,
  },
  {
    id: "Media-Services",
    name: "Media-Services",
    displayName: "Media Services",
    iconPath: "/aws/Category/Arch-Category_Media-Services_64.svg",
    description: "Media processing and streaming services",
    enabled: true,
  },
  {
    id: "Migration-Modernization",
    name: "Migration-Modernization",
    displayName: "Migration & Transfer",
    iconPath: "/aws/Category/Arch-Category_Migration-Modernization_64.svg",
    description: "Application migration and modernization",
    enabled: true,
  },
  {
    id: "Networking-Content-Delivery",
    name: "Networking-Content-Delivery",
    displayName: "Networking & Content Delivery",
    iconPath: "/aws/Category/Arch-Category_Networking-Content-Delivery_64.svg",
    description: "Networking and content delivery services",
    enabled: true,
  },
  {
    id: "Quantum-Technologies",
    name: "Quantum-Technologies",
    displayName: "Quantum Technologies",
    iconPath: "/aws/Category/Arch-Category_Quantum-Technologies_64.svg",
    description: "Quantum computing services",
    enabled: true,
  },
  {
    id: "Satellite",
    name: "Satellite",
    displayName: "Satellite",
    iconPath: "/aws/Category/Arch-Category_Satellite_64.svg",
    description: "Satellite communication services",
    enabled: true,
  },
  {
    id: "Security-Identity-Compliance",
    name: "Security-Identity-Compliance",
    displayName: "Security, Identity & Compliance",
    iconPath: "/aws/Category/Arch-Category_Security-Identity-Compliance_64.svg",
    description: "Security, identity, and compliance services",
    enabled: true,
  },
  {
    id: "Serverless",
    name: "Serverless",
    displayName: "Serverless",
    iconPath: "/aws/Category/Arch-Category_Serverless_64.svg",
    description: "Serverless computing services",
    enabled: true,
  },
  {
    id: "Storage",
    name: "Storage",
    displayName: "Storage",
    iconPath: "/aws/Category/Arch-Category_Storage_64.svg",
    description: "Cloud storage services",
    enabled: true,
  },
];

// Cloud Providers configuration
export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: "aws",
    name: "aws",
    displayName: "Amazon Web Services",
    enabled: true,
  },
  {
    id: "azure",
    name: "azure",
    displayName: "Microsoft Azure",
    enabled: false,
  },
  {
    id: "gcp",
    name: "gcp",
    displayName: "Google Cloud Platform",
    enabled: false,
  },
];

// Helper functions
export function getCategoryByName(
  categoryName: string
): CategoryConfig | undefined {
  return AWS_CATEGORIES.find((cat) => cat.name === categoryName);
}

export function getEnabledCategories(): CategoryConfig[] {
  return AWS_CATEGORIES.filter((cat) => cat.enabled);
}

export function getEnabledProviders(): CloudProvider[] {
  return CLOUD_PROVIDERS.filter((provider) => provider.enabled);
}
