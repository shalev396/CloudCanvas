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
    // First get all services from the category
    const categoryServices = await ServicesDb.getServicesByCategory(category);

    // Find the service with matching slug
    const service = categoryServices.find((s) => s.slug === serviceSlug);

    return service || null;
  } catch (error) {
    console.error("Error fetching service data:", error);
    return null;
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
