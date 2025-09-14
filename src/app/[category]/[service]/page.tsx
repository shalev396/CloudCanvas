import { notFound } from "next/navigation";
import { ServicesDb } from "@/lib/dynamodb";
import { AWS_CATEGORIES } from "@/lib/categories";
import { AwsService } from "@/lib/types";
import { ServicePageClient } from "@/components/service-page-client";

interface ServicePageProps {
  params: Promise<{
    category: string;
    service: string;
  }>;
}

// Function to fetch service by category and service slug
async function getServiceData(
  category: string,
  serviceSlug: string
): Promise<AwsService | null> {
  try {
    // Use API route to ensure consistent data processing
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "";

    const response = await fetch(
      `${baseUrl}/api/services?category=${category}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    const result = await response.json();

    if (result.success && result.data) {
      // Find the service with matching slug
      const service = result.data.find(
        (s: AwsService) => s.slug === serviceSlug
      );

      // Ensure all string fields have safe defaults
      if (service) {
        return {
          ...service,
          enabled: service.enabled ?? true,
          markdownContent: service.markdownContent || "",
          awsDocsUrl: service.awsDocsUrl || "",
          diagramUrl: service.diagramUrl || "",
          summary: service.summary || "",
          description: service.description || "",
          name: service.name || "Unknown Service",
        };
      }

      return null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching service data:", error);

    // Fallback to direct database query
    try {
      const categoryServices = await ServicesDb.getServicesByCategory(category);
      const service = categoryServices.find((s) => s.slug === serviceSlug);

      // Apply same fallback logic as API
      if (service) {
        return {
          ...service,
          enabled: service.enabled ?? true,
          markdownContent: service.markdownContent || "",
          awsDocsUrl: service.awsDocsUrl || "",
          diagramUrl: service.diagramUrl || "",
          summary: service.summary || "",
          description: service.description || "",
          name: service.name || "Unknown Service",
        };
      }

      return null;
    } catch (fallbackError) {
      console.error("Fallback fetch also failed:", fallbackError);
      return null;
    }
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { category, service: serviceSlug } = await params;

  // Get the service data
  const service = await getServiceData(category, serviceSlug);

  if (!service) {
    notFound();
  }

  // Get category info
  const categoryInfo = AWS_CATEGORIES.find((cat) => cat.id === category);

  if (!categoryInfo) {
    notFound();
  }

  return <ServicePageClient service={service} categoryInfo={categoryInfo} />;
}

// Generate static params for known services (optional - for better performance)
export async function generateStaticParams() {
  // This would be called at build time
  // For now, we'll let Next.js handle dynamic routes
  return [];
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { category, service: serviceSlug } = await params;

  const service = await getServiceData(category, serviceSlug);

  if (!service) {
    return {
      title: "Service Not Found - Cloud Canvas",
      description: "The requested service could not be found.",
    };
  }

  return {
    title: `${service.name} - Cloud Canvas`,
    description: service.summary,
  };
}
