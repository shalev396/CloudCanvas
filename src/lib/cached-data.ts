import { unstable_cache } from "next/cache";
import { ServicesDb, CategoriesDb } from "./dynamodb";
import { AwsService, ServicesByCategory } from "./types";

const CACHE_TAG = "services";
const CACHE_REVALIDATE_SECONDS = 300;

/**
 * Cached: all services for dashboard, grouped by category.
 * One DynamoDB scan shared across all visitors for CACHE_REVALIDATE_SECONDS.
 */
export const getCachedServicesGroupedByCategory = unstable_cache(
  async (): Promise<{
    servicesByCategory: ServicesByCategory[];
    stats: { total: number; available: number };
  }> => {
    const [services, categories] = await Promise.all([
      ServicesDb.getServicesForDashboard(),
      CategoriesDb.getAllCategories(),
    ]);

    const total = services.length;
    const available = services.filter((s) => s.enabled === true).length;

    const servicesByCategory: ServicesByCategory[] = [];

    for (const categoryConfig of categories) {
      const categoryServices = services.filter(
        (service) => service.category === categoryConfig.id,
      );

      if (categoryServices.length > 0) {
        servicesByCategory.push({
          category: categoryConfig.id,
          displayName: categoryConfig.displayName,
          iconPath: categoryConfig.iconPath,
          services: categoryServices.map((service) => ({
            id: service.id!,
            name: service.name!,
            slug: service.slug!,
            category: service.category!,
            summary: service.summary!,
            description: service.summary!,
            markdownContent: service.markdownContent || "",
            awsDocsUrl: service.awsDocsUrl || "",
            diagramUrl: service.diagramUrl || "",
            iconPath: service.iconPath!,
            enabled: service.enabled ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        });
      }
    }

    return { servicesByCategory, stats: { total, available } };
  },
  ["dashboard-services"],
  { tags: [CACHE_TAG], revalidate: CACHE_REVALIDATE_SECONDS },
);

/**
 * Cached: all services in a specific category.
 * Keyed by category ID so each category is cached independently.
 */
export const getCachedServicesByCategory = unstable_cache(
  async (category: string): Promise<AwsService[]> => {
    return ServicesDb.getServicesByCategory(category);
  },
  ["services-by-category"],
  { tags: [CACHE_TAG], revalidate: CACHE_REVALIDATE_SECONDS },
);

/**
 * Cache tag used for all service data. Pass to revalidateTag() to bust everything.
 */
export { CACHE_TAG as SERVICES_CACHE_TAG };
