import { notFound } from "next/navigation";
import { CategoriesDb } from "@/lib/dynamodb";
import { AwsService } from "@/lib/types";
import { ServicePageClient } from "@/components/service-page-client";
import { getCachedServicesByCategory } from "@/lib/cached-data";

interface ServicePageProps {
  params: Promise<{
    category: string;
    service: string;
  }>;
}

function findServiceBySlug(
  services: AwsService[],
  slug: string,
): AwsService | null {
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;

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

export default async function ServicePage({ params }: ServicePageProps) {
  const { category, service: serviceSlug } = await params;

  const categoryServices = await getCachedServicesByCategory(category);
  const service = findServiceBySlug(categoryServices, serviceSlug);

  if (!service) {
    notFound();
  }

  const allCategories = await CategoriesDb.getAllCategories();
  const categoryInfo = allCategories.find((cat) => cat.id === category);

  if (!categoryInfo) {
    notFound();
  }

  const relatedServices = categoryServices
    .filter((s) => s.id !== service.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ServicePageClient
      service={service}
      categoryInfo={categoryInfo}
      relatedServices={relatedServices}
    />
  );
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ServicePageProps) {
  const { category, service: serviceSlug } = await params;

  const categoryServices = await getCachedServicesByCategory(category);
  const service = findServiceBySlug(categoryServices, serviceSlug);

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
